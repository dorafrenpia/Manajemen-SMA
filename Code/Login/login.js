// login.js
import { db } from "./firebase.js";
import { collection, query, where, getDocs } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const namaInput = document.getElementById("nama");
  const passwordInput = document.getElementById("password");
  const popup = document.getElementById("popup");

  // 🔹 Fungsi popup
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
      // 🔹 Cek IT/Admin dari DEV_Users
      const devUsersRef = collection(db, "DEV_Users");
      const qDev = query(devUsersRef, where("nama", "==", nama));
      const snapDev = await getDocs(qDev);

      if (!snapDev.empty) {
        const devData = snapDev.docs[0].data();
        if (devData.password === password) {
          // 🔹 Simpan login & role
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", devData.role);

          if (devData.role.toLowerCase() === "admin") {
            showPopup("Login admin berhasil! Mengarahkan ke dashboard...", "success", 2000);
            setTimeout(() => {
              window.location.href = "/Main/dashboard_admin.html";
            }, 2000);
          } else if (devData.role.toLowerCase() === "it") {
            showPopup("Login IT berhasil! Mengarahkan ke halaman IT...", "success", 2000);
            setTimeout(() => {
              window.location.href = "/IT/IT.html";
            }, 2000);
          } else {
            showPopup("Role tidak dikenali!", "error");
          }
          return; // hentikan proses
        } else {
          showPopup("Nama atau password salah!", "error");
          return;
        }
      }

      // 🔹 Cek user biasa di collection 'users'
      const usersRef = collection(db, "users");
      const qUser = query(usersRef, where("nama", "==", nama));
      const snapUser = await getDocs(qUser);

      if (snapUser.empty) {
        showPopup("Nama atau password salah!", "error");
        return;
      }

      const userData = snapUser.docs[0].data();
      if (userData.password !== password) {
        showPopup("Nama atau password salah!", "error");
        return;
      }

      // 🔹 Simpan login & role user
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("role", "user");

      showPopup("Login user berhasil! Mengarahkan ke dashboard...", "success", 2000);
      setTimeout(() => {
        window.location.href = "/Main/dashboard_user.html";
      }, 2000);

    } catch (err) {
      console.error("❌ ERROR login:", err);
      showPopup("Terjadi kesalahan saat login!", "error");
    }
  });
});
