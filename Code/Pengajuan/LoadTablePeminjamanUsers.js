// ======= Peminjaman.js =======
import { db } from "/js/firebase.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const tableBody = document.querySelector("#peminjamanTable tbody");
const statusEl = document.getElementById("status");
const pageInfo = document.getElementById("pageInfo");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");

// Ambil email user yang login
const currentUserEmail = localStorage.getItem("email") || "";
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
// Variabel pagination
let allData = [];
let currentPage = 1;
const pageSize = 10; // jumlah data per halaman

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

// 🔹 Render tabel dengan pagination
function renderTable(data) {
  tableBody.innerHTML = "";

  if (data.length === 0) {
    statusEl.textContent = "⚠️ Tidak ada data peminjaman.";
    return;
  }

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginated = data.slice(start, end);

  paginated.forEach((item, index) => {
    const fotoAmbilArr = extractHttpsAll(item.fotoPengambilan);
    const fotoKembaliArr = extractHttpsAll(item.fotoPengembalian);

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

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${item.tanggalPeminjaman || "-"}</td>
      <td>${item.namaPeminjam || "-"}</td>
      <td>${item.kelasJabatan || "-"}</td>
      <td>${item.namaBarang || "-"}</td>
      <td>${item.jumlahBarang || "-"}</td>
      <td>${item.keperluan || "-"}</td>
      <td>${fotoAmbilHTML}</td>
      <td>${fotoKembaliHTML}</td>
    `;
    tableBody.appendChild(row);
  });

  // update status & page info
  const totalPages = Math.ceil(data.length / pageSize);
  statusEl.textContent = `🟢 Menampilkan ${start + 1} - ${Math.min(end, data.length)} dari ${data.length} data`;
  pageInfo.textContent = `Halaman ${currentPage} / ${totalPages}`;

  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

// 🔹 Navigasi
prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable(allData);
  }
});
nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(allData.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable(allData);
  }
});

// 🔹 Load data dari Firestore
async function loadPeminjaman() {
  try {
    statusEl.textContent = "⏳ Memuat data...";

    const q = query(collection(db, "peminjaman"), where("email", "==", currentUserEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      statusEl.textContent = "❌ Tidak ada data peminjaman milik Anda.";
      tableBody.innerHTML = "";
      return;
    }

    allData = querySnapshot.docs.map(doc => doc.data());
    currentPage = 1; // reset ke halaman pertama
    renderTable(allData);
  } catch (err) {
    console.error("Error load data:", err);
    statusEl.textContent = "❌ Gagal memuat data.";
  }
}

// Jalankan saat halaman dibuka
loadPeminjaman();
