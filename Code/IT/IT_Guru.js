import { db } from "../js/firebase.js";
import { collection, addDoc, query, where, getDocs, doc, deleteDoc } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// ── Elemen HTML ──
const guruInput = document.getElementById("guruInput");
const addGuruBtn = document.getElementById("addGuruBtn");
const popup = document.getElementById("popup");
const guruTableBody = document.querySelector("#guruTable tbody");
const searchContainer = document.getElementById("searchContainer");
const containerForm2 = document.querySelector(".containerForm2");

let allGuru = [];
let currentPage = 1;
const pageSize = 10;
let searchTerm = "";

// ── Format tanggal ──
function formatDate(timestamp) {
  if (!timestamp) return "-";
  if (timestamp.toDate) {
    const d = timestamp.toDate();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } else if (typeof timestamp === "string") {
    return timestamp;
  }
  return "-";
}

// ── Popup ──
function showPopup(msg, type = "info", duration = 3000){
  if(!popup) return;
  popup.textContent = msg;
  popup.className = "popup show " + type;
  setTimeout(()=>{ popup.className = "popup"; }, duration);
}

// ── Fetch semua guru dari Firestore ──
async function fetchAllGuru() {
  const guruRef = collection(db, "guru");
  const usersRef = collection(db, "DataGuru");
  const guruSnap = await getDocs(guruRef);

  allGuru = [];

  for(const docSnap of guruSnap.docs){
    const data = docSnap.data();
    const guruNo = data.nomor;

    const q = query(usersRef, where("nomor", "==", guruNo));

    const userSnap = await getDocs(q);

    let status, usersList;
    if(!userSnap.empty){
      status = "Aktif";
      usersList = userSnap.docs.map(d=>{
        const u = d.data();
        return { nama: u.nama || "-", email: u.email || "-" };
      });
    } else {
      status = "Tidak Aktif";
      usersList = [];
    }

    allGuru.push({
      nomor: guruNo,
      status,
      usersList,
      tanggalInput: data.tanggalInput || "-"
    });
  }
}
let sortColumn = null;
let sortAsc = true;

