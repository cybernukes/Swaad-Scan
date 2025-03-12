import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
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

  passwordToggle.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });

  // Login form submission
  const loginForm = document.getElementById("loginForm");
  const loginButton = document.querySelector(".login-button");

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Add loading state to button
    loginButton.innerHTML =
      '<i class="fas fa-circle-notch fa-spin"></i> Logging in...';
    loginButton.disabled = true;

    const email = document.getElementById("username").value; // Use email as username
    const password = document.getElementById("password").value;

    // Firebase Authentication
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in successfully
        const user = userCredential.user;
        console.log("User logged in:", user);

        // Store admin data in Firestore
        setDoc(doc(db, "admins", user.uid), {
          email: user.email,
          lastLogin: new Date(),
          role: "admin",
        })
          .then(() => {
            console.log("Admin data stored in Firestore");
          })
          .catch((error) => {
            console.error("Error storing admin data:", error);
          });

        // Redirect to dashboard
        window.location.href = "/staff/waiter.html";
      })
      .catch((error) => {
        // Handle errors
        console.error("Login error:", error.message);
        alert("Login failed: " + error.message);

        // Reset button
        loginButton.innerHTML =
          'Log in to Dashboard <i class="fas fa-arrow-right"></i>';
        loginButton.disabled = false;
      });
  });

  // Forgot password modal
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const modalClose = document.getElementById("modalClose");
  const resetForm = document.getElementById("resetForm");
  const modalMessage = document.getElementById("modalMessage");

  forgotPasswordLink.addEventListener("click", function (e) {
    e.preventDefault();
    forgotPasswordModal.style.display = "flex";
    setTimeout(() => {
      forgotPasswordModal.classList.add("show");
    }, 10);
  });

  function closeModal() {
    forgotPasswordModal.classList.remove("show");
    setTimeout(() => {
      forgotPasswordModal.style.display = "none";
      modalMessage.style.display = "none";
      modalMessage.className = "modal-message";
    }, 300);
  }

  modalClose.addEventListener("click", closeModal);

  window.addEventListener("click", function (e) {
    if (e.target === forgotPasswordModal) {
      closeModal();
    }
  });

  resetForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const resetButton = document.querySelector(".reset-button");
    resetButton.innerHTML =
      '<i class="fas fa-circle-notch fa-spin"></i> Sending...';
    resetButton.disabled = true;

    const email = document.getElementById("resetUsername").value; // Use email as username

    // Send password reset email
    sendPasswordResetEmail(auth, email)
      .then(() => {
        // Email sent successfully
        modalMessage.textContent =
          "Password reset link has been sent to your email address";
        modalMessage.className = "modal-message success";
      })
      .catch((error) => {
        // Handle errors
        console.error("Password reset error:", error.message);
        modalMessage.textContent = "Error: " + error.message;
        modalMessage.className = "modal-message error";
      })
      .finally(() => {
        // Reset the form
        resetForm.reset();
        resetButton.innerHTML =
          'Send Reset Link <i class="fas fa-paper-plane"></i>';
        resetButton.disabled = false;

        // Close modal after delay
        setTimeout(closeModal, 3000);
      });
  });

  // Create floating animation for dashboard preview elements
  const previewCards = document.querySelectorAll(".preview-card");
  previewCards.forEach((card, index) => {
    card.style.animation = `float ${3 + index}s ease-in-out infinite`;
    card.style.animationDelay = `${index * 0.5}s`;
  });
});

// Example login function (to be implemented in your login page)
function login(username, password) {
  // Perform authentication (e.g., via Firebase Auth)
  firebase
    .auth()
    .signInWithEmailAndPassword(username, password)
    .then((userCredential) => {
      // Set authToken cookie upon successful login
      setCookie("authToken", userCredential.user.uid, 1); // 1 day expiration
      window.location.href = "/waiter.html"; // Redirect to the waiter page
    })
    .catch((error) => {
      console.error("Login error:", error);
      alert("Login failed. Please check your credentials.");
    });
}
