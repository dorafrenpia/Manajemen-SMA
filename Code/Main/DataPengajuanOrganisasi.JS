import { db } from '/js/firebase.js';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

const tableBody = document.querySelector("#peminjamanTable tbody");
const statusEl = document.getElementById("status");
const prevBtn = document.getElementById("prevPageBtn");
const nextBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

let allRows = [];
let allItems = [];
let currentPage = 1;
const rowsPerPage = 10;

// ===== Ambil data dari Firebase =====
async function fetchData() {
  statusEl.textContent = "⏳ Memuat data...";
  const q = query(collection(db, "DataPengajuanOrganisasi"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  allRows = [];
  snap.forEach(docSnap => {
    const data = docSnap.data();
    if (Array.isArray(data.barang) && data.barang.length > 0) {
      allRows.push({
        id: docSnap.id,
        kodePengajuan: data.kodePengajuan || "",
        email: data.email || "",
        nomorOrganisasi: data.nomorOrganisasi || "",
        totalKeseluruhan: data.totalKeseluruhan || 0,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        barang: data.barang
      });
    }
  });

  // Buat array baru berisi semua item dari semua row untuk mempermudah render tabel
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
        parentId: row.id,      // id dokumen untuk update Firestore
        indexInParent: idx     // posisi item di array barang
      });
    });
  });

  statusEl.textContent = `✅ ${allRows.length} data ditemukan.`;
  renderTable();
}

// ===== Render tabel =====
function renderTable() {
  tableBody.innerHTML = "";

  const totalPages = Math.ceil(allItems.length / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = allItems.slice(start, end);

  pageData.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${item.kodePengajuan}</td>
      <td>${item.email}</td>
      <td>${item.nomorOrganisasi}</td>
      <td>${item.namaBarang || ""}</td>
      <td>${item.jumlahBarang || 0}</td>
      <td>${item.hargaSatuan || 0}</td>
      <td>${item.totalHarga || 0}</td>
      <td>${item.catatanDivisi || ""}</td>
      <td>${item.totalKeseluruhan}</td>
      <td>${item.createdAt ? item.createdAt.toLocaleString() : ""}</td>
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
    renderTable();
  }
});
nextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(allItems.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
});

// ===== Jalankan fetch =====
fetchData();

// ===== Panel editor =====
const editorPanel = document.getElementById("editorPanel");
const closeEditorBtn = document.getElementById("closeEditorBtn");
const saveEditorBtn = document.getElementById("saveEditorBtn");

let currentEditing = null;

// Buka modal editor
tableBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("openEditorBtn")) {
    const docId = e.target.dataset.id;
    const indexInParent = parseInt(e.target.dataset.index);

    // Cari dokumen
    const row = allRows.find(r => r.id === docId);
    if (!row) return;

    const itemData = row.barang[indexInParent];

    currentEditing = { docId, indexInParent, row };

    // Isi field editor
    document.getElementById("statusEditor").value = itemData.status || "";
    document.getElementById("catatanEditor").value = itemData.catatan || "";
    document.getElementById("cekSapras").value = itemData.cekSapras || "";
    document.getElementById("kategoriEditor").value = itemData.kategori || "";
    document.getElementById("picEditor").value = itemData.pic || "";

    // Tampilkan modal
    editorPanel.style.display = "flex";
    setTimeout(() => editorPanel.classList.add("active"), 10);
  }
});

// Tutup modal editor
closeEditorBtn.addEventListener("click", () => {
  editorPanel.classList.remove("active");
  setTimeout(() => { 
    editorPanel.style.display = "none"; 
    document.getElementById("statusEditor").value = "";
    document.getElementById("catatanEditor").value = "";
    document.getElementById("cekSapras").value = "";
    document.getElementById("kategoriEditor").value = "";
    document.getElementById("picEditor").value = "";
    currentEditing = null;
  }, 300);
});

// Simpan perubahan
saveEditorBtn.addEventListener("click", async () => {
  if (!currentEditing) return;

  const { docId, indexInParent, row } = currentEditing;
  const docRef = doc(db, "DataPengajuanOrganisasi", docId);

  const updatedItem = {
    ...row.barang[indexInParent],
    status: document.getElementById("statusEditor").value || null,
    catatan: document.getElementById("catatanEditor").value || null,
    cekSapras: document.getElementById("cekSapras").value || null,
    kategori: document.getElementById("kategoriEditor").value || null,
    pic: document.getElementById("picEditor").value || null,
    updatedAt: new Date()
  };

  const newBarangArray = [...row.barang];
  newBarangArray[indexInParent] = updatedItem;

  try {
    await updateDoc(docRef, { barang: newBarangArray });
    alert("Data berhasil diperbarui!");
    editorPanel.classList.remove("active");
    setTimeout(() => { editorPanel.style.display = "none"; }, 300);
    fetchData();
    currentEditing = null;
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan data!");
  }
});
