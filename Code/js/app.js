import { auth } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

window.logout = function() {
  // Hapus status login Firebase
  localStorage.removeItem("isLoggedIn");

  // Hapus status login Google Drive
  window.accessToken = "";
  localStorage.removeItem("isDriveLoggedIn");
  localStorage.removeItem("driveAccessToken");

  const loginBtn = document.getElementById("loginBtn");
  const sendBtn = document.getElementById("sendBtn");

  if (loginBtn && window.updateLoginButton) window.updateLoginButton();
  if (sendBtn) sendBtn.disabled = true;

  // Logout Firebase
  signOut(auth).finally(() => {
    alert("✅ Berhasil logout dari aplikasi & Google Drive!");
    window.location.replace("/Login/login.html");
  });
};
