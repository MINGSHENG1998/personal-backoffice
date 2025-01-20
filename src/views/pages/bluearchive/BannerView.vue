<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import type { AtkType, DefType } from '../../../types/game'
import Pagination from '@/components/Pagination.vue'
import SearchBar from '@/components/SearchBar.vue'
import BannerTable from '@/components/bluearchive/BannerTable.vue'

// Types in separate interface file
interface Character {
  id: string
  name: string
  image: string
  class: string
  rarity: number
  atkType: AtkType
  defType: DefType
  isNew?: boolean
  isLimited?: boolean
}

interface Banner {
  id: string
  startDate: string
  endDate: string
  characters: Character[]
  type: BannerType
  expanded?: boolean
}

type BannerType = 'New' | 'Rerun' | 'Fes' | 'Collab'

interface BannerFormData extends Omit<Banner, 'id'> {
  type: BannerType
}

// Constants
const ITEMS_PER_PAGE = 10
const BANNER_TYPES: BannerType[] = ['New', 'Rerun', 'Fes', 'Collab']
const STATUS_CLASSES = {
  New: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  Rerun: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Fes: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  Collab: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
} as const

// Composable for form handling
const useFormData = () => {
  const initialFormData: BannerFormData = {
    startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    endDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0], // 7 days later
    type: 'New',
    characters: [],
  }

  const formData = ref<BannerFormData>({ ...initialFormData })
  const resetForm = () => {
    formData.value = { ...initialFormData }
  }

  return {
    formData,
    resetForm,
  }
}

// State management
const { formData, resetForm } = useFormData()
const searchQuery = ref('')
const characterSearch = ref('')
const banners = ref<Banner[]>([])
const characters = ref<Character[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const showModal = ref(false)
const showDeleteModal = ref(false)
const selectedBanner = ref<Banner | null>(null)
const dropdownOpen = ref(false)

// Computed properties
const filteredBanners = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return banners.value.filter(
    (banner) =>
      banner.characters.some((char) => char.name.toLowerCase().includes(query)) ||
      banner.type.toLowerCase().includes(query),
  )
})

const paginatedBanners = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return filteredBanners.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredBanners.value.length / ITEMS_PER_PAGE))

const displayRange = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE + 1
  const end = Math.min(currentPage.value * ITEMS_PER_PAGE, filteredBanners.value.length)
  return { start, end, total: filteredBanners.value.length }
})

const filteredCharacters = computed(() => {
  const query = characterSearch.value.toLowerCase()
  return characters.value.filter((char) => char.name.toLowerCase().includes(query))
})

// Firebase operations
const fetchData = async () => {
  loading.value = true
  error.value = null

  try {
    const [bannersSnapshot, charactersSnapshot] = await Promise.all([
      getDocs(collection(db, 'banners')),
      getDocs(collection(db, 'characters')),
    ])

    banners.value = bannersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Banner[]

    characters.value = charactersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Character[]
  } catch (err) {
    console.error('Failed to fetch data:', err)
    error.value = 'Failed to load data. Please try again.'
  } finally {
    loading.value = false
  }
}

// Form validation
const validateForm = (): boolean => {
  const { startDate, endDate, type, characters } = formData.value
  if (!startDate || !endDate || !type || characters.length === 0) {
    error.value = 'Please fill in all required fields'
    return false
  }

  if (new Date(startDate) > new Date(endDate)) {
    error.value = 'Start date must be before end date'
    return false
  }

  return true
}

// CRUD operations
const handleCreate = async () => {
  if (!validateForm()) return

  try {
    await addDoc(collection(db, 'banners'), formData.value)
    showModal.value = false
    await fetchData()
    resetForm()
  } catch (err) {
    console.error('Failed to create banner:', err)
    error.value = 'Failed to create banner. Please try again.'
  }
}

const handleUpdate = async () => {
  if (!selectedBanner.value || !validateForm()) return

  try {
    await updateDoc(doc(db, 'banners', selectedBanner.value.id), formData.value)
    showModal.value = false
    await fetchData()
  } catch (err) {
    console.error('Failed to update banner:', err)
    error.value = 'Failed to update banner. Please try again.'
  }
}

const handleDelete = async () => {
  if (!selectedBanner.value) return

  try {
    await deleteDoc(doc(db, 'banners', selectedBanner.value.id))
    showDeleteModal.value = false
    await fetchData()
  } catch (err) {
    console.error('Failed to delete banner:', err)
    error.value = 'Failed to delete banner. Please try again.'
  }
}

// UI handlers
const openEditModal = (banner: Banner) => {
  selectedBanner.value = banner
  formData.value = {
    startDate: banner.startDate,
    endDate: banner.endDate,
    type: banner.type,
    characters: [...banner.characters],
  }
  showModal.value = true
}

const openCreateModal = () => {
  selectedBanner.value = null
  resetForm()
  showModal.value = true
}

