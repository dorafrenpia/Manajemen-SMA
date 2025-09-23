// ======= Peminjaman.js =======
import { db } from "/js/firebase.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const tableBody = document.querySelector("#peminjamanTable tbody");
const statusEl = document.getElementById("status");
const pageInfo = document.getElementById("pageInfo");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");

const kodeFilterInput = document.getElementById("kodeFilter");
const tanggalPeminjamanInput = document.getElementById("tanggalPeminjamanFilter");
const tanggalInputFilterInput = document.getElementById("tanggalInputFilter");

// Ambil email user yang login
const currentUserEmail = localStorage.getItem("email") || "";

// 🔹 Buat teks refresh sekali saja
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
setupRefreshNote();

// 🔹 Pagination & Data
window.allData = [];
window.currentPage = 1;
const pageSize = 10;

// 🔹 Helper: ambil semua link "https://"
function extractHttpsAll(value) {
  let hasil = [];
  if (!value && value !== "") return hasil;

  if (typeof value === "string") {
    const s = value.trim();
    if (s.startsWith("https://")) hasil.push(s);
    return hasil;
  }

  if (Array.isArray(value)) {
    for (const v of value) hasil = hasil.concat(extractHttpsAll(v));
    return hasil;
  }

  if (typeof value === "object" && value !== null) {
    for (const k in value) if (Object.prototype.hasOwnProperty.call(value, k)) {
      hasil = hasil.concat(extractHttpsAll(value[k]));
    }
    return hasil;
  }

  return hasil;
}

// 🔹 Render Tabel
window.renderTable = function(data) {
  tableBody.innerHTML = "";

  if (!data || data.length === 0) {
    statusEl.textContent = "⚠️ Tidak ada data peminjaman.";
    tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">⚠️ Tidak ada data.</td></tr>`;
    return;
  }

  const start = (window.currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginated = data.slice(start, end);

  paginated.forEach((item, index) => {
    const fotoAmbilArr = extractHttpsAll(item.fotoPengambilan);
    const fotoKembaliArr = extractHttpsAll(item.fotoPengembalian);

    const fotoAmbilHTML =
      fotoAmbilArr.length > 0
        ? fotoAmbilArr.map((url, i) =>
            `<button class="foto-btn" onclick="window.open('${url}', '_blank')">📷 Lihat ${i + 1}</button>`).join(" ")
        : "Tidak ada Foto";

    const fotoKembaliHTML =
      fotoKembaliArr.length > 0
        ? fotoKembaliArr.map((url, i) =>
            `<button class="foto-btn" onclick="window.open('${url}', '_blank')">📷 Lihat ${i + 1}</button>`).join(" ")
        : "Tidak ada Foto";

    let barangText = "-";
    if (Array.isArray(item.barangDipinjam) && item.barangDipinjam.length > 0) {
      barangText = item.barangDipinjam
        .map(b => `${b.namaBarang || "-"} (${b.jumlahBarang || 0} ${b.satuanBarang || ""})`)
        .join(", ");
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${item.kodePengajuan || "-"}</td>
      <td>${item.tanggalPeminjaman || "-"}</td>
      <td>${item.namaPeminjam || "-"}</td>
      <td>${item.kelasJabatan || "-"}</td>
      <td>${barangText}</td>
      <td>${item.tipePengajuan || "-"}</td>
      <td>${item.keperluan || "-"}</td>
      <td>${fotoAmbilHTML}</td>
      <td>${fotoKembaliHTML}</td>
    `;
    tableBody.appendChild(row);
  });

  const totalPages = Math.ceil(data.length / pageSize);
  statusEl.textContent = `🟢 Menampilkan ${start + 1} - ${Math.min(end, data.length)} dari ${data.length} data`;
  pageInfo.textContent = `Halaman ${window.currentPage} / ${totalPages}`;

  prevPageBtn.disabled = window.currentPage === 1;
  nextPageBtn.disabled = window.currentPage === totalPages;
};

// 🔹 Navigasi
prevPageBtn.addEventListener("click", () => {
  if (window.currentPage > 1) {
    window.currentPage--;
    window.renderTable(window.allData);
  }
});
nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(window.allData.length / pageSize);
  if (window.currentPage < totalPages) {
    window.currentPage++;
    window.renderTable(window.allData);
  }
});

// 🔹 Fungsi bantu format tanggal "YYYY-MM-DD"
function formatTanggal(itemTanggal) {
  if (!itemTanggal) return "";
  if (itemTanggal.toDate) return itemTanggal.toDate().toISOString().slice(0, 10);
  return itemTanggal;
}

// 🔹 Filter Otomatis
function applyFilter() {
  const kode = kodeFilterInput.value.trim().toLowerCase();
  const tanggalPeminjaman = tanggalPeminjamanInput.value;
  const tanggalInput = tanggalInputFilterInput.value;

  if (!window.allData || !Array.isArray(window.allData)) return;

  const filtered = window.allData.filter(item => {
    let match = true;

    if (kode) match = match && (item.kodePengajuan || "").toLowerCase().includes(kode);
    if (tanggalPeminjaman) match = match && formatTanggal(item.tanggalPeminjaman) === tanggalPeminjaman;
    if (tanggalInput) match = match && formatTanggal(item.tanggalInput) === tanggalInput;

    return match;
  });

  window.currentPage = 1;
  window.renderTable(filtered);
}

// 🔹 Event listener filter otomatis
kodeFilterInput.addEventListener("input", applyFilter);
tanggalPeminjamanInput.addEventListener("change", applyFilter);
tanggalInputFilterInput.addEventListener("change", applyFilter);

// 🔹 Load Data Firestore
async function loadPeminjaman() {
  try {
    statusEl.textContent = "⏳ Memuat data...";

    const q = query(collection(db, "peminjaman"), where("email", "==", currentUserEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      statusEl.textContent = "❌ Tidak ada data peminjaman milik Anda.";
      tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">❌ Tidak ada data.</td></tr>`;
      return;
    }

    window.allData = querySnapshot.docs.map(doc => doc.data());
    window.currentPage = 1;
    applyFilter(); // langsung terapkan filter supaya tabel langsung tampil
  } catch (err) {
    console.error("Error load data:", err);
    statusEl.textContent = "❌ Gagal memuat data.";
  }
}

// jalankan saat halaman dibuka
loadPeminjaman();
