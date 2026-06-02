<template>
  <div class="min-h-screen bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center p-2 overflow-auto">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
      <div class="text-center mb-5">
        <div class="text-4xl mb-2">👤</div>
        <h1 class="text-xl font-bold text-gray-800">创建账号</h1>
        <p class="text-gray-500 text-sm mt-1">注册开始聊天之旅</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">用户名</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            :class="{ 'border-red-500': errors.username }"
            :disabled="isLoading"
          />
          <p v-if="errors.username" class="mt-1 text-xs text-red-500">{{ errors.username }}</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">昵称</label>
          <input
            v-model="form.nickname"
            type="text"
            placeholder="请输入昵称（可选）"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            :class="{ 'border-red-500': errors.nickname }"
            :disabled="isLoading"
          />
          <p v-if="errors.nickname" class="mt-1 text-xs text-red-500">{{ errors.nickname }}</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（至少8位）"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            :class="{ 'border-red-500': errors.password }"
            :disabled="isLoading"
          />
          <p v-if="errors.password" class="mt-1 text-xs text-red-500">{{ errors.password }}</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">确认密码</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            :class="{ 'border-red-500': errors.confirmPassword }"
            :disabled="isLoading"
          />
          <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-500">{{ errors.confirmPassword }}</p>
        </div>

        <div v-if="apiError" class="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-xs text-red-600">{{ apiError }}</p>
        </div>

        <button
          type="submit"
          class="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            注册中...
          </span>
          <span v-else>注册</span>
        </button>
      </form>

      <div class="mt-4 text-center">
        <p class="text-sm text-gray-600">
          已有账号？
          <router-link
            to="/login"
            class="text-green-500 hover:text-green-600 font-medium transition-colors"
          >
            立即登录
          </router-link>
        </p>
      </div>

      <div class="mt-3 pt-3 border-t border-gray-100">
        <div class="text-xs text-gray-400 space-y-0.5">
          <p>💡 密码要求：至少 8 个字符</p>
          <p>💡 用户名：只能包含字母、数字和下划线</p>
        </div>
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
  nickname: '',
  password: '',
  confirmPassword: ''
});

const errors = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: ''
});

const validate = (): boolean => {
  errors.username = '';
  errors.nickname = '';
  errors.password = '';
  errors.confirmPassword = '';
  apiError.value = null;

  if (!form.username.trim()) {
    errors.username = '请输入用户名';
    return false;
  }

  if (form.username.length < 3) {
    errors.username = '用户名至少 3 个字符';
    return false;
  }

  if (form.username.length > 50) {
    errors.username = '用户名最多 50 个字符';
    return false;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
    errors.username = '用户名只能包含字母、数字和下划线';
    return false;
  }

  if (form.nickname && form.nickname.length > 50) {
    errors.nickname = '昵称最多 50 个字符';
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

  if (form.password.length > 50) {
    errors.password = '密码最多 50 个字符';
    return false;
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码';
    return false;
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次密码输入不一致';
    return false;
  }

  return true;
};

const handleRegister = async (): Promise<void> => {
  if (!validate()) return;

  isLoading.value = true;

  try {
    const nickname = form.nickname.trim() || form.username;
    await authStore.register(
      form.username,
      form.password,
      form.confirmPassword,
      nickname
    );
    router.push('/chat');
  } catch (err: any) {
    apiError.value = err?.response?.data?.detail || '注册失败，请稍后重试';
  } finally {
    isLoading.value = false;
  }
};
</script>
