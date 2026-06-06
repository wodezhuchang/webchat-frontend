<template>
  <div class="h-screen flex bg-gray-100">
    <aside class="w-72 bg-white shadow-lg flex flex-col">
      <div class="p-4 border-b">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold text-gray-800">聊天</h2>
          <div class="flex items-center space-x-1">
            <button
              @click="handleLogout"
              class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="退出登录"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        <div class="flex items-center">
          <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {{ authStore.user?.nickname?.charAt(0)?.toUpperCase() || authStore.user?.username?.charAt(0)?.toUpperCase() || '?' }}
          </div>
          <div class="ml-3 flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-800 truncate">
              {{ authStore.user?.nickname || authStore.user?.username }}
            </div>
            <div class="flex items-center">
              <span
                :class="[
                  'w-2 h-2 rounded-full mr-1.5',
                  chatStore.isConnected ? 'bg-green-500' : 'bg-red-500'
                ]"
              ></span>
              <span class="text-xs text-gray-500">
                {{ chatStore.isConnected ? '已连接' : '未连接' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="px-4 pt-4 pb-2">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">全部会话</span>
            <button
              @click="handleNewAISession"
              class="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="新建AI对话"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div v-if="convStore.isLoading" class="py-2 text-center text-sm text-gray-400">
            加载中...
          </div>

          <div v-else-if="convStore.conversations.length === 0" class="py-2 text-center text-sm text-gray-400">
            暂无会话
          </div>

          <div v-else class="space-y-1">
            <div
              v-for="conv in convStore.conversations"
              :key="conv.id"
              @click="handleSelectConversation(conv.id)"
              :class="[
                'group flex items-start justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                convStore.currentConversationId === conv.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50 text-gray-700'
              ]"
            >
              <div class="flex items-start flex-1 min-w-0">
                <div class="flex-shrink-0 mt-1">
                  <template v-if="conv.type === 1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </template>
                  <template v-else>
                    <div :class="[
                      'w-2 h-2 rounded-full',
                      conv.is_online ? 'bg-green-500' : 'bg-gray-400'
                    ]"></div>
                  </template>
                </div>
                <div class="ml-2 flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium truncate">{{ conv.title }}</span>
                    <span v-if="conv.unread_count && conv.unread_count > 0" class="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {{ conv.unread_count }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 truncate">{{ conv.last_message || '暂无消息' }}</p>
                  <p v-if="conv.last_message_time" class="text-xs text-gray-400 mt-0.5">
                    {{ formatTime(conv.last_message_time) }}
                  </p>
                </div>
              </div>
              <button
                @click.stop="handleDeleteConversation(conv.id)"
                class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all ml-1"
                title="删除会话"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="px-4 pt-2 pb-2 border-t">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">在线用户</span>
            <button
              @click="chatStore.refreshOnlineUsers"
              class="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="刷新"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div v-if="chatStore.onlineUsers.length === 0" class="py-2 text-center text-sm text-gray-400">
            暂无其他在线用户
          </div>

          <div v-else class="space-y-1">
            <div
              v-for="user in chatStore.onlineUsers"
              :key="user"
              @click="handleOnlineUserSelect(user)"
              :class="[
                'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                convStore.currentConversation?.type === 2 && convStore.currentConversation?.target_username === user
                  ? 'bg-green-50 text-green-700'
                  : 'hover:bg-gray-50 text-gray-700'
              ]"
            >
              <div class="flex items-center flex-1 min-w-0">
                <div class="w-2 h-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></div>
                <span class="text-sm truncate">{{ user }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col">
      <header class="bg-white shadow-sm p-4 border-b">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <template v-if="convStore.currentConversation">
              <div v-if="convStore.currentConversation.type === 2" class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h1 class="text-lg font-semibold text-gray-800">
                  {{ convStore.currentConversation.title }}
                </h1>
                <span :class="[
                  'ml-2 w-2 h-2 rounded-full',
                  convStore.currentConversation.is_online ? 'bg-green-500' : 'bg-gray-400'
                ]"></span>
                <span class="ml-1 text-xs text-gray-500">
                  {{ convStore.currentConversation.is_online ? '在线' : '离线' }}
                </span>
              </div>
              <div v-else class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h1 class="text-lg font-semibold text-gray-800">
                  {{ convStore.currentConversation.title || 'AI 助手' }}
                </h1>
              </div>
            </template>
            <div v-else class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h1 class="text-lg font-semibold text-gray-400">选择一个会话开始聊天</h1>
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-6" ref="messageContainer">
        <div v-if="chatStore.connectionError" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <span class="text-xl">⚠️</span>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium">连接失败</p>
              <p class="text-xs mt-1">{{ chatStore.connectionError }}</p>
              <p class="text-xs mt-2 text-red-600">请确保后端服务正在运行 (http://localhost:8000)</p>
              <button
                @click="chatStore.connectWebSocket"
                class="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
              >
                重新连接
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="convStore.isLoadingMessages" class="flex items-center justify-center h-full">
          <div class="text-gray-500">加载中...</div>
        </div>

        <div v-else-if="!convStore.currentConversation" class="flex items-center justify-center h-full">
          <div class="text-center text-gray-500">
            <div class="text-4xl mb-2">💬</div>
            <p>请从左侧选择一个会话或新建对话</p>
          </div>
        </div>

        <div v-else-if="convStore.messages.length === 0" class="flex items-center justify-center h-full">
          <div class="text-center text-gray-500">
            <div class="text-4xl mb-2">💬</div>
            <p>开始和 {{ convStore.currentConversation.title }} 聊天吧</p>
          </div>
        </div>

        <div v-else>
          <ChatMessage
            v-for="message in convStore.messages"
            :key="message.id"
            :message="message"
            :is-own="isMessageOwn(message)"
            @delete="handleDeleteMessage"
          />
        </div>
      </div>

      <footer class="bg-white border-t p-4">
        <MessageInput
          @send="handleSendMessage"
          :placeholder="inputPlaceholder"
          :disabled="!chatStore.isConnected || !convStore.currentConversationId"
        />
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useConversationStore } from '@/stores/conversation';
import { useChatStore } from '@/stores/chat';
import { authApi } from '@/services/auth';
import ChatMessage from '@/components/ChatMessage.vue';
import MessageInput from '@/components/MessageInput.vue';
import type { Message, WebSocketMessage } from '@/types';

