<template>
  <div class="h-screen flex bg-gray-100">
    <aside class="w-64 bg-white shadow-lg p-4">
      <div class="mb-4 pb-4 border-b">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-bold text-gray-800">AI 聊天室</h2>
          <button
            @click="handleLogout"
            class="text-sm text-red-500 hover:text-red-600"
          >
            退出
          </button>
        </div>
        <div class="text-sm text-gray-600">
          欢迎, <span class="font-semibold">{{ chatStore.currentUser }}</span>
        </div>
        <div class="flex items-center mt-2">
          <span
            :class="[
              'w-2 h-2 rounded-full mr-2',
              chatStore.isConnected ? 'bg-green-500' : 'bg-red-500'
            ]"
          ></span>
          <span class="text-xs text-gray-500">
            {{ chatStore.isConnected ? '已连接' : '未连接' }}
          </span>
        </div>
      </div>

      <UserList
        :users="chatStore.onlineUsers"
        :currentUser="chatStore.currentUser || ''"
        :selectedUser="chatStore.selectedUser"
        @select-user="handleUserSelect"
      />

      <button
        v-if="chatStore.isPrivateMode"
        @click="exitPrivateMode"
        class="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200 text-sm"
      >
        返回 AI 对话
      </button>
    </aside>

    <main class="flex-1 flex flex-col">
      <header class="bg-white shadow-sm p-4 border-b">
        <div class="flex items-center justify-between">
          <h1 class="text-lg font-semibold text-gray-800">
            {{ chatStore.isPrivateMode ? `与 ${chatStore.selectedUser} 的私聊` : 'AI 助手' }}
          </h1>
          <button
            @click="chatStore.getOnlineUsers"
            class="px-4 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors duration-200"
          >
            刷新用户
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-6" ref="messageContainer">
        <div v-if="chatStore.connectionError" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
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
        <div v-if="chatStore.isLoading" class="flex items-center justify-center h-full">
          <div class="text-gray-500">加载中...</div>
        </div>
        <div v-else-if="chatStore.messages.length === 0" class="flex items-center justify-center h-full">
          <div class="text-center text-gray-500">
            <div class="text-4xl mb-2">💬</div>
            <p>{{ chatStore.isPrivateMode ? '开始和 ' + chatStore.selectedUser + ' 私聊吧' : '开始和 AI 对话吧' }}</p>
          </div>
        </div>
        <div v-else>
          <ChatMessage
            v-for="message in chatStore.messages"
            :key="message.id"
            :message="message"
            :is-own="message.role === 'user' || (message.role === 'private' && message.from === chatStore.currentUser)"
          />
        </div>
      </div>

      <footer class="bg-white border-t p-4">
        <MessageInput
          @send="handleSendMessage"
          :placeholder="chatStore.isPrivateMode ? `发送给 ${chatStore.selectedUser}...` : '输入消息...'"
          :disabled="!chatStore.isConnected"
        />
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import ChatMessage from '@/components/ChatMessage.vue';
import UserList from '@/components/UserList.vue';
import MessageInput from '@/components/MessageInput.vue';

const chatStore = useChatStore();
const messageContainer = ref<HTMLElement | null>(null);

const scrollToBottom = async (): Promise<void> => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

watch(() => chatStore.messages.length, () => {
  scrollToBottom();
});

watch(() => chatStore.messages, () => {
  scrollToBottom();
}, { deep: true });

onMounted(() => {
  scrollToBottom();
});

const handleSendMessage = (message: string): void => {
  chatStore.sendMessage(message);
};

const handleUserSelect = (username: string): void => {
  chatStore.selectUser(username);
};

const exitPrivateMode = (): void => {
  chatStore.selectUser(null);
};

const handleLogout = (): void => {
  if (confirm('确定要退出登录吗?')) {
    chatStore.logout();
  }
};
</script>

<style scoped>
</style>
