// Import the functions you need from the SDKs you need
//const {initializeApp} = require("firebase/app");
//const {getAnalytics} = require("firebase/analytics");
//const {getFirestore} = require("firebase/firestore");

import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import 'dotenv/config'
import {getStorage} from "firebase/storage";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.firebase_apiKey,
  authDomain: "metamind-db.firebaseapp.com",
  projectId: "metamind-db",
  storageBucket: "metamind-db.appspot.com",
  messagingSenderId: "482705015231",
  appId: "1:482705015231:web:e4ca31540600f97ddd210a",
  measurementId: "G-LK73TWH2M7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const db = getFirestore(app)
const storage = getStorage(app)

export {app, db, storage}