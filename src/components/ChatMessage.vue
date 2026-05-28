<template>
  <div :class="messageClasses">
    <div class="flex flex-col">
      <div class="text-xs text-gray-500 mb-1">
        <span v-if="message.from" class="font-semibold">{{ message.from }}</span>
        <span v-else-if="message.role === 'user'">我</span>
        <span v-else-if="message.role === 'assistant'">AI 助手</span>
        <span v-else-if="message.role === 'system'">系统</span>
        <span class="ml-2">{{ formattedTime }}</span>
      </div>
      <div :class="contentClasses">
        {{ message.content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Message } from '@/types';

interface Props {
  message: Message;
  isOwn?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOwn: false
});

const messageClasses = computed(() => {
  const base = 'flex mb-3';
  if (props.message.role === 'system') {
    return `${base} justify-center`;
  }
  return props.isOwn || props.message.role === 'user'
    ? `${base} justify-end`
    : `${base} justify-start`;
});

const contentClasses = computed(() => {
  const base = 'px-4 py-2 rounded-lg max-w-md break-words';
  if (props.message.role === 'system') {
    return `${base} bg-gray-100 text-gray-600 text-sm`;
  }
  if (props.isOwn || props.message.role === 'user') {
    return `${base} bg-blue-500 text-white`;
  }
  if (props.message.role === 'private') {
    return `${base} bg-green-500 text-white`;
  }
  return `${base} bg-gray-200 text-gray-800`;
});

const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
});
</script>

<style scoped>
</style>
