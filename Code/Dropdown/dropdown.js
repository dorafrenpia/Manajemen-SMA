import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { 
  getFirestore, collection, getDocs, doc, deleteDoc, updateDoc, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// 🔹 Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCAVsG_cBB_Ksbk4oqkXTH6oTlNKl-p-bU",
  authDomain: "manajemen-sma.firebaseapp.com",
  projectId: "manajemen-sma",
  storageBucket: "manajemen-sma.firebasestorage.app",
  messagingSenderId: "1008287671477",
  appId: "1:1008287671477:web:7829d82b3da953d2598afc",
  measurementId: "G-ZSFSXW3C2C"
};

// 🔹 Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const nisnTableBody = document.querySelector("#nisnTable tbody");
const filterButtons = document.querySelectorAll(".filter-buttons button");

// Popup Edit
const editPopup = document.getElementById("editPopup");
const editNamaInput = document.getElementById("editNama");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// Popup Delete
const deletePopup = document.getElementById("deletePopup");
const deleteNamaText = document.getElementById("deleteNama");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

// Popup Tambah
const addPopup = document.getElementById("addPopup");
const addNamaInput = document.getElementById("addNama");
const saveAddBtn = document.getElementById("saveAddBtn");
const cancelAddBtn = document.getElementById("cancelAddBtn");
const openAddBtn = document.getElementById("openAddBtn"); // tombol "Tambah Data"

// Pagination
const paginationContainer = document.createElement("div");
paginationContainer.style.marginTop = "15px";
paginationContainer.style.textAlign = "center";
document.querySelector(".table-container").appendChild(paginationContainer);

let currentCollection = "merek"; // default
let currentEditId = null;
let currentDeleteId = null;
let allData = [];      // simpan semua dokumen
let currentPage = 1;   // halaman aktif
const itemsPerPage = 10;

// 🔹 Fungsi notif manual
function showManualNotif(pesan, warna = "green") {
  const box = document.getElementById("manualNotif");
  box.innerText = pesan;
  box.style.display = "block";
  box.style.color = "white";
  box.style.background = warna;
}

