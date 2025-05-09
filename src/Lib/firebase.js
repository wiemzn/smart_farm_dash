import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAQAz7bXV3sBqEVO7lUQGQG5RZPtLlxKGE",
  authDomain: "smart-52763.firebaseapp.com",
  databaseURL: "https://smart-52763-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "smart-52763",
  storageBucket: "smart-52763.firebasestorage.app",
  messagingSenderId: "473502394913",
  appId: "1:473502394913:web:bc8468578a3ef1e1ea5160"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export { db, rtdb };