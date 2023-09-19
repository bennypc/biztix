import Head from 'next/head';
import Image from 'next/image';
import styles from '@/styles/Home.module.css';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useUser } from '../contexts/UserContext.js';

import { app } from '../../firebaseConfig';
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where
} from 'firebase/firestore';

const db = getFirestore(app);

export default function OrganizerDashboard() {
  const { user } = useUser(); // Extract user data from context

  return (
    <div className='bg-[#070f21] min-h-screen'>
      {user ? (
        <div className='m-5'>
          <h2 className='text-white'>User Data:</h2>
          <pre className='bg-white text-black p-4 rounded'>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      ) : (
        <p className='text-white m-5'>No user logged in.</p>
      )}
    </div>
  );
}
