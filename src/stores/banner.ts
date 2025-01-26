// stores/bannerStore.ts
import { defineStore } from 'pinia'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { baDB } from '../firebase/config'
import type { Banner, BannerFormData } from '../types/banner'

export const useBannerStore = defineStore('banner', {
  state: () => ({
    banners: [] as Banner[],
    error: null as string | null,
    loading: false,
  }),
  actions: {
    async fetchBanners() {
      this.loading = true
      try {
        const bannersRef = collection(baDB, 'banners')
        const querySnapshot = await getDocs(bannersRef)
        this.banners = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Banner[]
      } catch (err) {
        this.error = 'Failed to load banners.'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    // Add other CRUD operations here
  },
})
