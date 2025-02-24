<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { cvDB } from '../../../firebase/config'
import TechnologySection from '@/components/cv/technology/TechnologySection.vue'

interface Social {
  classname: string
  name: string
  url: string
}

interface Education {
  degree: string
  description: string
  graduated: string
  school: string
}

interface Technology {
  IconUrl: string
  name: string
}

interface Technologies {
  [key: string]: Technology[]
}

interface WorkExperience {
  company: string
  description: string
  title: string
  years: string
}

interface CVData {
  address: {
    city: string
    state: string
    street: string
    zip: string
  }
  bio: string
  contactMessage: string
  description: string
  email: string
  image: string
  name: string
  occupation: string
  phone: string
  social: Social[]
  education: Education[]
  technologies: Technologies
  work: WorkExperience[]
}

// Form state management
const formData = ref<CVData>()
const isEditing = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

// Work experience management
const addWorkExperience = () => {
  if (!formData.value) return

  formData.value.work.push({
    company: '',
    title: '',
    years: '',
    description: '',
  })
}

const removeWorkExperience = (index: number) => {
  if (!formData.value) return

  formData.value.work.splice(index, 1)
}

// Fetch data from Firestore
const fetchData = async () => {
  loading.value = true
  error.value = null

  try {
    const [mainSnapshot, resumeSnapshot] = await Promise.all([
      getDocs(collection(cvDB, 'main')),
      getDocs(collection(cvDB, 'resume')),
    ])
    console.log(mainSnapshot)
    const mainData = mainSnapshot.docs[0]?.data() || {}
    const resumeData = resumeSnapshot.docs[0]?.data() || {}

    const nonArrayTechs: { [key: string]: any } = {}
    const arrayTechs: { [key: string]: any } = {}

    for (const [category, techs] of Object.entries(resumeData.technologies)) {
      if (Array.isArray(techs)) {
        arrayTechs[category] = techs
      } else {
        nonArrayTechs[category] = techs
      }
    }

    resumeData.technologies = { ...nonArrayTechs, ...arrayTechs }

    //@ts-ignore
    formData.value = {
      ...mainData,
      ...resumeData,
    }
  } catch (err) {
    console.error('Failed to fetch data:', err)
    error.value = 'Failed to load data. Please try again.'
  } finally {
    loading.value = false
  }
}

// Save changes to Firestore
const saveChanges = async () => {
  if (!formData.value) return

  loading.value = true
  error.value = null

  try {
    const mainDoc = doc(cvDB, 'main', '001')
    const resumeDoc = doc(cvDB, 'resume', '001')

    // Split data between collections
    const { education, technologies, work, ...mainData } = formData.value

    const resumeData = { education, technologies, work }
    console.log(resumeData)
    await Promise.all([updateDoc(mainDoc, mainData), updateDoc(resumeDoc, resumeData)])

    isEditing.value = false
  } catch (err) {
    console.error('Failed to save changes:', err)
    error.value = 'Failed to save changes. Please try again.'
  } finally {
    loading.value = false
  }
}

// Lifecycle hooks
onMounted(fetchData)
</script>

<template>
  <section class="bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <!-- Error Alert -->
      <div
        v-if="error"
        class="mb-4 p-4 bg-red-100 text-red-800 rounded-lg flex items-center"
        role="alert"
      >
        <svg
          class="w-5 h-5 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          ></path>
        </svg>
        {{ error }}
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>

      <!-- CV Content -->
      <div v-else-if="formData" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <!-- Header Actions -->
        <div
          class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">CV Details</h1>
          <div class="space-x-2">
            <button
              v-if="!isEditing"
              @click="isEditing = true"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span class="flex items-center">
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  ></path>
                </svg>
                Edit
              </span>
            </button>
            <button
              v-else
              @click="saveChanges"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <span class="flex items-center">
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Save
              </span>
            </button>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Personal Information
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  v-model="formData.name"
                  :disabled="!isEditing"
                  class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  v-model="formData.email"
                  :disabled="!isEditing"
                  class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  v-model="formData.phone"
                  :disabled="!isEditing"
                  class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Occupation
                </label>
                <input
                  v-model="formData.occupation"
                  :disabled="!isEditing"
                  class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bio
                </label>
                <textarea
                  v-model="formData.bio"
                  :disabled="!isEditing"
                  rows="3"
                  class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Work Experience -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Work Experience</h2>
            <button
              v-if="isEditing"
              @click="addWorkExperience"
              class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <svg
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              Add Experience
            </button>
          </div>

          <div class="space-y-6">
            <div
              v-for="(work, index) in formData.work"
              :key="index"
              class="p-5 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 relative"
            >
              <button
                v-if="isEditing"
                @click="removeWorkExperience(index)"
                class="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                title="Remove experience"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </button>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="grid gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Company
                    </label>
                    <input
                      v-model="work.company"
                      :disabled="!isEditing"
                      class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Title
                    </label>
                    <input
                      v-model="work.title"
                      :disabled="!isEditing"
                      class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Years
                    </label>
                    <input
                      v-model="work.years"
                      :disabled="!isEditing"
                      class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g., 2020-2022"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    v-model="work.description"
                    :disabled="!isEditing"
                    rows="3"
                    class="h-[90%] mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Empty state when no work experiences -->
            <div
              v-if="formData.work.length === 0"
              class="p-8 bg-gray-50 dark:bg-gray-700 rounded-lg text-center"
            >
              <p class="text-gray-500 dark:text-gray-400">No work experiences added yet.</p>
              <button
                v-if="isEditing"
                @click="addWorkExperience"
                class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                Add Your First Experience
              </button>
            </div>
          </div>
        </div>

        <!-- Technologies -->
        <technology-section v-model="formData.technologies" :is-editing="isEditing" />
      </div>
    </div>
  </section>
</template>
