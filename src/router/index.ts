import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/pages/auth/LoginView.vue'
import AppLayout from '../layout/AppLayout.vue'
import { baAuth } from '@/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

// BA (Blue Archive) views
import BannerView from '@/views/pages/bluearchive/BannerView.vue'
import CharaView from '@/views/pages/bluearchive/CharaView.vue'

// CV views
import DetailView from '@/views/pages/cv/DetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/w/:workspaceId',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'banner',
          name: 'banner-list',
          component: BannerView,
        },
        {
          path: 'chara',
          name: 'character-list',
          component: CharaView,
        },
        {
          path: 'details',
          name: 'cv-details',
          component: DetailView,
        },
      ],
    },
  ],
})
let authInitialized = false

const waitForAuth = () => {
  return new Promise((resolve) => {
    if (authInitialized) {
      resolve(baAuth.currentUser)
    } else {
      const unsubscribe = onAuthStateChanged(baAuth, (user) => {
        authInitialized = true
        unsubscribe()
        resolve(user)
      })
    }
  })
}

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const user = await waitForAuth()

  if (requiresAuth && !user) {
    next('/login')
  } else {
    console.log('hi')
    next()
  }
})

export default router
