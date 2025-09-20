import { db } from "/js/firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// ======================
// 🔹 STATE GLOBAL
// ======================
let allBarang = [];      // Semua data barang
let filteredBarang = []; // Data hasil filter search
let currentPage = 1;
const pageSize = 10;

// ======================
// 🔹 LOAD DATA DARI FIRESTORE
// ======================
async function loadBarangMasuk() {
  const tableBody = document.querySelector("#barangMasukTable tbody");

  // Loading awal di tabel
  tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">⏳ Memuat data...</td></tr>';

  try {
    const barangMasukRef = collection(db, "barangMasuk");
    const q = query(barangMasukRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tidak ada data</td></tr>';
      return;
    }

    // Ambil semua data
    allBarang = [];
    snapshot.forEach(doc => {
      allBarang.push(doc.data());
    });

    // Simpan juga ke filteredBarang
    filteredBarang = [...allBarang];

    // Render tabel awal (status + pagination otomatis ditampilkan di sini)
    renderTable();

  } catch (error) {
    console.error("Error loading barangMasuk:", error);
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Error memuat data</td></tr>';
  }
}


// ======================
// 🔹 RENDER TABLE + PAGINATION
// ======================
function renderTable() {
  const tableBody = document.querySelector("#barangMasukTable tbody");
  const statusEl = document.getElementById("status1");

  tableBody.innerHTML = "";

  const totalPages = Math.ceil(filteredBarang.length / pageSize);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filteredBarang.slice(start, end);

  if (pageData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Data tidak ditemukan</td></tr>';
  } else {
    let no = start + 1;
    pageData.forEach(data => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${no++}</td>
        <td>${data.namaBarang || "-"}</td>
        <td>${data.satuan || "-"}</td>
        <td>${data.jumlahBarang || "-"}</td>
      `;

      // Klik baris → isi Nama Barang & Satuan
      row.addEventListener("click", () => {
        document.getElementById("namaBarang").value = data.namaBarang || "";
        document.getElementById("satuanBarang").value = data.satuan || "";

        // Highlight baris yang dipilih
        tableBody.querySelectorAll("tr").forEach(r => r.classList.remove("active"));
        row.classList.add("active");
      });

      tableBody.appendChild(row);
    });
  }

  // Status + Navigasi
  statusEl.innerHTML = `
    <div style="font-weight:500; margin-bottom:6px;">
      🟢 Menampilkan ${start + 1} - ${Math.min(end, filteredBarang.length)} dari ${filteredBarang.length} data
    </div>
    <div style="display:flex; gap:10px; align-items:center; justify-content:center; margin-top:8px;">
      <button class="page-btn" ${currentPage === 1 ? "disabled" : ""} onclick="prevPage()">⬅️ Sebelumnya</button>
      <span style="font-size:14px; font-weight:600; color:#555;">
        Halaman ${currentPage} / ${totalPages || 1}
      </span>
      <button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="nextPage()">Berikutnya ➡️</button>
    </div>
  `;
}

// ======================
// 🔹 NAVIGASI HALAMAN
// ======================
window.nextPage = function () {
  const totalPages = Math.ceil(filteredBarang.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
};

window.prevPage = function () {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
};

// ======================
// 🔹 SEARCH EVENT
// ======================
const searchInput = document.getElementById("searchBarang");
searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  filteredBarang = allBarang.filter(item =>
    (item.namaBarang || "").toLowerCase().includes(keyword)
  );
  currentPage = 1;
  renderTable();
});

// ======================
// 🔹 INIT
// ======================
loadBarangMasuk();
