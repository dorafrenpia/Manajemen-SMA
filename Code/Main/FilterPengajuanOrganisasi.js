import { db } from "/js/firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const tableBody = document.querySelector("#peminjamanTable tbody");
const statusEl = document.getElementById("status");
const prevBtn = document.getElementById("prevPageBtn");
const nextBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

// ======= Filter Modal & Filter Data =======
const filterModal = document.getElementById("filterModal");
const openFilterBtn = document.getElementById("openFilter");
const closeFilterBtn = document.getElementById("closeFilter");
const searchInput = document.getElementById("searchInput");
const searchTanggal = document.getElementById("searchTanggal");

// semua row dan allItems
let allRows = [];
let allItems = [];
let currentPage = 1;
const rowsPerPage = 10;

// helper untuk gabung nama & jumlah barang
function extractBarangText(barangArr) {
  if (!Array.isArray(barangArr) || barangArr.length === 0) return ["-", "-"];
  const namaBarang = barangArr.map(b => b.namaBarang || "-").join(", ");
  const jumlahBarang = barangArr.map(b => b.jumlahBarang || 0).join(", ");
  return [namaBarang, jumlahBarang];
}

// ===== Render tabel =====
function renderTable(dataItems) {
  tableBody.innerHTML = "";

  const totalPages = Math.ceil(dataItems.length / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = dataItems.slice(start, end);

  pageData.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${item.kodePengajuan || "-"}</td>
      <td>${item.email || "-"}</td>
      <td>${item.nomorOrganisasi || "-"}</td>
      <td>${item.namaBarang || "-"}</td>
      <td>${item.jumlahBarang || 0}</td>
      <td>${item.hargaSatuan || 0}</td>
      <td>${item.totalHarga || 0}</td>
      <td>${item.catatanDivisi || "-"}</td>
      <td>${item.totalKeseluruhan || 0}</td>
      <td>${item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate().toLocaleString() : item.createdAt) : "-"}</td>
      <td>${item.status || ""}</td>
      <td>${item.cekSapras || ""}</td>
      <td>${item.kategori || ""}</td>
      <td>${item.pic || ""}</td>
      <td>${item.catatan || ""}</td>
      <td><button class="openEditorBtn" data-id="${item.parentId}" data-index="${item.indexInParent}">Open</button></td>
    `;
    tableBody.appendChild(tr);
  });

  pageInfo.textContent = `Halaman ${currentPage} / ${totalPages || 1}`;
}

// ===== Pagination =====
prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable(allItems);
  }
});
nextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(allItems.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable(allItems);
  }
});

// ===== Load data Firestore =====
async function loadPengajuan() {
  try {
    statusEl.textContent = "⏳ Memuat data...";

    const querySnapshot = await getDocs(collection(db, "DataPengajuanOrganisasi"));
    if (querySnapshot.empty) {
      statusEl.textContent = "❌ Tidak ada data pengajuan.";
      tableBody.innerHTML = "";
      return;
    }

    allRows = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (Array.isArray(data.barang) && data.barang.length > 0) {
        allRows.push({
          id: docSnap.id,
          kodePengajuan: data.kodePengajuan || "",
          email: data.email || "",
          nomorOrganisasi: data.nomorOrganisasi || "",
          totalKeseluruhan: data.totalKeseluruhan || 0,
          createdAt: data.createdAt || null,
          barang: data.barang
        });
      }
    });

    // flatten barang jadi allItems
    allItems = [];
    allRows.forEach(row => {
      row.barang.forEach((item, idx) => {
        allItems.push({
          ...item,
          kodePengajuan: row.kodePengajuan,
          email: row.email,
          nomorOrganisasi: row.nomorOrganisasi,
          totalKeseluruhan: row.totalKeseluruhan,
          createdAt: row.createdAt,
          parentId: row.id,
          indexInParent: idx
        });
      });
    });

    renderTable(allItems);
    statusEl.textContent = `✅ ${allItems.length} item ditemukan.`;
  } catch (err) {
    console.error("Error load data:", err);
    statusEl.textContent = "❌ Gagal memuat data.";
  }
}

// ===== Filter =====
function applyFilter() {
  const keyword = searchInput.value.toLowerCase();
  const tanggal = searchTanggal.value;

  const filtered = allItems.filter(item => {
    const kodeMatch = item.kodePengajuan?.toLowerCase().includes(keyword) ?? false;
    const emailMatch = item.email?.toLowerCase().includes(keyword) ?? false;
    const namaBarangMatch = (item.namaBarang || "").toLowerCase().includes(keyword);

    let tanggalMatch = true;
    if (tanggal) {
      let itemTanggal = "";
      if (item.createdAt) {
        if (item.createdAt.toDate) itemTanggal = item.createdAt.toDate().toISOString().substring(0,10);
        else itemTanggal = item.createdAt.substring(0,10);
      }
      tanggalMatch = itemTanggal === tanggal;
    }

    return (kodeMatch || emailMatch || namaBarangMatch) && tanggalMatch;
  });

  currentPage = 1;
  renderTable(filtered);
}

// event modal & filter
openFilterBtn.addEventListener("click", () => filterModal.style.display = "block");
closeFilterBtn.addEventListener("click", () => filterModal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === filterModal) filterModal.style.display = "none"; });
searchInput.addEventListener("input", applyFilter);
searchTanggal.addEventListener("change", applyFilter);

// jalankan saat halaman dibuka
loadPengajuan();

// setup teks refresh
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
