const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")
const { parse } = require("json2csv")

// Load service account key  (You will need to get the service key)
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

function generateRandomCode(length = 4) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let code = ""
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function seedFirestore() {
  const batch = db.batch()
  const timestamp = admin.firestore.FieldValue.serverTimestamp()
  const usersData = []

  for (let i = 1; i <= 30; i++) {
    let userCode = generateRandomCode(4)

    const userData = {
      code: userCode,
      firstName: `Team ${i}`,
      lastName: "",
      role: "participant",
      teamName: `Team ${i}`
    }

    const userRef = db.collection("users").doc()
    batch.set(userRef, userData)

    const teamRef = db.collection("teams").doc(`team${i}`)
    batch.set(teamRef, {
      teamName: `Team ${i}`,
      teamMembers: [userData],
      createdAt: timestamp
    })

    usersData.push({ firstName: userData.firstName, code: userData.code })
  }

  await batch.commit()
  console.log("Successfully created teams and users.")

  generateCSV(usersData)
}

function generateCSV(usersData) {
  try {
    const csv = parse(usersData, { fields: ["firstName", "code"] })
    fs.writeFileSync("users.csv", csv)
    console.log("CSV file 'users.csv' created successfully!")
  } catch (err) {
    console.error("Error generating CSV:", err)
  }
}

seedFirestore().catch(console.error)
