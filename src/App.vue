<template>
  <div id="app">
    <LoginModal
      ref="loginModalRef"
      v-if="!chatStore.currentUser"
      :show="!chatStore.currentUser"
      @login="handleLogin"
    />
    <ChatView v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useChatStore } from '@/stores/chat';
import LoginModal from '@/components/LoginModal.vue';
import ChatView from '@/views/ChatView.vue';

const chatStore = useChatStore();
const loginModalRef = ref<InstanceType<typeof LoginModal> | null>(null);


const handleLogin = async (username: string): Promise<void> => {
  try {
    await chatStore.login(username);
  } catch (error) {
    if (loginModalRef.value) {
      loginModalRef.value.setError(error instanceof Error ? error.message : '登录失败');
    }
  }
};
</script>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
