// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCAtRUmyIC7fOb-87fecEuox9fPX_rL0QY',
  authDomain: 'biztech-bot.firebaseapp.com',
  projectId: 'biztech-bot',
  storageBucket: 'biztech-bot.appspot.com',
  messagingSenderId: '490896591225',
  appId: '1:490896591225:web:1b1c8b9367e024e8a8c7a8'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
