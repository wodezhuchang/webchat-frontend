# 前端聊天记录留存改进方案

## 一、当前问题分析

### 1. 私聊功能问题

#### 1.1 点击用户直接进入私聊（无会话关联）

**当前代码位置：** [ChatView.vue#L318-L324](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/views/ChatView.vue#L318-L324)

```typescript
const handleUserSelect = (username: string): void => {
  chatStore.selectUser(username);
};
```

**问题：**
- 点击在线用户直接设置 `selectedUser` 和 `isPrivateMode`
- **没有查询或创建私聊会话**
- **没有加载历史消息**
- 刷新页面后消息全部丢失

#### 1.2 私聊消息仅内存存储

**当前代码位置：** [chat.ts#L14-L29](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/stores/chat.ts#L14-L29)

```typescript
const privateMessages = ref<PrivateChatHistory>({});  // 仅内存

const messages = computed(() => {
  if (isPrivateMode.value && selectedUser.value) {
    return privateMessages.value[selectedUser.value] || [];  // 从内存读取
  }
  return aiMessages.value;
});
```

**问题：**
- 私聊消息存储在 `privateMessages.value[username]`
- 仅存在于浏览器内存
- 刷新页面后全部丢失
- 切换用户后消息也丢失

#### 1.3 发送消息不携带 session_id

**当前代码位置：** [websocket.ts#L169-L171](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/services/websocket.ts#L169-L171)

```typescript
sendPrivate(to: string, content: string): void {
  this.send({ type: 'user', to, content });  // 缺少 session_id
}
```

**问题：**
- 私聊消息只发送 `to` 和 `content`
- **没有携带 session_id**
- 后端无法关联到会话

### 2. AI 对话问题

#### 2.1 消息发送流程不一致

**当前代码位置：** [ChatView.vue#L326-L346](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/views/ChatView.vue#L326-L346)

```typescript
const handleSendMessage = async (message: string): Promise<void> => {
  if (!message.trim()) return;

  if (chatStore.isPrivateMode) {
    chatStore.sendMessage(message);  // 私聊：只更新内存
  } else if (sessionStore.currentSessionId) {
    // AI 对话：有 session_id，但发送时不携带
    const userMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    sessionStore.addLocalMessage(userMessage);  // 仅本地添加
    chatStore.sendMessage(message);  // WebSocket 发送
  }
};
```

**问题：**
- AI 对话有 `session_id`，但发送消息时不携带
- 后端 WebSocket 无法关联到会话

### 3. 缺失功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 私聊历史记录 | ❌ 缺失 | 无法查看之前的聊天记录 |
| 删除聊天记录 | ❌ 缺失 | 用户无法删除消息 |
| 自动加载历史 | ❌ 缺失 | 进入会话时不加载历史消息 |

---

## 二、前端改进方案

### 1. 私聊入口改造

#### 1.1 点击用户时的新流程

**改造前：**
```
点击用户
   ↓
直接设置 selectedUser = 用户名
   ↓
进入私聊模式（无历史记录）
```

**改造后：**
```
点击用户
   ↓
查询用户 ID（需要新增接口）
   ↓
查询/创建私聊会话
   ├─ 已有会话 → 加载历史消息
   └─ 新会话 → 显示空消息列表
   ↓
设置当前 session_id
   ↓
进入私聊模式
```

#### 1.2 代码改造位置

**文件：** [ChatView.vue](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/views/ChatView.vue)

**需要修改：**

1. `handleUserSelect` 函数
   - 调用 API 查询用户 ID
   - 调用 `sessionStore.createPrivateSession` 或查询已有会话
   - 加载该会话的历史消息
   - 设置 `sessionStore.currentSessionId`

2. `onMounted` 生命周期
   - 加载所有会话列表（包括私聊）
   - 支持私聊会话显示在左侧列表

### 2. 消息发送改造

#### 2.1 发送消息携带 session_id

**改造前 WebSocket 消息格式：**
```json
{
  "type": "user",
  "to": "target_username",
  "content": "消息内容"
}
```

**改造后 WebSocket 消息格式：**
```json
{
  "type": "user",
  "to": "target_username",
  "content": "消息内容",
  "session_id": 123
}
```

#### 2.2 AI 对话消息也携带 session_id

**改造前：**
```typescript
sendAI(content: string): void {
  this.send({ type: 'ai', content });
}
```

**改造后：**
```typescript
sendAI(content: string, sessionId?: number): void {
  this.send({ 
    type: 'ai', 
    content,
    session_id: sessionId
  });
}
```

### 3. 状态管理改进

#### 3.1 chat.ts 改造

**当前问题：**
- 私聊消息按用户名存储：`privateMessages[username]`
- 没有关联 session_id

**改进方案：**
- 私聊消息按 session_id 存储
- 与 sessionStore 统一管理

**新增状态：**
```typescript
// 私聊会话映射：targetUserId -> sessionId
const privateSessionMap = ref<Map<number, number>>(new Map());

// 当前私聊 session_id
const currentPrivateSessionId = ref<number | null>(null);
```

**改造后结构：**
```typescript
// 不再使用 privateMessages，改为统一使用 sessionStore
// sessionStore.messages 存储当前会话消息
// sessionStore.sessions 存储所有会话（包括 AI 和私聊）
```

#### 3.2 session.ts 扩展

**需要新增：**

1. `getOrCreatePrivateSession(targetUserId: number, targetUsername: string)`
   - 查询是否已有私聊会话
   - 没有则创建新会话
   - 返回会话对象

2. `loadPrivateSessions()`
   - 加载用户的所有私聊会话
   - 显示在左侧会话列表

3. `getSessionByTargetUser(targetUserId: number)`
   - 根据目标用户查询会话

### 4. 删除消息功能

#### 4.1 UI 设计

**方案一：hover 显示删除按钮**
- 鼠标悬停在消息上时，右侧显示删除图标
- 点击图标弹出确认对话框
- 确认后调用删除接口

**方案二：右键/长按菜单**
- 右键点击消息（PC）或长按（移动端）
- 弹出操作菜单（删除、复制、转发等）
- 选择删除

**推荐：方案一（实现简单，用户友好）**

#### 4.2 组件改造

**文件：** [ChatMessage.vue](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/components/ChatMessage.vue)

**需要新增：**
- 删除按钮（hover 显示）
- 点击事件触发删除
- 确认对话框

#### 4.3 删除流程

```
点击删除按钮
   ↓
确认弹窗：确定删除这条消息吗？
   ├─ 取消 → 关闭弹窗
   └─ 确定 → 调用 DELETE /api/messages/{id}
                  ↓
             成功 → 本地移除消息
             失败 → 提示错误
```

### 5. 自动加载历史记录

#### 5.1 触发时机

| 场景 | 加载内容 |
|------|----------|
| 页面加载完成 | 加载所有会话列表（AI + 私聊） |
| 选择 AI 会话 | 加载该会话的历史消息 |
| 选择私聊用户 | 查询/创建会话 → 加载历史消息 |
| 滚动到顶部 | 加载更多历史消息（分页） |

#### 5.2 分页加载

**首次加载：**
- 每页 50 条
- 按时间倒序查询
- 前端反转顺序显示

**滚动加载：**
- 检测滚动到顶部
- 加载上一页
- 插入到消息列表开头

**状态管理：**
```typescript
const hasMore = ref<boolean>(true);  // 是否还有更多
const currentPage = ref<number>(1);   // 当前页码
const isLoadingMore = ref<boolean>(false);  // 加载中
```

---

## 三、文件改造清单

### 1. 高优先级（必须改造）

| 文件 | 改造内容 |
|------|----------|
| [ChatView.vue](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/views/ChatView.vue) | 私聊入口改造、历史消息加载 |
| [chat.ts](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/stores/chat.ts) | 私聊消息持久化状态管理 |
| [session.ts](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/stores/session.ts) | 扩展私聊会话管理 |
| [websocket.ts](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/services/websocket.ts) | 消息携带 session_id |

### 2. 中优先级（功能完善）

| 文件 | 改造内容 |
|------|----------|
| [ChatMessage.vue](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/components/ChatMessage.vue) | 增加删除按钮 |
| [message.ts](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/services/message.ts) | 新增删除消息 API 调用 |
| [types/index.ts](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/types/index.ts) | 扩展类型定义 |

### 3. 可选优化

| 文件 | 改造内容 |
|------|----------|
| [api.ts](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/services/api.ts) | 统一 API 封装 |
| [auth.ts](file:///c:/Users/yangd/Desktop/Python/交互系统/frontend/webchat-frontend/src/services/auth.ts) | 新增用户查询接口 |

---

## 四、API 接口需求

### 1. 现有接口（可直接使用）

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/sessions` | 创建会话 |
| GET | `/api/sessions` | 获取会话列表 |
| GET | `/api/sessions/{id}` | 获取会话详情 |
| DELETE | `/api/sessions/{id}` | 删除会话 |
| GET | `/api/messages/session/{session_id}` | 获取会话消息 |
| DELETE | `/api/messages/{id}` | 删除/撤回消息 |

### 2. 待新增接口

| 方法 | 路径 | 功能 | 说明 |
|------|------|------|------|
| POST | `/api/sessions/private` | 创建或获取私聊会话 | 支持双向查询 |
| GET | `/api/users/search?username=xxx` | 根据用户名查询用户 | 获取用户 ID |

### 3. WebSocket 消息格式

#### 3.1 私聊消息（改造后）

**发送：**
```json
{
  "type": "user",
  "to": "target_username",
  "content": "消息内容",
  "session_id": 123
}
```

**接收：**
```json
{
  "type": "private",
  "from": "sender_username",
  "content": "消息内容",
  "session_id": 123,
  "message_id": 456,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 3.2 AI 对话消息（改造后）

**发送：**
```json
{
  "type": "ai",
  "content": "用户问题",
  "session_id": 123
}
```

**接收：**
```json
{
  "type": "ai",
  "content": "AI 回答",
  "session_id": 123,
  "message_id": 456
}
```

---

## 五、状态管理改造

### 1. chat.ts 改造前

```typescript
// 当前结构
const currentUser = ref<string | null>(null);
const aiMessages = ref<Message[]>([]);
const privateMessages = ref<PrivateChatHistory>({});  // 按用户名存储
const selectedUser = ref<string | null>(null);
const isPrivateMode = ref<boolean>(false);
```

### 2. chat.ts 改造后

```typescript
// 改造后（简化，与 sessionStore 统一）
const currentUser = ref<string | null>(null);
const currentUserId = ref<number | null>(null);  // 新增
const onlineUsers = ref<string[]>([]);
const isConnected = ref<boolean>(false);

// 私聊模式状态
const selectedTargetUserId = ref<number | null>(null);  // 新增
const selectedTargetUsername = ref<string | null>(null);  // 新增
const currentPrivateSessionId = ref<number | null>(null);  // 新增
const isPrivateMode = ref<boolean>(false);
```

### 3. session.ts 扩展

```typescript
// 新增方法

// 创建或获取私聊会话
const getOrCreatePrivateSession = async (
  targetUserId: number,
  targetUsername: string
): Promise<ChatSession> => {
  // 先查询是否已有会话
  const existing = sessions.value.find(
    s => s.session_type === 2 && 
    (s.target_user_id === targetUserId || 
     (s.user_id === targetUserId && s.target_user_id === currentUserId))
  );
  
  if (existing) {
    return existing;
  }
  
  // 创建新会话
  return await createPrivateSession(targetUserId, `与 ${targetUsername} 的对话`);
};

// 加载所有会话（包括私聊）
const loadAllSessions = async (): Promise<void> => {
  // 同时加载 AI 会话和私聊会话
  const response = await sessionApi.list();
  sessions.value = response.sessions;
};
```

---

## 六、详细改造步骤

### 步骤 1：扩展 WebSocket 消息格式

**文件：** `services/websocket.ts`

```typescript
// 新增方法
sendAI(content: string, sessionId?: number): void {
  const data: any = { type: 'ai', content };
  if (sessionId) {
    data.session_id = sessionId;
  }
  this.send(data);
}

sendPrivate(to: string, content: string, sessionId?: number): void {
  const data: any = { type: 'user', to, content };
  if (sessionId) {
    data.session_id = sessionId;
  }
  this.send(data);
}
```

### 步骤 2：改造私聊入口

**文件：** `views/ChatView.vue`

```typescript
const handleUserSelect = async (username: string): Promise<void> => {
  try {
    // 1. 查询用户 ID（需要新增 API）
    const targetUser = await userApi.getByUsername(username);
    
    // 2. 获取或创建私聊会话
    const session = await sessionStore.getOrCreatePrivateSession(
      targetUser.id,
      username
    );
    
    // 3. 设置私聊模式
    chatStore.enterPrivateMode(targetUser.id, username, session.id);
    
    // 4. 加载历史消息
    await sessionStore.selectSession(session.id);
    
  } catch (error) {
    console.error('进入私聊失败:', error);
  }
};
```

### 步骤 3：改造消息发送

**文件：** `views/ChatView.vue`

```typescript
const handleSendMessage = async (message: string): Promise<void> => {
  if (!message.trim()) return;

  if (chatStore.isPrivateMode) {
    // 私聊：携带 session_id
    chatStore.sendMessage(message, chatStore.currentPrivateSessionId);
  } else if (sessionStore.currentSessionId) {
    // AI 对话：携带 session_id
    const userMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    sessionStore.addLocalMessage(userMessage);
    chatStore.sendAIMessage(message, sessionStore.currentSessionId);
  }
};
```

### 步骤 4：添加删除消息按钮

**文件：** `components/ChatMessage.vue`

```vue
<template>
  <div class="group relative">
    <!-- 消息内容 -->
    <div :class="messageClass">
      {{ message.content }}
    </div>
    
    <!-- 删除按钮（hover 显示） -->
    <button
      v-if="canDelete"
      @click="handleDelete"
      class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 
             p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
      title="删除消息"
    >
      <svg ...>
    </button>
  </div>
</template>

<script setup lang="ts">
const canDelete = computed(() => {
  // 只能删除自己发送的消息
  return message.role === 'user' || 
         (message.role === 'private' && message.from === currentUser);
});

const handleDelete = async (): Promise<void> => {
  if (!confirm('确定删除这条消息吗？')) return;
  
  try {
    await messageApi.delete(parseInt(message.id));
    // 通知 store 删除本地消息
  } catch (error) {
    console.error('删除失败:', error);
  }
};
</script>
```

### 步骤 5：自动加载历史记录

**文件：** `stores/session.ts`

```typescript
const loadMessages = async (sessionId: number, page: number = 1): Promise<void> => {
  if (page === 1) {
    isLoadingMessages.value = true;
    messages.value = [];
  } else {
    isLoadingMore.value = true;
  }

  try {
    const response = await messageApi.getBySession(sessionId, {
      page,
      limit: 50
    });

    const newMessages = response.messages
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(convertDbMessageToLocal);

    if (page === 1) {
      messages.value = newMessages;
    } else {
      // 分页加载：插入到开头
      messages.value = [...newMessages, ...messages.value];
    }

    hasMore.value = response.has_more;
    currentPage.value = page;
  } catch (err) {
    console.error('加载消息失败:', err);
  } finally {
    isLoadingMessages.value = false;
    isLoadingMore.value = false;
  }
};
```

---

## 七、类型定义扩展

**文件：** `types/index.ts`

```typescript
// 现有类型保持不变

// 新增：用户信息
interface User {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  status: number;
}

// 新增：WebSocket 消息扩展
interface WebSocketMessage {
  type: string;
  content?: string;
  from?: string;
  to?: string;
  users?: string[];
  session_id?: number;  // 新增
  message_id?: number;   // 新增
  timestamp?: string;    // 新增
}

// 新增：会话扩展
interface ChatSession {
  id: number;
  user_id: number;
  title: string;
  session_type: number;  // 1=AI, 2=私聊
  target_user_id?: number;  // 私聊目标用户
  created_at: string;
  updated_at: string;
  is_active: number;
}

// 新增：消息扩展
interface ChatMessage {
  id: number;
  session_id: number;
  sender_type: number;   // 1=用户, 2=AI, 3=系统
  sender_id?: number;
  content: string;
  message_type: number;
  status: number;
  created_at: string;
}
```

---

## 八、注意事项

### 1. 数据同步

- WebSocket 消息和数据库消息需要同步
- 乐观更新后等待后端确认
- 失败时需要回滚本地状态

### 2. 性能优化

- 历史消息分页加载
- 大量消息时使用虚拟滚动
- 图片/文件消息懒加载

### 3. 用户体验

- 删除消息时显示确认
- 加载状态显示
- 错误提示友好

### 4. 兼容性

- 旧数据迁移（如果需要）
- 消息格式向后兼容

---

## 九、测试计划

### 功能测试

| 测试项 | 预期结果 |
|--------|----------|
| 点击在线用户 | 创建/查询私聊会话，加载历史消息 |
| 发送私聊消息 | 消息保存到数据库，对方收到推送 |
| 刷新页面 | 私聊历史记录仍然存在 |
| 删除自己的消息 | 消息标记为已撤回，前端移除 |
| 删除别人的消息 | 无删除按钮或提示无权限 |
| 选择 AI 会话 | 自动加载该会话历史消息 |
| 发送 AI 消息 | 消息保存到数据库 |

### 边界测试

| 测试项 | 预期结果 |
|--------|----------|
| 目标用户离线 | 消息保存，上线后可查看 |
| 网络断开后重连 | 消息继续发送（需要实现队列） |
| 大量历史消息 | 分页加载，不卡顿 |