const router = useRouter();
const authStore = useAuthStore();
const convStore = useConversationStore();
const chatStore = useChatStore();
const messageContainer = ref<HTMLElement | null>(null);

const inputPlaceholder = computed(() => {
  if (!convStore.currentConversationId) {
    return '请先选择一个会话...';
  }
  return '输入消息...';
});

const isMessageOwn = (message: Message): boolean => {
  if (message.role === 'user') return true;
  if (message.role === 'assistant') return false;
  if (message.role === 'private') {
    if (message.from && message.from !== chatStore.currentUser) {
      return false;
    }
    return true;
  }
  return false;
};

const scrollToBottom = async (): Promise<void> => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return date.toLocaleDateString('zh-CN');
};

watch(() => convStore.messages.length, () => {
  scrollToBottom();
});

watch(() => convStore.messages, () => {
  scrollToBottom();
}, { deep: true });

watch(() => convStore.currentConversationId, () => {
  scrollToBottom();
});

const setupWebSocketCallbacks = (): void => {
  chatStore.setOnMessageCallback((data: WebSocketMessage, message: Message | null) => {
    if (data.type === 'users' && data.users) {
      convStore.refreshOnlineStatusFromList(data.users);
    }

    if (message) {
      if (data.type === 'ai' && data.conversation_id) {
        convStore.addReceivedMessage(message, data.conversation_id);
      } else if (data.type === 'private' && data.conversation_id && data.from) {
        if (!convStore.getConversationByTargetUsername(data.from)) {
          convStore.loadConversations();
        }
        
        const isCurrentConversation = convStore.currentConversationId === data.conversation_id;
        if (isCurrentConversation) {
          convStore.addLocalMessage(message);
        }
      } else if (data.type === 'info' && data.conversation_id) {
        convStore.addReceivedMessage(message, data.conversation_id);
      }
    }
  });
};

