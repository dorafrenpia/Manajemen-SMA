import { db } from "/js/firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// 🔹 Status koneksi terpisah
const statusKoneksiEl = document.getElementById("statusKoneksi");
const statusEl = document.getElementById("status"); // untuk refresh note

// 🔹 Buat teks refresh sekali saja
function setupRefreshNote() {
  let refreshContainer = document.getElementById("refresh-container");
  if (!refreshContainer) {
    refreshContainer = document.createElement("div");
    refreshContainer.id = "refresh-container";
    refreshContainer.innerHTML = `
      <span id="refresh-note">
        ⏳ Jika lebih dari 5 detik tidak terhubung Database, tekan 
        <span class="refresh-link" onclick="location.reload()">refresh</span>
      </span>
    `;
    statusEl.parentElement.insertBefore(refreshContainer, statusEl);
  }
}
setupRefreshNote();

// 🔹 Fungsi setStatus untuk ubah class dan teks
function setStatus(status, text) {
  statusKoneksiEl.classList.remove("loading", "success", "error");
  statusKoneksiEl.classList.add(status);

  if (text) {
    statusKoneksiEl.textContent = text;
  } else {
    if(status === "loading") statusKoneksiEl.textContent = "⏳ Memuat data...";
    if(status === "success") statusKoneksiEl.textContent = "✅ Terhubung dengan Database";
    if(status === "error") statusKoneksiEl.textContent = "❌ Gagal terhubung ke Database";
  }
}

// 🔹 Cek koneksi ke Firestore
async function cekKoneksiDB() {
  setStatus("loading"); // mulai dengan loading
  try {
    const snap = await getDocs(collection(db, "DataPengajuanOrganisasi"));
    if (!snap.empty) {
      setStatus("success", "✅ Terhubung dengan Database !");
    } else {
      setStatus("success", "⚠️ Terhubung, tapi belum ada data di Database");
    }
  } catch (err) {
    console.error("❌ Error koneksi:", err);
    setStatus("error", "❌ Gagal terhubung ke Database");
  }
}

// Jalankan cek koneksi saat load
cekKoneksiDB();
