<template>
  <div class="h-screen flex bg-gray-100">
    <aside class="w-72 bg-white shadow-lg flex flex-col">
      <div class="p-4 border-b">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold text-gray-800">AI 聊天室</h2>
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
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI 对话</span>
            <button
              @click="handleNewAISession"
              class="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="新建对话"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div v-if="sessionStore.isLoading" class="py-2 text-center text-sm text-gray-400">
            加载中...
          </div>

          <div v-else-if="sessionStore.aiSessions.length === 0" class="py-2 text-center text-sm text-gray-400">
            暂无对话
          </div>

          <div v-else class="space-y-1">
            <div
              v-for="session in sessionStore.aiSessions"
              :key="session.id"
              @click="handleSelectAISession(session.id)"
              :class="[
                'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                sessionStore.currentSessionId === session.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50 text-gray-700'
              ]"
            >
              <div class="flex items-center flex-1 min-w-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span class="text-sm truncate">{{ session.title }}</span>
              </div>
              <button
                @click.stop="handleDeleteSession(session.id)"
                class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
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
              @click="chatStore.getOnlineUsers"
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
              @click="handleUserSelect(user)"
              :class="[
                'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors',
                chatStore.selectedUser === user
                  ? 'bg-green-50 text-green-700'
                  : 'hover:bg-gray-50 text-gray-700'
              ]"
            >
              <div class="flex items-center flex-1 min-w-0">
                <div class="w-2 h-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></div>
                <span class="text-sm truncate">{{ user }}</span>
              </div>
              <button
                v-if="chatStore.selectedUser === user"
                @click.stop="exitPrivateMode"
                class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                title="返回"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col">
      <header class="bg-white shadow-sm p-4 border-b">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div v-if="chatStore.isPrivateMode" class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h1 class="text-lg font-semibold text-gray-800">
                与 {{ chatStore.selectedUser }} 的私聊
              </h1>
            </div>
            <div v-else class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h1 class="text-lg font-semibold text-gray-800">
                {{ sessionStore.currentSession?.title || 'AI 助手' }}
              </h1>
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

        <div v-else-if="sessionStore.isLoadingMessages" class="flex items-center justify-center h-full">
          <div class="text-gray-500">加载中...</div>
        </div>

        <div v-else-if="displayMessages.length === 0" class="flex items-center justify-center h-full">
          <div class="text-center text-gray-500">
            <div class="text-4xl mb-2">💬</div>
            <p>{{ chatStore.isPrivateMode ? '开始和 ' + chatStore.selectedUser + ' 私聊吧' : (sessionStore.currentSession ? '开始和 AI 对话吧' : '请创建一个新对话') }}</p>
          </div>
        </div>

        <div v-else>
          <ChatMessage
            v-for="message in displayMessages"
            :key="message.id"
            :message="message"
            :is-own="message.role === 'user' || (message.role === 'private' && message.from === chatStore.currentUser)"
          />
        </div>
      </div>

      <footer class="bg-white border-t p-4">
        <MessageInput
          @send="handleSendMessage"
          :placeholder="inputPlaceholder"
          :disabled="!chatStore.isConnected || (!chatStore.isPrivateMode && !sessionStore.currentSessionId)"
        />
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSessionStore } from '@/stores/session';
import { useChatStore } from '@/stores/chat';
import ChatMessage from '@/components/ChatMessage.vue';
import MessageInput from '@/components/MessageInput.vue';

const router = useRouter();
const authStore = useAuthStore();
const sessionStore = useSessionStore();
const chatStore = useChatStore();
const messageContainer = ref<HTMLElement | null>(null);

const displayMessages = computed(() => {
  if (chatStore.isPrivateMode) {
    return chatStore.messages;
  }
  return sessionStore.messages;
});

const inputPlaceholder = computed(() => {
  if (chatStore.isPrivateMode) {
    return `发送给 ${chatStore.selectedUser}...`;
  }
  if (!sessionStore.currentSessionId) {
    return '请先创建一个新对话...';
  }
  return '输入消息...';
});

const scrollToBottom = async (): Promise<void> => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

watch(() => displayMessages.value.length, () => {
  scrollToBottom();
});

watch(() => displayMessages.value, () => {
  scrollToBottom();
}, { deep: true });

watch(() => chatStore.isPrivateMode, () => {
  scrollToBottom();
});

watch(() => sessionStore.currentSessionId, () => {
  scrollToBottom();
});

onMounted(async () => {
  const username = authStore.user?.username || localStorage.getItem('chat_user_info') ? JSON.parse(localStorage.getItem('chat_user_info') || '{}').username : null;
  if (username) {
    chatStore.login(username);
  }

  await sessionStore.loadSessions();

  if (sessionStore.aiSessions.length > 0) {
    await sessionStore.selectSession(sessionStore.aiSessions[0].id);
  }
});

const handleNewAISession = async (): Promise<void> => {
  try {
    const session = await sessionStore.createAISession('新对话');
    await sessionStore.selectSession(session.id);
  } catch (error) {
    console.error('创建会话失败:', error);
  }
};

const handleSelectAISession = async (sessionId: number): Promise<void> => {
  if (chatStore.isPrivateMode) {
    exitPrivateMode();
  }
  await sessionStore.selectSession(sessionId);
};

const handleDeleteSession = async (sessionId: number): Promise<void> => {
  if (!confirm('确定要删除这个会话吗？')) {
    return;
  }

  try {
    await sessionStore.deleteSession(sessionId);
  } catch (error) {
    console.error('删除会话失败:', error);
  }
};

const handleUserSelect = (username: string): void => {
  chatStore.selectUser(username);
};

const exitPrivateMode = (): void => {
  chatStore.selectUser(null);
};

const handleSendMessage = async (message: string): Promise<void> => {
  if (!message.trim()) return;

  if (chatStore.isPrivateMode) {
    chatStore.sendMessage(message);
  } else if (sessionStore.currentSessionId) {
    if (sessionStore.messages.length === 0) {
      const title = message.substring(0, 20) + (message.length > 20 ? '...' : '');
      await sessionStore.updateSessionTitle(sessionStore.currentSessionId, title);
    }

    const userMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    sessionStore.addLocalMessage(userMessage);
    chatStore.sendMessage(message);
  }
};

const handleLogout = async (): Promise<void> => {
  if (!confirm('确定要退出登录吗？')) {
    return;
  }

  chatStore.logout();
  sessionStore.clearAll();
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
</style>
