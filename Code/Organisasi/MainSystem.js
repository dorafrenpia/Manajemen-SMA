// ===== kodepengajuan.js =====
import { db } from "/js/firebase.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", async () => {
  const kodeInput = document.getElementById("kodePengajuan");
  if (!kodeInput) return;

  // 🔹 Ambil nomor organisasi dari localStorage (sesuai login.js pakai "nomor")
  const nomorOrg = localStorage.getItem("nomor") || "000";

  // 🔹 Format tanggal (YYYYMMDD)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;

  // 🔹 Cek sudah ada berapa pengajuan untuk hari ini
  let urutan = 1;
  try {
    const pengajuanRef = collection(db, "DataPengajuanOrganisasi");
    const q = query(pengajuanRef, where("nomorOrganisasi", "==", nomorOrg));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // filter hanya yang tanggalnya sama dengan hari ini
      const todayDocs = snap.docs.filter(doc => {
        const data = doc.data();
        if (!data.kodePengajuan) return false;
        return data.kodePengajuan.includes(dateStr);
      });

      urutan = todayDocs.length + 1;
    }
  } catch (err) {
    console.error("❌ Gagal cek urutan kodePengajuan:", err);
  }

  // 🔹 Buat kode final
  const kodeFinal = `${nomorOrg}-${dateStr}-${urutan}`;

  // 🔹 Isi ke input
  kodeInput.value = kodeFinal;
});
