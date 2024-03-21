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
import CodeTyper from '@/components/Typer';

const db = getFirestore(app);

export default function Home() {
  return (
    <div className='bg-[rgb(253,253,253)] min-h-screen'>
      <Head>
        <title>Code Typer Game</title>
      </Head>
      <div className='container'>
        <CodeTyper />
      </div>
      <style jsx>{`
        .container {
          max-width: 800px;
          margin: auto;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}