onMounted(async () => {
  const storedUserInfo = localStorage.getItem('chat_user_info');
  const storedUser = storedUserInfo ? JSON.parse(storedUserInfo) : null;
  
  const username = authStore.user?.username || storedUser?.username;
  const userId = authStore.user?.id || storedUser?.id;

  if (username) {
    chatStore.setCurrentUser(username, userId);
    if (userId) {
      convStore.setCurrentUserId(userId);
    }
    setupWebSocketCallbacks();
    chatStore.connectWebSocket();
  }

  await convStore.loadConversations();
});

const handleNewAISession = async (): Promise<void> => {
  try {
    const conv = await convStore.createAIConversation();
    await convStore.selectConversation(conv.id);
  } catch (error) {
    console.error('创建对话失败:', error);
  }
};

const handleSelectConversation = async (convId: number): Promise<void> => {
  await convStore.selectConversation(convId);
};

const handleDeleteConversation = async (convId: number): Promise<void> => {
  if (!confirm('确定要删除这个会话吗？（仅对自己隐藏）')) {
    return;
  }

  try {
    await convStore.deleteConversation(convId);
  } catch (error) {
    console.error('删除会话失败:', error);
  }
};

const handleOnlineUserSelect = async (username: string): Promise<void> => {
  const currentUsername = authStore.user?.username || chatStore.currentUser;
  if (username === currentUsername) {
    return;
  }

  try {
    const targetUser = await authApi.getUserByUsername(username);
    if (!targetUser || !targetUser.id) {
      throw new Error('用户不存在');
    }

    const currentUserId = authStore.user?.id || chatStore.currentUserId;
    if (targetUser.id === currentUserId) {
      throw new Error('不能与自己创建私聊会话');
    }

    const conv = await convStore.getOrCreatePrivateConversation(targetUser.id);
    await convStore.selectConversation(conv.id);
  } catch (error) {
    console.error('进入私聊失败:', error);
  }
};

const handleSendMessage = async (content: string): Promise<void> => {
  if (!content.trim() || !convStore.currentConversationId) return;

  const conv = convStore.currentConversation;
  if (!conv) return;

  const userMessage: Message = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    role: conv.type === 2 ? 'private' : 'user',
    content: content,
    from: chatStore.currentUser || undefined,
    to: conv.type === 2 ? (conv.target_username || undefined) : undefined,
    timestamp: new Date()
  };

  convStore.addLocalMessage(userMessage);

  if (conv.type === 2 && conv.target_username) {
    chatStore.sendPrivateMessage(
      conv.target_username,
      content,
      conv.id
    );
  } else {
    if (convStore.messages.length === 1) {
      const title = content.substring(0, 20) + (content.length > 20 ? '...' : '');
      await convStore.updateConversationTitle(conv.id, title);
    }
    chatStore.sendAIMessage(content, conv.id);
  }
};

const handleDeleteMessage = async (messageId: string): Promise<void> => {
  if (!confirm('确定删除这条消息吗？（仅对自己隐藏）')) return;

  try {
    const id = parseInt(messageId);
    if (!isNaN(id)) {
      await convStore.deleteMessage(id);
    }
  } catch (error) {
    console.error('删除消息失败:', error);
    alert('删除消息失败');
  }
};

const handleLogout = async (): Promise<void> => {
  if (!confirm('确定要退出登录吗？')) {
    return;
  }

  chatStore.logout();
  convStore.clearAll();
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
</style>
