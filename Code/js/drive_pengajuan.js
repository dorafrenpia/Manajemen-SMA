// drive_pengajuan.js (multi-upload)
import { auth, provider } from "./firebase.js";

// ===== Variabel Google Drive =====
const FOLDER_ID = "13JY_VRcLnsLIYbQ3hlxcpu5gv12XNfpB";
const CLIENT_ID = "1008287671477-rm03r2f3e52h8c95047uk3kjqlo52atn.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient;
window.accessToken = "";
window.uploadedPhotos = []; // array untuk menyimpan semua foto

// ===== Tombol & Elemen =====
const loginBtn = document.getElementById("loginBtn");
const uploadBtn = document.getElementById("uploadBtn");
const captureBtn = document.getElementById("captureBtn");
const fotoPengambilanInput = document.getElementById("fotoPengambilan");
const previewImage = document.getElementById("previewImage");
const uploadInfo = document.getElementById("uploadInfo");
const uploadDebug = document.getElementById("uploadDebug");
const camera = document.getElementById("camera");
const canvas = document.getElementById("canvas");

// ===== Tombol state =====
function setButtonState(isLoggedIn) {
  [uploadBtn, captureBtn].forEach(btn => {
    if (btn) {
      btn.disabled = !isLoggedIn;
      btn.style.opacity = isLoggedIn ? "1" : "0.6";
      btn.style.cursor = isLoggedIn ? "pointer" : "not-allowed";
    }
  });
}

// ===== Update tombol login/logout =====
window.updateLoginButton = function () {
  const isLoggedInDrive = localStorage.getItem("isDriveLoggedIn") === "true";
  if (!loginBtn) return;

  if (isLoggedInDrive) {
    loginBtn.textContent = "Logout Google Drive";
    loginBtn.style.backgroundColor = "red";
    loginBtn.style.color = "white";
    loginBtn.disabled = false;
    setButtonState(true);

    loginBtn.onclick = () => {
      window.accessToken = "";
      localStorage.removeItem("isDriveLoggedIn");
      localStorage.removeItem("driveAccessToken");
      setButtonState(false);
      window.updateLoginButton();
      uploadDebug.textContent = "🔹 Logout berhasil";
    };
  } else {
    loginBtn.textContent = "Login Google Drive";
    loginBtn.style.backgroundColor = "green";
    loginBtn.style.color = "white";
    loginBtn.disabled = false;
    setButtonState(false);

    loginBtn.onclick = () => {
      loginBtn.disabled = true;
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          loginBtn.disabled = false;
          if (tokenResponse.access_token) {
            window.accessToken = tokenResponse.access_token;
            localStorage.setItem("isDriveLoggedIn", "true");
            localStorage.setItem("driveAccessToken", window.accessToken);
            setButtonState(true);
            window.updateLoginButton();
            uploadDebug.textContent = "🔹 Login berhasil, siap upload";
          } else {
            uploadDebug.textContent = "❌ Login gagal";
          }
        },
      });
      tokenClient.requestAccessToken();
    };
  }
};

// ===== Ambil token saat load =====
if (localStorage.getItem("isDriveLoggedIn") === "true") {
  window.accessToken = localStorage.getItem("driveAccessToken");
  setButtonState(true);
  uploadDebug.textContent = "🔹 Token ditemukan, tombol aktif";
} else {
  setButtonState(false);
}

// ===== Panggil update tombol =====
window.updateLoginButton();

// ===== Kamera & Capture Foto =====
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    camera.srcObject = stream;
  } catch (err) {
    console.error(err);
    uploadDebug.textContent = "❌ Gagal akses kamera: " + err.message;
  }
}
startCamera();

captureBtn.addEventListener("click", () => {
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(camera, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  fotoPengambilanInput.value = dataUrl;
  previewImage.src = dataUrl;
  uploadInfo.textContent = "📷 Foto sudah diambil, siap diupload";
  uploadDebug.textContent = "🔹 Foto diambil, base64 siap";
  uploadBtn.disabled = false; // aktifkan upload untuk setiap foto
  uploadBtn.style.opacity = "1";
  uploadBtn.style.cursor = "pointer";
});

// ===== Upload ke Drive =====
async function uploadToDrive(base64Image, token) {
  const metadata = {
    name: `Foto_${Date.now()}.png`,
    parents: [FOLDER_ID]
  };

  const form = new FormData();
  const blob = await (await fetch(base64Image)).blob();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: form
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// ===== Tombol Upload (Multi) =====
uploadBtn.addEventListener("click", async () => {
  if (!fotoPengambilanInput.value) {
    alert("Ambil foto dulu sebelum upload!");
    uploadDebug.textContent = "❌ Belum ada foto diambil";
    return;
  }
  if (!window.accessToken) {
    alert("Harus login Google Drive dulu!");
    uploadDebug.textContent = "❌ Belum login Google Drive";
    return;
  }

  uploadInfo.textContent = "⏳ Sedang upload ke Drive...";
  uploadDebug.textContent = "🔹 Upload dimulai...";

  try {
    const result = await uploadToDrive(fotoPengambilanInput.value, window.accessToken);
    console.log(result);
    uploadInfo.textContent = "✅ Foto berhasil diupload ke Drive";
    uploadDebug.textContent += `\n✅ Upload sukses, ID: ${result.id}`;

    // Simpan ke array global (multi-upload)
    window.uploadedPhotos.push({
      fileId: result.id,
      fileLink: `https://drive.google.com/uc?id=${result.id}`
    });

    // Simpan ke dataset input hidden untuk Peminjaman.js
    fotoPengambilanInput.dataset.fileId = window.uploadedPhotos.map(f => f.fileId).join(",");
    fotoPengambilanInput.dataset.fileLink = window.uploadedPhotos.map(f => f.fileLink).join(",");

    // Reset foto untuk ambil lagi
    fotoPengambilanInput.value = "";
    previewImage.src = "";
    uploadInfo.textContent = "📷 Ambil foto berikutnya atau submit form";
    uploadBtn.disabled = true;
    uploadBtn.style.opacity = "0.6";
    uploadBtn.style.cursor = "not-allowed";

    // Update tombol submit
    if (window.updateSubmitButton) window.updateSubmitButton();

    // Debug: tampil semua foto
    uploadDebug.textContent += "\n🔹 Total foto diarray: " + window.uploadedPhotos.length;

  } catch (err) {
    console.error(err);
    uploadInfo.textContent = "❌ Gagal upload: " + err.message;
    uploadDebug.textContent = "❌ Error upload: " + err.message;
  }
});
