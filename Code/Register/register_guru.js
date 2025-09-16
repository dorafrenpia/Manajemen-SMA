import { auth, db } from "../Login/firebase.js";
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  fetchSignInMethodsForEmail 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// Ambil elemen form
const registerForm = document.getElementById("registerForm");
const statusMsg = document.getElementById("status");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama").value.trim();
  const nomorInput = document.getElementById("nomor").value.trim();
  const nomor = String(nomorInput); // pastikan string
  const email = document.getElementById("email").value.trim();
  const telepon = document.getElementById("telepon").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validasi dasar
  if (!nama || !nomor || !email || !telepon || !password || !confirmPassword) {
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

    // Cek apakah nomor guru ada di collection guru
    const guruQuery = query(collection(db, "guru"), where("nomor", "==", nomor));
    const guruSnapshot = await getDocs(guruQuery);

    if (guruSnapshot.empty) {
      statusMsg.textContent = "❌ Nomor guru tidak tersedia!";
      statusMsg.style.color = "red";
      return;
    }

    // Cek apakah nomor guru sudah digunakan di collection DataGuru
    const dataGuruQuery = query(collection(db, "DataGuru"), where("nomor", "==", nomor));
    const dataGuruSnapshot = await getDocs(dataGuruQuery);

    if (!dataGuruSnapshot.empty) {
      statusMsg.textContent = "❌ Nomor guru sudah digunakan!";
      statusMsg.style.color = "red";
      return;
    }

    // Buat akun di Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Kirim email verifikasi
    await sendEmailVerification(user);

    // Simpan data guru ke DataGuru
    await addDoc(collection(db, "DataGuru"), {
      uid: user.uid,
      nama,
      nomor,
      email,
      telepon,
      verified: false,
      createdAt: new Date()
    });

    // Reset form
    registerForm.reset();

    statusMsg.textContent = "✅ Registrasi berhasil! Periksa email untuk verifikasi.";
    statusMsg.style.color = "green";

  } catch (error) {
    console.error("Error register guru:", error);
    statusMsg.textContent = "❌ Gagal registrasi: " + error.message;
    statusMsg.style.color = "red";
  }
});
