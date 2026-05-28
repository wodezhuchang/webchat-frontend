<template>
  <div class="flex gap-2">
    <input
      v-model="message"
      type="text"
      :placeholder="placeholder"
      @keyup.enter="handleSend"
      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      :disabled="disabled"
    />
    <button
      @click="handleSend"
      :disabled="!message.trim() || disabled"
      class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
    >
      发送
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  placeholder?: string;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  placeholder: '输入消息...',
  disabled: false
});

const emit = defineEmits<{
  (e: 'send', message: string): void;
}>();

const message = ref('');

const handleSend = (): void => {
  if (message.value.trim()) {
    emit('send', message.value.trim());
    message.value = '';
  }
};
</script>

<style scoped>
</style>
