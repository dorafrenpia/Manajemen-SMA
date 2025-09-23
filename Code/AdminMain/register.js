import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// 🔹 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCAVsG_cBB_Ksbk4oqkXTH6oTlNKl-p-bU",
  authDomain: "manajemen-sma.firebaseapp.com",
  projectId: "manajemen-sma",
  storageBucket: "manajemen-sma.appspot.com",
  messagingSenderId: "1008287671477",
  appId: "1:1008287671477:web:7829d82b3da953d2598afc",
  measurementId: "G-ZSFSXW3C2C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔹 Proteksi akses IT
const loggedInRole = localStorage.getItem("role"); // set saat login
if (!loggedInRole || loggedInRole !== "IT") {
  alert("❌ Hanya IT yang bisa mengakses halaman ini!");
  window.location.href = "/Login/login.html"; // redirect ke login
}

// 🔹 Elemen HTML
const namaInput = document.getElementById("nama");
const passwordInput = document.getElementById("password");
const roleSelect = document.getElementById("role");
const registerBtn = document.getElementById("registerBtn");
const popup = document.getElementById("popup");
const debug = document.getElementById("debug");

// 🔹 Fungsi popup
function showPopup(msg, type="info", duration=3000) {
  popup.textContent = msg;
  popup.className = "popup show " + type;
  setTimeout(() => { popup.className = "popup"; }, duration);
}

// 🔹 Fungsi debug
//function showDebug(msg) {
  //const p = document.createElement("p");
  //p.textContent = msg;
  //debug.appendChild(p);
//}

// 🔹 Event klik register
registerBtn.addEventListener("click", async () => {
  const nama = namaInput.value.trim();
  const password = passwordInput.value;
  const role = roleSelect.value;

  if (!nama || !password) {
    showPopup("Nama dan password wajib diisi!", "error");
   // showDebug("❌ Nama atau password kosong");
    return;
  }

  try {
    // cek apakah nama sudah ada
    const usersRef = collection(db, "DEV_Users");
    const q = query(usersRef, where("nama", "==", nama));
    const snap = await getDocs(q);

    if (!snap.empty) {
      showPopup("Nama sudah digunakan!", "error");
      //showDebug(`❌ Gagal membuat akun: ${nama} sudah ada`);
      return;
    }

    // simpan ke Firestore
    const docRef = await addDoc(usersRef, {
      nama,
      password,   // disimpan apa adanya
      role,
      createdAt: new Date()
    });

    showPopup(`Akun ${role} berhasil dibuat!`, "success");
    //showDebug(`✅ Akun berhasil dibuat: ID=${docRef.id}, Nama=${nama}, Role=${role}`);

    // reset input
    namaInput.value = "";
    passwordInput.value = "";

  } catch(err) {
    showPopup("Error: " + err.message, "error");
    //showDebug(`❌ Error: ${err.message}`);
  }
});
