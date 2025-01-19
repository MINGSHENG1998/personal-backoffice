<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import type { AtkType, DefType } from '../../../dto/game.dto'

// Types
interface Character {
  id: string
  name: string
  image: string
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
  type: 'New' | 'Rerun' | 'Fes' | 'Collab'
  eventDetails?: string
  rewards?: string[]
  expanded?: boolean
}

interface BannerFormData {
  startDate: string
  endDate: string
  type: Banner['type']
  characters: Character[]
  eventDetails?: string
  rewards?: string[]
}

// State
const searchQuery = ref('')
const characterSearch = ref('')
const banners = ref<Banner[]>([])
const characters = ref<Character[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showModal = ref(false)
const showDeleteModal = ref(false)
const selectedBanner = ref<Banner | null>(null)
const formData = ref<BannerFormData>({
  startDate: '',
  endDate: '',
  type: 'New',
  characters: [],
  eventDetails: '',
  rewards: [],
})
const dropdownOpen = ref(false)

// Computed
const totalPages = computed(() => Math.ceil(filteredBanners.value.length / itemsPerPage.value))

const filteredBanners = computed(() => {
  return banners.value.filter(
    (banner) =>
      banner.characters.some((char) =>
        char.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
      ) || banner.type.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const paginatedBanners = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredBanners.value.slice(start, end)
})

const displayRange = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(currentPage.value * itemsPerPage.value, filteredBanners.value.length)
  return {
    start,
    end,
    total: filteredBanners.value.length,
  }
})

// Methods
const fetchBanners = async () => {
  loading.value = true
  error.value = null

  try {
    const bannersRef = collection(db, 'banners')
    const querySnapshot = await getDocs(bannersRef)
    banners.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Banner[]
  } catch (err) {
    console.error('Failed to fetch banners:', err)
    error.value = 'Failed to load banners.'
  } finally {
    loading.value = false
  }
}

