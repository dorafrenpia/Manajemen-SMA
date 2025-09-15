import { db } from "./firebase.js";
import { collection, addDoc, query, where, getDocs, doc, deleteDoc } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const nisnInput = document.getElementById("nisnInput");
const addBtn = document.getElementById("addBtn");
const popup = document.getElementById("popup");
const nisnTableBody = document.querySelector("#nisnTable tbody");
// Data NISN contoh
let allNISN = [
  { no: 1, nisn: "12345", nama: "Budi", email: "budi@mail.com", telepon: "081234", status: "Aktif" },
  { no: 2, nisn: "54321", nama: "Ani", email: "ani@mail.com", telepon: "081235", status: "Pending" },
  // bisa tambah data lainnya
];

let currentPage = 1;
const pageSize = 10;
let searchTerm = "";

// Elemen container
const infoContainer = document.getElementById("infoData");
const searchContainer = document.getElementById("searchContainer");
const tbody = document.querySelector("#nisnTable tbody");
let sortColumn = null;
let sortAsc = true;

document.querySelectorAll(".sort-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const column = btn.dataset.column;

    // toggle ascending/descending
    if (sortColumn === column) sortAsc = !sortAsc;
    else sortAsc = true;
    sortColumn = column;

    allNISN.sort((a, b) => {
      let valA, valB;
      if (column === "nama") {
        valA = a.usersList.length > 0 ? a.usersList[0].nama : "";
        valB = b.usersList.length > 0 ? b.usersList[0].nama : "";
      } else if (column === "email") {
        valA = a.usersList.length > 0 ? a.usersList[0].email : "";
        valB = b.usersList.length > 0 ? b.usersList[0].email : "";
      } else if (column === "telepon") {
        valA = a.usersList.length > 0 ? a.usersList[0].telepon : "";
        valB = b.usersList.length > 0 ? b.usersList[0].telepon : "";
      } else if (column === "status") {
        valA = a.status;
        valB = b.status;
      } else if (column === "nisn") {
        valA = a.nisn;
        valB = b.nisn;
      } else {
        return 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    displayPage(currentPage);
  });
});
// --- Buat input search ---
const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.placeholder = "Cari NISN atau Nama...";
searchInput.style.width = "100%";
searchInput.style.padding = "8px";
searchInput.style.marginBottom = "10px";
searchContainer.appendChild(searchInput);


// Event search
searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  currentPage = 1;
  displayPage(currentPage);
});

// Fungsi menampilkan popup
function showPopup(message, type = "info", duration = 3000) {
  popup.textContent = message;
  popup.className = "popup show " + type;
  setTimeout(() => {
    popup.className = "popup";
  }, duration);
}
async function fetchAllNISN() {
  const nisnRef = collection(db, "nisn");
  const usersRef = collection(db, "users");
  const nisnSnap = await getDocs(nisnRef);

  allNISN = [];

  for (const docSnap of nisnSnap.docs) {
    const data = docSnap.data();
    const nisnValue = data.nisn;

    const q = query(usersRef, where("nisn", "==", nisnValue));
    const userSnap = await getDocs(q);

    let status, usersList;
    if (!userSnap.empty) {
      status = "Aktif";
      // Ambil semua pengguna terkait NISN
      usersList = userSnap.docs.map(d => {
        const u = d.data();
        return {
          nama: u.nama || "-",
          email: u.email || "-",
          telepon: u.telepon || "-"
        };
      });
    } else {
      status = "Tidak Aktif";
      usersList = [];
    }

    allNISN.push({ nisn: nisnValue, status, usersList });
  }
}
function displayPage(page) {
  nisnTableBody.innerHTML = ""; // <-- ini wajib
  // Filter data sesuai search
const filteredData = allNISN.filter(item => {
  const nama = item.usersList.length > 0 ? item.usersList[0].nama.toLowerCase() : "";
  return item.nisn.toLowerCase().includes(searchTerm) || nama.includes(searchTerm);
});





  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, filteredData.length);
  const pageData = filteredData.slice(start, end);
