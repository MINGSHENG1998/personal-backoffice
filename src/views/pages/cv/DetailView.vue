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
  technologies: {
    backend: Technology[]
    frontend: Technology[]
    hosting: Technology[]
    messages: string
  }
  work: WorkExperience[]
}

// Form state management
const formData = ref<CVData>()
const isEditing = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

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
      <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-800 rounded-lg" role="alert">
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
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              v-else
              @click="saveChanges"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Save
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
                  class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  v-model="formData.email"
                  :disabled="!isEditing"
                  class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  v-model="formData.phone"
                  :disabled="!isEditing"
                  class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
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
                  class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
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
                  class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Work Experience -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Work Experience</h2>
          <div class="space-y-4">
            <div
              v-for="(work, index) in formData.work"
              :key="index"
              class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company
                  </label>
                  <input
                    v-model="work.company"
                    :disabled="!isEditing"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    v-model="work.title"
                    :disabled="!isEditing"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Years
                  </label>
                  <input
                    v-model="work.years"
                    :disabled="!isEditing"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    v-model="work.description"
                    :disabled="!isEditing"
                    rows="2"
                    class="mt-1 min-h-24 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Technologies -->
        <technology-section v-model="formData.technologies" :is-editing="isEditing" />
      </div>
    </div>
  </section>
</template>
