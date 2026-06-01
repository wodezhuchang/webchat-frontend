import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, AuthLoginResponse, AuthRefreshResponse } from '@/types';
import { STORAGE_KEYS } from '@/types';
import { authApi } from '@/services/auth';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const tokenExpiresAt = ref<number | null>(null);
  const user = ref<User | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => {
    return accessToken.value !== null && user.value !== null;
  });

  const getAccessToken = (): string | null => {
    return accessToken.value || localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  };

  const saveToStorage = (): void => {
    if (accessToken.value) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken.value);
    }
    if (refreshToken.value) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken.value);
    }
    if (tokenExpiresAt.value) {
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, tokenExpiresAt.value.toString());
    }
    if (user.value) {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user.value));
    }
  };

  const clearStorage = (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
  };

  const restoreFromStorage = (): boolean => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);

    if (token && userStr && expiresAt) {
      const expiresTime = parseInt(expiresAt, 10);
      if (Date.now() < expiresTime) {
        accessToken.value = token;
        refreshToken.value = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        tokenExpiresAt.value = expiresTime;
        user.value = JSON.parse(userStr);
        return true;
      } else {
        clearStorage();
      }
    }
    return false;
  };

  const setTokens = (response: AuthLoginResponse): void => {
    accessToken.value = response.access_token;
    refreshToken.value = response.refresh_token;
    tokenExpiresAt.value = Date.now() + response.expires_in * 1000;
    user.value = response.user;
    saveToStorage();
  };

  const updateAccessToken = (response: AuthRefreshResponse): void => {
    accessToken.value = response.access_token;
    tokenExpiresAt.value = Date.now() + response.expires_in * 1000;
    saveToStorage();
  };

  const shouldRefreshToken = (): boolean => {
    if (!tokenExpiresAt.value) return false;
    const buffer = 60 * 1000;
    return tokenExpiresAt.value - Date.now() < buffer;
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken.value) return false;

    try {
      const response = await authApi.refreshToken(refreshToken.value);
      updateAccessToken(response);
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authApi.login({ username, password });
      setTokens(response);
      return true;
    } catch (err: any) {
      error.value = err?.response?.data?.detail || err.message || '登录失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (
    username: string,
    password: string,
    confirmPassword: string,
    nickname: string
  ): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authApi.register({
        username,
        password,
        confirm_password: confirmPassword,
        nickname
      });
      setTokens(response);
      return true;
    } catch (err: any) {
      error.value = err?.response?.data?.detail || err.message || '注册失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (accessToken.value) {
        await authApi.logout(accessToken.value);
      }
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      accessToken.value = null;
      refreshToken.value = null;
      tokenExpiresAt.value = null;
      user.value = null;
      clearStorage();
    }
  };

  const fetchCurrentUser = async (): Promise<boolean> => {
    if (!accessToken.value) return false;

    try {
      const currentUser = await authApi.getCurrentUser(accessToken.value);
      user.value = currentUser;
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(currentUser));
      }
      return true;
    } catch (err) {
      console.error('Fetch user failed:', err);
      logout();
      return false;
    }
  };

  const setUser = (userData: User): void => {
    user.value = userData;
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userData));
  };

  return {
    accessToken,
    refreshToken,
    tokenExpiresAt,
    user,
    isLoading,
    error,
    isAuthenticated,
    getAccessToken,
    saveToStorage,
    clearStorage,
    restoreFromStorage,
    setTokens,
    shouldRefreshToken,
    refreshAccessToken,
    login,
    register,
    logout,
    fetchCurrentUser,
    setUser
  };
});