pageData.forEach((item, index) => {
  const row = document.createElement("tr");
  const statusClass = item.status === "Aktif" ? "status-aktif" : "status-tidak-aktif";
  row.innerHTML = `
  <td>${start + index + 1}</td>
  <td>${item.nisn}</td>
  <td>
    ${item.usersList.length > 0 
      ? item.usersList.map(u => u.nama).join("<br>") 
      : "-"}
  </td>
  <td>
    ${item.usersList.length > 0 
      ? item.usersList.map(u => u.email).join("<br>") 
      : "-"}
  </td>
  <td>
    ${item.usersList.length > 0 
      ? item.usersList.map(u => u.telepon).join("<br>") 
      : "-"}
  </td>
  <td class="${item.status === "Aktif" ? "status-aktif" : "status-tidak-aktif"}">
    ${item.status}
  </td>
  <td>
    <button class="delete-users-btn" data-nisn="${item.nisn}">User</button>
    <button class="delete-all-btn" data-nisn="${item.nisn}">ALL</button>
  </td>
`;

  nisnTableBody.appendChild(row);
});



  // <-- letakkan di sini -->
  let circleColor = filteredData.length > 0 ? "#28a745" : "#dc3545"; // hijau jika ada, merah jika kosong
  infoContainer.innerHTML = `
    <span class="status-circle" style="background-color: ${circleColor};"></span>
    Menampilkan ${start + 1}-${end} dari ${filteredData.length} data
  `;

  // Update tombol pagination
  prevBtn.disabled = page === 1;
  nextBtn.disabled = end >= filteredData.length;
}


// Event klik tombol Tambah NISN
addBtn.addEventListener("click", async () => {
  const nisn = nisnInput.value.trim();
  if (!nisn) {
    showPopup("NISN tidak boleh kosong!", "error");
    return;
  }

  try {
    const nisnRef = collection(db, "nisn");
    const q = query(nisnRef, where("nisn", "==", nisn));
    const snap = await getDocs(q);

    if (!snap.empty) {
      showPopup("NISN sudah ada!", "error");
      return;
    }

    await addDoc(nisnRef, { nisn });
    showPopup(`NISN ${nisn} berhasil ditambahkan!`, "success");
    nisnInput.value = "";

    // reload data
    await fetchAllNISN();
    currentPage = 1;
    displayPage(currentPage);

  } catch (error) {
    showPopup("Error: " + error.message, "error");
  }
});

// Pagination buttons
const paginationContainer = document.createElement("div");
paginationContainer.style.marginTop = "10px";
paginationContainer.style.textAlign = "center";

const prevBtn = document.createElement("button");
prevBtn.textContent = "Previous";
prevBtn.style.marginRight = "10px";
const nextBtn = document.createElement("button");
nextBtn.textContent = "Next";

paginationContainer.appendChild(prevBtn);
paginationContainer.appendChild(nextBtn);
document.querySelector(".container").appendChild(paginationContainer);

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    displayPage(currentPage);
  }
});

nextBtn.addEventListener("click", () => {
  currentPage++;
  displayPage(currentPage);
});

// Load data saat pertama kali
(async function init() {
  await fetchAllNISN();
  displayPage(currentPage);
})();
nisnTableBody.addEventListener("click", async (e) => {
  const nisnToDelete = e.target.dataset.nisn;
  if (!nisnToDelete) return;

  try {
    if (e.target.classList.contains("delete-users-btn")) {
      // Hapus users saja
      if (!confirm(`Hapus semua pengguna dengan NISN ${nisnToDelete}?`)) return;

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("nisn", "==", nisnToDelete));
      const userSnap = await getDocs(q);

      for (const docSnap of userSnap.docs) {
        const docRef = doc(db, "users", docSnap.id);
        await deleteDoc(docRef);
      }

      showPopup(`Semua pengguna dengan NISN ${nisnToDelete} berhasil dihapus`, "success");

    } else if (e.target.classList.contains("delete-all-btn")) {
      // Hapus NISN + users
      if (!confirm(`Hapus NISN ${nisnToDelete} beserta semua pengguna terkait?`)) return;

      // Hapus semua users
      const usersRef = collection(db, "users");
      const qUsers = query(usersRef, where("nisn", "==", nisnToDelete));
      const userSnap = await getDocs(qUsers);
      for (const docSnap of userSnap.docs) {
        const docRef = doc(db, "users", docSnap.id);
        await deleteDoc(docRef);
      }

      // Hapus NISN
      const nisnRef = collection(db, "nisn");
      const qNisn = query(nisnRef, where("nisn", "==", nisnToDelete));
      const nisnSnap = await getDocs(qNisn);
      for (const docSnap of nisnSnap.docs) {
        const docRef = doc(db, "nisn", docSnap.id);
        await deleteDoc(docRef);
      }

      showPopup(`NISN ${nisnToDelete} dan semua pengguna terkait berhasil dihapus`, "success");
    }

    // Reload data agar tabel ter-update
    await fetchAllNISN();
    displayPage(currentPage);

  } catch (error) {
    showPopup("Error: " + error.message, "error");
  }
});

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