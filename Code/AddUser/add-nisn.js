import { db } from "./firebase.js";
import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const nisnInput = document.getElementById("nisnInput");
const addBtn = document.getElementById("addBtn");
const popup = document.getElementById("popup");

// Fungsi untuk menampilkan popup
function showPopup(message, type = "info", duration = 3000) {
  popup.textContent = message;
  popup.className = "popup show " + type;
  setTimeout(() => {
    popup.className = "popup";
  }, duration);
}

// Event klik tombol Tambah NISN
addBtn.addEventListener("click", async () => {
  const nisn = nisnInput.value.trim();
  if (!nisn) {
    showPopup("NISN tidak boleh kosong!", "error");
    return;
  }

  try {
    // cek apakah NISN sudah ada
    const nisnRef = collection(db, "nisn");
    const q = query(nisnRef, where("nisn", "==", nisn));
    const snap = await getDocs(q);

    if (!snap.empty) {
      showPopup("NISN sudah ada!", "error");
      return;
    }

    // tambah NISN baru
    await addDoc(nisnRef, { nisn });
    showPopup(`NISN ${nisn} berhasil ditambahkan!`, "success");
    nisnInput.value = "";

  } catch (error) {
    showPopup("Error: " + error.message, "error");
  }
});
