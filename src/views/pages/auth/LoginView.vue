<script setup lang="ts">
import { ref } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { useRouter } from 'vue-router'
import type { Auth } from 'firebase/auth'
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { baAuth } from '@/firebase/config'
import { CVAuth } from '@/firebase/config'

// Interface for credentials
interface LoginCredentials {
  email: string
  password: string
  remember: boolean
}

// Interface for response
interface LoginResponse {
  success: boolean
  baUser: any
  cvUser: any
  error?: string
}

const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')

// Form validation schema
const schema = yup.object({
  email: yup.string().required('Email is required').email('Email is invalid'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  remember: yup.boolean(),
})

// Initialize form
const { handleSubmit, errors } = useForm({
  validationSchema: schema,
})

// Initialize fields
const { value: email } = useField('email')
const { value: password } = useField('password')
const { value: remember } = useField('remember')

const loginToBothFirebaseProjects = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  try {
    const persistenceType = credentials.remember
      ? browserLocalPersistence
      : browserSessionPersistence

    // Set persistence for first auth instance
    await setPersistence(baAuth, persistenceType)

    // Sign in to first project
    const baUserCredential = await signInWithEmailAndPassword(
      baAuth,
      credentials.email,
      credentials.password,
    )

    // Reset persistence and sign in to second project
    // We need to handle these sequentially
    await setPersistence(CVAuth, persistenceType)
    const cvUserCredential = await signInWithEmailAndPassword(
      CVAuth,
      credentials.email,
      credentials.password,
    )

    return {
      success: true,
      baUser: baUserCredential.user,
      cvUser: cvUserCredential.user,
    }
  } catch (error: any) {
    // Enhanced error handling
    let message = 'An error occurred during sign in'

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email'
        break
      case 'auth/wrong-password':
        message = 'Invalid password'
        break
      case 'auth/invalid-email':
        message = 'Invalid email address'
        break
      case 'auth/user-disabled':
        message = 'This account has been disabled'
        break
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later'
        break
    }

    return {
      success: false,
      baUser: null,
      cvUser: null,
      error: message,
    }
  }
}

const onSubmit = handleSubmit(async (values) => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const response = await loginToBothFirebaseProjects({
      email: values.email,
      password: values.password,
      remember: values.remember || false,
    })

    if (response.success) {
      // You can store additional user data in your state management if needed
      // For example, using Pinia or Vuex

      // Redirect to dashboard
      console.log(response)
      router.push('/')
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'An error occurred'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="bg-gray-50 dark:bg-gray-900">
    <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <a
        href="#"
        class="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
      >
        <img
          class="w-8 h-8 mr-2"
          src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg"
          alt="logo"
        />
        Flowbite
      </a>
      <div
        class="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700"
      >
        <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1
            class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white"
          >
            Sign in to your account
          </h1>

          <!-- Error Message -->
          <div
            v-if="errorMessage"
            class="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
            role="alert"
          >
            {{ errorMessage }}
          </div>

          <form @submit="onSubmit" class="space-y-4 md:space-y-6">
            <div>
              <label
                for="email"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Your email</label
              >
              <input
                v-model="email"
                type="email"
                id="email"
                class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@company.com"
              />
              <p v-if="errors.email" class="mt-1 text-sm text-red-600 dark:text-red-500">
                {{ errors.email }}
              </p>
            </div>

            <div>
              <label
                for="password"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Password</label
              >
              <input
                v-model="password"
                type="password"
                id="password"
                placeholder="••••••••"
                class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
              <p v-if="errors.password" class="mt-1 text-sm text-red-600 dark:text-red-500">
                {{ errors.password }}
              </p>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-start">
                <div class="flex items-center h-5">
                  <input
                    v-model="remember"
                    id="remember"
                    type="checkbox"
                    class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label for="remember" class="text-gray-500 dark:text-gray-300">Remember me</label>
                </div>
              </div>
              <a
                href="#"
                class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
                >Forgot password?</a
              >
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading">Signing in...</span>
              <span v-else>Sign in</span>
            </button>

            <p class="text-sm font-light text-gray-500 dark:text-gray-400">
              Don't have an account yet?
              <a href="#" class="font-medium text-primary-600 hover:underline dark:text-primary-500"
                >Sign up</a
              >
            </p>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
