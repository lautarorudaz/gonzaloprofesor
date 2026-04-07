
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAE9eLKKtavdAymTS1BrXPgg3hddxdv0ao",
    authDomain: "gonzaloalmiron.firebaseapp.com",
    projectId: "gonzaloalmiron",
    storageBucket: "gonzaloalmiron.firebasestorage.app",
    messagingSenderId: "632429411400",
    appId: "1:632429411400:web:9353e1b0c880e0c94eec7d"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);