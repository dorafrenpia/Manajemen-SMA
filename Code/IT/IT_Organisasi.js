import { db } from "../js/firebase.js";
import { collection, getDocs, addDoc, query, where, deleteDoc, doc } 
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// Elemen HTML
const orgInput = document.getElementById("orgInput");
const addOrgBtn = document.getElementById("addOrgBtn");
const popup = document.getElementById("popup");
const orgTableBody = document.querySelector("#orgTable tbody");
const searchContainer = document.getElementById("searchContainer");
const containerForm2 = document.querySelector(".containerForm2");

let allOrgs = [];
let currentPage = 1;
const pageSize = 10;
let searchTerm = "";

// Format tanggal
function formatDate(value) {
  if (!value) return "-";
  if (value.toDate) {
    const d = value.toDate();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } else if (typeof value === "string") {
    return value;
  }
  return "-";
}

// Popup
function showPopup(msg, type = "info", duration = 3000){
  if(!popup) return;
  popup.textContent = msg;
  popup.className = "popup show " + type;
  setTimeout(()=>{ popup.className = "popup"; }, duration);
}

// Ambil semua data organisasi
async function fetchAllOrgs() {
  const orgSnap = await getDocs(collection(db, "organisasi"));
  const dataSnap = await getDocs(collection(db, "DataOrganisasi"));

  // Map DataOrganisasi berdasar nomorOrg
  const dataMap = {};
  dataSnap.docs.forEach(d => {
    const data = d.data();
    if (data.nomorOrg) dataMap[data.nomorOrg] = data;
  });

  allOrgs = orgSnap.docs.map(d => {
    const nomor = d.data().nomorOrg || "-";
    const data = dataMap[nomor] || {};
    return {
      nomor,
      ketua: data.ketua || "-",
      nama: data.nama || "-",
      email: data.email || "-",
      status: data.nomorOrg ? "Aktif" : "Tidak Aktif",
      tanggalInput: formatDate(data.createdAt)
    };
  });
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

    allOrgs.sort((a, b) => {
      let valA = a[column] || "";
      let valB = b[column] || "";

      // Pastikan string dibandingkan case-insensitive
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    displayPage(currentPage);
  });
});
// Tampilkan tabel sesuai table HTML
function displayPage(page) {
  orgTableBody.innerHTML = "";

  // Filter data sesuai search
  const filtered = allOrgs.filter(item => {
    return item.nomor.toLowerCase().includes(searchTerm) ||
           item.nama.toLowerCase().includes(searchTerm) ||
           item.ketua.toLowerCase().includes(searchTerm);
  });

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, filtered.length);

  // Tampilkan baris
  filtered.slice(start, end).forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${item.nomor}</td>
      <td>${item.nama}</td>
      <td>${item.ketua}</td>
      <td>${item.email}</td>
      <td class="${item.status === "Aktif" ? "status-aktif" : "status-tidak-aktif"}">${item.status}</td>
      <td>${item.tanggalInput}</td>
      <td>
        <button class="delete-users-btn" data-org="${item.nomor}">User</button>
        <button class="delete-all-btn" data-org="${item.nomor}">ALL</button>
      </td>
    `;
    orgTableBody.appendChild(row);
  });

  // 🔹 Tampilkan info status
  if (typeof infoContainer !== "undefined" && infoContainer) {
    let circleColor = filtered.length > 0 ? "#28a745" : "#dc3545"; // hijau jika ada, merah jika kosong
    infoContainer.innerHTML = `
      <span class="status-circle" style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color: ${circleColor}; margin-right:5px;"></span>
      Menampilkan ${start + 1}-${end} dari ${filtered.length} data
    `;
  }

  // Pagination
  prevBtn.disabled = page === 1;
  nextBtn.disabled = end >= filtered.length;
}

// Search input
const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.placeholder = "Cari No.Organisasi, Nama Pendaftar, atau Ketua...";
searchInput.style.width="100%";
searchInput.style.padding="8px";
searchInput.style.marginBottom="10px";
searchContainer.appendChild(searchInput);

searchInput.addEventListener("input", ()=>{
  searchTerm = searchInput.value.trim().toLowerCase();
  currentPage = 1;
  displayPage(currentPage);
});

// Pagination
const paginationContainer = document.createElement("div");
paginationContainer.style.marginTop="10px";
paginationContainer.style.textAlign="center";

const prevBtn = document.createElement("button");
prevBtn.textContent = "Previous";
prevBtn.style.marginRight="10px";
const nextBtn = document.createElement("button");
nextBtn.textContent = "Next";

paginationContainer.appendChild(prevBtn);
paginationContainer.appendChild(nextBtn);
containerForm2.appendChild(paginationContainer);

prevBtn.addEventListener("click", ()=>{ if(currentPage>1){ currentPage--; displayPage(currentPage); }});
nextBtn.addEventListener("click", ()=>{ currentPage++; displayPage(currentPage); });

// Hapus tombol
orgTableBody.addEventListener("click", async (e)=>{
  const nomor = e.target.dataset.org;
  if(!nomor) return;

  try{
    if(e.target.classList.contains("delete-users-btn")){
      if(!confirm(`Hapus semua pengguna DataOrganisasi ${nomor}?`)) return;
      const dataRef = collection(db,"DataOrganisasi");
      const q = query(dataRef, where("nomorOrg","==",nomor));
      const snap = await getDocs(q);
      for(const docSnap of snap.docs){
        await deleteDoc(doc(db,"DataOrganisasi",docSnap.id));
      }
      showPopup(`Semua pengguna DataOrganisasi ${nomor} berhasil dihapus`,"success");
    } else if(e.target.classList.contains("delete-all-btn")){
      if(!confirm(`Hapus No.Organisasi ${nomor} beserta semua DataOrganisasi terkait?`)) return;
      // Hapus DataOrganisasi
      const dataRef = collection(db,"DataOrganisasi");
      const q = query(dataRef, where("nomorOrg","==",nomor));
      const snap = await getDocs(q);
      for(const docSnap of snap.docs){
        await deleteDoc(doc(db,"DataOrganisasi",docSnap.id));
      }
      // Hapus organisasi
      const orgRef = collection(db,"organisasi");
      const q2 = query(orgRef, where("nomorOrg","==",nomor));
      const snap2 = await getDocs(q2);
      for(const docSnap of snap2.docs){
        await deleteDoc(doc(db,"organisasi",docSnap.id));
      }
      showPopup(`No.Organisasi ${nomor} dan semua DataOrganisasi terkait berhasil dihapus`,"success");
    }

    await fetchAllOrgs();
    displayPage(currentPage);

  }catch(err){
    showPopup("Error: "+err.message,"error");
  }
});

// Tambah nomor organisasi baru
addOrgBtn.addEventListener("click", async ()=>{
  const nomor = orgInput.value.trim();
  if(!nomor){ showPopup("No.Organisasi tidak boleh kosong!","error"); return; }
  try{
    await addDoc(collection(db,"organisasi"), { nomorOrg: nomor, createdAt: new Date() });
    showPopup(`Nomor organisasi ${nomor} berhasil ditambahkan!`,"success");
    orgInput.value = "";
    await fetchAllOrgs();
    displayPage(currentPage);
  } catch(err){
    showPopup("Error: "+err.message,"error");
  }
});

// Load awal
(async function init(){
  await fetchAllOrgs();
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
