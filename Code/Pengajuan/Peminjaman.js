// ======= Peminjaman.js =======
import { db } from "/js/firebase.js";
import { 
  collection, addDoc, serverTimestamp, getDocs, 
  query, where, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const form = document.getElementById("barangForm");
const statusEl = document.getElementById("status");
const popup = document.getElementById("popup");
const fotoPengambilanInput = document.getElementById("fotoPengambilan");
const sendBtn = form?.querySelector("button[type='submit']");

// 🔹 Ambil email user dari localStorage (login.js sudah simpan)
const currentUserEmail = localStorage.getItem("email") || "";
console.log("Email user:", currentUserEmail);

// 🔹 Cek koneksi Firestore
async function cekKoneksi() {
  try {
    await getDocs(collection(db, "barangMasuk"));
    if (statusEl) statusEl.textContent = "🟢 Terhubung ke Database!";
  } catch (err) {
    console.error("❌ Gagal koneksi:", err);
    if (statusEl) statusEl.textContent = `❌ Gagal koneksi Database: ${err.message}`;
  }
}
cekKoneksi();

// ===== Fungsi enable/disable tombol submit =====
function updateSubmitButton() {
  const isPhotoReady = window.uploadedPhotos && window.uploadedPhotos.length > 0;
  if (sendBtn) {
    sendBtn.disabled = !isPhotoReady;
    sendBtn.style.opacity = isPhotoReady ? "1" : "0.5";
    sendBtn.style.cursor = isPhotoReady ? "pointer" : "not-allowed";
  }
}

// Panggil saat load
updateSubmitButton();

// ===== Fungsi cek stok & kurangi =====
async function cekStokDanKurangi(namaBarang, jumlahPinjam) {
  try {
    const q = query(collection(db, "barangMasuk"), where("namaBarang", "==", namaBarang));
    const snap = await getDocs(q);

    if (snap.empty) {
      alert("❌ Barang tidak ditemukan di database!");
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Barang tidak ada";
        sendBtn.style.cursor = "not-allowed";
      }
      return false;
    }

    let docId = "";
    let stokSekarang = 0;

    snap.forEach((d) => {
      docId = d.id;
      stokSekarang = d.data().jumlahBarang || 0;
    });

    if (stokSekarang < jumlahPinjam) {
      alert("❌ Stok tidak cukup. Stok tersedia: " + stokSekarang);
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = "Barang tidak cukup";
        sendBtn.style.cursor = "not-allowed";
      }
      return false;
    }

    // Kurangi stok
    const newStok = stokSekarang - jumlahPinjam;
    await updateDoc(doc(db, "barangMasuk", docId), {
      jumlahBarang: newStok
    });

    console.log(`✅ Stok ${namaBarang} dikurangi: ${stokSekarang} → ${newStok}`);
    return true;
  } catch (err) {
    console.error("❌ Gagal cek stok:", err);
    return false;
  }
}

// ===== Submit Form =====
if (!form) {
  console.warn("Form 'barangForm' tidak ditemukan di halaman.");
} else {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Pastikan minimal 1 foto sudah di-upload
    if (!window.uploadedPhotos || !window.uploadedPhotos.length) {
      alert("❌ Harus ambil dan upload minimal 1 foto ke Google Drive terlebih dahulu!");
      return;
    }

    if (statusEl) statusEl.textContent = "⏳ Menyimpan data...";

    // Ambil data dari form
    const namaPeminjam = document.getElementById("namaPeminjam")?.value.trim() || "";
    const kelasJabatan = document.getElementById("kelasInput")?.value.trim() || "";
    const namaBarang = document.getElementById("namaBarang")?.value.trim() || "";
    const jumlahRaw = document.getElementById("jumlahBarang")?.value || "0";
    const jumlahBarang = parseInt(jumlahRaw, 10) || 0;
    const tanggalPeminjaman = document.getElementById("tanggalPeminjaman")?.value || "";
    const keperluan = document.getElementById("keperluanInput")?.value.trim() || "";

    try {
      // 🔹 Cek stok dulu
      const stokOk = await cekStokDanKurangi(namaBarang, jumlahBarang);
      if (!stokOk) {
        if (statusEl) statusEl.textContent = "❌ Gagal karena stok barang tidak cukup.";
        return; // stop, jangan lanjut simpan
      }

      // 🔹 Simpan data peminjaman
      await addDoc(collection(db, "peminjaman"), {
        namaPeminjam,
        kelasJabatan,
        namaBarang,
        jumlahBarang,
        tanggalPeminjaman,
        keperluan,
        fotoPengambilan: window.uploadedPhotos.map(f => f.fileLink),
        fotoId: window.uploadedPhotos.map(f => f.fileId),
        email: currentUserEmail, // ambil dari localStorage
        createdAt: serverTimestamp()
      });

      if (statusEl) statusEl.textContent = "✅ Data berhasil disimpan!";
      if (popup) popup.innerHTML = `<div style="padding:10px; background:#2ecc71; color:white; border-radius:5px;">
        Data peminjaman berhasil disimpan 🎉
      </div>`;

      form.reset();

      // Reset array foto & input
      window.uploadedPhotos = [];
      if (fotoPengambilanInput) {
        fotoPengambilanInput.value = "";
        fotoPengambilanInput.dataset.fileId = "";
        fotoPengambilanInput.dataset.fileLink = "";
      }

      // Update debug & tombol submit
      window.updateUploadDebug?.();
      updateSubmitButton(); // tombol submit disable lagi

    } catch (error) {
      console.error("❌ Error simpan data:", error);
      if (statusEl) statusEl.textContent = "❌ Gagal menyimpan data.";
      if (popup) popup.innerHTML = `<div style="padding:10px; background:#e74c3c; color:white; border-radius:5px;">
        Terjadi kesalahan: ${error.message}
      </div>`;
    }
  });
}

// ===== Update tombol submit setiap kali foto diupload =====
window.updateSubmitButton = updateSubmitButton;
