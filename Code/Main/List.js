// ======= Peminjaman.js =======
import { db } from "/js/firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const tableBody = document.querySelector("#peminjamanTable tbody");
const statusEl = document.getElementById("status");

// helper: ambil semua nilai string dalam array/object yang diawali "https://"
function extractHttpsAll(value) {
  let hasil = [];

  if (!value && value !== "") return hasil;

  if (typeof value === "string") {
    const s = value.trim();
    if (s.startsWith("https://")) {
      hasil.push(s);
    }
    return hasil;
  }

  if (Array.isArray(value)) {
    for (const v of value) {
      hasil = hasil.concat(extractHttpsAll(v));
    }
    return hasil;
  }

  if (typeof value === "object" && value !== null) {
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        hasil = hasil.concat(extractHttpsAll(value[k]));
      }
    }
    return hasil;
  }

  return hasil;
}

async function loadPeminjaman() {
  try {
    statusEl.textContent = "⏳ Memuat data...";

    const querySnapshot = await getDocs(collection(db, "peminjaman"));

    if (querySnapshot.empty) {
      statusEl.textContent = "❌ Tidak ada data peminjaman.";
      tableBody.innerHTML = "";
      return;
    }

    let no = 1;
    tableBody.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // ambil semua link https
      const fotoAmbilArr = extractHttpsAll(data.fotoPengambilan);
      const fotoKembaliArr = extractHttpsAll(data.fotoPengembalian);
// buat link-list dengan button dan CSS
const fotoAmbilHTML =
  fotoAmbilArr.length > 0
    ? fotoAmbilArr
        .map(
          (url, i) =>
            `<button class="foto-btn" onclick="window.open('${url}', '_blank')">📷 Lihat ${i + 1}</button>`
        )
        .join(" ")
    : "Tidak ada Foto";

const fotoKembaliHTML =
  fotoKembaliArr.length > 0
    ? fotoKembaliArr
        .map(
          (url, i) =>
            `<button class="foto-btn" onclick="window.open('${url}', '_blank')">📷 Lihat ${i + 1}</button>`
        )
        .join(" ")
    : "Tidak ada Foto";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${no++}</td>
        <td>${data.tanggalPeminjaman || "-"}</td>
        <td>${data.namaPeminjam || "-"}</td>
        <td>${data.kelasJabatan || "-"}</td>
        <td>${data.namaBarang || "-"}</td>
        <td>${data.jumlahBarang || "-"}</td>
        <td>${data.keperluan || "-"}</td>
        <td>${fotoAmbilHTML}</td>
        <td>${fotoKembaliHTML}</td>
      `;
      tableBody.appendChild(row);
    });

    statusEl.textContent = "✅ Data berhasil dimuat.";
  } catch (err) {
    console.error("Error load data:", err);
    statusEl.textContent = "❌ Gagal memuat data.";
  }
}

// Jalankan saat halaman dibuka
loadPeminjaman();
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