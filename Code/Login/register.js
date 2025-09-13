import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  fetchSignInMethodsForEmail 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { 
  collection, 
  addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// Ambil elemen form
const registerForm = document.getElementById("registerForm");
const statusMsg = document.getElementById("status"); // <p id="status"></p> di HTML

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama").value.trim();
  const nisn = document.getElementById("nisn").value.trim();
  const email = document.getElementById("email").value.trim();
  const telepon = document.getElementById("telepon").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validasi dasar
  if (!nama || !nisn || !email || !telepon || !password || !confirmPassword) {
    statusMsg.textContent = "❌ Semua field wajib diisi!";
    statusMsg.style.color = "red";
    return;
  }

  if (password !== confirmPassword) {
    statusMsg.textContent = "❌ Password dan konfirmasi tidak cocok!";
    statusMsg.style.color = "red";
    return;
  }

  try {
    // Cek apakah email sudah dipakai
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      statusMsg.textContent = "❌ Email sudah digunakan!";
      statusMsg.style.color = "red";
      return;
    }

    // Buat akun di Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Kirim email verifikasi (default Firebase page)
    await sendEmailVerification(user);

    // Simpan data user ke Firestore
    await addDoc(collection(db, "users"), {
      uid: user.uid,
      nama,
      nisn,
      email,
      telepon,
      verified: false, // akan diupdate saat login kalau email sudah verified
      createdAt: new Date()
    });

    // Reset form
    registerForm.reset();

    statusMsg.textContent = "✅ Registrasi berhasil! Periksa email untuk verifikasi.";
    statusMsg.style.color = "green";

  } catch (error) {
    console.error("Error register:", error);
    statusMsg.textContent = "❌ Gagal registrasi: " + error.message;
    statusMsg.style.color = "red";
  }
});
