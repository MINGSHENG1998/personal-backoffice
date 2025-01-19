import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB6pWCe9NesXPQmKjgJ7dEekSKE03R4DDE',
  //authDomain: 'your-auth-domain',
  projectId: 'blue-archive-tool',
  //storageBucket: 'your-storage-bucket',
  //messagingSenderId: 'your-messaging-sender-id',
  appId: '1:153272661943:android:c39a1eb6e6cd86f2d69a32',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Initialize Firebase Authentication
export const auth = getAuth(app)
