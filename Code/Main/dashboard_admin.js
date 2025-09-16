import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// 🔹 Firebase Config
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
const auth = getAuth(app);

// 🔹 DOM Elements
const statusEl = document.getElementById("status");
const tableBody = document.querySelector("#barangTable tbody");
const searchInput = document.getElementById("searchInput");
const kategoriDropdown = document.getElementById("kategoriDropdown");
const satuanDropdown = document.getElementById("satuanDropdown");
const jenisDanaDropdown = document.getElementById("jenisDanaDropdown");

const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");

// 🔹 State
let allData = [];
let currentEditIndex = null;

// 🔹 Proteksi login
if (!localStorage.getItem("isLoggedIn")) {
  window.location.replace("https://manajemen-sma.web.app/Login/login.html");
}

// 🔹 Format Rupiah
function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
}// 🔹 Render Tabel
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
// 🔹 State

let currentPage = 1;
const pageSize = 10;

// 🔹 Render tabel dengan pagination
function renderTable(data) {
  tableBody.innerHTML = "";

  if (data.length === 0) {
    statusEl.textContent = "⚠️ Tidak ada data yang cocok!";
    return;
  }

  // Hitung indeks data berdasarkan page
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginated = data.slice(start, end);

  paginated.forEach((item, index) => {
    const row = document.createElement("tr");

    let fotoBtns = "-";
    if (item.fotoLinks && item.fotoLinks.length > 0) {
      fotoBtns = item.fotoLinks.map(link => {
        const driveId = link.match(/[-\w]{25,}/)?.[0];
        const directLink = driveId
          ? `https://drive.google.com/uc?export=view&id=${driveId}`
          : link;

        return `<button class="foto-btn" onclick="window.open('${directLink}', '_blank')">📷 Lihat Foto</button>`;
      }).join(" ");
    }

    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${item.kodeBarang || '-'}</td>
      <td>${item.namaBarang || '-'}</td>
      <td>${item.merek || '-'}</td>
      <td>${item.jumlahBarang || '-'}</td>
      
      <td>${item.tanggalBarang || '-'}</td>
      
      <td>${item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString("id-ID") : '-'}</td>
      <td>${item.kategori || '-'}</td>
      <td>${item.satuan || '-'}</td>
      <td>${item.jenisDana || '-'}</td>
      
      <td>${fotoBtns}</td>
      <td>${item.keterangan || '-'}</td>
      <td><button class="edit-btn" onclick="editRowPopup(${start + index})">✏️ Edit</button></td>
    `;

    tableBody.appendChild(row);
  });

 // 🔹 Status + Navigasi (modern style)
const totalPages = Math.ceil(data.length / pageSize);
statusEl.innerHTML = `
  <div style="font-weight:500; margin-bottom:6px;">
    🟢 Menampilkan ${start + 1} - ${Math.min(end, data.length)} dari ${data.length} data
  </div>
  <div style="display:flex; gap:10px; align-items:center; justify-content:center; margin-top:8px;">
    <button 
      class="page-btn" 
      ${currentPage === 1 ? "disabled" : ""} 
      onclick="prevPage()">⬅️ Sebelumnya
    </button>
    <span style="font-size:14px; font-weight:600; color:#555;">
      Halaman ${currentPage} / ${totalPages}
    </span>
    <button 
      class="page-btn" 
      ${currentPage === totalPages ? "disabled" : ""} 
      onclick="nextPage()">Berikutnya ➡️
    </button>
  </div>
`;

}

// 🔹 Navigasi halaman
window.prevPage = function() {
  if (currentPage > 1) {
    currentPage--;
    applyFilters();
  }
};
window.nextPage = function() {
  const totalPages = Math.ceil(allData.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    applyFilters();
  }
};





function editRowPopup(index) {
  currentEditIndex = index;
  const item = allData[index];

  document.getElementById("editKode").textContent = item.kodeBarang;
  document.getElementById("editNama").value = item.namaBarang || '';
  document.getElementById("editMerek").value = item.merek || '';
  document.getElementById("editJumlah").value = item.jumlahBarang || '';
  
  document.getElementById("editTanggal").value = item.tanggalBarang || '';
  document.getElementById("editKategori").value = item.kategori || '';
  document.getElementById("editSatuan").value = item.satuan || '';
  document.getElementById("editDana").value = item.jenisDana || '';
  document.getElementById("editKeterangan").value = item.keterangan || '';


  editModal.style.display = "flex";
}

window.editRowPopup = editRowPopup; // Agar bisa dipanggil dari HTML onclick

// 🔹 Cancel edit
document.getElementById("cancelEdit").onclick = () => {
  editModal.style.display = "none";
};

// 🔹 Submit edit
editForm.onsubmit = async (e) => {
  e.preventDefault();
  if (currentEditIndex === null) return;

  const item = allData[currentEditIndex];
  const updateData = {
    namaBarang: document.getElementById("editNama").value,
    merek: document.getElementById("editMerek").value, // <--- tambahkan ini
    jumlahBarang: Number(document.getElementById("editJumlah").value),
    
    tanggalBarang: document.getElementById("editTanggal").value,
    kategori: document.getElementById("editKategori").value,
    satuan: document.getElementById("editSatuan").value,
    jenisDana: document.getElementById("editDana").value,
    keterangan: document.getElementById("editKeterangan").value
};


  try {
    await updateDoc(doc(db, "barangMasuk", item.id), updateData);
    Object.assign(item, updateData); // update lokal
    editModal.style.display = "none";
    renderTable(allData);
    alert("✅ Data berhasil diupdate!");
  } catch(err) {
    alert("❌ Gagal update: " + err.message);
  }
};

// 🔹 Populate Dropdown
function populateDropdown(dropdown, items, label) {
  dropdown.innerHTML = `<option value="">-- Pilih ${label} --</option>`;
  items.forEach(value => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    dropdown.appendChild(opt);
  });
  const tambahOpt = document.createElement("option");
  tambahOpt.value = "__tambah__";
  tambahOpt.textContent = `➕ Tambah ${label} baru...`;
  dropdown.appendChild(tambahOpt);
}

// 🔹 Load Data
async function loadData() {
  try {
    const snapshot = await getDocs(collection(db, "barangMasuk"));
    allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Ambil list unik untuk dropdown
    const kategoriSet = new Set();
    const satuanSet = new Set();
    const jenisDanaSet = new Set();

    allData.forEach(item => {
      if (item.kategori) kategoriSet.add(item.kategori);
      if (item.satuan) satuanSet.add(item.satuan);
      if (item.jenisDana) jenisDanaSet.add(item.jenisDana);
    });

    populateDropdown(kategoriDropdown, [...kategoriSet], "kategori");
    populateDropdown(satuanDropdown, [...satuanSet], "satuan");
    populateDropdown(jenisDanaDropdown, [...jenisDanaSet], "jenis dana");

    applyFilters(); // render tabel sesuai filter yang aktif
  } catch (err) {
    console.error(err);
    statusEl.textContent = `❌ Gagal memuat data: ${err.message}`;
  }
}
function applyFilters() {
  const kategori = kategoriDropdown.value;
  const satuan = satuanDropdown.value;
  const dana = jenisDanaDropdown.value;
  const keyword = searchInput.value.toLowerCase();

  const tanggalBarang = document.getElementById("searchTanggalBarang").value;
  const tanggalInput = document.getElementById("searchTanggalInput").value;

  const filtered = allData.filter(item => {
    // cek keyword (kode, nama, merek)
    const matchKeyword = 
      item.kodeBarang.toLowerCase().includes(keyword) ||
      item.namaBarang.toLowerCase().includes(keyword) ||
      (item.merek && item.merek.toLowerCase().includes(keyword));

    // cek tanggal barang
    const matchTanggalBarang = !tanggalBarang || item.tanggalBarang === tanggalBarang;

    // cek tanggal input sistem (pakai format YYYY-MM-DD dari createdAt)
    let createdAtStr = "";
    if (item.createdAt?.toDate) {
      const d = item.createdAt.toDate();
      createdAtStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
    }
    const matchTanggalInput = !tanggalInput || createdAtStr === tanggalInput;

    return (!kategori || item.kategori === kategori) &&
           (!satuan || item.satuan === satuan) &&
           (!dana || item.jenisDana === dana) &&
           matchKeyword &&
           matchTanggalBarang &&
           matchTanggalInput;
  });

  renderTable(filtered);
}
searchInput.addEventListener("input", applyFilters);
document.getElementById("searchTanggalBarang").addEventListener("change", applyFilters);
document.getElementById("searchTanggalInput").addEventListener("change", applyFilters);


kategoriDropdown.addEventListener("change", async (e) => {
  if (e.target.value === "__tambah__") {
    const namaBaru = prompt("Masukkan nama kategori baru:");
    if (!namaBaru?.trim()) { e.target.value = ""; return; }
    await addDoc(collection(db, "kategori"), { nama: namaBaru.trim() });
    await loadData();
    e.target.value = namaBaru.trim();
  } else {
    applyFilters();
  }
});

satuanDropdown.addEventListener("change", async (e) => {
  if (e.target.value === "__tambah__") {
    const namaBaru = prompt("Masukkan nama satuan baru:");
    if (!namaBaru?.trim()) { e.target.value = ""; return; }
    await addDoc(collection(db, "satuan"), { nama: namaBaru.trim() });
    await loadData();
    e.target.value = namaBaru.trim();
  } else {
    applyFilters();
  }
});

jenisDanaDropdown.addEventListener("change", async (e) => {
  if (e.target.value === "__tambah__") {
    const namaBaru = prompt("Masukkan jenis dana baru:");
    if (!namaBaru?.trim()) { e.target.value = ""; return; }
    await addDoc(collection(db, "jenisDana"), { nama: namaBaru.trim() });
    await loadData();
    e.target.value = namaBaru.trim();
  } else {
    applyFilters();
  }
});

searchInput.addEventListener("input", applyFilters);

// 🔹 Logout
window.logout = function() {
  localStorage.removeItem("isLoggedIn");
  signOut(auth).finally(() => {
    alert("✅ Berhasil logout!");
    window.location.replace("/Login/login.html");
  });
};
function sortData(field, asc = true) {
  allData.sort((a, b) => {
    if (typeof a[field] === "number") return asc ? a[field] - b[field] : b[field] - a[field];
    return asc ? String(a[field]).localeCompare(String(b[field])) : String(b[field]).localeCompare(String(a[field]));
  });
  applyFilters();
}

let kodeAsc = true, namaAsc = true, jumlahAsc = true, tanggalAsc = true, inputAsc = true;
let merekAsc = true;
let fotoAsc = true;

document.getElementById("sortKodeBtn").addEventListener("click", () => { 
  sortData("kodeBarang", kodeAsc); 
  kodeAsc = !kodeAsc; 
});

document.getElementById("sortNamaBtn").addEventListener("click", () => { 
  sortData("namaBarang", namaAsc); 
  namaAsc = !namaAsc; 
});

document.getElementById("sortMerekBtn").addEventListener("click", () => { 
  sortData("merek", merekAsc); 
  merekAsc = !merekAsc; 
});

document.getElementById("sortJumlahBtn").addEventListener("click", () => { 
  sortData("jumlahBarang", jumlahAsc); 
  jumlahAsc = !jumlahAsc; 
});

document.getElementById("sortTanggalBtn").addEventListener("click", () => { 
  sortData("tanggalBarang", tanggalAsc); 
  tanggalAsc = !tanggalAsc; 
});

document.getElementById("sortInputBtn").addEventListener("click", () => { 
  sortData("createdAt", inputAsc); 
  inputAsc = !inputAsc; 
});

document.getElementById("sortFotoBtn").addEventListener("click", () => {
  allData.sort((a, b) => {
    const aLen = a.fotoLinks ? a.fotoLinks.length : 0;
    const bLen = b.fotoLinks ? b.fotoLinks.length : 0;
    return fotoAsc ? aLen - bLen : bLen - aLen;
  });
  fotoAsc = !fotoAsc;
  applyFilters(); // rerender tabel
});


// 🔹 Load awal
loadData();
