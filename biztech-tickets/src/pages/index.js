import Head from 'next/head';
import Image from 'next/image';
import styles from '@/styles/Home.module.css';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useUser } from '../contexts/UserContext';

import { app } from '../../firebaseConfig';
import {
  Query,
  collection,
  getDocs,
  getFirestore,
  query,
  where
} from 'firebase/firestore';

const db = getFirestore(app);

export default function Home() {
  const [userCode, setUserCode] = useState(''); // For form input management
  const { user, setUser } = useUser(); // Use inside the component!
  const router = useRouter(); // For redirecting users based on their roles

  const handleLogin = async (e) => {
    e.preventDefault();

    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('code', '==', userCode));
    const querySnapshot = await getDocs(q);
    try {
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        console.log(userData);
        setUser(userData); // Now this should work

        if (userData.role === 'participant') {
          router.push('/participant-dashboard');
        } else if (userData.role === 'mentor') {
          router.push('/mentor-dashboard');
        } else if (userData.role === 'organizer') {
          router.push('/organizer-dashboard');
        } else {
          alert('Unexpected role!');
        }
      } else {
        alert('Invalid code!');
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className='bg-[#070f21] min-h-screen'>
      <div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
          <img className='mx-auto h-36 w-auto' src='/biztechlogo.png' />
          <h2 className='mt-2 text-center text-2xl font-bold leading-9 tracking-tight text-white'>
            Sign in BizTix!
          </h2>
        </div>

        <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
          <form className='space-y-6' action='#' method='POST'>
            <div>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium leading-6 text-white'
                >
                  User Code
                </label>
              </div>
              <div className='mt-2'>
                <input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  required
                  className='px-3 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6'
                />
              </div>
            </div>

            <div>
              <button
                onClick={handleLogin}
                className='flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
