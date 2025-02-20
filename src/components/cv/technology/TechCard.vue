<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Technology {
  IconUrl: string
  name: string
}

defineProps<{
  modelValue: Technology
  isEditing: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: Technology): void
  (e: 'remove'): void
}>()
</script>
<template>
  <div class="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <img :src="modelValue.IconUrl" :alt="modelValue.name" class="w-6 h-6" />
    <div class="flex-1 space-y-2">
      <input
        v-model="modelValue.IconUrl"
        :disabled="!isEditing"
        placeholder="Icon URL"
        class="w-full bg-transparent border-none focus:ring-0"
      />
      <input
        v-model="modelValue.name"
        :disabled="!isEditing"
        placeholder="Technology Name"
        class="w-full bg-transparent border-none focus:ring-0"
      />
    </div>
    <button v-if="isEditing" @click="$emit('remove')" class="text-red-500 hover:text-red-700">
      ×
    </button>
  </div>
</template>
