// ======= filterdatapengajuan.js =======

const openFilterBtn = document.getElementById("openFilter");
const closeFilterBtn = document.getElementById("closeFilter");
const filterModal = document.getElementById("filterModal");

const kodeFilterInput = document.getElementById("kodeFilter");
const tanggalPeminjamanInput = document.getElementById("tanggalPeminjamanFilter");
const tanggalInputFilterInput = document.getElementById("tanggalInputFilter");

// 🔹 Buka modal filter
openFilterBtn.addEventListener("click", () => {
  filterModal.style.display = "block";
});

// 🔹 Tutup modal filter
closeFilterBtn.addEventListener("click", () => {
  filterModal.style.display = "none";
});

// 🔹 Tutup modal jika klik di luar konten
window.addEventListener("click", (e) => {
  if (e.target === filterModal) {
    filterModal.style.display = "none";
  }
});

// 🔹 Fungsi bantu untuk konversi Firestore Timestamp ke string "YYYY-MM-DD"
function formatTanggal(itemTanggal) {
  if (!itemTanggal) return "";
  if (itemTanggal.toDate) { // Firestore Timestamp
    return itemTanggal.toDate().toISOString().slice(0, 10);
  }
  return itemTanggal; // asumsi sudah string "YYYY-MM-DD"
}

// 🔹 Fungsi filter otomatis
function applyFilter() {
  // pastikan data sudah tersedia
  if (!window.allData || !Array.isArray(window.allData)) return;

  const kode = kodeFilterInput.value.trim().toLowerCase();
  const tanggalPeminjaman = tanggalPeminjamanInput.value;
  const tanggalInput = tanggalInputFilterInput.value;

  const filtered = window.allData.filter(item => {
    let match = true;

    // filter kode
    if (kode) {
      match = match && (item.kodePengajuan || "").toLowerCase().includes(kode);
    }

    // filter tanggal peminjaman
    if (tanggalPeminjaman) {
      const tglPeminjaman = formatTanggal(item.tanggalPeminjaman);
      match = match && tglPeminjaman === tanggalPeminjaman;
    }

    // filter tanggal input sistem
    if (tanggalInput) {
      const tglInput = formatTanggal(item.tanggalInput);
      match = match && tglInput === tanggalInput;
    }

    return match;
  });

  // reset ke halaman pertama & render
  window.currentPage = 1;

  const tableBody = document.querySelector("#peminjamanTable tbody");
  const statusEl = document.getElementById("status");

  if (filtered.length === 0) {
    // Kosongkan table & tampilkan pesan
    tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">⚠️ Tidak ada data yang sesuai filter.</td></tr>`;
    if (statusEl) statusEl.textContent = "⚠️ Tidak ada data yang sesuai filter.";
  } else {
    if (window.renderTable) window.renderTable(filtered);
  }
}

// 🔹 Event listener untuk filter otomatis
kodeFilterInput.addEventListener("input", applyFilter);
tanggalPeminjamanInput.addEventListener("change", applyFilter);
tanggalInputFilterInput.addEventListener("change", applyFilter);

// 🔹 Fungsi untuk dijalankan dari luar, menunggu data siap
function triggerFilter() {
  if (window.allData && window.allData.length > 0) {
    applyFilter();
  } else {
    // tunggu sebentar jika data belum siap
    setTimeout(triggerFilter, 500);
  }
}

// 🔹 Jalankan filter otomatis saat halaman load
document.addEventListener("DOMContentLoaded", () => {
  triggerFilter();
});

// expose fungsi agar bisa dipanggil dari Peminjaman.js
window.applyFilter = applyFilter;
