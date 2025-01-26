<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AtkType, DefType } from '@/types/game'
import type { Banner } from '../../types/banner'

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
  banners: Banner[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  edit: [banner: Banner]
  delete: [banner: Banner]
}>()

// State
const selectedBanner = ref<Banner | null>(null)
const searchQuery = ref('')

// Computed
const filteredBanners = computed(() => {
  if (!searchQuery.value) return props.banners

  const query = searchQuery.value.toLowerCase()
  return props.banners.filter(
    (banner) =>
      banner.characters.some(
        (char) =>
          char.name.toLowerCase().includes(query) ||
          char.class.toLowerCase().includes(query) ||
          char.atkType.toLowerCase().includes(query) ||
          char.defType.toLowerCase().includes(query),
      ) || banner.type.toLowerCase().includes(query),
  )
})

// Methods
const toggleExpand = (banner: Banner) => {
  banner.expanded = !banner.expanded
}

const closeMenu = () => {
  console.log('close menu')
  selectedBanner.value = null
}

const getStatusClass = (status: Banner['type']): string => {
  const statusClasses = {
    New: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Rerun: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Fes: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    Collab: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  } as const

  return statusClasses[status] || ''
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString()
}

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
  <div class="space-y-4 relative">
    <!-- Table -->
    <div class="relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 rounded-xl">
      <!-- Overlay for dropdown to break out of table constraints -->
      <div
        v-if="selectedBanner"
        class="fixed inset-0 z-40 bg-transparent"
        @click.stop="selectedBanner = null"
      ></div>
      <div
        v-if="loading"
        class="absolute inset-0 bg-gray-50/75 dark:bg-gray-800/75 backdrop-blur flex items-center justify-center z-10"
      >
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead
            class="bg-gray-50/75 dark:bg-gray-800/75 backdrop-blur supports-[backdrop-filter]:bg-white/60"
          >
            <tr>
              <th
                scope="col"
                class="px-6 py-4 text-left font-semibold text-gray-900 dark:text-gray-100"
              >
                Banner Name
              </th>
              <th
                scope="col"
                class="px-6 py-4 text-left font-semibold text-gray-900 dark:text-gray-100"
              >
                Type
              </th>
              <th
                scope="col"
                class="px-6 py-4 text-left font-semibold text-gray-900 dark:text-gray-100"
              >
                Status
              </th>
              <th
                scope="col"
                class="px-6 py-4 text-left font-semibold text-gray-900 dark:text-gray-100"
              >
                Start Date
              </th>
              <th
                scope="col"
                class="px-6 py-4 text-left font-semibold text-gray-900 dark:text-gray-100"
              >
                End Date
              </th>
              <th scope="col" class="px-6 py-4 text-right">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <template v-for="banner in filteredBanners" :key="banner.id">
              <!-- Banner Row -->
              <tr
                class="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors relative"
                :class="{ 'bg-gray-50/25 dark:bg-gray-800/25': banner.expanded }"
              >
                <th scope="row" class="px-6 py-4">
                  <div
                    class="flex items-center space-x-2 cursor-pointer"
                    @click="toggleExpand(banner)"
                  >
                    <svg
                      :class="[
                        'w-5 h-5 transition-transform duration-200',
                        { 'rotate-90': banner.expanded },
                      ]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ banner.characters[0].name }}
                    </span>
                  </div>
                </th>
                <td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {{ banner.type }}
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusClass(banner.type),
                    ]"
                  >
                    {{ banner.type }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {{ formatDate(banner.startDate) }}
                </td>
                <td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {{ formatDate(banner.endDate) }}
                </td>
                <td class="px-6 py-4">
                  <div class="relative flex justify-end">
                    <button
                      @click.stop="selectedBanner = banner"
                      class="invisible group-hover:visible inline-flex items-center p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
                        />
                      </svg>
                    </button>

                    <!-- Dropdown menu -->
                    <div
                      v-if="selectedBanner === banner"
                      class="fixed mt-1 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    >
                      <div class="py-1">
                        <button
                          @click.stop="((selectedBanner = null), emit('edit', banner))"
                          class="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg
                            class="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          @click.stop="((selectedBanner = null), emit('delete', banner))"
                          class="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path
                              fill-rule="evenodd"
                              d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452z"
                              clip-rule="evenodd"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Expanded Content -->
              <tr v-if="banner.expanded">
                <td colspan="6" class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                  <div class="pl-8">
                    <h4 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                      Banner Details
                    </h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div
                        v-for="chara in banner.characters"
                        :key="chara.id"
                        class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
                      >
                        <div class="flex items-start justify-between">
                          <div>
                            <p
                              class="font-medium text-gray-900 dark:text-white flex items-center gap-2"
                            >
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
                          <img
                            :src="chara.image"
                            :alt="chara.name"
                            class="w-12 h-12 rounded-lg object-cover"
                          />
                        </div>
                        <div class="mt-2">
                          <p
                            class="mt-1 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                          >
                            <span :class="getCharacterRarityColor(chara.rarity)">
                              {{ chara.rarity }}★
                            </span>
                            <span class="text-gray-400">|</span>
                            {{ chara.atkType }}/{{ chara.defType }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