// 🔹 Load Data dari Firestore
async function loadData(collectionName) {
  nisnTableBody.innerHTML = ""; 
  currentCollection = collectionName;
  allData = [];
  currentPage = 1;

  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    querySnapshot.forEach((docSnap) => {
      allData.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    renderTable();
  } catch (error) {
    console.error("Error getting documents: ", error);
  }
}

// 🔹 Render Table sesuai halaman
function renderTable() {
  nisnTableBody.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = allData.slice(startIndex, endIndex);

  pageData.forEach((data, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${startIndex + index + 1}</td>
      <td>${data.nama || "-"}</td>
      <td>
        <button class="edit-btn" data-id="${data.id}" data-nama="${data.nama || ""}">Edit</button>
        <button class="delete-btn" data-id="${data.id}" data-nama="${data.nama || ""}">Hapus</button>
      </td>
    `;
    nisnTableBody.appendChild(tr);
  });

  // Re-attach event tombol edit & delete
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      openEditPopup(btn.dataset.id, btn.dataset.nama);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      openDeletePopup(btn.dataset.id, btn.dataset.nama);
    });
  });

  renderPagination();
}

// 🔹 Render Pagination Buttons
function renderPagination() {
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(allData.length / itemsPerPage);

  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.innerText = "⬅ Sebelumnya";
  prevBtn.disabled = currentPage === 1;
  prevBtn.style.marginRight = "10px";
  prevBtn.onclick = () => {
    currentPage--;
    renderTable();
  };
  paginationContainer.appendChild(prevBtn);

  const pageInfo = document.createElement("span");
  pageInfo.innerText = `Halaman ${currentPage} dari ${totalPages}`;
  paginationContainer.appendChild(pageInfo);

  const nextBtn = document.createElement("button");
  nextBtn.innerText = "Selanjutnya ➡";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.style.marginLeft = "10px";
  nextBtn.onclick = () => {
    currentPage++;
    renderTable();
  };
  paginationContainer.appendChild(nextBtn);
}

// 🔹 Open Edit Popup
function openEditPopup(id, namaLama) {
  currentEditId = id;
  editNamaInput.value = namaLama;
  editPopup.style.display = "flex";
}

// 🔹 Save Edit
saveEditBtn.addEventListener("click", async () => {
  const newNama = editNamaInput.value.trim();
  if (!newNama) {
    showManualNotif("Nama tidak boleh kosong!", "orange");
    return;
  }

  try {
    await updateDoc(doc(db, currentCollection, currentEditId), { nama: newNama });
    showManualNotif("Data berhasil diupdate!", "green");
    editPopup.style.display = "none";
    loadData(currentCollection);
  } catch (error) {
    console.error("Error updating document: ", error);
  }
});

// 🔹 Cancel Edit
cancelEditBtn.addEventListener("click", () => {
  editPopup.style.display = "none";
});

// 🔹 Open Delete Popup
function openDeletePopup(id, nama) {
  currentDeleteId = id;
  deleteNamaText.innerText = `Data: ${nama}`;
  deletePopup.style.display = "flex";
}

// 🔹 Confirm Delete
confirmDeleteBtn.addEventListener("click", async () => {
  try {
    await deleteDoc(doc(db, currentCollection, currentDeleteId));
    showManualNotif("Data berhasil dihapus!", "red");
    deletePopup.style.display = "none";
    loadData(currentCollection);
  } catch (error) {
    console.error("Error deleting document:", error);
  }
});

// 🔹 Cancel Delete
cancelDeleteBtn.addEventListener("click", () => {
  deletePopup.style.display = "none";
});

// 🔹 Open Add Popup
openAddBtn.addEventListener("click", () => {
  addNamaInput.value = "";
  addPopup.style.display = "flex";
});
saveAddBtn.addEventListener("click", async () => {
  const newNama = addNamaInput.value.trim();
  if (!newNama) {
    showManualNotif("Nama tidak boleh kosong!", "orange");
    return;
  }

  try {
    // 🔹 Cek duplikat
    const existing = allData.find(d => d.nama.toLowerCase() === newNama.toLowerCase());
    if (existing) {
      showManualNotif("Nama sudah ada, tidak bisa ditambahkan!", "red");
      return;
    }

    // 🔹 Tambahkan data baru
    await addDoc(collection(db, currentCollection), { nama: newNama });
    showManualNotif("Data berhasil ditambahkan!", "green");
    addPopup.style.display = "none";
    loadData(currentCollection);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
});

// 🔹 Cancel Add
cancelAddBtn.addEventListener("click", () => {
  addPopup.style.display = "none";
});

// 🔹 Tombol Filter
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const collectionName = btn.dataset.collection;
    loadData(collectionName);
  });
});

// 🔹 Load default
loadData("merek");

// 🔹 Ambil elemen infoData
const statusEl = document.getElementById("infoData");

// 🔹 Buat teks refresh sekali saja (selalu tampil di atas statusEl)
function setupRefreshNote() {
  let refreshContainer = document.getElementById("refresh-container");
  if (!refreshContainer) {
    refreshContainer = document.createElement("div");
    refreshContainer.id = "refresh-container";
    refreshContainer.style.marginBottom = "10px"; // beri jarak
    refreshContainer.innerHTML = `
      <span id="refresh-note" style="font-size:0.9em; color:#555;">
        ⏳ Jika lebih dari 5 detik data belum muncul, tekan 
        <span class="refresh-link" style="color:#007bff; cursor:pointer;" onclick="location.reload()">refresh</span>
      </span>
    `;
    statusEl.parentElement.insertBefore(refreshContainer, statusEl);
  }
}

// panggil sekali saat halaman load
setupRefreshNote();