// firebase/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyD3ItqXf9Bia6s__0Uz6HlBta8U4gKWuYE",
    authDomain: "eeris-16-d60f3.firebaseapp.com",
    projectId: "eeris-16-d60f3",
    storageBucket: "eeris-16-d60f3.firebasestorage.app",
    messagingSenderId: "1034863501987",
    appId: "1:1034863501987:web:7bdd1df0e5db40e2b09516"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
