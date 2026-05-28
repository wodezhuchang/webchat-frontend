<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">欢迎来到 AI 聊天室</h2>
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label for="username" class="block text-gray-700 text-sm font-bold mb-2">
            用户名
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div v-if="error" class="mb-4 text-red-500 text-sm text-center">
          {{ error }}
        </div>
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'login', username: string): void;
}>();

const username = ref('');
const error = ref('');
const isLoading = ref(false);

const handleSubmit = async (): Promise<void> => {
  if (!username.value.trim()) {
    error.value = '用户名不能为空';
    return;
  }

  error.value = '';
  isLoading.value = true;

  try {
    emit('login', username.value.trim());
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登录失败';
  } finally {
    isLoading.value = false;
  }
};

const reset = (): void => {
  username.value = '';
  error.value = '';
  isLoading.value = false;
};

const setError = (errMsg: string): void => {
  error.value = errMsg;
};

defineExpose({ reset, setError });
</script>

<style scoped>
</style>