const fetchCharacters = async () => {
  loading.value = true
  error.value = null

  try {
    const charactersRef = collection(db, 'characters')
    const querySnapshot = await getDocs(charactersRef)
    characters.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Character[]
  } catch (err) {
    console.error('Failed to fetch characters:', err)
    error.value = 'Failed to load characters.'
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  if (
    !formData.value.startDate ||
    !formData.value.endDate ||
    !formData.value.type ||
    formData.value.characters.length === 0
  ) {
    error.value = 'Please fill in all required fields'
    return false
  }
  return true
}

const handleCreate = async () => {
  if (!validateForm()) return

  try {
    const bannersRef = collection(db, 'banners')
    await addDoc(bannersRef, formData.value)
    showModal.value = false
    await fetchBanners()
    resetForm()
  } catch (err) {
    console.error('Failed to create banner:', err)
    error.value = 'Failed to create banner.'
  }
}

const handleUpdate = async () => {
  if (!selectedBanner.value || !validateForm()) return

  try {
    const bannerRef = doc(db, 'banners', selectedBanner.value.id)
    await updateDoc(bannerRef, formData.value)
    showModal.value = false
    await fetchBanners()
  } catch (err) {
    console.error('Failed to update banner:', err)
    error.value = 'Failed to update banner.'
  }
}

const handleDelete = async () => {
  if (!selectedBanner.value) return

  try {
    const bannerRef = doc(db, 'banners', selectedBanner.value.id)
    await deleteDoc(bannerRef)
    showDeleteModal.value = false
    await fetchBanners()
  } catch (err) {
    console.error('Failed to delete banner:', err)
    error.value = 'Failed to delete banner.'
  }
}

const openEditModal = (banner: Banner) => {
  selectedBanner.value = banner
  formData.value = {
    startDate: banner.startDate,
    endDate: banner.endDate,
    type: banner.type,
    characters: [...banner.characters],
    eventDetails: banner.eventDetails,
    rewards: banner.rewards,
  }
  showModal.value = true
}

const openCreateModal = () => {
  selectedBanner.value = null
  resetForm()
  showModal.value = true
}

const resetForm = () => {
  formData.value = {
    startDate: '',
    endDate: '',
    type: 'New' as Banner['type'],
    characters: [],
    eventDetails: '',
    rewards: [],
  }
  error.value = null
}

const filteredCharacters = computed(() => {
  return characters.value.filter((char) =>
    char.name.toLowerCase().includes(characterSearch.value.toLowerCase()),
  )
})

const isSelected = (id: string) => {
  return formData.value.characters.some((char) => char.id === id)
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

const removeCharacter = (id: string) => {
  formData.value.characters = formData.value.characters.filter((char) => char.id !== id)
}

const toggleExpand = (banner: Banner) => {
  banner.expanded = !banner.expanded
}

const getStatusClass = (status: string) => {
  return (
    {
      New: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      Rerun: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      Fes: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      Collab: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    }[status] || ''
  )
}

onMounted(fetchBanners)
onMounted(fetchCharacters)
</script>

<template>
  <section class="bg-gray-50 dark:bg-gray-900 p-3 sm:p-5">
    <div class="mx-auto max-w-screen-xl px-4 lg:px-12">
      <!-- Error Alert -->
      <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
        {{ error }}
      </div>

      <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <!-- Search and Actions Bar -->
        <div
          class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4"
        >
          <!-- Search -->
          <div class="w-full md:w-1/2">
            <form class="flex items-center">
              <label for="simple-search" class="sr-only">Search</label>
              <div class="relative w-full">
                <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    class="w-5 h-5 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    viewbox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Search banners"
                />
              </div>
            </form>
          </div>
          <!-- Action Buttons -->
          <div class="w-full md:w-auto flex justify-end">
            <button
              @click="openCreateModal"
              class="flex items-center justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2"
            >
              <svg class="h-5 w-5 mr-2" fill="currentColor" viewbox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clip-rule="evenodd"
                />
              </svg>
              Add Banner
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead
              class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
            >
              <tr>
                <th scope="col" class="px-4 py-3">Banner Name</th>
                <th scope="col" class="px-4 py-3">Type</th>
                <th scope="col" class="px-4 py-3">Status</th>
                <th scope="col" class="px-4 py-3">Start Date</th>
                <th scope="col" class="px-4 py-3">End Date</th>
                <th scope="col" class="px-4 py-3">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="banner in paginatedBanners" :key="banner.id">
                <!-- Parent Row -->
                <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <th
                    scope="row"
                    class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    <div class="flex items-center cursor-pointer" @click="toggleExpand(banner)">
                      <svg
                        :class="{ 'rotate-90': banner.expanded }"
                        class="w-4 h-4 mr-2 transition-transform duration-200"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      {{ banner.characters[0].name }}
                    </div>
                  </th>
                  <td class="px-4 py-3">{{ banner.type }}</td>
                  <td class="px-4 py-3">
                    <span
                      :class="[
                        'px-2.5 py-0.5 rounded text-xs font-medium',
                        getStatusClass(banner.type),
                      ]"
                    >
                      {{ banner.type }}
                    </span>
                  </td>
                  <td class="px-4 py-3">{{ banner.startDate }}</td>
                  <td class="px-4 py-3">{{ banner.endDate }}</td>
                  <td class="px-4 py-3 flex items-center justify-end">
                    <button
                      @click="selectedBanner = banner"
                      class="inline-flex items-center p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewbox="0 0 20 20">
                        <path
                          d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"
                        />
                      </svg>
                    </button>
                    <!-- Dropdown menu -->
                    <div
                      v-if="selectedBanner === banner"
                      class="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                    >
                      <div class="py-1">
                        <button
                          @click="openEditModal(banner)"
                          class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                          @click="showDeleteModal = true"
                          class="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <svg
                            class="mr-2 h-4 w-4"
                            fill="currentColor"
                            stroke="none"
                            id="Layer_1"
                            data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 110.61 122.88"
                          >
                            <path
                              d="M39.27,58.64a4.74,4.74,0,1,1,9.47,0V93.72a4.74,4.74,0,1,1-9.47,0V58.64Zm63.6-19.86L98,103a22.29,22.29,0,0,1-6.33,14.1,19.41,19.41,0,0,1-13.88,5.78h-45a19.4,19.4,0,0,1-13.86-5.78l0,0A22.31,22.31,0,0,1,12.59,103L7.74,38.78H0V25c0-3.32,1.63-4.58,4.84-4.58H27.58V10.79A10.82,10.82,0,0,1,38.37,0H72.24A10.82,10.82,0,0,1,83,10.79v9.62h23.35a6.19,6.19,0,0,1,1,.06A3.86,3.86,0,0,1,110.59,24c0,.2,0,.38,0,.57V38.78Zm-9.5.17H17.24L22,102.3a12.82,12.82,0,0,0,3.57,8.1l0,0a10,10,0,0,0,7.19,3h45a10.06,10.06,0,0,0,7.19-3,12.8,12.8,0,0,0,3.59-8.1L93.37,39ZM71,20.41V12.05H39.64v8.36ZM61.87,58.64a4.74,4.74,0,1,1,9.47,0V93.72a4.74,4.74,0,1,1-9.47,0V58.64Z"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
                <!-- Expanded Content -->
                <tr v-if="banner.expanded" class="bg-gray-50 dark:bg-gray-700">
                  <td colspan="6" class="px-4 py-3">
                    <div class="pl-8">
                      <h4 class="text-lg font-semibold mb-2">Banner Details</h4>
                      <div class="grid grid-cols-2 gap-4">
                        <div
                          v-for="chara in banner.characters"
                          :key="chara.id"
                          class="p-3 bg-white dark:bg-gray-800 rounded shadow"
                        >
                          <p class="font-medium">{{ chara.name }}</p>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ chara.rarity }}★ {{ chara.atkType }}/{{ chara.defType }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          class="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 p-4"
        >
          <span class="text-sm text-gray-700 dark:text-gray-400">
            Showing <span class="font-semibold">{{ displayRange.start }}</span> to
            <span class="font-semibold">{{ displayRange.end }}</span> of
            <span class="font-semibold">{{ displayRange.total }}</span> entries
          </span>
          <div class="flex space-x-2">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              @click="currentPage = page"
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
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
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
                  <div class="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <span v-if="formData.characters.length === 0">No characters selected</span>
                    <span v-else
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
                            {{ character.name }}
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

              <!-- Event Details -->
              <div class="sm:col-span-2">
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Event Details</label
                >
                <textarea
                  v-model="formData.eventDetails"
                  rows="5"
                  class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                ></textarea>
              </div>

              <!-- Rewards -->
              <div class="sm:col-span-2">
                <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >Rewards</label
                >
                <input
                  v-model="formData.rewards"
                  type="text"
                  placeholder="Comma-separated rewards"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
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