// Event listener untuk tombol sort
document.querySelectorAll(".sort-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const column = btn.dataset.column;

    // Toggle ascending/descending
    if (sortColumn === column) sortAsc = !sortAsc;
    else sortAsc = true;
    sortColumn = column;

    allGuru.sort((a, b) => {
      let valA = a[column] || "";
      let valB = b[column] || "";

      // Case-insensitive untuk string
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    displayPage(currentPage); // tampilkan halaman saat ini
  });
});
function displayPage(page) {
  guruTableBody.innerHTML = "";

  const term = searchTerm.toLowerCase();
  const filteredData = allGuru.filter(item => {
    const nama = item.usersList.length > 0 ? item.usersList.map(u => u.nama.toLowerCase()).join(" ") : "";
    return item.nomor.toLowerCase().includes(term) || nama.includes(term);
  });

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, filteredData.length);
  const pageData = filteredData.slice(start, end);

  pageData.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${item.nomor}</td>
      <td>${item.usersList.length > 0 ? item.usersList.map(u => u.nama).join("<br>") : "-"}</td>
      <td>${item.usersList.length > 0 ? item.usersList.map(u => u.email).join("<br>") : "-"}</td>
      <td class="${item.status === "Aktif" ? "status-aktif" : "status-tidak-aktif"}">${item.status}</td>
      <td>${formatDate(item.tanggalInput)}</td>
      <td>
        <button class="delete-users-btn" data-guru="${item.nomor}">User</button>
        <button class="delete-all-btn" data-guru="${item.nomor}">ALL</button>
      </td>
    `;
    guruTableBody.appendChild(row);
  });

  // 🔹 Tampilkan info status
  if (typeof infoContainer !== "undefined" && infoContainer) {
    const circleColor = filteredData.length > 0 ? "#28a745" : "#dc3545"; // hijau jika ada, merah jika kosong
    infoContainer.innerHTML = `
      <span class="status-circle" style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color: ${circleColor}; margin-right:5px;"></span>
      Menampilkan ${filteredData.length === 0 ? 0 : start + 1}-${end} dari ${filteredData.length} data
    `;
  }

  prevBtn.disabled = page === 1;
  nextBtn.disabled = end >= filteredData.length;
}


// ── Event Tambah No.Guru ──
addGuruBtn.addEventListener("click", async ()=>{
  const nomor = guruInput.value.trim();
  if(!nomor){
    showPopup("No.Guru tidak boleh kosong!","error");
    return;
  }

  try{
    const guruRef = collection(db, "guru");
    const q = query(guruRef, where("nomor","==",nomor));
    const snap = await getDocs(q);

    if(!snap.empty){
      showPopup("No.Guru sudah ada!","error");
      return;
    }

    await addDoc(guruRef, { nomor, tanggalInput: new Date() });
    showPopup(`No.Guru ${nomor} berhasil ditambahkan!`, "success");
    guruInput.value = "";

    await fetchAllGuru();
    currentPage = 1;
    displayPage(currentPage);

  }catch(err){
    showPopup("Error: "+err.message,"error");
  }
});

// ── Search input ──
const searchInput = document.createElement("input");
searchInput.type="text";
searchInput.placeholder="Cari No.Guru atau Nama Pendaftar...";
searchInput.style.width="100%";
searchInput.style.padding="8px";
searchInput.style.marginBottom="10px";
searchContainer.appendChild(searchInput);

searchInput.addEventListener("input",()=>{
  searchTerm = searchInput.value.trim().toLowerCase();
  currentPage = 1;
  displayPage(currentPage);
});

// ── Pagination ──
const paginationContainer = document.createElement("div");
paginationContainer.style.marginTop="10px";
paginationContainer.style.textAlign="center";

const prevBtn = document.createElement("button");
prevBtn.textContent="Previous";
prevBtn.style.marginRight="10px";

const nextBtn = document.createElement("button");
nextBtn.textContent="Next";

paginationContainer.appendChild(prevBtn);
paginationContainer.appendChild(nextBtn);
containerForm2.appendChild(paginationContainer);

prevBtn.addEventListener("click", ()=>{
  if(currentPage>1){
    currentPage--;
    displayPage(currentPage);
  }
});
nextBtn.addEventListener("click", ()=>{
  currentPage++;
  displayPage(currentPage);
});
// ── Hapus DataGuru / guru ──
guruTableBody.addEventListener("click", async (e)=>{
  const guruToDelete = e.target.dataset.guru;
  if(!guruToDelete) return;

  try{
    const usersRef = collection(db,"DataGuru");
    // Ganti field "guru" menjadi "nomor"
    const qUsers = query(usersRef, where("nomor","==",guruToDelete));
    const userSnap = await getDocs(qUsers);

    if(e.target.classList.contains("delete-users-btn")){
      if(!confirm(`Hapus semua pengguna dengan No.Guru ${guruToDelete}?`)) return;
      for(const docSnap of userSnap.docs){
        await deleteDoc(doc(db,"DataGuru",docSnap.id));
      }
      showPopup(`Semua pengguna dengan No.Guru ${guruToDelete} berhasil dihapus`,"success");
    }else if(e.target.classList.contains("delete-all-btn")){
      if(!confirm(`Hapus No.Guru ${guruToDelete} beserta semua pengguna terkait?`)) return;
      for(const docSnap of userSnap.docs){
        await deleteDoc(doc(db,"DataGuru",docSnap.id));
      }
      const guruRef = collection(db,"guru");
      const qGuru = query(guruRef,where("nomor","==",guruToDelete));
      const guruSnap = await getDocs(qGuru);
      for(const docSnap of guruSnap.docs){
        await deleteDoc(doc(db,"guru",docSnap.id));
      }
      showPopup(`No.Guru ${guruToDelete} dan semua pengguna terkait berhasil dihapus`,"success");
    }

    await fetchAllGuru();
    displayPage(currentPage);

  }catch(err){
    showPopup("Error: "+err.message,"error");
  }
});

// ── Load awal ──
(async function init(){
  await fetchAllGuru();
  displayPage(currentPage);
})();
function setupRefreshNote() {
  let refreshContainer = document.getElementById("refresh-container");
  if (!refreshContainer) {
    refreshContainer = document.createElement("div");
    refreshContainer.id = "refresh-container";
    refreshContainer.style.marginBottom = "10px";
    refreshContainer.innerHTML = `
      <span id="refresh-note" style="font-size:0.9em; color:#555;">
        ⏳ Jika lebih dari 5 detik data belum muncul, tekan 
        <span class="refresh-link" style="color:#007bff; cursor:pointer;" onclick="location.reload()">refresh</span>
      </span>
    `;
    
    // Ganti statusEl dengan container yang pasti ada, misal searchContainer
    searchContainer.parentElement.insertBefore(refreshContainer, searchContainer);
  }
}
setupRefreshNote();
