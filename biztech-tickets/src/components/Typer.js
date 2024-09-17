import React, { useState, useEffect } from "react";
import { app } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
  addDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { useUser } from "../contexts/UserContext.js"; // Ensure this path points to the correct location

import { ref, getDownloadURL, uploadBytes, getStorage } from "firebase/storage";

const db = getFirestore(app);
const storage = getStorage(app);
const codeSnippets = [
  // Java Snippets
  `System.out.println("Welcome to Hello Hacks!");`,
  //`public class BizTech {\n    public static void main(String[] args) {\n    System.out.println("Hello Hacks!");\n    }\n}`,
  `int[] scores = new int[]{88, 73, 90, 100};`,
  `for (int i = 0; i < 4; i++) {\n    System.out.println("Scoring: " + scores[i]);\n}`,
  `String hackathon = "Hello Hacks";\nSystem.out.println(hackathon.toUpperCase());`,

  // Python Snippets
  `print("Hello, Hello Hacks!")`,
  `participants = ["Jay", "Kamryn", "Benny"]\nfor p in participants:\n    print(p)`,
  `def calculate_bonus(score):\n    return score * 0.1 if score > 90 else 0`,
  `hackathon = {"name": "Hello Hacks", "year": 2024}\nprint(hackathon["name"])`,
  `import random\nprint(random.choice(["BizTech", "UBC", "Hello Hacks"]))`,

  // C Snippets
  `printf("Hackathon season is here!\\n");`,
  `for(int i = 0; i < 3; i++) {\n    printf("%d days to Hello Hacks!\\n", 3-i);\n}`,
  `char *event = "Hello Hacks";\nprintf("Event: %s\\n", event);`,
  `int sum(int a, int b) {\n    return a + b;\n}\nprintf("%d", sum(3, 5));`,
  `double pi = 3.14159;\nprintf("Pi: %.2f\\n", pi);`,

  // SQL Snippets
  `SELECT * FROM Participants WHERE Hackathon='Hello Hacks';`,
  `INSERT INTO Winners (Name, Prize) VALUES ('BizTech Team', 1000);`,
  `UPDATE Scores SET Points = Points + 10 WHERE TeamName = 'Team 1';`,
  `DELETE FROM Sessions WHERE Topic = 'Intro to SQL';`,
  `CREATE TABLE BizTechChallenges (ID int, Name varchar(255), Difficulty int);`,

  // Mix of Shorter Snippets
  `boolean isUBCStudent = true;`,
  `String welcomeMessage = "Start hacking!";`,
  `if (isUBCStudent) {\n    System.out.println(welcomeMessage);\n}`,
  `x = 42\nif x > 0: print("Positive")`,
  `import math\nprint(math.sqrt(16))`,

  // Mix of Longer Snippets
  //`public class Challenge {\n  String name;\n  int level;\n  public Challenge(String name, int level) {\n    this.name = name;\n    this.level = level;\n  }\n}`,
  `for (String part : new String[]{"Design", "Code", "Pitch"}) {\n    System.out.println(part);\n}`,
  //`int total = 0;\nfor (int i = 1; i <= 10; i++) {\n  total += i;\n}\nSystem.out.println("Total: " + total);`,
  `scores = list(filter(lambda x: x > 80, scores))\nprint(scores)`,
  `try:\n    x = int(input("Enter a number: "))\nexcept ValueError:\n    print("Not a valid number")`,

  // More Complex Snippets
  `class Participant {\n    String name;\n    public Participant(String name) {\n    this.name = name;\n    }\n}`,
  `List<String> projects = Arrays.asList("App", "Website", "AI Model");\nprojects.forEach(System.out::println);`,
  `int factorial(int n) {\n    if (n == 0) return 1;\n    return n * factorial(n-1);\n}`,
  `String.join(", ", new String[]{"BizTech", "UBC", "Hello Hacks"})`,
  `Stream.of("BizTech", "UBC", "Hello Hacks").forEach(System.out::println);`,

  // Challenging Snippets
  `SELECT TeamName, SUM(Points) AS TotalPoints FROM Scores GROUP BY TeamName;`,

  // More C
  //`void printTeamMembers(char *teamMembers[], int size) {\n    for (int i = 0; i < size; i++) {\n        printf("%s\\n", teamMembers[i]);\n    }\n}`,
  //`if (isRegistered) {\n    printf("Participant is already registered.\\n");\n} else {\n    printf("Please complete your registration.\\n");\n}`,
  //`int hoursPassed = 0;\nwhile (hoursPassed < 24) {\n    printf("Hackathon in progress...\\n");\n    hoursPassed++;\n}`,

  // DrRacket
  `(define (say-hello) (display "Hello Hello Hacks!"))`,
  `(define (square x) (* x x))`,
  `(if (<= (current-inexact-milliseconds) 10000) 'early 'late)`,

  // Java
  `System.out.println("ABCDEFGHIJKLMNOPQRSTUVWXYZ");`,
  `int sum(int x, int y) { return x + y; }`,
  `boolean isEligible = participantAge >= 18;`,

  // Python
  `is_prime = lambda num: all(num%i != 0 for i in range(2, num))`,
  `hackathon_name = "Hello Hacks"`,

  // Assembly
  `mov eax, UBC`,
  `mov ebx, Hello Hacks`,
  `add eax, ebx ; Add UBC to Hello Hacks`,
  `sub eax, 2024 ; Subtract the year`,
  `cmp eax, ebx ; Compare UBC with Hello Hacks`,
  `msg db 'Welcome to Hello Hacks!', 0xA ; Define string`,

  `public static void joinTeam(String memberName) {\n    System.out.println(memberName + " has joined the team.");\n}`,
  `int calculateScore(int challengesCompleted) {\n    return challengesCompleted * 10;\n}`,
  `String hackathonLocation = "UBC Campus";\nSystem.out.println("Location: " + hackathonLocation);`,
  `boolean submitProject(boolean completed) {\n    return completed;\n}`,
  `for (int i = 0; i < 10; i++) {\n    System.out.println("BizTech challenge " + i);\n}`,

  `while hacking:\n    drink_coffee()`,

  `break;`,

  `System.out.println("Hello, Hello Hacks!");`,
  `print('Welcome to Vancouver!')`,
  `echo "UBC BizTech";`,
  `if (hackathonStarted) {\n    System.out.println("Drink redbull");\n}`,
  `print("Where is the redbull")`,
  `cout << "UBC BizTech" << endl;`,
  `document.getElementById("hackathon-name").textContent = "Welcome to UBC Hello Hacks!";`,
  `participants.forEach(hacker => {\n    console.log(hacker.name + " is eating pizza");\n});`
];

