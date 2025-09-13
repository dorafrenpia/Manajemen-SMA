// 🔹 Proteksi login
if (!localStorage.getItem("isLoggedIn")) {
  window.location.replace("https://manajemen-sma.web.app/Login/login.html");
}

import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, query, where 
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// 🔹 Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCAVsG_cBB_Ksbk4oqkXTH6oTlNKl-p-bU",
  authDomain: "manajemen-sma.firebaseapp.com",
  projectId: "manajemen-sma",
  storageBucket: "manajemen-sma.firebasestorage.app",
  messagingSenderId: "1008287671477",
  appId: "1:1008287671477:web:7829d82b3da953d2598afc",
  measurementId: "G-ZSFSXW3C2C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
// 🔹 Logout Firebase (aplikasi)
window.logout = function() {
  // Hapus status login Firebase
  localStorage.removeItem("isLoggedIn");

  // Hapus status login Google Drive juga
  accessToken = "";
  localStorage.removeItem("isDriveLoggedIn");
  sendBtn.disabled = true;
  updateLoginButton(); // update tombol login/logout Drive

  // Logout dari Firebase
  signOut(auth).finally(() => {
    alert("✅ Berhasil logout dari aplikasi & Google Drive!");
    window.location.replace("/Login/login.html");
  });
};


// 🔹 Elemen DOM
const statusEl = document.getElementById("status");
const kodeInput = document.getElementById("kodeBarang");
const namaInput = document.getElementById("namaBarang");
const merekInput = document.getElementById("merekInput");
const jumlahInput = document.getElementById("jumlahBarang");
const hargaInput = document.getElementById("hargaBarang");
const tanggalInput = document.getElementById("tanggalBarang");
const kategoriDropdown = document.getElementById("kategoriDropdown");
const satuanDropdown = document.getElementById("satuanDropdown");
const danaDropdown = document.getElementById("danaDropdown");
const keteranganInput = document.getElementById("keteranganInput");

kodeInput.readOnly = true;
// 🔹 Elemen DOM untuk upload foto
const fotoInput = document.getElementById("fotoInput"); // pastikan id di HTML sama
let uploadedFileId = ""; // untuk menyimpan ID file setelah upload

// 🔹 Google Drive Upload Config

const FOLDER_ID = "13JY_VRcLnsLIYbQ3hlxcpu5gv12XNfpB";
const CLIENT_ID = "1008287671477-rm03r2f3e52h8c95047uk3kjqlo52atn.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
let tokenClient;
let accessToken = "";


// 🔹 Elemen DOM
const loginBtn = document.getElementById("loginBtn");
const sendBtn = document.getElementById("sendBtn");
sendBtn.disabled = true; // default disabled sebelum login
// 🔹 Update tombol login/logout
// 🔹 Update tombol login/logout
function updateLoginButton() {
  const isLoggedInDrive = localStorage.getItem("isDriveLoggedIn") === "true";

  if (isLoggedInDrive) {
    loginBtn.textContent = "Logout Google Drive";
    sendBtn.disabled = false;

    // Tombol logout Google Drive
    loginBtn.onclick = () => {
      accessToken = "";
      localStorage.removeItem("isDriveLoggedIn");
      sendBtn.disabled = true;
      updateLoginButton();
      alert("✅ Logout Google Drive berhasil!");
    };
  } else {
    loginBtn.textContent = "Login Google Drive";
    sendBtn.disabled = true;

    // Tombol login Google Drive
    loginBtn.onclick = () => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse.access_token) {
            accessToken = tokenResponse.access_token;

            // Simpan status login dan update tombol
            localStorage.setItem("isDriveLoggedIn", "true");
            updateLoginButton();

            alert("✅ Login Google Drive berhasil!");
          }
        },
      });

      tokenClient.requestAccessToken();
    };
  }
}

// 🔹 Cek status login Google Drive saat halaman load
if (localStorage.getItem("isDriveLoggedIn") === "true") {
  sendBtn.disabled = false; // aktifkan tombol upload
}

// 🔹 Panggil update button saat halaman siap
updateLoginButton();

// 🔹 Fungsi logout global (Firebase + Google Drive)
window.logout = function() {
  // Hapus status login Firebase
  localStorage.removeItem("isLoggedIn");

  // Hapus status login Google Drive
  accessToken = "";
  localStorage.removeItem("isDriveLoggedIn");
  sendBtn.disabled = true;
  updateLoginButton(); // update tombol login/logout Drive

  // Logout dari Firebase
  signOut(auth).finally(() => {
    alert("✅ Berhasil logout dari aplikasi & Google Drive!");
    window.location.replace("/Login/login.html"); // redirect ke login
  });
};


// 🔹 Saat halaman load, cek status login
if (localStorage.getItem("isDriveLoggedIn") === "true") {
  sendBtn.disabled = false; // aktifkan tombol upload
}

// 🔹 Panggil update button saat halaman siap
updateLoginButton();
// 🔹 Tunggu sampai halaman & DOM siap
loginBtn.onclick = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      if(tokenResponse.access_token){
        accessToken = tokenResponse.access_token;
        sendBtn.disabled = false;
        localStorage.setItem("isDriveLoggedIn", "true"); // simpan status login
        updateLoginButton();
        alert("Login Google Drive berhasil!");
      }
    },
  });
  tokenClient.requestAccessToken();
};

