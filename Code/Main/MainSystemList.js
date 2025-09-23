 // Variabel global
let allData = [];        // hasil fetch firebase
let currentPage = 1;
const pageSize = 10;     // jumlah data per halaman
const tableBody = document.querySelector("#peminjamanTable tbody");
const statusEl = document.getElementById("status");
const pageInfo = document.getElementById("pageInfo");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");

// 🔹 Render tabel dengan pagination
function renderTable(data) {
  tableBody.innerHTML = "";

  if (data.length === 0) {
    statusEl.textContent = "⚠️ Tidak ada data!";
    return;
  }

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginated = data.slice(start, end);

  paginated.forEach((item, index) => {
    const row = document.createElement("tr");

    // tombol foto pengambilan
    let fotoAmbil = "-";
    if (item.fotoAmbil && item.fotoAmbil.length > 0) {
      fotoAmbil = item.fotoAmbil.map(link => {
        const driveId = link.match(/[-\w]{25,}/)?.[0];
        const directLink = driveId
          ? `https://drive.google.com/uc?export=view&id=${driveId}`
          : link;
        return `<button class="foto-btn" onclick="window.open('${directLink}','_blank')">📷 Lihat Foto</button>`;
      }).join(" ");
    }

    // tombol foto pengembalian
    let fotoKembali = "-";
    if (item.fotoKembali && item.fotoKembali.length > 0) {
      fotoKembali = item.fotoKembali.map(link => {
        const driveId = link.match(/[-\w]{25,}/)?.[0];
        const directLink = driveId
          ? `https://drive.google.com/uc?export=view&id=${driveId}`
          : link;
        return `<button class="foto-btn" onclick="window.open('${directLink}','_blank')">📷 Lihat Foto</button>`;
      }).join(" ");
    }

    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${item.tanggalPeminjaman || '-'}</td>
      <td>${item.namaPeminjam || '-'}</td>
      <td>${item.kelasJabatan || '-'}</td>
      <td>${item.namaBarang || '-'}</td>
      <td>${item.jumlahBarang || '-'}</td>
      <td>${item.keperluan || '-'}</td>
      <td>${fotoAmbil}</td>
      <td>${fotoKembali}</td>
    `;

    tableBody.appendChild(row);
  });

  // update status + info halaman
  const totalPages = Math.ceil(data.length / pageSize);
  statusEl.innerHTML = `
    🟢 Menampilkan ${start + 1} - ${Math.min(end, data.length)} dari ${data.length} data
  `;
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

// 🔹 Dummy loader (nanti ganti firebase)
document.addEventListener("DOMContentLoaded", () => {
  // contoh data dummy, ganti dengan fetch Firestore
  allData = [
    { tanggalPeminjaman: "2025-09-18", namaPeminjam: "Andi", kelasJabatan: "XI IPA 1", namaBarang: "Proyektor", jumlahBarang: 1, keperluan: "Presentasi", fotoAmbil: [], fotoKembali: [] },
    { tanggalPeminjaman: "2025-09-19", namaPeminjam: "Budi", kelasJabatan: "Guru", namaBarang: "Laptop", jumlahBarang: 1, keperluan: "Mengajar", fotoAmbil: [], fotoKembali: [] }
    // dst...
  ];
  renderTable(allData);
});
