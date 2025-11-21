'use client';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdS878XeSy9Dc2pU5UhiOKN0ZJp5RH_oA",
  authDomain: "e-voting-68dda.firebaseapp.com",
  databaseURL: "https://e-voting-68dda-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "e-voting-68dda",
  storageBucket: "e-voting-68dda.appspot.com",
  messagingSenderId: "786875940790",
  appId: "1:786875940790:web:243f2c27fd747cb54d0b17"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { db };
