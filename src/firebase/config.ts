import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

//todo: add other insatnce
const firebaseConfig = {
  apiKey: 'AIzaSyD0HhyCTL_TxOvbpp6Or52KBNx7tijeX-U',
  authDomain: 'personal-backoffice-ms.firebaseapp.com',
  projectId: 'personal-backoffice-ms',
  storageBucket: 'personal-backoffice-ms.firebasestorage.app',
  messagingSenderId: '198998051256',
  appId: '1:198998051256:web:bde984d2b9d6b99d79274d',
}

const firebaseConfigBA = {
  apiKey: 'AIzaSyB6pWCe9NesXPQmKjgJ7dEekSKE03R4DDE',
  //authDomain: 'your-auth-domain',
  projectId: 'blue-archive-tool',
  //storageBucket: 'your-storage-bucket',
  //messagingSenderId: 'your-messaging-sender-id',
  appId: '1:153272661943:android:c39a1eb6e6cd86f2d69a32',
}

// Initialize Firebase
const app = getApps().find((app) => app.name === '[DEFAULT]') || initializeApp(firebaseConfig)
const baApp = getApps().find((app) => app.name === 'BA') || initializeApp(firebaseConfigBA, 'BA')

export const baDB = getFirestore(baApp)

// Initialize Firebase Authentication
export const baAuth = getAuth(baApp)
