// Ambil elemen
const previewImage = document.getElementById("previewImage");
const uploadInfo = document.getElementById("uploadInfo");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.getElementById("closeModal");
const fotoPengambilanInput = document.getElementById("fotoPengambilan");

// =======================
// Fungsi tampil preview
// =======================
function tampilkanPreview(base64) {
  if (!base64) {
    previewImage.style.display = "none";
    uploadInfo.textContent = "📷 Belum ada foto diambil";
    return;
  }

  // Tampilkan preview kecil
  previewImage.src = base64;
  previewImage.style.display = "block";
  uploadInfo.textContent = "📷 Foto sudah diambil, siap diupload";

  // Set modal image juga
  modalImage.src = base64;

  // Set hidden input
  if (fotoPengambilanInput) {
    fotoPengambilanInput.value = base64;
  }
}

// =======================
// Klik preview untuk buka modal fullscreen
// =======================
previewImage.addEventListener("click", () => {
  if (modalImage.src) {
    imageModal.style.display = "flex";
  }
});

closeModal.addEventListener("click", () => {
  imageModal.style.display = "none";
});

imageModal.addEventListener("click", (e) => {
  if (e.target === imageModal) imageModal.style.display = "none";
});

// =======================
// Contoh update preview dari canvas
// Misal ini dari tombol capture
// =======================
const captureBtn = document.getElementById("captureBtn");
const canvas = document.getElementById("canvas");
const camera = document.getElementById("camera");

captureBtn.addEventListener("click", () => {
  // ambil frame dari video
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  canvas.getContext("2d").drawImage(camera, 0, 0);
  const base64 = canvas.toDataURL("image/png");

  // Tampilkan preview
  tampilkanPreview(base64);

  // Simpan di array uploadedPhotos (multi upload nanti bisa push)
  window.uploadedPhotos = window.uploadedPhotos || [];
  window.uploadedPhotos.push({
    fileId: "", // nanti diisi setelah upload ke Drive
    fileLink: base64
  });

  console.log("🔹 Foto diambil, base64 siap");
});
