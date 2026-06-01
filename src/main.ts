import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.isAuthenticated) {
    authStore.restoreFromStorage();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
    return;
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/chat');
    return;
  }

  next();
});

app.mount('#app');