const toggleCharacter = (character: Character) => {
  const index = formData.value.characters.findIndex((char) => char.id === character.id)
  if (index === -1) {
    formData.value.characters.push(character)
  } else {
    formData.value.characters.splice(index, 1)
  }
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const isSelected = (id: string): boolean => formData.value.characters.some((char) => char.id === id)

const removeCharacter = (id: string) => {
  formData.value.characters = formData.value.characters.filter((char) => char.id !== id)
}

// Watchers
watch(searchQuery, () => {
  currentPage.value = 1
})

// Lifecycle hooks
onMounted(fetchData)
</script>

<template>
  <section class="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
    <div class="mx-auto max-w-screen-xl px-4 lg:px-12">
      <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-800 rounded-lg" role="alert">
        {{ error }}
      </div>

      <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <!-- Search and Actions Bar -->
        <div
          class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4"
        >
          <SearchBar v-model="searchQuery" placeholder="Search banners..." :disabled="loading" />

          <button
            @click="openCreateModal"
            :disabled="loading"
            class="flex items-center justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 disabled:opacity-50"
          >
            <svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clip-rule="evenodd"
              />
            </svg>
            Add Banner
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center p-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
        </div>

        <!-- Content -->
        <template v-else>
          <BannerTable
            :banners="paginatedBanners"
            :status-classes="STATUS_CLASSES"
            @edit="openEditModal"
            @delete="
              (banner) => {
                selectedBanner = banner
                showDeleteModal = true
              }
            "
          />

          <Pagination
            v-if="filteredBanners.length > 0"
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :display-range="displayRange"
          />

          <!-- No Results -->
          <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400">
            No banners found matching your search.
          </div>
        </template>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed overflow-y-auto overflow-x-hidden top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-modal md:h-full bg-gray-900 bg-opacity-50 p-4"
    >
      <div class="relative p-4 w-full max-w-2xl h-full md:h-auto mx-auto">
        <!-- Modal content -->
        <div class="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
          <!-- Modal header -->
          <div
            class="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ selectedBanner ? 'Edit Banner' : 'Create Banner' }}
            </h3>
            <button
              type="button"
              @click="showModal = false"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>

          <!-- Modal body -->
          <form @submit.prevent="selectedBanner ? handleUpdate() : handleCreate()">
            <div class="grid gap-4 mb-4 sm:grid-cols-2">
              <!-- Start Date -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Start Date</label
                >
                <input
                  v-model="formData.startDate"
                  type="date"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                />
              </div>

              <!-- End Date -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >End Date</label
                >
                <input
                  v-model="formData.endDate"
                  type="date"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                />
              </div>

              <!-- Type -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Type</label
                >
                <select
                  v-model="formData.type"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                >
                  <option value="New">New</option>
                  <option value="Rerun">Rerun</option>
                  <option value="Fes">Fes</option>
                  <option value="Collab">Collab</option>
                </select>
              </div>

              <!-- Characters -->
              <div class="sm:col-span-2">
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Characters</label
                >
                <div
                  @click="toggleDropdown"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 cursor-pointer"
                >
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="char in formData.characters"
                      :key="char.id"
                      class="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-600"
                    >
                      {{ char.name }}
                      <button
                        @click.stop="removeCharacter(char.id)"
                        class="ml-2 hover:text-gray-900 p-0.5"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <span v-if="formData.characters.length === 0">No characters selected</span>
                    <span class="mt-2" v-else
                      >{{ formData.characters.length }} character{{
                        formData.characters.length > 1 ? 's' : ''
                      }}
                      selected</span
                    >
                    <svg
                      class="w-4 h-4 ml-auto"
                      :class="{ 'rotate-180': dropdownOpen }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <!-- Dropdown -->
                <div
                  v-if="dropdownOpen"
                  class="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
                >
                  <div
                    class="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
                  >
                    <input
                      type="text"
                      v-model="characterSearch"
                      placeholder="Search characters..."
                      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      @click.stop
                    />
                  </div>
                  <div class="py-1">
                    <div
                      v-for="character in filteredCharacters"
                      :key="character.id"
                      class="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                      @click.stop="toggleCharacter(character)"
                    >
                      <div class="flex items-center flex-1 min-w-0">
                        <div class="relative flex-shrink-0">
                          <img
                            :src="character.image"
                            :alt="character.name"
                            class="w-8 h-8 rounded-full object-cover border-2"
                            :class="[
                              isSelected(character.id)
                                ? 'border-primary-500'
                                : 'border-transparent',
                            ]"
                          />
                          <div
                            v-if="isSelected(character.id)"
                            class="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center"
                          >
                            <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <div class="ml-3 flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                            {{ character.name }} ( {{ character.class?.toUpperCase() }} )
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {{ character.rarity }}★ {{ character.atkType }}/{{ character.defType }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex items-center space-x-4">
              <button
                type="submit"
                class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                {{ selectedBanner ? 'Update banner' : 'Create banner' }}
              </button>
              <button
                type="button"
                @click="showModal = false"
                class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h3 class="text-lg font-semibold mb-4">Delete Banner</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete this banner? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            @click="handleDelete"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
