<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { baDB } from '../../../firebase/config'
import type { AtkType, DefType } from '../../../types/game'
import SearchBar from '@/components/SearchBar.vue'
import CharacterTable from '@/components/bluearchive/CharacterTable.vue'
import Pagination from '@/components/Pagination.vue'

// Types
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

// Constants
const ITEMS_PER_PAGE = 10

// State management
const searchQuery = ref('')
const characters = ref<Character[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const showModal = ref(false)
const showDeleteModal = ref(false)
const selectedCharacter = ref<Character | null>(null)

// Computed properties
const filteredCharacters = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return characters.value.filter(
    (char) =>
      char.name.toLowerCase().includes(query) ||
      char.class.toLowerCase().includes(query) ||
      char.atkType.toLowerCase().includes(query) ||
      char.defType.toLowerCase().includes(query),
  )
})

const paginatedCharacters = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  return filteredCharacters.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredCharacters.value.length / ITEMS_PER_PAGE))

const displayRange = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE + 1
  const end = Math.min(currentPage.value * ITEMS_PER_PAGE, filteredCharacters.value.length)
  return { start, end, total: filteredCharacters.value.length }
})

// Firebase operations
const fetchCharacters = async () => {
  loading.value = true
  error.value = null

  try {
    const charactersSnapshot = await getDocs(collection(baDB, 'characters'))
    characters.value = charactersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Character[]
  } catch (err) {
    console.error('Failed to fetch characters:', err)
    error.value = 'Failed to load characters. Please try again.'
  } finally {
    loading.value = false
  }
}

// Form handling
const characterForm = ref<Omit<Character, 'id'>>({
  name: '',
  image: '',
  class: 'striker',
  rarity: 3,
  atkType: 'explosive',
  defType: 'light',
  isNew: false,
  isLimited: false,
})

const resetForm = () => {
  characterForm.value = {
    name: '',
    image: '',
    class: 'striker',
    rarity: 3,
    atkType: 'explosive',
    defType: 'light',
    isNew: false,
    isLimited: false,
  }
}

// CRUD operations
const handleCreate = async () => {
  try {
    const docRef = await addDoc(collection(baDB, 'characters'), characterForm.value)
    characters.value.push({
      ...characterForm.value,
      id: docRef.id,
    })
    showModal.value = false
    resetForm()
  } catch (err) {
    console.error('Failed to create character:', err)
    error.value = 'Failed to create character. Please try again.'
  }
}

const handleUpdate = async () => {
  if (!selectedCharacter.value) return

  try {
    await updateDoc(doc(baDB, 'characters', selectedCharacter.value.id), characterForm.value)
    const index = characters.value.findIndex((c) => c.id === selectedCharacter?.value?.id)
    if (index !== -1) {
      characters.value[index] = {
        ...characters.value[index],
        ...characterForm.value,
      }
    }

    showModal.value = false
  } catch (err) {
    console.error('Failed to update character:', err)
    error.value = 'Failed to update character. Please try again.'
  }
}

const handleDelete = async () => {
  if (!selectedCharacter.value) return

  try {
    await deleteDoc(doc(baDB, 'characters', selectedCharacter.value.id))
    characters.value = characters.value.filter((c) => c.id !== selectedCharacter?.value?.id)

    showDeleteModal.value = false
  } catch (err) {
    console.error('Failed to delete character:', err)
    error.value = 'Failed to delete character. Please try again.'
  }
}

// UI handlers
const openEditModal = (character: Character) => {
  selectedCharacter.value = character
  characterForm.value = { ...character }
  showModal.value = true
}

const openCreateModal = () => {
  selectedCharacter.value = null
  resetForm()
  showModal.value = true
}

// Lifecycle hooks
onMounted(fetchCharacters)
</script>

<template>
  <section class="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
    <div class="mx-auto max-w-screen-xl px-4 lg:px-12">
      <!-- Error Handling -->
      <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-800 rounded-lg" role="alert">
        {{ error }}
      </div>

      <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <!-- Search and Actions Bar -->
        <div
          class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4"
        >
          <SearchBar v-model="searchQuery" placeholder="Search characters..." :disabled="loading" />

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
            Add Character
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center p-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
        </div>

        <!-- Content -->
        <template v-else>
          <CharacterTable
            :characters="paginatedCharacters"
            @edit="openEditModal"
            @delete="
              (banner) => {
                selectedCharacter = banner
                showDeleteModal = true
              }
            "
          />

          <Pagination
            v-if="filteredCharacters.length > 0"
            v-model:current-page="currentPage"
            :total-pages="totalPages"
            :display-range="displayRange"
          />

          <!-- No Results -->
          <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400">
            No characters found matching your search.
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
        <div class="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
          <!-- Modal header -->
          <div
            class="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ selectedCharacter ? 'Edit Character' : 'Create Character' }}
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
          <form @submit.prevent="selectedCharacter ? handleUpdate() : handleCreate()">
            <div class="grid gap-4 mb-4 sm:grid-cols-2">
              <!-- Name -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Name</label
                >
                <input
                  v-model="characterForm.name"
                  type="text"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                />
              </div>

              <!-- Image URL -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Image URL</label
                >
                <input
                  v-model="characterForm.image"
                  type="text"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                />
              </div>

              <!-- Class -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Class</label
                >
                <select
                  v-model="characterForm.class"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                >
                  <option value="striker">Striker</option>
                  <option value="special">Special</option>
                </select>
              </div>

              <!-- Rarity -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Rarity</label
                >
                <select
                  v-model="characterForm.rarity"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                >
                  <option value="3">3★</option>
                  <option value="4">4★</option>
                  <option value="5">5★</option>
                  <option value="6">6★</option>
                </select>
              </div>

              <!-- Attack Type -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Attack Type</label
                >
                <select
                  v-model="characterForm.atkType"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                >
                  <option value="explosive">Explosive</option>
                  <option value="piercing">Piercing</option>
                  <option value="mystic">Mystic</option>
                  <option value="sonic">Sonic</option>
                </select>
              </div>

              <!-- Defense Type -->
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Defense Type</label
                >
                <select
                  v-model="characterForm.defType"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                >
                  <option value="light">Light</option>
                  <option value="heavy">Heavy</option>
                  <option value="special">Special</option>
                  <option value="elastic">Elastic</option>
                </select>
              </div>

              <!-- Flags -->
              <div class="flex items-center sm:col-span-2">
                <div class="flex items-center mr-4">
                  <input
                    v-model="characterForm.isNew"
                    type="checkbox"
                    class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    id="isNewCheckbox"
                  />
                  <label
                    for="isNewCheckbox"
                    class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    New Character
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    v-model="characterForm.isLimited"
                    type="checkbox"
                    class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    id="isLimitedCheckbox"
                  />
                  <label
                    for="isLimitedCheckbox"
                    class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Limited Character
                  </label>
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex items-center space-x-4">
              <button
                type="submit"
                class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                {{ selectedCharacter ? 'Update character' : 'Create character' }}
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
        <h3 class="text-lg font-semibold mb-4">Delete Character</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete this character? This action cannot be undone.
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
