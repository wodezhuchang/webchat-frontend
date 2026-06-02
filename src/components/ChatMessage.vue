<template>
  <div :class="messageClasses">
    <div class="flex flex-col relative group">
      <div class="text-xs text-gray-500 mb-1" :class="isOwn ? 'text-right' : 'text-left'">
        <span v-if="message.from" class="font-semibold">{{ message.from }}</span>
        <span v-else-if="message.role === 'user'">我</span>
        <span v-else-if="message.role === 'assistant'">AI 助手</span>
        <span v-else-if="message.role === 'system'">系统</span>
        <span class="ml-2">{{ formattedTime }}</span>
      </div>
      <div class="flex items-center" :class="isOwn ? 'flex-row-reverse' : 'flex-row'">
        <div :class="contentClasses">
          {{ message.content }}
        </div>
        <button
          v-if="canDelete"
          @click="handleDelete"
          class="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all ml-2"
          title="删除消息"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Message } from '@/types';
import { useChatStore } from '@/stores/chat';

interface Props {
  message: Message;
  isOwn?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOwn: false
});

const emit = defineEmits<{
  delete: [messageId: string]
}>();

const chatStore = useChatStore();

const isOwn = computed(() => {
  return props.isOwn || 
         props.message.role === 'user' || 
         (props.message.role === 'private' && props.message.from === chatStore.currentUser);
});

const canDelete = computed(() => {
  return isOwn.value && props.message.role !== 'system';
});

const messageClasses = computed(() => {
  const base = 'flex mb-3';
  if (props.message.role === 'system') {
    return `${base} justify-center`;
  }
  return isOwn.value
    ? `${base} justify-end`
    : `${base} justify-start`;
});

const contentClasses = computed(() => {
  const base = 'px-4 py-2 rounded-lg max-w-md break-words';
  if (props.message.role === 'system') {
    return `${base} bg-gray-100 text-gray-600 text-sm`;
  }
  if (isOwn.value) {
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

const handleDelete = (): void => {
  emit('delete', props.message.id);
};
</script>

<style scoped>
</style>
