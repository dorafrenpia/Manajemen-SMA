// ======= Pengembalian.js =======
import { db } from "/js/firebase.js";
import { 
  collection, addDoc, serverTimestamp, getDocs, 
  query, where, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const form = document.getElementById("barangForm");
const statusEl = document.getElementById("status");
const popup = document.getElementById("popup");
const fotoInput = document.getElementById("fotoPengambilan");
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

        setTimeout(() => {
          sendBtn.disabled = false;
          sendBtn.textContent = "Kirim";
          sendBtn.style.cursor = "pointer";
        }, 3000);
      }
      return false;
    }

    const newStok = stokSekarang - jumlahPinjam;
    await updateDoc(doc(db, "barangMasuk", docId), { jumlahBarang: newStok });

    console.log(`✅ Stok ${namaBarang} dikurangi: ${stokSekarang} → ${newStok}`);
    return true;

  } catch (err) {
    console.error("❌ Gagal cek stok:", err);
    return false;
  }
}

// ===== Fungsi update pengembalian =====
async function updatePengembalian(kodePengajuan) {
  if (!kodePengajuan) return alert("❌ Kode pengajuan kosong!");
  if (!window.uploadedPhotos || !window.uploadedPhotos.length) return alert("❌ Upload minimal 1 foto pengembalian!");

  try {
    const q = query(collection(db, "peminjaman"), where("kodePengajuan", "==", kodePengajuan));
    const snap = await getDocs(q);

    if (snap.empty) return alert("❌ Data dengan kode pengajuan ini tidak ditemukan!");

    snap.forEach(async (d) => {
      await updateDoc(doc(db, "peminjaman", d.id), {
        fotoPengembalian: window.uploadedPhotos.map(f => f.fileLink),
        fotoIdPengembalian: window.uploadedPhotos.map(f => f.fileId)
      });
      console.log(`✅ Foto pengembalian berhasil ditambahkan ke dokumen ID: ${d.id}`);
    });

    alert("✅ Foto pengembalian berhasil disimpan!");
  } catch (err) {
    console.error("❌ Gagal simpan pengembalian:", err);
    alert("❌ Terjadi kesalahan: " + err.message);
  }
}

// ===== Submit Form =====
if (!form) {
  console.warn("Form 'barangForm' tidak ditemukan di halaman.");
} else {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!window.uploadedPhotos || !window.uploadedPhotos.length) {
      alert("❌ Harus ambil dan upload minimal 1 foto ke Google Drive terlebih dahulu!");
      return;
    }

    if (statusEl) statusEl.textContent = "⏳ Menyimpan data...";

    const namaPeminjam = document.getElementById("namaPeminjam")?.value.trim() || "";
    const kelasJabatan = document.getElementById("kelasInput")?.value.trim() || "";
    const tanggalPeminjaman = document.getElementById("tanggalPeminjaman")?.value || "";
    const tipePengajuan = document.querySelector("input[name='tipePengajuan']:checked")?.value || "";
    const keperluan = document.getElementById("keperluanInput")?.value.trim() || "";
    const kodePengajuan = document.getElementById("kodePengajuan")?.value.trim() || "";

    const barangDipinjam = [];
    document.querySelectorAll(".barang-field").forEach((field) => {
      const i = field.dataset.index;
      const namaBarang = document.getElementById(`namaBarang-${i}`)?.value.trim() || "";
      const satuanBarang = document.getElementById(`satuanBarang-${i}`)?.value.trim() || "";
      const jumlahRaw = document.getElementById(`jumlahBarang-${i}`)?.value || "0";
      const jumlahBarang = parseInt(jumlahRaw, 10) || 0;

      if (namaBarang && jumlahBarang > 0) {
        barangDipinjam.push({ namaBarang, satuanBarang, jumlahBarang });
      }
    });

    if (barangDipinjam.length === 0) return alert("❌ Minimal harus ada 1 barang dipinjam!");

    try {
      // 🔹 Cek stok & kurangi
      for (const item of barangDipinjam) {
        const stokOk = await cekStokDanKurangi(item.namaBarang, item.jumlahBarang);
        if (!stokOk) {
          if (statusEl) statusEl.textContent = `❌ Gagal karena stok ${item.namaBarang} tidak cukup.`;
          return;
        }
      }

      // 🔹 Simpan data peminjaman
      await addDoc(collection(db, "peminjaman"), {
        kodePengajuan,
        namaPeminjam,
        kelasJabatan,
        tanggalPeminjaman,
        tipePengajuan,
        keperluan,
        barangDipinjam,
        fotoPengambilan: window.uploadedPhotos.map(f => f.fileLink),
        fotoId: window.uploadedPhotos.map(f => f.fileId),
        email: currentUserEmail,
        createdAt: serverTimestamp()
      });

      // 🔹 Update pengembalian (opsional jika ingin langsung simpan)
      // await updatePengembalian(kodePengajuan);

      if (statusEl) statusEl.textContent = "✅ Data berhasil disimpan!";
      if (popup) popup.innerHTML = `<div style="padding:10px; background:#2ecc71; color:white; border-radius:5px;">
        Data peminjaman berhasil disimpan 🎉
      </div>`;

      // 🔹 Reset form & upload
      form.reset();
      window.uploadedPhotos = [];
      if (fotoInput) {
        fotoInput.value = "";
        fotoInput.dataset.fileId = "";
        fotoInput.dataset.fileLink = "";
      }

      window.updateUploadDebug?.();
      updateSubmitButton();

      // 🔹 Refresh halaman
      setTimeout(() => location.reload(), 1000);

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
