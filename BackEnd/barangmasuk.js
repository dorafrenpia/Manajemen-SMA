// 🔹 Proteksi login
if (!localStorage.getItem("isLoggedIn")) {
  window.location.replace("index.html");
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

// 🔹 Logout function
window.logout = function() {
  localStorage.removeItem("isLoggedIn");
  signOut(auth).finally(() => {
    alert("✅ Berhasil logout!");
    window.location.replace("index.html");
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
const fotoUploadInput = document.getElementById("fotoUploadInput");
const uploadFotoBtn = document.getElementById("uploadFotoBtn");

kodeInput.readOnly = true;

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

// 🔹 Upload foto terpisah via server Node.js
async function uploadFotoKeDrive(file, namaBarang = "barang") {
  try {
    const formData = new FormData();
    formData.append("foto", file);
    formData.append("namaBarang", namaBarang);

    const response = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (result.success) {
      return result.link; // link foto di Drive
    } else {
      throw new Error(result.error || "Gagal upload foto ke Drive");
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// 🔹 Tombol upload foto terpisah
uploadFotoBtn.addEventListener("click", async () => {
  const file = fotoUploadInput.files[0];
  if (!file) return alert("⚠️ Pilih foto terlebih dahulu!");

  const namaBarang = prompt("Masukkan nama barang untuk foto ini:") || "barang";
  
  try {
    const link = await uploadFotoKeDrive(file, namaBarang);
    alert(`✅ Foto berhasil diupload!\nLink Google Drive: ${link}`);

    // Simpan link ke Firestore
    const docRef = await addDoc(collection(db, "fotoBarang"), {
      namaBarang,
      fotoURL: link,
      createdAt: new Date()
    });

    alert(`✅ Link berhasil tersimpan di Firestore.\nID Dokumen: ${docRef.id}`);
  } catch (err) {
    console.error("❌ Error upload foto:", err);
    alert(`❌ Gagal upload: ${err.message}`);
  }
});

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
      createdAt: new Date()
    });

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
