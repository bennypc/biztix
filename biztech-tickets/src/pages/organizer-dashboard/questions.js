import Head from 'next/head';
import Image from 'next/image';
import styles from '@/styles/Home.module.css';
import { useRouter } from 'next/router';
import { useState, Fragment, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext.js'; // Ensure this path points to the correct location
import { Dialog, Menu, Transition, Disclosure } from '@headlessui/react';
import {
  ArrowRightOnRectangleIcon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  FolderIcon,
  GlobeAltIcon,
  ServerIcon,
  SignalIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  Bars3Icon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/20/solid';

import { app } from '../../../firebaseConfig';
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
var randomstring = require('randomstring');

const db = getFirestore(app);

const teams = [
  {
    id: 1,
    name: 'BizTeching BizTechers',
    href: '#',
    initial: 'P',
    current: false
  }
];
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

export default function OrganizerQuestions() {
  const { user, loading, setUser } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);

  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('Front-end');
  const [description, setDescription] = useState('');
  const navigation = [
    {
      name: 'Users',
      href: '/organizer-dashboard/users',
      icon: UserIcon,
      current: false
    },
    {
      name: 'Teams',
      href: '/organizer-dashboard/teams',
      icon: UserGroupIcon,
      current: false
    },
    {
      name: 'Questions',
      href: '/organizer-dashboard/questions',
      icon: FolderIcon,
      current: true
    },

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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      const fetchedQuestions = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      }));
      setQuestions(fetchedQuestions);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

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
    console.log(users);
    console.log('Searching for user with ID:', id);
    const user = users.find((user) => user.code === id);
    console.log('Found user:', user);
    return user ? user.firstName + ' ' + user.lastName : null;
  }

  async function submitQuestion() {
    const questionID = randomstring.generate(10);
    const fullName = `${user.firstName} ${user.lastName}`;
    const timestamp = new Date();

    const newQuestion = {
      id: questionID,
      name: fullName,
      teamName: user.teamName,
      question,
      category,
      description,
      status: 'active',
      timestamp: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, 'tickets'), newQuestion);
      console.log('Document written with ID: ', docRef.id);
      setQuestion('');
      setCategory('Front-end');
      setDescription('');
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  }

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('No user found. Redirecting to /');
        router.push('/');
      }
    }
  }, [loading, user, router]);

  if (!user || (user.role !== 'mentor' && user.role !== 'organizer')) {
    return (
      <div>
        <p className='text-white'>You don't have access to this page.</p>
      </div>
    );
  }

  const filteredQuestions = questions.filter((question) => {
    if (
      statusFilter.length > 0 &&
      !statusFilter.includes(question.status.toLowerCase())
    )
      return false;
    if (
      categoryFilter.length > 0 &&
      !categoryFilter.includes(question.category)
    )
      return false;
    return true;
  });

  async function handleDeleteQuestion(questionId) {
    const questionRef = doc(db, 'tickets', questionId);
    try {
      await deleteDoc(questionRef);
    } catch (error) {
      console.error('Error deleting question: ', error);
    }
  }

  async function handleStatusChange(questionId) {
    const questionRef = doc(db, 'tickets', questionId);

    const currentStatus = questions.find((q) => q.id === questionId).status;

    let updatedStatus;
    let updatePayload = {};

    if (currentStatus === 'active') {
      updatedStatus = 'pending';
      updatePayload = {
        status: updatedStatus,
        claimedBy: user.code
      };
    } else if (currentStatus === 'pending') {
      updatedStatus = 'completed';
      updatePayload = {
        status: updatedStatus,
        claimedBy: null // Setting claimedBy to null when the question is solved
      };
    } else {
      return;
    }

    await updateDoc(questionRef, updatePayload);
  }

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
                        src='../biztechlogo.png'
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
              <img className='h-12 w-auto mt-4' src='../biztechlogo.png' />
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
            <div className=''>
              <Disclosure as='section' aria-labelledby='filter-heading'>
                <h2 id='filter-heading' className='sr-only'>
                  Filters
                </h2>
                <div className='flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6 sm:py-6 lg:px-8'>
                  <h1 className='text-base font-semibold leading-7 text-gray-200'>
                    Questions
                  </h1>
                  <div className='flex items-center gap-x-3'>
                    <Disclosure.Button className='group flex items-center font-medium text-gray-200 group-hover:text-gray-500'>
                      <FunnelIcon
                        className='mr-2 h-5 w-5 flex-none text-gray-200 group-hover:text-gray-500'
                        aria-hidden='true'
                      />
                      Filters
                    </Disclosure.Button>
                    <button
                      type='button'
                      className='text-gray-500'
                      onClick={() => {
                        setStatusFilter([]);
                        setCategoryFilter([]);
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                </div>
                <Disclosure.Panel className='border-t border-gray-800 py-10 bg-[#152241]'>
                  <div className='mx-auto grid max-w-7xl grid-cols-2 gap-x-4 px-4 text-sm sm:px-6 md:gap-x-6 lg:px-8'>
                    {/* Status filter */}
                    <fieldset>
                      <legend className='block font-medium text-white'>
                        Status
                      </legend>
                      <div className='space-y-6 pt-6 sm:space-y-4 sm:pt-4 '>
                        {['Active', 'Pending', 'Completed'].map(
                          (status, idx) => (
                            <div
                              key={status}
                              className='flex items-center text-base sm:text-sm'
                            >
                              <input
                                id={`status-${idx}`}
                                name='status[]'
                                defaultValue={status}
                                type='checkbox'
                                className='h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                                checked={statusFilter.includes(
                                  status.toLowerCase()
                                )}
                                onChange={() => {
                                  const formattedStatus = status.toLowerCase();
                                  if (statusFilter.includes(formattedStatus)) {
                                    setStatusFilter((prev) =>
                                      prev.filter((s) => s !== formattedStatus)
                                    );
                                  } else {
                                    setStatusFilter((prev) => [
                                      ...prev,
                                      formattedStatus
                                    ]);
                                  }
                                }}
                              />
                              <label
                                htmlFor={`status-${idx}`}
                                className='ml-3 min-w-0 flex-1 text-gray-400'
                              >
                                {status}
                              </label>
                            </div>
                          )
                        )}
                      </div>
                    </fieldset>

                    {/* Category filter */}
                    <fieldset>
                      <legend className='block font-medium text-white'>
                        Category
                      </legend>
                      <div className='grid md:grid-cols-2 grid-cols-1 gap-4 pt-6 sm:pt-4'>
                        {[
                          'APIs',
                          'Databases & Storage',
                          'Back-end',
                          'Front-end',
                          'Pitching',
                          'UI/UX',
                          'Other',
                          'Ideation'
                        ].map((category, idx) => (
                          <div
                            key={category}
                            className='flex items-center text-base sm:text-sm'
                          >
                            <input
                              id={`category-${idx}`}
                              name='category[]'
                              defaultValue={category}
                              type='checkbox'
                              className='h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                              checked={categoryFilter.includes(category)}
                              onChange={() => {
                                if (categoryFilter.includes(category)) {
                                  setCategoryFilter((prev) =>
                                    prev.filter((c) => c !== category)
                                  );
                                } else {
                                  setCategoryFilter((prev) => [
                                    ...prev,
                                    category
                                  ]);
                                }
                              }}
                            />
                            <label
                              htmlFor={`category-${idx}`}
                              className='ml-3 min-w-0 flex-1 text-gray-400'
                            >
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                </Disclosure.Panel>
              </Disclosure>
            </div>

            {/* Questions list */}
            <ul
              role='list'
              className='divide-y divide-white/5 max-h-[35rem] overflow-y-auto lg:max-h-full px-2 md:px-0'
            >
              {filteredQuestions
                .sort((a, b) => {
                  if (
                    a.status === 'completed' &&
                    (b.status === 'active' || b.status === 'pending')
                  )
                    return 1;
                  if (
                    b.status === 'completed' &&
                    (a.status === 'active' || a.status === 'pending')
                  )
                    return -1;
                  return a.timestamp.seconds - b.timestamp.seconds;
                })
                .map((question) => (
                  <li
                    key={question.id}
                    className='relative flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 px-2 py-3 sm:px-4 lg:px-6'
                  >
                    <div className='md:flex-grow flex items-center md:items-start gap-x-2 gap-y-1'>
                      <div
                        className={classNames(
                          statuses[question.status],
                          'flex-none rounded-full p-1'
                        )}
                      >
                        <div className='h-2 w-2 rounded-full bg-current' />
                      </div>
                      <div className='flex-grow'>
                        <h2 className='text-sm font-semibold leading-6 text-white'>
                          <a href={question.href} className='flex gap-x-2'>
                            <span className='whitespace-nowrap'>
                              {question.teamName}
                            </span>
                            <span className='text-gray-400'>/</span>
                            <span className='flex-grow whitespace-nowrap truncate md:max-w-[350px] max-w-[160px]'>
                              {question.question}
                            </span>
                          </a>
                        </h2>

                        <div className='mt-1 flex flex-col sm:flex-row gap-x-2.5 text-xs leading-5 text-gray-400 mb-2'>
                          <div className='flex items-center gap-x-2.5'>
                            <p className='truncate'>{question.description}</p>
                            <svg
                              viewBox='0 0 2 2'
                              className='h-0.5 w-0.5 flex-none fill-gray-300'
                            >
                              <circle cx={1} cy={1} r={1} />
                            </svg>
                            <p className='whitespace-nowrap'>
                              {timeAgo(question.timestamp)}
                            </p>
                          </div>

                          {question.claimedBy && !question.solvedBy && (
                            <p className='whitespace-nowrap mt-1 sm:mt-0 sm:ml-4 text-indigo-500'>
                              Claimed by {findUserNameById(question.claimedBy)}
                            </p>
                          )}
                          {question.solvedBy && (
                            <p className='whitespace-nowrap mt-1 sm:mt-0 sm:ml-4 text-green-500'>
                              Solved by {findUserNameById(question.solvedBy)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className='rounded-full py-1 px-2 text-xs font-medium ring-1 ring-inset text-white mb-2 md:mb-0'>
                        {question.category}
                      </div>
                    </div>

                    <button
                      type='button'
                      onClick={() => handleDeleteQuestion(question.id)}
                      className='w-full md:w-auto mt-4 md:mt-0 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
                    >
                      Delete Question
                    </button>
                  </li>
                ))}
            </ul>
          </main>

          {/* List of questions */}
          <aside className='bg-black/10 lg:fixed lg:bottom-0 lg:right-0 lg:top-16 lg:w-96 lg:overflow-y-auto lg:border-l lg:border-white/5'>
            <header className='flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8'>
              <h2 className='text-base font-semibold leading-7 text-white'>
                Hello Hacks! Questions
              </h2>
            </header>
            <div className='mx-8 pb-6'>
              <p className='text-white mt-4'>
                <strong>Total questions: </strong>
                {questions.length}
              </p>
              <p className='text-white mt-2'>
                <strong>Active questions:</strong>{' '}
                {questions.filter((q) => q.status === 'active').length}
              </p>
              <p className='text-white mt-2'>
                <strong>Pending questions:</strong>{' '}
                {questions.filter((q) => q.status === 'pending').length}
              </p>
              <p className='text-white mt-2'>
                <strong>Completed questions:</strong>{' '}
                {questions.filter((q) => q.status === 'completed').length}
              </p>

              <h3 className='text-white mt-4 font-semibold'>
                Category Distribution:
              </h3>

              {Object.entries(
                questions.reduce((acc, q) => {
                  if (!acc[q.category]) {
                    acc[q.category] = 0;
                  }
                  acc[q.category]++;
                  return acc;
                }, {})
              ).map(([category, count]) => (
                <div
                  key={category}
                  className='flex justify-between text-white mt-2'
                >
                  <span>{category}:</span>
                  <span>{count}</span>
                </div>
              ))}

              {/* You can replace this with a graphic representation using a library like D3.js or Chart.js for a more visual representation of category distribution. */}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
