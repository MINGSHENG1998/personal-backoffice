<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from 'vue'
import TechCard from '@/components/cv/technology/TechCard.vue'

interface Technology {
  IconUrl: string
  name: string
}

interface Technologies {
  [key: string]: Technology[]
}

const props = defineProps<{
  modelValue: Technologies
  isEditing: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Technologies): void
}>()

const newCategoryName = ref('')

// Computed property for easier handling
const categorizedTechnologies = computed(() => {
  return Object.entries(props.modelValue).map(([category, techs]) => ({
    category,
    techs,
    isArray: Array.isArray(techs),
  }))
})

const addTechnology = (category: string) => {
  if (!Array.isArray(props.modelValue[category])) return

  const updatedValue = { ...props.modelValue }
  updatedValue[category] = [
    ...(props.modelValue[category] as Technology[]),
    { IconUrl: '', name: '' },
  ]

  emit('update:modelValue', updatedValue)
}

const removeTechnology = (category: string, index: number) => {
  if (!Array.isArray(props.modelValue[category])) return

  const updatedValue = { ...props.modelValue }
  updatedValue[category] = (props.modelValue[category] as Technology[]).filter(
    (_, i) => i !== index,
  )

  emit('update:modelValue', updatedValue)
}

const addCategory = () => {
  const categoryName = newCategoryName.value.trim().toLowerCase()
  if (!categoryName) return
  if (props.modelValue[categoryName]) return alert('Category already exists!')

  emit('update:modelValue', { ...props.modelValue, [categoryName]: [] })
  newCategoryName.value = '' // Reset input
}

const removeCategory = (category: string) => {
  if (!confirm(`Are you sure you want to delete "${category}"?`)) return

  const updatedValue = { ...props.modelValue }
  delete updatedValue[category]

  emit('update:modelValue', updatedValue)
}
</script>

<template>
  <div class="p-6">
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Technologies</h2>

    <!-- Add new category input -->
    <div v-if="isEditing" class="mb-4 flex items-center gap-2">
      <input
        v-model="newCategoryName"
        placeholder="Enter category name..."
        class="p-2 border rounded-lg w-full dark:bg-gray-700"
      />
      <button
        @click="addCategory"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        ➕ Add
      </button>
    </div>

    <div class="space-y-6">
      <div v-for="{ category, techs, isArray } in categorizedTechnologies" :key="category">
        <!-- Category Header with Delete Button -->
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium capitalize text-gray-800 dark:text-gray-200">
            {{ category }}
          </h3>

          <button
            v-if="isEditing"
            @click="removeCategory(category)"
            class="text-red-600 hover:text-red-700 text-sm"
          >
            🗑 Delete
          </button>
        </div>

        <!-- If value is not an array -->
        <div v-if="!isArray">
          <input
            v-model="modelValue[category]"
            :disabled="!isEditing"
            class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <!-- If value is an array -->
        <div v-else>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <tech-card
              v-for="(tech, index) in techs"
              :key="index"
              v-model="modelValue[category][index]"
              :is-editing="isEditing"
              @remove="removeTechnology(category, index)"
            />
          </div>

          <!-- No technologies message -->
          <p v-if="techs.length === 0" class="text-gray-500 italic mt-2">
            No technologies added yet.
          </p>

          <!-- Add new technology button -->
          <button
            v-if="isEditing"
            @click="addTechnology(category)"
            class="mt-2 flex items-center gap-2 p-2 border border-dashed rounded-lg text-gray-600 hover:border-blue-500"
          >
            ➕ Add Technology
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
