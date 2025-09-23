// ======= Peminjaman.js =======
import { db } from "/js/firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const tableBody = document.querySelector("#peminjamanTable tbody");
const statusEl = document.getElementById("status");

// ======= Filter Modal & Filter Data =======
const filterModal = document.getElementById("filterModal");
const openFilterBtn = document.getElementById("openFilter");
const closeFilterBtn = document.getElementById("closeFilter");
const searchInput = document.getElementById("searchInput");
const searchTanggal = document.getElementById("searchTanggal");

// simpan semua data untuk filter
let peminjamanData = [];

// helper: ambil semua nilai string dalam array/object yang diawali "https://"
function extractHttpsAll(value) {
  let hasil = [];

  if (!value && value !== "") return hasil;

  if (typeof value === "string") {
    const s = value.trim();
    if (s.startsWith("https://")) {
      hasil.push(s);
    }
    return hasil;
  }

  if (Array.isArray(value)) {
    for (const v of value) {
      hasil = hasil.concat(extractHttpsAll(v));
    }
    return hasil;
  }

  if (typeof value === "object" && value !== null) {
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        hasil = hasil.concat(extractHttpsAll(value[k]));
      }
    }
    return hasil;
  }

  return hasil;
}
function renderFilteredTable(filteredBarang) {
  tableBody.innerHTML = "";

  if (filteredBarang.length === 0) {
    statusEl.textContent = "❌ Tidak ada data yang sesuai filter.";
    return;
  }

  filteredBarang.forEach((data, index) => {
    // Ambil foto pengambilan & pengembalian
    const fotoAmbilArr = extractHttpsAll(data.fotoPengambilan);
    const fotoKembaliArr = extractHttpsAll(data.fotoPengembalian);

    const fotoAmbilHTML =
      fotoAmbilArr.length > 0
        ? fotoAmbilArr
            .map(
              (url, i) =>
                `<button class="foto-btn" onclick="window.open('${url}', '_blank')">📷 Lihat ${i + 1}</button>`
            )
            .join(" ")
        : "Tidak ada Foto";

    const fotoKembaliHTML =
      fotoKembaliArr.length > 0
        ? fotoKembaliArr
            .map(
              (url, i) =>
                `<button class="foto-btn" onclick="window.open('${url}', '_blank')">📷 Lihat ${i + 1}</button>`
            )
            .join(" ")
        : "Tidak ada Foto";

    // Barang dipinjam: tampilkan nama & jumlah terpisah
    let namaBarangText = "-";
    let jumlahBarangText = "-";
    if (Array.isArray(data.barangDipinjam) && data.barangDipinjam.length > 0) {
      namaBarangText = data.barangDipinjam
        .map(b => b.namaBarang || "-")
        .join(", ");
      jumlahBarangText = data.barangDipinjam
        .map(b => `${b.jumlahBarang || 0} ${b.satuanBarang || ""}`)
        .join(", ");
    }

    const row = document.createElement("tr");
row.innerHTML = `
  <td>${index + 1}</td>
  <td>${data.kodePengajuan || "-"}</td>
  <td>${data.namaPeminjam || "-"}</td>
  <td>${data.email || "-"}</td>
  <td>${data.kelasJabatan || "-"}</td>
  <td>${namaBarangText}</td>
  <td>${jumlahBarangText}</td>
  <td>${data.tanggalPeminjaman || "-"}</td>
  <td>${data.tipePengajuan || "-"}</td>
  <td>${data.keperluan || "-"}</td>
  <td>${fotoAmbilHTML}</td>
  <td>${fotoKembaliHTML}</td>
`;


    tableBody.appendChild(row);
  });

  statusEl.textContent = `✅ Menampilkan ${filteredBarang.length} data yang sesuai filter.`;
}
function applyFilter() {
  const keyword = searchInput.value.toLowerCase();
  const tanggal = searchTanggal.value;

  const filtered = peminjamanData.filter((item) => {
    // filter kode, nama, email
    const kodeMatch = item.kodePengajuan?.toLowerCase().includes(keyword) ?? false;
    const namaMatch = item.namaPeminjam?.toLowerCase().includes(keyword) ?? false;
    const emailMatch = item.email?.toLowerCase().includes(keyword) ?? false;

    // filter tanggal
    let tanggalMatch = true;
    if (tanggal) {
      let itemTanggal = "";
      if (item.tanggalPeminjaman) {
        if (item.tanggalPeminjaman.toDate) {
          itemTanggal = item.tanggalPeminjaman.toDate().toISOString().substring(0,10);
        } else {
          itemTanggal = item.tanggalPeminjaman.substring(0,10);
        }
      }
      tanggalMatch = itemTanggal === tanggal;
    }

    // return true jika keyword cocok di salah satu field dan tanggal cocok
    return (kodeMatch || namaMatch || emailMatch) && tanggalMatch;
  });

  renderFilteredTable(filtered);
}


// event listener modal & filter
openFilterBtn.addEventListener("click", () => {
  filterModal.style.display = "block";
});
closeFilterBtn.addEventListener("click", () => {
  filterModal.style.display = "none";
});
window.addEventListener("click", (e) => {
  if (e.target === filterModal) filterModal.style.display = "none";
});
searchInput.addEventListener("input", applyFilter);
searchTanggal.addEventListener("change", applyFilter);

// load data dari firestore
async function loadPeminjaman() {
  try {
    statusEl.textContent = "⏳ Memuat data...";

    const querySnapshot = await getDocs(collection(db, "peminjaman"));

    if (querySnapshot.empty) {
      statusEl.textContent = "❌ Tidak ada data peminjaman.";
      tableBody.innerHTML = "";
      return;
    }

    peminjamanData = []; // reset data
    querySnapshot.forEach((doc) => {
      peminjamanData.push(doc.data());
    });

    renderFilteredTable(peminjamanData); // render semua data awal
  } catch (err) {
    console.error("Error load data:", err);
    statusEl.textContent = "❌ Gagal memuat data.";
  }
}

// Jalankan saat halaman dibuka
loadPeminjaman();

// 🔹 Buat teks refresh sekali saja (selalu tampil di atas statusEl)
function setupRefreshNote() {
  let refreshContainer = document.getElementById("refresh-container");
  if (!refreshContainer) {
    refreshContainer = document.createElement("div");
    refreshContainer.id = "refresh-container";
    refreshContainer.innerHTML = `
      <span id="refresh-note">
        ⏳ Jika lebih dari 5 detik data belum muncul, tekan 
        <span class="refresh-link" onclick="location.reload()">refresh</span>
      </span>
    `;
    statusEl.parentElement.insertBefore(refreshContainer, statusEl);
  }
}

// panggil sekali saat halaman load
setupRefreshNote();
