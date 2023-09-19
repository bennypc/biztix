import Head from 'next/head';
import Image from 'next/image';
import styles from '@/styles/Home.module.css';
import { useRouter } from 'next/router';
import { useState, Fragment } from 'react';
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
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  ChartBarSquareIcon,
  Cog6ToothIcon,
  FolderIcon,
  GlobeAltIcon,
  ServerIcon,
  SignalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  Bars3Icon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/20/solid';

const db = getFirestore(app);

export default function MentorDashboard() {
  const [userCode, setUserCode] = useState('');
  const router = useRouter();

  const { user } = useUser();

  function testUser() {
    console.log(user);
  }

  if (!user || (user.role !== 'mentor' && user.role !== 'organizer')) {
    return (
      <div>
        <p className='text-white'>You don't have access to this page.</p>
        <button className='text-white' onClick={testUser}>
          adwaw
        </button>
      </div>
    );
  }
  return <div className='bg-[#070f21] min-h-screen'>welcome mentor</div>;
}
