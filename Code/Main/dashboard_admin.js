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
function renderTable(data) {
    tableBody.innerHTML = "";
    if (data.length === 0) {
        statusEl.textContent = "⚠️ Tidak ada data yang cocok!";
        return;
    }

    data.forEach((item, index) => {
        const row = document.createElement("tr");

        // Tombol lihat foto untuk semua link
        let fotoBtns = "-";
        if (item.fotoLinks && item.fotoLinks.length > 0) {
            fotoBtns = item.fotoLinks.map(link => {
                // Ambil ID file dari link Drive
                const driveId = link.match(/[-\w]{25,}/)?.[0];
                const directLink = driveId
                    ? `https://drive.google.com/uc?export=view&id=${driveId}`
                    : link;

                return `<button style="font-size:12px; margin:2px;" onclick="window.open('${directLink}', '_blank')">📷 Lihat Foto</button>`;
            }).join(" ");
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.kodeBarang || '-'}</td>
            <td>${item.namaBarang || '-'}</td>
            <td>${item.jumlahBarang || '-'}</td>
            <td>${formatRupiah(item.hargaBarang)}</td>
            <td>${item.tanggalBarang || '-'}</td>
            <td>${item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString("id-ID") : '-'}</td>
            <td>${item.kategori || '-'}</td>
            <td>${item.satuan || '-'}</td>
            <td>${item.jenisDana || '-'}</td>
            <td>${item.merek || '-'}</td>
            <td>${fotoBtns}</td>
            <td>${item.keterangan || '-'}</td>
            <td><button style="font-size:12px;" onclick="editRowPopup(${index})">✏️ Edit</button></td>
        `;

        tableBody.appendChild(row);
    });

    statusEl.textContent = `🟢 ${data.length} data ditampilkan`;
}



function editRowPopup(index) {
  currentEditIndex = index;
  const item = allData[index];

  document.getElementById("editKode").textContent = item.kodeBarang;
  document.getElementById("editNama").value = item.namaBarang || '';
  document.getElementById("editMerek").value = item.merek || '';
  document.getElementById("editJumlah").value = item.jumlahBarang || '';
  document.getElementById("editHarga").value = item.hargaBarang || '';
  document.getElementById("editTanggal").value = item.tanggalBarang || '';
  document.getElementById("editKategori").value = item.kategori || '';
  document.getElementById("editSatuan").value = item.satuan || '';
  document.getElementById("editDana").value = item.jenisDana || '';
  document.getElementById("editKeterangan").value = item.keterangan || '';

  // Preview foto
  const fotoPreview = document.getElementById("editFotoPreview");
  fotoPreview.innerHTML = ''; // kosongkan dulu
  if(item.fotoURL){
    const img = document.createElement("img");
    img.src = item.fotoURL;
    img.style.width = "80px";
    img.style.height = "80px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "4px";
    fotoPreview.appendChild(img);
  }

  editModal.style.display = "flex";
}

// Preview saat user pilih foto baru
document.getElementById("editFoto").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const fotoPreview = document.getElementById("editFotoPreview");
  fotoPreview.innerHTML = '';
  if(file){
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement("img");
      img.src = ev.target.result;
      img.style.width = "80px";
      img.style.height = "80px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "4px";
      fotoPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});
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
    jumlahBarang: Number(document.getElementById("editJumlah").value),
    hargaBarang: Number(document.getElementById("editHarga").value),
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

// 🔹 Filter & Search
function applyFilters() {
  const kategori = kategoriDropdown.value;
  const satuan = satuanDropdown.value;
  const dana = jenisDanaDropdown.value;
  const keyword = searchInput.value.toLowerCase();

  const filtered = allData.filter(item => {
    return (!kategori || item.kategori === kategori) &&
           (!satuan || item.satuan === satuan) &&
           (!dana || item.jenisDana === dana) &&
           (
             item.kodeBarang.toLowerCase().includes(keyword) ||
             item.namaBarang.toLowerCase().includes(keyword) ||
             (item.merek && item.merek.toLowerCase().includes(keyword))
           );
  });

  renderTable(filtered);
}


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


// 🔹 Sort
function sortData(field, asc = true) {
  allData.sort((a, b) => {
    if (typeof a[field] === "number") return asc ? a[field]-b[field] : b[field]-a[field];
    return asc ? String(a[field]).localeCompare(String(b[field])) : String(b[field]).localeCompare(String(a[field]));
  });
  applyFilters();
}

let kodeAsc=true, namaAsc=true, jumlahAsc=true, hargaAsc=true, tanggalAsc=true, inputAsc=true;
document.getElementById("sortKodeBtn").addEventListener("click", ()=>{ sortData("kodeBarang", kodeAsc); kodeAsc=!kodeAsc; });
document.getElementById("sortNamaBtn").addEventListener("click", ()=>{ sortData("namaBarang", namaAsc); namaAsc=!namaAsc; });
document.getElementById("sortJumlahBtn").addEventListener("click", ()=>{ sortData("jumlahBarang", jumlahAsc); jumlahAsc=!jumlahAsc; });
document.getElementById("sortHargaBtn").addEventListener("click", ()=>{ sortData("hargaBarang", hargaAsc); hargaAsc=!hargaAsc; });
document.getElementById("sortTanggalBtn").addEventListener("click", ()=>{ sortData("tanggalBarang", tanggalAsc); tanggalAsc=!tanggalAsc; });
document.getElementById("sortInputBtn").addEventListener("click", ()=>{ sortData("createdAt", inputAsc); inputAsc=!inputAsc; });

// 🔹 Load awal
loadData();
