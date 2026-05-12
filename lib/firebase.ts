import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAd_trdx6ojzPlWKrHacmlaUoL4Q6OS7lo",
  authDomain: "dealnet-d6a4c.firebaseapp.com",
  projectId: "dealnet-d6a4c",
  storageBucket: "dealnet-d6a4c.firebasestorage.app",
  messagingSenderId: "979229982028",
  appId: "1:979229982028:web:5aaed87ee22a7777a0e3e9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);