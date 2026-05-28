<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <h3 class="text-lg font-bold mb-3 text-gray-800">在线用户</h3>
    <div v-if="users.length === 0" class="text-gray-500 text-sm">
      暂无其他在线用户
    </div>
    <ul v-else class="space-y-2">
      <li
        v-for="user in users"
        :key="user"
        @click="handleUserClick(user)"
        :class="[
          'px-3 py-2 rounded cursor-pointer transition-colors duration-200',
          selectedUser === user
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-100 text-gray-700'
        ]"
      >
        <div class="flex items-center justify-between">
          <span class="font-medium">{{ user }}</span>
          <span
            :class="[
              'w-2 h-2 rounded-full',
              selectedUser === user ? 'bg-white' : 'bg-green-500'
            ]"
          ></span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
interface Props {
  users: string[];
  currentUser: string;
  selectedUser: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'select-user', username: string): void;
}>();

const handleUserClick = (username: string): void => {
  emit('select-user', username);
};
</script>

<style scoped>
</style>
