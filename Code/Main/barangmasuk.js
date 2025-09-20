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

const jumlahInput = document.getElementById("jumlahBarang");

const tanggalInput = document.getElementById("tanggalBarang");
const kategoriDropdown = document.getElementById("kategoriDropdown");
const satuanDropdown = document.getElementById("satuanDropdown");
const danaDropdown = document.getElementById("danaDropdown");
const merekInput = document.getElementById("merekInput");


const keteranganInput = document.getElementById("keteranganInput");
kodeInput.readOnly = true;

// 🔹 Elemen DOM
const fotoInput = document.getElementById("fotoInput");
const previewImage = document.getElementById("previewImage");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");

let uploadedFileIds = [];   // untuk menyimpan banyak ID file
let uploadedFileLinks = []; // untuk menyimpan banyak link file
fotoInput.addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImage.src = e.target.result;
      previewImage.style.display = "block";

      // ✅ update status jumlah foto
      updateUploadCount(1);
    };
    reader.readAsDataURL(file);
  } else {
    previewImage.src = "";
    previewImage.style.display = "none";

    // ✅ kembali ke status awal
    updateUploadCount(0);
  }
});

// 🔹 Klik gambar kecil → tampilkan modal
previewImage.addEventListener("click", function() {
  if (previewImage.src) {
    modalImage.src = previewImage.src;
    imageModal.style.display = "flex";
  }
});

// 🔹 Klik di luar gambar → tutup modal
imageModal.addEventListener("click", function(e) {
  if (e.target === imageModal) {
    imageModal.style.display = "none";
  }
});


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


// UPLOAD
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
      const fileLink = `https://drive.google.com/file/d/${result.id}/view?usp=sharing`;

      // Simpan ke array
      uploadedFileIds.push(result.id);
      uploadedFileLinks.push(fileLink);

      // Simpan juga ke localStorage biar aman
      localStorage.setItem("uploadedFileIds", JSON.stringify(uploadedFileIds));
      localStorage.setItem("uploadedFileLinks", JSON.stringify(uploadedFileLinks));

      // ✅ Update jumlah upload setelah berhasil
      updateUploadCount(uploadedFileIds.length);

      alert("✅ Berhasil upload foto! \nLink: " + fileLink);
    } else {
      alert("❌ Gagal upload: " + JSON.stringify(result));
    }
  } catch (err) {
    alert("❌ Terjadi error: " + err);
  }
};

// Generate kode
async function generateKodeBarang() {
  const kategori = kategoriDropdown.value;
  const jenisDana = danaDropdown.value;  // ambil dari danaDropdown
  const tanggal = tanggalInput.value;

  if (!kategori || !tanggal || !jenisDana) {
    kodeInput.value = "";
    return;
  }

  // ambil huruf pertama + terakhir dari jenis dana
  const jdUpper = (jenisDana.charAt(0) + jenisDana.charAt(jenisDana.length - 1)).toUpperCase();
  const tanggalStr = tanggal.replace(/-/g, "");

  // Query Firestore
  const q = query(
    collection(db, "barangMasuk"),
    where("kategori", "==", kategori),
    where("tanggalBarang", "==", tanggal)
  );
  const snapshot = await getDocs(q);
  const urutan = snapshot.size + 1;

  // Set hasil
  kodeInput.value = `${kategori.toUpperCase()}-${jdUpper}-${tanggalStr}-${urutan}`;
}

// Pasang event listener
kategoriDropdown.addEventListener("change", generateKodeBarang);
danaDropdown.addEventListener("change", generateKodeBarang);
tanggalInput.addEventListener("change", generateKodeBarang);

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
function updateUploadCount() {
  const uploadInfo = document.getElementById("uploadInfo");
  if (uploadedFileLinks.length > 0) {
    uploadInfo.textContent = `📷 ${uploadedFileLinks.length} foto sudah diupload`;
  } else {
    uploadInfo.textContent = "📷 Belum ada foto diupload";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");

  document.getElementById("barangForm").addEventListener("submit", async e => {
    e.preventDefault();

    const kodeBarang = kodeInput.value.trim();
    const namaBarang = namaInput.value.trim();
    const merekValue = merekInput.value.trim();
    const jumlahBarang = parseInt(jumlahInput.value);
    const tanggalBarang = tanggalInput.value;

    const kategori = kategoriDropdown.value;
    const satuan = satuanDropdown.value;
    const jenisDana = danaDropdown.value;
    const keterangan = keteranganInput.value.trim();

    // 🔎 Validasi field wajib
    if (!kodeBarang || !namaBarang || !merekValue || !tanggalBarang || !kategori || !satuan || !jenisDana || isNaN(jumlahBarang)) {
      statusEl.textContent = "❌ Semua field harus diisi dengan benar!";
      return;
    }

    try {
      // 🔎 Cek apakah namaBarang sudah ada di Firestore
      const q = query(
        collection(db, "barangMasuk"),
        where("namaBarang", "==", namaBarang)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        statusEl.textContent = `⚠️ Barang "${namaBarang}" sudah ada di database!`;
        return; // hentikan proses save
      }

      // ✅ Kalau belum ada → simpan data baru
      await addDoc(collection(db, "barangMasuk"), {
        kodeBarang,
        namaBarang,
        merek: merekValue,
        jumlahBarang,
        tanggalBarang,
        kategori,
        satuan,
        jenisDana,
        keterangan,
        fotoIds: uploadedFileIds,
        fotoLinks: uploadedFileLinks,
        createdAt: new Date()
      });

      // reset data foto
      uploadedFileIds = [];
      uploadedFileLinks = [];
      localStorage.removeItem("uploadedFileIds");
      localStorage.removeItem("uploadedFileLinks");
      updateUploadCount();

      // status sementara
      statusEl.textContent = `🟢 Data tersimpan! Kode: ${kodeBarang}`;

      // update status koneksi setelah 3 detik
      setTimeout(() => {
        cekKoneksi();
      }, 3000);

      // tampilkan popup
      showPopup(`🟢 Data tersimpan! Kode: ${kodeBarang}`);

      // reset form
      document.getElementById("barangForm").reset();
      kodeInput.value = "";
    } catch (err) {
      console.error("❌ Error menyimpan data:", err);
      statusEl.textContent = `❌ Gagal menyimpan: ${err.message}`;
    }
  });

  // fungsi popup
  function showPopup(message) {
    const popup = document.getElementById("popup");
    popup.textContent = message;
    popup.classList.add("show");
    setTimeout(() => popup.classList.remove("show"), 3000);
  }
});



// 🔹 Load awal dropdown
loadDropdown("kategori", kategoriDropdown);
loadDropdown("satuan", satuanDropdown);


loadDropdown("jenisDana", danaDropdown);
