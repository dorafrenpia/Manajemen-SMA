// ======= SavePengajuan.js =======
import { db } from "/js/firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const form = document.getElementById("barangForm");
const kodePengajuanEl = document.getElementById("kodePengajuan");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    // Ambil semua data barang
    const barangList = [];
    document.querySelectorAll(".barang-field").forEach(field => {
      const idx = field.dataset.index;
      const barang = {
        namaBarang: document.getElementById(`namaBarang-${idx}`).value,
        jumlahBarang: parseInt(document.getElementById(`jumlahBarang-${idx}`).value) || 0,
        hargaSatuan: parseFloat(document.getElementById(`hargaSatuan-${idx}`).value) || 0,
        totalHarga: parseFloat(document.getElementById(`totalHarga-${idx}`).value) || 0,
        catatanDivisi: document.getElementById(`catatanDivisi-${idx}`).value || ""
      };
      barangList.push(barang);
    });

    // Hitung total keseluruhan
    const totalKeseluruhan = barangList.reduce((sum, b) => sum + b.totalHarga, 0);

    // Ambil email & nomor organisasi dari localStorage
    const emailUser = localStorage.getItem("email") || "unknown";
    const nomorOrg = localStorage.getItem("nomor") || "000";

    // Data final
    const dataPengajuan = {
      kodePengajuan: kodePengajuanEl.value,   // dari kodepengajuan.js
      email: emailUser,
      nomorOrganisasi: nomorOrg,
      barang: barangList,
      totalKeseluruhan: totalKeseluruhan,
      createdAt: serverTimestamp()
    };

    // Simpan ke Firestore (❌ jangan duplikat)
    await addDoc(collection(db, "DataPengajuanOrganisasi"), dataPengajuan);

    alert("✅ Pengajuan berhasil disimpan!");

    // Reset form
    form.reset();

    // Generate kode baru
    window.dispatchEvent(new Event("DOMContentLoaded"));

  } catch (err) {
    console.error("❌ Error menyimpan:", err);
    alert("Gagal menyimpan data!");
  }
});
