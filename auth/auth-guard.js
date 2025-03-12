import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

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

// Check authentication state when the page loads
document.addEventListener("DOMContentLoaded", function () {
  // Show loading state while checking authentication
  const contentContainer = document.getElementById("content") || document.body;
  const loadingElement = document.createElement("div");
  loadingElement.id = "auth-loading";
  loadingElement.innerHTML =
    '<div class="spinner"></div><p>Verifying access...</p>';
  loadingElement.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255,255,255,0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999;";

  // Add spinner style
  const style = document.createElement("style");
  style.textContent = `
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  contentContainer.appendChild(loadingElement);

  // Check if user is authenticated
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, hide loading screen
      const loadingScreen = document.getElementById("auth-loading");
      if (loadingScreen) {
        loadingScreen.style.display = "none";
      }
      console.log("User is authenticated:", user.email);
    } else {
      // User is not signed in, redirect to login page
      console.log("User is not authenticated, redirecting to login page");
      window.location.href = "/login.html";
    }
  });
});