sendBtn.onclick = async () => {
  const file = fotoInput.files[0];
  if (!file) return alert("Pilih file dulu");
  if (!window.accessToken) return alert("Login Google Drive dulu!");

  const metadata = {
    name: file.name,
    parents: [FOLDER_ID]
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);

  try {
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: { Authorization: "Bearer " + window.accessToken },
        body: form
      }
    );
    const result = await response.json();
    if (result.id) {
      uploadedFileId = result.id;
      alert("✅ Berhasil upload foto! ID file: " + uploadedFileId);
    } else {
      alert("❌ Gagal upload: " + JSON.stringify(result));
    }
  } catch (err) {
    alert("❌ Terjadi error: " + err);
  }
};


// 🔹 Generate kode unik berdasarkan kategori & tanggal
async function generateKodeBarang() {
  const kategori = kategoriDropdown.value;
  const tanggal = tanggalInput.value;
  if (!kategori || !tanggal) { kodeInput.value = ""; return; }

  const tanggalStr = tanggal.replace(/-/g, ""); // YYYYMMDD
  const q = query(
    collection(db, "barangMasuk"),
    where("kategori", "==", kategori),
    where("tanggalBarang", "==", tanggal)
  );
  const snapshot = await getDocs(q);
  const urutan = snapshot.size + 1;
  kodeInput.value = `${kategori.toUpperCase()}-${tanggalStr}-${urutan}`;
}

// 🔹 Cek koneksi Firestore
async function cekKoneksi() {
  try {
    await getDocs(collection(db, "barangMasuk"));
    statusEl.textContent = "🟢 Terhubung ke Database!";
  } catch (err) {
    console.error("❌ Gagal koneksi:", err);
    statusEl.textContent = `❌ Gagal koneksi Database: ${err.message}`;
  }
}
cekKoneksi();

// 🔹 Load dropdown
async function loadDropdown(namaField, dropdownEl) {
  dropdownEl.innerHTML = `<option value="">-- Pilih ${namaField} --</option>`;
  const snapshot = await getDocs(collection(db, namaField));
  snapshot.forEach(doc => {
    const value = doc.data().nama;
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    dropdownEl.appendChild(opt);
  });
  const tambahOpt = document.createElement("option");
  tambahOpt.value = "__tambah__";
  tambahOpt.textContent = `➕ Tambah ${namaField.toLowerCase()} baru...`;
  dropdownEl.appendChild(tambahOpt);
}

// 🔹 Handle tambah baru dropdown
async function handleDropdownChange(e, namaField) {
  if (e.target.value === "__tambah__") {
    const namaBaru = prompt(`Masukkan ${namaField} baru:`)?.trim();
    if (!namaBaru) { e.target.value = ""; return; }

    const q = query(collection(db, namaField), where("nama", "==", namaBaru));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      alert(`⚠️ ${namaField} sudah ada!`);
      e.target.value = "";
      return;
    }

    await addDoc(collection(db, namaField), { nama: namaBaru });
    await loadDropdown(namaField, e.target);
    e.target.value = namaBaru;
  }

  if (namaField === "kategori") await generateKodeBarang();
}

// 🔹 Event listener dropdown & tanggal
kategoriDropdown.addEventListener("change", e => handleDropdownChange(e, "kategori"));
satuanDropdown.addEventListener("change", e => handleDropdownChange(e, "satuan"));
danaDropdown.addEventListener("change", e => handleDropdownChange(e, "jenisDana"));
tanggalInput.addEventListener("change", generateKodeBarang);

// 🔹 Format Rupiah untuk harga
function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
}
hargaInput.addEventListener("input", e => {
  let value = e.target.value.replace(/\D/g, "");
  e.target.value = value ? formatRupiah(value) : "";
});

// 🔹 Submit form utama
document.getElementById("barangForm").addEventListener("submit", async e => {
  e.preventDefault();

  const kodeBarang = kodeInput.value.trim();
  const namaBarang = namaInput.value.trim();
  const merekValue = merekInput.value.trim();
  const jumlahBarang = parseInt(jumlahInput.value);
  const tanggalBarang = tanggalInput.value;
  const hargaBarang = parseInt(hargaInput.value.replace(/\D/g, ""));
  const kategori = kategoriDropdown.value;
  const satuan = satuanDropdown.value;
  const jenisDana = danaDropdown.value;
  const keterangan = keteranganInput.value.trim();

  if (!kodeBarang || !namaBarang || !merekValue || !tanggalBarang || !kategori || !satuan || !jenisDana || isNaN(jumlahBarang) || isNaN(hargaBarang)) {
    statusEl.textContent = "❌ Semua field harus diisi dengan benar!";
    return;
  }

  try {
   await addDoc(collection(db, "barangMasuk"), {
  kodeBarang,
  namaBarang,
  merek: merekValue,
  jumlahBarang,
  tanggalBarang,
  hargaBarang,
  kategori,
  satuan,
  jenisDana,
  keterangan,
  fotoId: uploadedFileId, // ID file dari Google Drive
  createdAt: new Date()
});
uploadedFileId = ""; // reset setelah submit


    statusEl.textContent = `🟢 Data tersimpan! Kode: ${kodeBarang}`;
    document.getElementById("barangForm").reset();
    kodeInput.value = "";
  } catch (err) {
    console.error("❌ Error menyimpan data:", err);
    statusEl.textContent = `❌ Gagal menyimpan: ${err.message}`;
  }
});

// 🔹 Load awal dropdown
loadDropdown("kategori", kategoriDropdown);
loadDropdown("satuan", satuanDropdown);
loadDropdown("jenisDana", danaDropdown);
