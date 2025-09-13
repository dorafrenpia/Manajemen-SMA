// login.js
import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const namaInput = document.getElementById("nama");
  const passwordInput = document.getElementById("password");
  const popup = document.getElementById("popup");

  // Fungsi popup
  function showPopup(msg, type = "info", duration = 3000) {
    popup.textContent = msg;
    popup.className = "popup show " + type;
    setTimeout(() => { popup.className = "popup"; }, duration);
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nama = namaInput.value.trim();
    const password = passwordInput.value;

    if (!nama || !password) {
      showPopup("Nama dan password wajib diisi!", "error");
      return;
    }

    try {
      // 🔹 Cek apakah admin (hardcode)
      if (nama === "admin" && password === "admin") {
          localStorage.setItem("isLoggedIn", "true");  // ← tambahkan ini
        showPopup("Login admin berhasil! Mengarahkan ke dashboard...", "success", 2000);
        setTimeout(() => {
          window.location.href = "/Main/dashboard_admin.html";
        }, 2000);
        return;
      }

      // 🔹 Cari email berdasarkan nama di Firestore untuk user biasa
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("nama", "==", nama));
      const snap = await getDocs(q);

      if (snap.empty) {
        showPopup("Nama atau password salah!", "error");
        return;
      }

      const userData = snap.docs[0].data();
      const email = userData.email;

      // 🔹 Sign in pakai email & password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔹 Cek emailVerified
      if (!user.emailVerified) {
        showPopup("Email belum diverifikasi! Cek inbox/spam.", "error");
        return;
      }

      // 🔹 Login sukses → redirect ke dashboard_user.html
      showPopup("Login berhasil! Mengarahkan ke dashboard...", "success", 2000);
      setTimeout(() => {
        window.location.href = "/Main/dashboard_user.html";
      }, 2000);

    } catch (err) {
      console.error("❌ ERROR login:", err);
      showPopup("Nama atau password salah!", "error");
    }
  });
});
