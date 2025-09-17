// login.js
import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("nama"); // tetap id 'nama'
  const passwordInput = document.getElementById("password");
  const popup = document.getElementById("popup");

  function showPopup(msg, type = "info", duration = 3000) {
    popup.textContent = msg;
    popup.className = "popup show " + type;
    setTimeout(() => { popup.className = "popup"; }, duration);
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showPopup("Email dan password wajib diisi!", "error");
      return;
    }

    try {
      // 🔹 Cek DEV_Users (IT/Admin)
      const devUsersRef = collection(db, "DEV_Users");
      const qDev = query(devUsersRef, where("nama", "==", email));
      const snapDev = await getDocs(qDev);

      if (!snapDev.empty) {
        const devData = snapDev.docs[0].data();
        if (devData.password === password) {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", devData.role);

          if (devData.role.toLowerCase() === "admin") {
            showPopup("Login admin berhasil! Mengarahkan ke dashboard...", "success", 2000);
            setTimeout(() => { window.location.href = "/Main/dashboard_admin.html"; }, 2000);
          } else if (devData.role.toLowerCase() === "it") {
            showPopup("Login IT berhasil! Mengarahkan ke halaman IT...", "success", 2000);
            setTimeout(() => { window.location.href = "/IT/IT.html"; }, 2000);
          } else {
            showPopup("Role tidak dikenali!", "error");
          }
          return;
        } else {
          showPopup("Nama atau password salah!", "error");
          return;
        }
      }

      // 🔹 Cek Firebase Auth untuk semua role selain DEV
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          showPopup("Email belum diverifikasi! Cek inbox/spam.", "error");
          return;
        }

        // 🔹 Ambil role dari Firestore (Organisasi atau Guru)
        const orgRef = collection(db, "DataOrganisasi");
        const qOrg = query(orgRef, where("email", "==", email));
        const snapOrg = await getDocs(qOrg);

        if (!snapOrg.empty) {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", "organisasi");
          showPopup("Login berhasil! Mengarahkan ke dashboard Organisasi...", "success", 2000);
          setTimeout(() => { window.location.href = "/Main/dashboard_organisasi.html"; }, 2000);
          return;
        }

        const guruRef = collection(db, "DataGuru");
        const qGuru = query(guruRef, where("email", "==", email));
        const snapGuru = await getDocs(qGuru);

        if (!snapGuru.empty) {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", "guru");
          showPopup("Login berhasil! Mengarahkan ke dashboard Guru...", "success", 2000);
          setTimeout(() => { window.location.href = "/Main/dashboard_guru.html"; }, 2000);
          return;
        }

        // 🔹 Kalau bukan DEV, Organisasi, maupun Guru → user biasa
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", "user");
        showPopup("Login berhasil! Mengarahkan ke dashboard...", "success", 2000);
        setTimeout(() => { window.location.href = "/Pengajuan/Dashboard_Users.html"; }, 2000);

      } catch (authErr) {
        console.log("❌ Login Firebase gagal:", authErr);
        showPopup("Email atau password salah!", "error");
      }

    } catch (err) {
      console.error("❌ ERROR login:", err);
      showPopup("Terjadi kesalahan saat login!", "error");
    }
  });
});
