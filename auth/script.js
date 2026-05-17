// ===============================
// Firebase SDK
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";

// ===============================
// Firebase config
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyDx_3O-ODKiPYCXSykQ9iqb3iJn08z9P9k",
  authDomain: "devsanvicare-56e5c.firebaseapp.com",
  databaseURL:
    "https://devsanvicare-56e5c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "devsanvicare-56e5c",
  storageBucket: "devsanvicare-56e5c.firebasestorage.app",
  messagingSenderId: "120747231459",
  appId: "1:120747231459:web:fbb7e9d46888524f19ddd6",
  measurementId: "G-09XTL0WPC0",
};

// ===============================
// INIT
// ===============================
const app = initializeApp(firebaseConfig);
getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// AUTO REDIRECT IF LOGGED IN
// ===============================
const savedUser = localStorage.getItem("sanvicareUser");

if (savedUser) {
  window.location.href = "../index.html";
}

// ===============================
// VALIDATION
// ===============================
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

// ===============================
// SIGN UP
// ===============================
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!name || !email || !password) {
    return Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please fill all fields",
    });
  }

  if (!validateEmail(email)) {
    return Swal.fire({
      icon: "warning",
      title: "Invalid Email",
      text: "Please enter a valid email format",
    });
  }

  if (!validatePassword(password)) {
    return Swal.fire({
      icon: "warning",
      title: "Weak Password",
      text: "Password must be at least 6 characters",
    });
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    const user = result.user;

    // SAVE TO FIRESTORE (admins table)
    await setDoc(doc(db, "admins", user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      createdAt: serverTimestamp(),
    });

    // LOCAL STORAGE
    localStorage.setItem(
      "sanvicareUser",
      JSON.stringify({
        email: user.email,
        uid: user.uid,
        name: name,
      }),
    );

    await Swal.fire({
      icon: "success",
      title: "Signup Successful",
      text: "Your account has been created",
      timer: 1200,
      showConfirmButton: false,
    });

    window.location.href = "../index.html";
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      Swal.fire({
        icon: "error",
        title: "Email Already Exists",
        text: "Try logging in instead",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: error.message,
      });
    }
  }
});

// ===============================
// LOGIN
// ===============================
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    return Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please fill all fields",
    });
  }

  if (!validateEmail(email)) {
    return Swal.fire({
      icon: "warning",
      title: "Invalid Email",
      text: "Enter a valid email",
    });
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);

    const user = auth.currentUser;

    localStorage.setItem(
      "sanvicareUser",
      JSON.stringify({
        email: user.email,
        uid: user.uid,
      }),
    );

    await Swal.fire({
      icon: "success",
      title: "Login Successful",
      timer: 1000,
      showConfirmButton: false,
    });

    window.location.href = "../index.html";
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Login Failed",
      text: "Login Failed",
    });
  }
});

// ===============================
// AUTH STATE
// ===============================
onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem(
      "sanvicareUser",
      JSON.stringify({
        email: user.email,
        uid: user.uid,
      }),
    );
  } else {
    localStorage.removeItem("sanvicareUser");
  }
});
