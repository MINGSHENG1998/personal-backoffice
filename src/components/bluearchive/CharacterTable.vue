<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AtkType, DefType } from '@/types/game'

interface Character {
  id: string
  name: string
  image: string
  rarity: number
  atkType: AtkType
  defType: DefType
  isNew?: boolean
  isLimited?: boolean
  class: string
}

interface Props {
  characters: Character[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'edit', character: Character): void
  (e: 'delete', character: Character): void
}>()

// State
const searchQuery = ref('')

// Computed
const filteredCharacters = computed(() => {
  if (!searchQuery.value) return props.characters

  const query = searchQuery.value.toLowerCase()
  return props.characters.filter(
    (char) =>
      char.name.toLowerCase().includes(query) ||
      char.class.toLowerCase().includes(query) ||
      char.atkType.toLowerCase().includes(query) ||
      char.defType.toLowerCase().includes(query),
  )
})

const getCharacterRarityColor = (rarity: number): string => {
  const rarityColors = {
    3: 'text-blue-500',
    4: 'text-purple-500',
    5: 'text-yellow-500',
    6: 'text-red-500',
  } as const

  return rarityColors[rarity as keyof typeof rarityColors] || 'text-gray-500'
}

const getCharacterBadges = (character: Character) => {
  const badges = []

  if (character.isNew) {
    badges.push({
      text: 'NEW',
      class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    })
  }

  if (character.isLimited) {
    badges.push({
      text: 'LIMITED',
      class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    })
  }

  return badges
}
</script>

<template>
  <div class="space-y-4">
    <div class="relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 rounded-xl">
      <div
        v-if="loading"
        class="absolute inset-0 bg-gray-50/75 dark:bg-gray-800/75 backdrop-blur flex items-center justify-center z-10"
      >
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <div
          v-for="chara in filteredCharacters"
          :key="chara.id"
          class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                {{ chara.name }}
                <span
                  v-for="badge in getCharacterBadges(chara)"
                  :key="badge.text"
                  :class="['text-xs px-1.5 py-0.5 rounded', badge.class]"
                >
                  {{ badge.text }}
                </span>
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ chara.class.toUpperCase() }}
              </p>
            </div>
            <img :src="chara.image" :alt="chara.name" class="w-16 h-16 rounded-lg object-cover" />
          </div>
          <div class="mt-2 flex items-center justify-between">
            <div>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span :class="getCharacterRarityColor(chara.rarity)"> {{ chara.rarity }}★ </span>
                <span class="text-gray-400">|</span>
                {{ chara.atkType }}/{{ chara.defType }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click.stop="emit('edit', chara)"
                class="text-blue-500 hover:text-blue-700 transition-colors"
              >
                Edit
              </button>
              <button
                @click.stop="emit('delete', chara)"
                class="text-red-500 hover:text-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
