import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5X9VwkILBgMp76NUxOonRMuGAczBdXMU",
  authDomain: "swaad-qr.firebaseapp.com",
  projectId: "swaad-qr",
  storageBucket: "swaad-qr.firebasestorage.app",
  messagingSenderId: "330570799980",
  appId: "1:330570799980:web:e0486d5a560ec64bd3b149",
  measurementId: "G-KC4P9YWCC1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function () {
  // Toggle password visibility
  const passwordToggle = document.getElementById("passwordToggle");
  const passwordInput = document.getElementById("password");
  const confirmPasswordToggle = document.getElementById(
    "confirmPasswordToggle"
  );
  const confirmPasswordInput = document.getElementById("confirmPassword");

  passwordToggle.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });

  confirmPasswordToggle.addEventListener("click", function () {
    const type =
      confirmPasswordInput.getAttribute("type") === "password"
        ? "text"
        : "password";
    confirmPasswordInput.setAttribute("type", type);
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });

  // Sign-up form submission
  const signupForm = document.getElementById("signupForm");
  const signupButton = document.querySelector(".login-button");

  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Add loading state to button
    signupButton.innerHTML =
      '<i class="fas fa-circle-notch fa-spin"></i> Signing up...';
    signupButton.disabled = true;

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validate passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      signupButton.innerHTML = "Sign Up <i class='fas fa-arrow-right'></i>";
      signupButton.disabled = false;
      return;
    }

    // Create user with Firebase Authentication
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up successfully
        const user = userCredential.user;
        console.log("User signed up:", user);

        // Save additional user data to Firestore
        setDoc(doc(db, "users", user.uid), {
          fullName: fullName,
          email: email,
          createdAt: new Date(),
        })
          .then(() => {
            console.log("User data saved to Firestore");
            // Redirect to dashboard or login page
            window.location.href = "/staff/waiter.html";
          })
          .catch((error) => {
            console.error("Error saving user data:", error);
            alert("Error saving user data: " + error.message);
          });
      })
      .catch((error) => {
        // Handle errors
        console.error("Sign-up error:", error.message);
        alert("Sign-up failed: " + error.message);

        // Reset button
        signupButton.innerHTML = "Sign Up <i class='fas fa-arrow-right'></i>";
        signupButton.disabled = false;
      });
  });
});
