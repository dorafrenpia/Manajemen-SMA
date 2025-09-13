// drive.js
import { auth, provider } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// Variabel Drive
const FOLDER_ID = "13JY_VRcLnsLIYbQ3hlxcpu5gv12XNfpB";
const CLIENT_ID = "1008287671477-rm03r2f3e52h8c95047uk3kjqlo52atn.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient;
window.accessToken = ""; // global supaya bisa diakses di semua file


// 🔹 Fungsi update tombol login/logout
const loginBtn = document.getElementById("loginBtn");
const sendBtn = document.getElementById("sendBtn");

window.updateLoginButton = function() {
  const isLoggedInDrive = localStorage.getItem("isDriveLoggedIn") === "true";
  if (!loginBtn) return; // aman jika tombol tidak ada di halaman

  if (isLoggedInDrive) {
    loginBtn.textContent = "Logout Google Drive";
    if (sendBtn) sendBtn.disabled = false;

    loginBtn.onclick = () => {
      window.accessToken = "";
      localStorage.removeItem("isDriveLoggedIn");
      localStorage.removeItem("driveAccessToken");
      if (sendBtn) sendBtn.disabled = true;
      window.updateLoginButton();
      alert("✅ Logout Google Drive berhasil!");
    };
  } else {
    loginBtn.textContent = "Login Google Drive";
    if (sendBtn) sendBtn.disabled = true;

    loginBtn.onclick = () => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse.access_token) {
            window.accessToken = tokenResponse.access_token;
            localStorage.setItem("isDriveLoggedIn", "true");
            localStorage.setItem("driveAccessToken", window.accessToken);
            window.updateLoginButton();
            alert("✅ Login Google Drive berhasil!");
          }
        },
      });
      tokenClient.requestAccessToken();
    };
  }
};

// Ambil token dari localStorage saat halaman load
if (localStorage.getItem("isDriveLoggedIn") === "true") {
  window.accessToken = localStorage.getItem("driveAccessToken");
  if (sendBtn) sendBtn.disabled = false;
}

// Panggil update tombol
window.updateLoginButton();
