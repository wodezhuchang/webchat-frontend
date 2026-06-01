<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div class="text-center mb-8">
        <div class="text-6xl mb-4">💬</div>
        <h1 class="text-2xl font-bold text-gray-800">AI 聊天室</h1>
        <p class="text-gray-500 mt-2">登录开始聊天</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            :class="{ 'border-red-500': errors.username }"
            :disabled="isLoading"
          />
          <p v-if="errors.username" class="mt-1 text-sm text-red-500">{{ errors.username }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            :class="{ 'border-red-500': errors.password }"
            :disabled="isLoading"
          />
          <p v-if="errors.password" class="mt-1 text-sm text-red-500">{{ errors.password }}</p>
        </div>

        <div v-if="apiError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ apiError }}</p>
        </div>

        <button
          type="submit"
          class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            登录中...
          </span>
          <span v-else>登录</span>
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-600">
          还没有账号？
          <router-link
            to="/register"
            class="text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            立即注册
          </router-link>
        </p>
      </div>

      <div class="mt-4 pt-4 border-t border-gray-100">
        <p class="text-xs text-gray-400 text-center">
          提示：密码至少需要 8 个字符
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isLoading = ref(false);
const apiError = ref<string | null>(null);

const form = reactive({
  username: '',
  password: ''
});

const errors = reactive({
  username: '',
  password: ''
});

const validate = (): boolean => {
  errors.username = '';
  errors.password = '';
  apiError.value = null;

  if (!form.username.trim()) {
    errors.username = '请输入用户名';
    return false;
  }

  if (form.username.length < 3) {
    errors.username = '用户名至少 3 个字符';
    return false;
  }

  if (!form.password) {
    errors.password = '请输入密码';
    return false;
  }

  if (form.password.length < 8) {
    errors.password = '密码至少 8 个字符';
    return false;
  }

  return true;
};

const handleLogin = async (): Promise<void> => {
  if (!validate()) return;

  isLoading.value = true;

  try {
    await authStore.login(form.username, form.password);
    router.push('/chat');
  } catch (err: any) {
    apiError.value = err?.response?.data?.detail || '登录失败，请检查用户名和密码';
  } finally {
    isLoading.value = false;
  }
};
</script>
