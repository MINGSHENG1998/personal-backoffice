<script setup lang="ts">
defineProps<{
  currentPage: number
  totalPages: number
  displayRange: {
    start: number
    end: number
    total: number
  }
}>()

const emit = defineEmits<{
  'update:currentPage': [page: number]
}>()
</script>

<template>
  <div class="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 p-4">
    <span class="text-sm text-gray-700 dark:text-gray-400">
      Showing <span class="font-semibold">{{ displayRange.start }}</span> to
      <span class="font-semibold">{{ displayRange.end }}</span> of
      <span class="font-semibold">{{ displayRange.total }}</span> entries
    </span>
    <div class="flex space-x-2">
      <button
        @click="emit('update:currentPage', currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
      >
        Previous
      </button>
      <button
        v-for="page in totalPages"
        :key="page"
        @click="emit('update:currentPage', page)"
        :class="[
          'px-3 py-1 rounded-md border',
          currentPage === page
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50',
        ]"
      >
        {{ page }}
      </button>
      <button
        @click="emit('update:currentPage', currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
</template>
