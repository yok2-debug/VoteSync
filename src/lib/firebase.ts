import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAdS878XeSy9Dc2pU5UhiOKN0ZJp5RH_oA",
  authDomain: "evoting-cfb3e.firebaseapp.com",
  databaseURL: "https://evoting-cfb3e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "evoting-cfb3e",
  storageBucket: "evoting-cfb3e.appspot.com",
  messagingSenderId: "786875940790",
  appId: "1:786875940790:web:243f2c27fd747cb54d0b17",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { db };
