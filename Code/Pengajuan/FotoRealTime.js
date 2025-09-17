// ========== Ambil Elemen ==========
const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const previewImage = document.getElementById("previewImage");
const uploadBtn = document.getElementById("uploadBtn");
const uploadInfo = document.getElementById("uploadInfo");
const fotoPengambilan = document.getElementById("fotoPengambilan");

// ==== Zoom foto saat di klik ====
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.getElementById("closeModal");

previewImage.addEventListener("click", () => {
  if (previewImage.src) {
    modalImage.src = previewImage.src;
    imageModal.style.display = "flex";
  }
});
closeModal.addEventListener("click", () => {
  imageModal.style.display = "none";
});
imageModal.addEventListener("click", (e) => {
  if (e.target === imageModal) {
    imageModal.style.display = "none";
  }
});

// ========== Kamera ==========
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
let constraints = { video: true };
if (isMobile) {
  constraints = { video: { facingMode: "user" } }; // kamera depan
}
navigator.mediaDevices.getUserMedia(constraints)
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    alert("Tidak bisa mengakses kamera: " + err);
  });


window.updateCaptureButton = checkDriveLogin;

// ========== Capture Foto ==========
captureBtn.addEventListener("click", () => {
  if (!window.accessToken) {
    alert("Harus login Google Drive dulu sebelum ambil foto!");
    return;
  }

  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = canvas.toDataURL("image/png");

  previewImage.src = imageData;
  previewImage.style.display = "block";
  uploadInfo.textContent = "✅ Foto berhasil diambil";

  fotoPengambilan.value = imageData;

  // aktifkan tombol upload setelah ambil foto
  uploadBtn.disabled = false;
  uploadBtn.style.opacity = "1";
  uploadBtn.style.cursor = "pointer";
});
