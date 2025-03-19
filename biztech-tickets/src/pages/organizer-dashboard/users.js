import Head from "next/head"
import Image from "next/image"
import styles from "@/styles/Home.module.css"
import { useRouter } from "next/router"
import { useState, Fragment, useEffect, useRef } from "react"
import { useUser } from "../../contexts/UserContext.js" // Ensure this path points to the correct location
import { Dialog, Menu, Transition } from "@headlessui/react"
import {
  ArrowRightOnRectangleIcon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  FolderIcon,
  GlobeAltIcon,
  ServerIcon,
  ShieldExclamationIcon,
  SignalIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon
} from "@heroicons/react/24/outline"
import {
  Bars3Icon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/20/solid"

import { app } from "../../../firebaseConfig.js"
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
  deleteDoc,
  arrayRemove,
  arrayUnion
} from "firebase/firestore"
var randomstring = require("randomstring")

const db = getFirestore(app)

const statuses = {
  pending: "text-yellow-500 bg-yellow-100/10",
  completed: "text-green-400 bg-green-400/10",
  active: "text-rose-400 bg-rose-400/10"
}

function classNames(...classes) {
  return classes.filter(Boolean).join(" ")
}

function timeAgo(timestamp) {
  if (!timestamp) return "Just now"

  const now = new Date()
  const questionDate = timestamp.toDate()
  const secondsAgo = Math.floor((now - questionDate) / 1000)

  if (secondsAgo < 60) return `${secondsAgo} seconds ago`
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`
  return `${Math.floor(secondsAgo / 86400)} days ago`
}

export default function OrganizerDashboard() {
  const router = useRouter()

  const { user, loading, setUser } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [questions, setQuestions] = useState([])

  const [question, setQuestion] = useState("")
  const [category, setCategory] = useState("Front-end")
  const [description, setDescription] = useState("")
  const [users, setUsers] = useState([])
  const [teams, setTeams] = useState([])

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState("organizer")
  const [team, setTeam] = useState("Select Team")

  const [teamName, setTeamName] = useState("")

  const [openCreateTeamModal, setOpenCreateTeamModal] = useState(false)
  const [openCreateUserModal, setOpenCreateUserModal] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalFirstName, setEditModalFirstName] = useState("")
  const [editModalLastName, setEditModalLastName] = useState("")
  const [editModalRole, setEditModalRole] = useState("")
  const [editModalTeam, setEditModalTeam] = useState("")
  const [editModalCode, setEditModalCode] = useState("")
  const cancelButtonRef = useRef(null)

  const navigation = [
    {
      name: "Users",
      href: "/organizer-dashboard/users",
      icon: UserIcon,
      current: true
    },
    {
      name: "Teams",
      href: "/organizer-dashboard/teams",
      icon: UserGroupIcon,
      current: false
    },
    {
      name: "Tickets",
      href: "/organizer-dashboard/questions",
      icon: FolderIcon,
      current: false
    },
    {
      name: "Report an Issue",
      href: "/report-issue",
      icon: ShieldExclamationIcon,
      current: false
    },
    {
      name: "Sign Out",
      onClick: signOut,
      icon: ArrowRightOnRectangleIcon,
      current: false
    }
  ]

  function signOut() {
    localStorage.removeItem("user")
    setUser(null)
    router.push("/")
  }
  const fetchUsers = async () => {
    try {
      const userCollection = collection(db, "users")
      const userSnapshot = await getDocs(userCollection)
      const usersData = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching users: ", error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const teamsRef = collection(db, "teams")
      const teamSnapshots = await getDocs(teamsRef)
      const teams = teamSnapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setTeams(teams)
    } catch (error) {
      console.error("Error fetching teams: ", error)
    }
  }

  const [totalUsers, setTotalUsers] = useState(0)
  const [mentorsCount, setMentorsCount] = useState(0)
  const [organizersCount, setOrganizersCount] = useState(0)
  const [participantsCount, setParticipantsCount] = useState(0)

  useEffect(() => {
    setTotalUsers(users.length)
    setMentorsCount(users.filter((user) => user.role === "mentor").length)
    setOrganizersCount(users.filter((user) => user.role === "organizer").length)
    setParticipantsCount(
      users.filter((user) => user.role === "participant").length
    )
  }, [users])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const fetchedQuestions = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      }))
      setQuestions(fetchedQuestions)
    })

    // Cleanup listener on component unmount
    return () => unsubscribe()
  }, [])

  async function createTeam() {
    // Check if the teamName is empty
    if (!teamName.trim()) {
      alert("Please enter a team name.")
      return
    }

    // Create a reference to the teams collection
    const teamsRef = collection(db, "teams")

    // Check if a team with the same name already exists
    const teamExistsQuery = query(teamsRef, where("teamName", "==", teamName))
    const teamExists = await getDocs(teamExistsQuery)

    if (!teamExists.empty) {
      alert("A team with this name already exists.")
      return
    }

    // Add the new team to Firestore
    try {
      await addDoc(teamsRef, {
        teamName: teamName,
        teamMembers: [], // Initially empty.
        createdAt: serverTimestamp()
      })

      setTeamName("") // Reset the input field
      setOpenCreateTeamModal(false) // Close the modal or respective UI
      fetchTeams()
    } catch (error) {
      console.error("Error creating team: ", error)
    }
  }
  async function createUser() {
    const userCode = generateCode(4)
    let userData

    if (role === "participant") {
      userData = {
        firstName: firstName,
        lastName: lastName,
        role: role,
        code: userCode,
        teamName: team
      }
    } else {
      userData = {
        firstName: firstName,
        lastName: lastName,
        role: role,
        code: userCode
      }
    }

    try {
      // Add the user to the 'users' collection
      await addDoc(collection(db, "users"), userData)

      // If the user is a participant, also update the team
      if (role === "participant" && team) {
        const teamQuery = query(
          collection(db, "teams"),
          where("teamName", "==", team)
        )

        const teamSnapshot = await getDocs(teamQuery)

        if (!teamSnapshot.empty) {
          const teamDoc = teamSnapshot.docs[0]

          await updateDoc(teamDoc.ref, {
            teamMembers: arrayUnion({
              firstName: firstName,
              lastName: lastName,
              code: userCode
            })
          })
        } else {
          console.error("No team found with name:", team)
        }
      }

      setFirstName("")
      setLastName("")
      setTeam("Select Team") // Reset the input field
      setRole("mentor")
      setOpenCreateUserModal(false)
      fetchUsers()
    } catch (error) {
      console.log(error)
    }
  }

  async function deleteUser(code) {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("code", "==", code))

    try {
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        await deleteDoc(userDoc.ref)
        // Refresh the user list after deleting
        fetchUsers()
      } else {
        console.error("No user found with code:", userCode)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  async function submitQuestion() {
    const questionID = randomstring.generate(10)
    const fullName = `${user.firstName} ${user.lastName}`
    const timestamp = new Date()

    const newQuestion = {
      id: questionID,
      name: fullName,
      teamName: user.teamName,
      question,
      category,
      description,
      status: "active",
      timestamp: serverTimestamp()
    }

    try {
      const docRef = await addDoc(collection(db, "tickets"), newQuestion)
      console.log("Document written with ID: ", docRef.id)
      setQuestion("")
      setCategory("Front-end")
      setDescription("")
    } catch (error) {
      console.error("Error adding document: ", error)
    }
  }
  function handleEditModalOpen(user) {
    setEditModalFirstName(user.firstName)
    setEditModalLastName(user.lastName)
    setEditModalRole(user.role)
    setEditModalTeam(user.teamName)
    setEditModalCode(user.code)
    setEditModalOpen(true)
  }
  async function updateUser() {
    // Get a reference to the users collection and create a query based on the code
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("code", "==", editModalCode))

    // Construct the updated user data object
    const updatedUserData = {
      firstName: editModalFirstName,
      lastName: editModalLastName,
      role: editModalRole
    }

    if (editModalRole === "participant" && editModalTeam) {
      updatedUserData.teamName = editModalTeam
    } else if (editModalRole !== "participant") {
      updatedUserData.teamName = firebase.firestore.FieldValue.delete()
    }

    try {
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        const oldTeamName = userDoc.data().teamName

        await updateDoc(doc(db, "users", userDoc.id), updatedUserData)

        // Update the teams collection if necessary
        if (oldTeamName !== editModalTeam || editModalRole !== "participant") {
          // Remove user from the old team
          if (oldTeamName) {
            const oldTeamQuery = query(
              collection(db, "teams"),
              where("teamName", "==", oldTeamName)
            )
            const oldTeamSnapshot = await getDocs(oldTeamQuery)
            const oldTeamDoc = oldTeamSnapshot.docs[0]

            await updateDoc(oldTeamDoc.ref, {
              teamMembers: arrayRemove({
                firstName: editModalFirstName,
                lastName: editModalLastName,
                code: editModalCode
              })
            })
          }

          // Add user to the new team
          if (editModalRole === "participant" && editModalTeam) {
            const newTeamQuery = query(
              collection(db, "teams"),
              where("teamName", "==", editModalTeam)
            )
            const newTeamSnapshot = await getDocs(newTeamQuery)
            const newTeamDoc = newTeamSnapshot.docs[0]

            await updateDoc(newTeamDoc.ref, {
              teamMembers: arrayUnion({
                firstName: editModalFirstName,
                lastName: editModalLastName,
                code: editModalCode
              })
            })
          }
        }

        setEditModalOpen(false)
        fetchUsers()
      } else {
        console.error("No user found with code:", editModalCode)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log("No user found. Redirecting to /")
        router.push("/")
      }
    }
  }, [loading, user, router])

  if (!user || (user.role !== "mentor" && user.role !== "organizer")) {
    return (
      <div>
        <p className="text-white">You don't have access to this page.</p>
      </div>
    )
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  function generateCode(length) {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  async function handleStatusChange(questionId) {
    // Identify which question to update based on its ID
    const questionRef = doc(db, "tickets", questionId)

    // Fetch the current status of the question from your state or Firestore
    const currentStatus = questions.find((q) => q.id === questionId).status

    let updatedStatus

    if (currentStatus === "active") {
      updatedStatus = "pending"
    } else if (currentStatus === "pending") {
      updatedStatus = "completed"
    } else {
      // If the current status is "completed", no further actions are needed.
      return
    }

    // Update the status in Firestore
    await updateDoc(questionRef, {
      status: updatedStatus
    })
  }

  return (
    <div className="bg-[#070f21] min-h-screen">
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50 xl:hidden"
            onClose={setSidebarOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/80" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button
                        type="button"
                        className="-m-2.5 p-2.5"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>

                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 ring-1 ring-white/10">
                    <div className="flex h-16 shrink-0 items-center">
                      <img
                        className="h-10 w-auto mt-2 pr-4"
                        src="../biztechlogo.png"
                      />
                    </div>
                    <nav className="flex flex-1 flex-col">
                      <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (
                              <li key={item.name}>
                                {item.href ? (
                                  <a
                                    href={item.href}
                                    className={classNames(
                                      item.current
                                        ? "bg-gray-800 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800",
                                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                    )}
                                  >
                                    <item.icon
                                      className="h-6 w-6 shrink-0"
                                      aria-hidden="true"
                                    />
                                    {item.name}
                                  </a>
                                ) : (
                                  <button
                                    onClick={item.onClick}
                                    className={classNames(
                                      item.current
                                        ? "bg-gray-800 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800",
                                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                    )}
                                  >
                                    <item.icon
                                      className="h-6 w-6 shrink-0"
                                      aria-hidden="true"
                                    />
                                    {item.name}
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </li>
                        <li></li>
                        <li className="-mx-6 mt-auto">
                          <a
                            href="#"
                            className="flex items-center gap-x-4 px-6 py-4 text-sm font-semibold leading-6 text-white hover:bg-gray-800"
                          >
                            <span className="sr-only">Your profile</span>
                            <span aria-hidden="true">
                              {user
                                ? `${user.firstName} ${user.lastName}`
                                : "Loading..."}
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
        <div className="hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black/10 px-6 ring-1 ring-white/5">
            <div className="flex h-16 shrink-0 items-center">
              <img className="h-12 w-auto mt-4" src="../biztechlogo.png" />
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        {item.href ? (
                          <a
                            href={item.href}
                            className={classNames(
                              item.current
                                ? "bg-gray-800 text-white"
                                : "text-gray-400 hover:text-white hover:bg-gray-800",
                              "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                            )}
                          >
                            <item.icon
                              className="h-6 w-6 shrink-0"
                              aria-hidden="true"
                            />
                            {item.name}
                          </a>
                        ) : (
                          <div //
                            onClick={item.onClick}
                            className={classNames(
                              item.current
                                ? "bg-gray-800 text-white cursor-pointer"
                                : "text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer",
                              "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                            )}
                          >
                            <item.icon
                              className="h-6 w-6 shrink-0"
                              aria-hidden="true"
                            />
                            {item.name}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
                <li></li>
                <li className="-mx-6 mt-auto">
                  <a
                    href="#"
                    className="flex items-center gap-x-4 px-6 py-4 text-sm font-semibold leading-6 text-white hover:bg-gray-800"
                  >
                    <span className="sr-only">Your profile</span>
                    <span aria-hidden="true">
                      {user
                        ? `${user.firstName} ${user.lastName}`
                        : "Loading..."}
                    </span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="xl:pl-72">
          {/* Sticky search header */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-white/5 bg-gray-900 px-4 shadow-sm sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-white xl:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6"></div>
          </div>

          <main className="lg:pr-96">
            <header className="flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
              <h1 className="text-base font-semibold leading-7 text-white">
                Users
              </h1>

              {/* Sort dropdown */}
              <Menu as="div" className="relative">
                <button
                  type="button"
                  className="rounded-md mr-4 bg-[#402dad] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  onClick={() => setOpenCreateUserModal(true)}
                >
                  Add User
                </button>

                <button
                  type="button"
                  className="rounded-md bg-[#402dad] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  onClick={() => setOpenCreateTeamModal(true)}
                >
                  Create Team
                </button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2.5 w-40 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          className={classNames(
                            active ? "bg-gray-50" : "",
                            "block px-3 py-1 text-sm leading-6 text-gray-900"
                          )}
                        >
                          Name
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          className={classNames(
                            active ? "bg-gray-50" : "",
                            "block px-3 py-1 text-sm leading-6 text-gray-900"
                          )}
                        >
                          Date updated
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          className={classNames(
                            active ? "bg-gray-50" : "",
                            "block px-3 py-1 text-sm leading-6 text-gray-900"
                          )}
                        >
                          Environment
                        </a>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </header>

            {/* Users list */}
            <ul role="list" className="divide-y divide-white/5">
              {users
                .sort((a, b) => {
                  const nameA = `${a.firstName} ${a.lastName}`.toUpperCase()
                  const nameB = `${b.firstName} ${b.lastName}`.toUpperCase()
                  if (nameA < nameB) return -1
                  if (nameA > nameB) return 1
                  return 0
                })
                .map((user) => (
                  <li
                    key={user.code}
                    className="relative flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-x-4 px-4 py-4 sm:px-6 lg:px-8"
                  >
                    <div className="min-w-0 flex-auto">
                      <div className="flex items-center gap-x-3">
                        <h2 className="min-w-0 text-sm font-semibold leading-6 text-white">
                          <a href={question.href} className="flex gap-x-2">
                            <span className="truncate">
                              {user.firstName} {user.lastName}
                            </span>
                            {user.teamName && (
                              <span className="text-gray-400">/</span>
                            )}
                            <span className="whitespace-nowrap">
                              {user.teamName && <span>{user.teamName}</span>}
                            </span>
                          </a>
                        </h2>
                      </div>
                      <div className="mt-3 flex items-center gap-x-2.5 text-xs leading-5 text-gray-400">
                        <p className="truncate">
                          {capitalizeFirstLetter(user.role)}
                        </p>{" "}
                        <svg
                          viewBox="0 0 2 2"
                          className="h-0.5 w-0.5 flex-none fill-gray-300"
                        >
                          <circle cx={1} cy={1} r={1} />
                        </svg>
                        <p className="whitespace-nowrap">{user.code}</p>
                      </div>
                    </div>
                    <div className="flex flex-col w-full sm:flex-row sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditModalOpen(user)}
                        className="w-full sm:w-auto rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                      >
                        Edit User
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteUser(user.code)}
                        className="w-full sm:w-auto rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                      >
                        Delete User
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </main>

          {/* Submit a question */}
          <aside className="bg-black/10 lg:fixed lg:bottom-0 lg:right-0 lg:top-16 lg:w-96 lg:overflow-y-auto lg:border-l lg:border-white/5">
            <header className="flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
              <h2 className="text-base font-semibold leading-7 text-white">
                ProductX Questions
              </h2>
            </header>
            <div className="mx-8 border-b border-white/5 pb-4  sm:py-6">
              <p className="text-white mt-2 ">
                <strong>Total questions: </strong>
                {questions.length}
              </p>
              <p className="text-white mt-2">
                <strong>Active questions:</strong>{" "}
                {questions.filter((q) => q.status === "active").length}
              </p>
              <p className="text-white mt-2">
                <strong>Pending questions:</strong>{" "}
                {questions.filter((q) => q.status === "pending").length}
              </p>
              <p className="text-white mt-2">
                <strong>Completed questions:</strong>{" "}
                {questions.filter((q) => q.status === "completed").length}
              </p>

              <h3 className="text-white mt-4 font-semibold">
                Category Distribution:
              </h3>

              {Object.entries(
                questions.reduce((acc, q) => {
                  if (!acc[q.category]) {
                    acc[q.category] = 0
                  }
                  acc[q.category]++
                  return acc
                }, {})
              ).map(([category, count]) => (
                <div
                  key={category}
                  className="flex justify-between text-white mt-2"
                >
                  <span>{category}:</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 mx-8 pb-6">
              {" "}
              <div className="text-white mt-4">
                <h2 className="mt-2">
                  <strong>Total Users:</strong> {totalUsers}
                </h2>
                <h2 className="mt-2">
                  <strong>Mentors:</strong> {mentorsCount}
                </h2>
                <h2 className="mt-2">
                  <strong>Organizers:</strong> {organizersCount}
                </h2>
                <h2 className="mt-2">
                  <strong>Participants:</strong> {participantsCount}
                </h2>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* create team modal */}
      <Transition.Root show={openCreateTeamModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={setOpenCreateTeamModal}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 " />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <Dialog.Title
                          as="h3"
                          className="text-base font-semibold leading-6 text-gray-900"
                        >
                          Create a team{" "}
                        </Dialog.Title>
                      </div>
                    </div>
                    <div className="mt-4 mb-2 mx-4">
                      <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Team Name
                        </label>
                        <div className="mt-2">
                          <input
                            className="px-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 sm:ml-3 sm:w-auto"
                      onClick={createTeam}
                    >
                      Create Team
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setOpenCreateTeamModal(false)}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* create user modal */}
      <Transition.Root show={openCreateUserModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={setOpenCreateUserModal}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 " />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <Dialog.Title
                          as="h3"
                          className="text-base font-semibold leading-6 text-gray-900"
                        >
                          Create a user{" "}
                        </Dialog.Title>
                      </div>
                    </div>
                    <div className="mt-4 mb-2 mx-4">
                      <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          First Name
                        </label>
                        <div className="mt-2">
                          <input
                            className="px-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Last Name */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Last Name
                        </label>
                        <div className="mt-2">
                          <input
                            className="px-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Role */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Role
                        </label>
                        <div className="mt-2">
                          <select
                            className="px-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                          >
                            <option value="participant">Participant</option>
                            <option value="mentor">Mentor</option>
                            <option value="organizer">Organizer</option>
                          </select>
                        </div>
                      </div>

                      {/* Teams Dropdown (visible only if participant role is selected) */}
                      {role === "participant" && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium leading-6 text-gray-900">
                            Team
                          </label>
                          <div className="mt-2">
                            <select
                              className="px-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              value={team}
                              onChange={(e) => setTeam(e.target.value)}
                            >
                              <option value="" selected>
                                Select Team
                              </option>
                              {teams
                                .sort((a, b) => {
                                  const numA = parseInt(
                                    a.teamName.replace(/[^0-9]/g, "")
                                  )
                                  const numB = parseInt(
                                    b.teamName.replace(/[^0-9]/g, "")
                                  )

                                  if (!isNaN(numA) && !isNaN(numB)) {
                                    return numA - numB // Sort numerically if both are numbers
                                  } else if (!isNaN(numA)) {
                                    return -1 // If only 'a' is a number, it comes first
                                  } else if (!isNaN(numB)) {
                                    return 1 // If only 'b' is a number, it comes first
                                  }

                                  return a.teamName.localeCompare(b.teamName) // Fallback to lexicographical ordering
                                })
                                .map((t) => (
                                  <option key={t.id} value={t.teamName}>
                                    {t.teamName}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 sm:ml-3 sm:w-auto"
                      onClick={createUser}
                    >
                      Create User
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setOpenCreateUserModal(false)}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={editModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={setEditModalOpen}
        >
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <Dialog.Title
                          as="h3"
                          className="text-base font-semibold leading-6 text-gray-900"
                        >
                          Edit user
                        </Dialog.Title>
                      </div>
                    </div>

                    {/* First Name */}
                    <div className="mt-4 mb-2 mx-4">
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        First Name
                      </label>
                      <div className="mt-2">
                        <input
                          className="px-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={editModalFirstName}
                          onChange={(e) =>
                            setEditModalFirstName(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div className="mt-4 mb-2 mx-4">
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        Last Name
                      </label>
                      <div className="mt-2">
                        <input
                          className="px-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={editModalLastName}
                          onChange={(e) => setEditModalLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Role */}
                    <div className="mt-4 mb-2 mx-4">
                      <label className="block text-sm font-medium leading-6 text-gray-900">
                        Role
                      </label>
                      <div className="mt-2">
                        <select
                          className="px-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={editModalRole}
                          onChange={(e) => setEditModalRole(e.target.value)}
                        >
                          <option value="participant">Participant</option>
                          <option value="mentor">Mentor</option>
                          <option value="organizer">Organizer</option>
                        </select>
                      </div>
                    </div>

                    {/* Teams Dropdown (visible only if participant role is selected) */}
                    {editModalRole === "participant" && (
                      <div className="mt-4 mb-2 mx-4">
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Team
                        </label>
                        <div className="mt-2">
                          <select
                            className="px-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={editModalTeam}
                            onChange={(e) => setEditModalTeam(e.target.value)}
                          >
                            <option value="">Select Team</option>
                            {teams
                              .sort((a, b) => {
                                const numA = parseInt(
                                  a.teamName.replace(/[^0-9]/g, "")
                                )
                                const numB = parseInt(
                                  b.teamName.replace(/[^0-9]/g, "")
                                )

                                if (!isNaN(numA) && !isNaN(numB)) {
                                  return numA - numB // Sort numerically if both are numbers
                                } else if (!isNaN(numA)) {
                                  return -1 // If only 'a' is a number, it comes first
                                } else if (!isNaN(numB)) {
                                  return 1 // If only 'b' is a number, it comes first
                                }

                                return a.teamName.localeCompare(b.teamName) // Fallback to lexicographical ordering
                              })
                              .map((t) => (
                                <option key={t.id} value={t.teamName}>
                                  {t.teamName}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:ml-3 sm:w-auto"
                      onClick={updateUser}
                    >
                      Update User
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setEditModalOpen(false)}
                      ref={cancelButtonRef}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
}