const normalizeString = (str) => {
  return str.replace(/\r\n/g, "\n").trim(); // Normalize line endings and trim
};

const CodeTyper = () => {
  const [currentSnippet, setCurrentSnippet] = useState("");
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState("waiting"); // waiting, playing, finished
  const { user, loading, setUser } = useUser();
  const [errors, setErrors] = useState([]);

  const getTimerBarColor = () => {
    const percentageLeft = (timeLeft / 60) * 100;
    if (percentageLeft > 66) {
      return "bg-green-600"; // More than 66% left
    } else if (percentageLeft > 33) {
      return "bg-yellow-600"; // Between 33% and 66% left
    } else {
      return "bg-red-600"; // Less than 33% left
    }
  };

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameState("finished");
    }
  }, [timeLeft, gameState]);

  useEffect(() => {
    if (gameState === "playing") {
      const normalizedUserInput = normalizeString(userInput);
      const normalizedSnippet = normalizeString(currentSnippet);
      if (normalizedUserInput === normalizedSnippet) {
        setScore(score + 1);
        setUserInput("");
        selectRandomSnippet();
      }
    }
  }, [userInput, gameState]);

  useEffect(() => {
    const updateUserHighScore = async () => {
      // Only attempt to update the high score if the game has finished
      if (gameState === "finished") {
        // Query for the user's document using their unique code
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("code", "==", user.code));
        const querySnapshot = await getDocs(q);

        // Assuming each code is unique, there should only be one matching document
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();

          // Check if the user's current score is higher than their stored high score
          if (!userData.highScore || score > userData.highScore) {
            // Update the user's high score in their Firestore document
            await updateDoc(userDoc.ref, {
              highScore: score
            });
            console.log(
              `High score updated to ${score} for user ${user.firstName}`
            );
          }
        } else {
          console.log("No matching user document found.");
        }
      }
    };

    if (gameState === "finished") {
      updateUserHighScore();
    }
  }, [gameState, score, user]);

  const selectRandomSnippet = () => {
    const randomIndex = Math.floor(Math.random() * codeSnippets.length);
    setCurrentSnippet(codeSnippets[randomIndex]);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameState("playing");
    setUserInput("");
    selectRandomSnippet();
  };

  const handleInputChange = (e) => {
    if (gameState !== "playing") return;

    const input = e.target.value;
    setUserInput(input);

    // Calculate errors
    const newErrors = [];
    for (let i = 0; i < currentSnippet.length; i++) {
      if (i < input.length && input[i] !== currentSnippet[i]) {
        newErrors.push(i);
      }
    }
    setErrors(newErrors);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      setUserInput(
        userInput.substring(0, start) + "    " + userInput.substring(end)
      );
      e.target.selectionStart = e.target.selectionEnd = start + 4;
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
  };

  return (
    <div>
      {gameState === "waiting" && (
        <button
          onClick={startGame}
          className="mx-8 my-8 rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          Start Game
        </button>
      )}
      {gameState === "playing" && (
        <>
          <div className="w-full bg-gray-200 h-2 mb-4">
            <div
              className="h-2 timer-bar"
              style={{
                width: `${(timeLeft / 60) * 100}%`,
                transition: "width 1s linear"
              }}
            ></div>
          </div>
          <div className="ml-4">
            <div className="text-white font-semibold">
              Time Left: {timeLeft}s
            </div>
            <div className="text-white font-semibold">Score: {score}</div>
            <pre className="text-white font-normal my-8">
              {currentSnippet.split("").map((char, index) => {
                const error = errors.includes(index);
                return (
                  <span key={index} className={error ? "text-red-500" : ""}>
                    {char}
                  </span>
                );
              })}
            </pre>
            <textarea
              value={userInput}
              className="px-3 py-3"
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              rows="8"
              cols="50"
            ></textarea>
          </div>
        </>
      )}
      {gameState === "finished" && (
        <div className="ml-8 mt-4">
          <div>
            <h1 className="text-white font-semibold">
              Game Over! Your score: {score}
            </h1>
          </div>
          <button
            onClick={startGame}
            className="mt-4 rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeTyper;
