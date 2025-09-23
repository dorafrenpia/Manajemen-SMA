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
      // 🔹 1) Cek DEV_Users (IT/Admin) dulu (tetap seperti sebelumnya)
      const devUsersRef = collection(db, "DEV_Users");
      const qDev = query(devUsersRef, where("nama", "==", email));
      const snapDev = await getDocs(qDev);

      if (!snapDev.empty) {
        const devData = snapDev.docs[0].data();
        if (devData.password === password) {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", devData.role);
          // jangan set nomor untuk DEV jika tidak ada
          if (devData.role.toLowerCase() === "admin") {
            showPopup("Login admin berhasil! Mengarahkan ke dashboard...", "success", 2000);
            setTimeout(() => { window.location.href = "/Main/dashboard_admin.html"; }, 2000);
          } else if (devData.role.toLowerCase() === "it") {
            showPopup("Login IT berhasil! Mengarahkan ke halaman IT...", "success", 2000);
            setTimeout(() => { window.location.href = "/IT/IT.html"; }, 2000);
          } else {
            showPopup("Role DEV tidak dikenali!", "error");
          }
          return;
        } else {
          showPopup("Nama atau password salah!", "error");
          return;
        }
      }

      // 🔹 2) Cek Firebase Auth untuk semua role selain DEV
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          showPopup("Email belum diverifikasi! Cek inbox/spam.", "error");
          return;
        }

        // Helper: simpan login dasar
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("email", email);

        // 🔹 3) Cek koleksi DataOrganisasi
        const orgRef = collection(db, "DataOrganisasi");
        const qOrg = query(orgRef, where("email", "==", email));
        const snapOrg = await getDocs(qOrg);

        if (!snapOrg.empty) {
          const orgData = snapOrg.docs[0].data();
          localStorage.setItem("role", "organisasi");

          // simpan nomor hanya kalau ada isian
          if (orgData.nomorOrg !== undefined && orgData.nomorOrg !== null && String(orgData.nomorOrg).trim() !== "") {
            localStorage.setItem("nomor", String(orgData.nomorOrg).trim());
          } else {
            // jika tidak ada, hapus key nomor agar tidak tersisa dari login sebelumnya
            localStorage.removeItem("nomor");
            showPopup("Nomor organisasi belum terdaftar. Lengkapi profil Anda.", "warning", 3500);
          }

          showPopup("Login berhasil! Mengarahkan ke dashboard Organisasi...", "success", 1200);
          setTimeout(() => { window.location.href = "/Main/dashboard_organisasi.html"; }, 1200);
          return;
        }

        // 🔹 4) Cek koleksi DataGuru
        const guruRef = collection(db, "DataGuru");
        const qGuru = query(guruRef, where("email", "==", email));
        const snapGuru = await getDocs(qGuru);

        if (!snapGuru.empty) {
          const guruData = snapGuru.docs[0].data();
          localStorage.setItem("role", "guru");

          if (guruData.nomor !== undefined && guruData.nomor !== null && String(guruData.nomor).trim() !== "") {
            localStorage.setItem("nomor", String(guruData.nomor).trim());
          } else {
            localStorage.removeItem("nomor");
            showPopup("Nomor guru belum terdaftar. Lengkapi profil Anda.", "warning", 3500);
          }

          showPopup("Login berhasil! Mengarahkan ke dashboard Guru...", "success", 1200);
          setTimeout(() => { window.location.href = "/Main/dashboard_guru.html"; }, 1200);
          return;
        }

        // 🔹 5) Cek koleksi users (user biasa)
        const userRef = collection(db, "users");
        const qUser = query(userRef, where("email", "==", email));
        const snapUser = await getDocs(qUser);

        if (!snapUser.empty) {
          const userData = snapUser.docs[0].data();
          localStorage.setItem("role", "user");

          if (userData.nisn !== undefined && userData.nisn !== null && String(userData.nisn).trim() !== "") {
            localStorage.setItem("nomor", String(userData.nisn).trim());
          } else {
            localStorage.removeItem("nomor");
            showPopup("NISN belum terdaftar. Lengkapi profil Anda.", "warning", 3500);
          }

          showPopup("Login berhasil! Mengarahkan ke dashboard...", "success", 1200);
          setTimeout(() => { window.location.href = "/Pengajuan/Dashboard_Users.html"; }, 1200);
          return;
        }

        // 🔹 6) Jika tidak ditemukan di ketiga koleksi (tetap treat as user tanpa nomor)
        localStorage.setItem("role", "user");
        localStorage.removeItem("nomor");
        showPopup("Login berhasil! (profil belum lengkap). Mengarahkan ke dashboard...", "success", 1200);
        setTimeout(() => { window.location.href = "/Pengajuan/Dashboard_Users.html"; }, 1200);

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
