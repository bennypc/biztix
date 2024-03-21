import Head from 'next/head';
import Image from 'next/image';
import styles from '@/styles/Home.module.css';
import { useRouter } from 'next/router';
import { useState, Fragment, useEffect } from 'react';
import { useUser } from '../contexts/UserContext.js'; // Ensure this path points to the correct location
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  ArrowRightOnRectangleIcon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  FolderIcon,
  GlobeAltIcon,
  ServerIcon,
  SignalIcon,
  XMarkIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import {
  Bars3Icon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/20/solid';

import { app } from '../../firebaseConfig';
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes, getStorage } from 'firebase/storage';
import CodeTyper from '@/components/Typer.js';
var randomstring = require('randomstring');

const db = getFirestore(app);
const storage = getStorage(app);
const statuses = {
  pending: 'text-yellow-500 bg-yellow-100/10',
  completed: 'text-green-400 bg-green-400/10',
  active: 'text-rose-400 bg-rose-400/10'
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function timeAgo(timestamp) {
  if (!timestamp) return 'Just now';

  const now = new Date();
  const questionDate = timestamp.toDate();
  const secondsAgo = Math.floor((now - questionDate) / 1000);

  if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`;
  return `${Math.floor(secondsAgo / 86400)} days ago`;
}

function generateTeamInitial(teamName) {
  if (!teamName) return '';

  const words = teamName.split(' ');

  if (words.length === 1) {
    return teamName.substring(0, 2).toUpperCase();
  }

  // Handle "Team X" format
  if (words[0].toLowerCase() === 'team' && words[1]) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  // Use the first letters of the first two words
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export default function GamesDashboard() {
  const { user, loading, setUser } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState([]);

  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('Front-end');
  const [description, setDescription] = useState('');

  const navigation = [
    {
      name: 'Tickets',
      href: '/participant-dashboard',
      icon: FolderIcon,
      current: false
    },
    { name: 'Games', href: '#', icon: PuzzlePieceIcon, current: true },

    {
      name: 'Sign Out',
      onClick: signOut,
      icon: ArrowRightOnRectangleIcon,
      current: false
    }
  ];

  function signOut() {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  }

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  function findUserNameById(id) {
    const user = users.find((user) => user.code === id);
    return user ? user.firstName + ' ' + user.lastName : null;
  }
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  useEffect(() => {
    // Reference to the users collection
    const usersRef = collection(db, 'users');

    // Query the collection: get the top N users ordered by highScore
    const q = query(usersRef, orderBy('highScore', 'desc'), limit(40));

    // Listen for real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Map over the documents in the snapshot to extract user data
      const leaderboardUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      // Update state with the fetched leaderboard data
      setLeaderboardData(leaderboardUsers);
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('No user found. Redirecting to /');
        router.push('/');
      }
    }
  }, [loading, user, router]);

  return (
    <div className='bg-[#070f21] min-h-screen'>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as='div'
            className='relative z-50 xl:hidden'
            onClose={setSidebarOpen}
          >
            <Transition.Child
              as={Fragment}
              enter='transition-opacity ease-linear duration-300'
              enterFrom='opacity-0'
              enterTo='opacity-100'
              leave='transition-opacity ease-linear duration-300'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'
            >
              <div className='fixed inset-0 bg-gray-900/80' />
            </Transition.Child>

            <div className='fixed inset-0 flex'>
              <Transition.Child
                as={Fragment}
                enter='transition ease-in-out duration-300 transform'
                enterFrom='-translate-x-full'
                enterTo='translate-x-0'
                leave='transition ease-in-out duration-300 transform'
                leaveFrom='translate-x-0'
                leaveTo='-translate-x-full'
              >
                <Dialog.Panel className='relative mr-16 flex w-full max-w-xs flex-1'>
                  <Transition.Child
                    as={Fragment}
                    enter='ease-in-out duration-300'
                    enterFrom='opacity-0'
                    enterTo='opacity-100'
                    leave='ease-in-out duration-300'
                    leaveFrom='opacity-100'
                    leaveTo='opacity-0'
                  >
                    <div className='absolute left-full top-0 flex w-16 justify-center pt-5'>
                      <button
                        type='button'
                        className='-m-2.5 p-2.5'
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className='sr-only'>Close sidebar</span>
                        <XMarkIcon
                          className='h-6 w-6 text-white'
                          aria-hidden='true'
                        />
                      </button>
                    </div>
                  </Transition.Child>

                  <div className='flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 ring-1 ring-white/10'>
                    <div className='flex h-16 shrink-0 items-center'>
                      <img
                        className='h-10 w-auto mt-2 pr-4'
                        src='/biztechlogo.png'
                      />
                    </div>
                    <nav className='flex flex-1 flex-col'>
                      <ul role='list' className='flex flex-1 flex-col gap-y-7'>
                        <li>
                          <ul role='list' className='-mx-2 space-y-1'>
                            {navigation.map((item) => (
                              <li key={item.name}>
                                {item.href ? (
                                  <a
                                    href={item.href}
                                    className={classNames(
                                      item.current
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                    )}
                                  >
                                    <item.icon
                                      className='h-6 w-6 shrink-0'
                                      aria-hidden='true'
                                    />
                                    {item.name}
                                  </a>
                                ) : (
                                  <button
                                    onClick={item.onClick}
                                    className={classNames(
                                      item.current
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800',
                                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                    )}
                                  >
                                    <item.icon
                                      className='h-6 w-6 shrink-0'
                                      aria-hidden='true'
                                    />
                                    {item.name}
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </li>

                        <li className='-mx-6 mt-auto'>
                          <a
                            href='#'
                            className='flex items-center gap-x-4 px-6 py-4 text-sm font-semibold leading-6 text-white hover:bg-gray-800'
                          >
                            {/* <img
                              className='h-8 w-8 rounded-full bg-gray-800'
                              src='https://media.licdn.com/dms/image/D5603AQFviDjG26DlRQ/profile-displayphoto-shrink_800_800/0/1689219654699?e=1700697600&v=beta&t=tZG3pJalB9vELrtZiepeP7CbR8Q829LDzYxWP3Qvx7M'
                              alt=''
                            /> */}
                            <span className='sr-only'>Your profile</span>
                            <span aria-hidden='true'>
                              {user
                                ? `${user.firstName} ${user.lastName}`
                                : 'Loading...'}
                            </span>
                          </a>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className='hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col'>
          <div className='flex grow flex-col gap-y-5 overflow-y-auto bg-black/10 px-6 ring-1 ring-white/5'>
            <div className='flex h-16 shrink-0 items-center'>
              <img className='h-12 w-auto mt-4' src='./biztechlogo.png' />
            </div>
            <nav className='flex flex-1 flex-col'>
              <ul role='list' className='flex flex-1 flex-col gap-y-7'>
                <li>
                  <ul role='list' className='-mx-2 space-y-1'>
                    {navigation.map((item) => (
                      <li key={item.name}>
                        {item.href ? (
                          <a
                            href={item.href}
                            className={classNames(
                              item.current
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800',
                              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                            )}
                          >
                            <item.icon
                              className='h-6 w-6 shrink-0'
                              aria-hidden='true'
                            />
                            {item.name}
                          </a>
                        ) : (
                          <div // using div here since it looks like you want a similar style to the anchor
                            onClick={item.onClick}
                            className={classNames(
                              item.current
                                ? 'bg-gray-800 text-white cursor-pointer'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer',
                              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                            )}
                          >
                            <item.icon
                              className='h-6 w-6 shrink-0'
                              aria-hidden='true'
                            />
                            {item.name}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>

                <li className='-mx-6 mt-auto'>
                  <a
                    href='#'
                    className='flex items-center gap-x-4 px-6 py-4 text-sm font-semibold leading-6 text-white hover:bg-gray-800'
                  >
                    {/* <img
                      className='h-8 w-8 rounded-full bg-gray-800'
                      src='https://media.licdn.com/dms/image/D5603AQFviDjG26DlRQ/profile-displayphoto-shrink_400_400/0/1689219654699?e=1700697600&v=beta&t=_-LRIlZ6Q_DUqLTa9MZC8uJ3YdmIFX2fS1JFNSuwwPQ'
                      alt=''
                    /> */}
                    <span className='sr-only'>Your profile</span>
                    <span aria-hidden='true'>
                      {user
                        ? `${user.firstName} ${user.lastName}`
                        : 'Loading...'}
                    </span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className='xl:pl-72'>
          {/* Sticky search header */}
          <div className='sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-white/5 bg-gray-900 px-4 shadow-sm sm:px-6 lg:px-8'>
            <button
              type='button'
              className='-m-2.5 p-2.5 text-white xl:hidden'
              onClick={() => setSidebarOpen(true)}
            >
              <span className='sr-only'>Open sidebar</span>
              <Bars3Icon className='h-5 w-5' aria-hidden='true' />
            </button>

            <div className='flex flex-1 gap-x-4 self-stretch lg:gap-x-6'></div>
          </div>

          <main className='lg:pr-96'>
            <header className='flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8'>
              <h1 className='text-base font-semibold leading-7 text-white'>
                Typing Test
              </h1>
            </header>

            <div className='container'>
              <CodeTyper />
            </div>
          </main>

          {/* Leaderboard */}
          <aside className='bg-black/10 lg:fixed lg:bottom-0 lg:right-0 lg:top-16 lg:w-96 lg:overflow-y-auto lg:border-l lg:border-white/5'>
            <header className='flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8'>
              <h2 className='text-base font-semibold leading-7 text-white'>
                Leaderboard
              </h2>
            </header>
            <div className='mx-8'>
              <ul>
                {leaderboardData.map((user) => (
                  <li
                    key={user.id}
                    className='flex justify-between text-white py-2 border-b border-white/10'
                  >
                    <span>
                      {user.firstName} {user.lastName}
                    </span>
                    <span>{user.highScore}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
