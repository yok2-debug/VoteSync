'use client';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Corrected Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_I47uV2-3s9b6c8d5a2f1g7h3j5k9l3",
  authDomain: "e-voting-68dda.firebaseapp.com",
  databaseURL: "https://e-voting-68dda-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "e-voting-68dda",
  storageBucket: "e-voting-68dda.appspot.com",
  messagingSenderId: "786875940790",
  appId: "1:786875940790:web:243f2c27fd747cb54d0b17"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { db };
