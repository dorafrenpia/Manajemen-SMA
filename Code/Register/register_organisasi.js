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
const orgForm = document.getElementById("orgForm");
const statusMsg = document.getElementById("status"); // <p id="status"></p> di HTML

orgForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const ketua = document.getElementById("ketua").value.trim();
  const nomorOrg = document.getElementById("nomorOrg").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const email = document.getElementById("email").value.trim();
  const telepon = document.getElementById("telepon").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validasi dasar
  if (!ketua || !nomorOrg || !nama || !email || !telepon || !password || !confirmPassword) {
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

    // Cek apakah nomor organisasi sudah digunakan
    const nomorQuery = query(collection(db, "organisasi"), where("nomorOrg", "==", nomorOrg));
    const nomorSnapshot = await getDocs(nomorQuery);

    if (!nomorSnapshot.empty) {
      statusMsg.textContent = "❌ Nomor organisasi sudah digunakan!";
      statusMsg.style.color = "red";
      return;
    }

    // Buat akun di Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Kirim email verifikasi
    await sendEmailVerification(user);

    // Simpan data organisasi ke Firestore
    await addDoc(collection(db, "DataOrganisasi"), {
      uid: user.uid,
      ketua,
      nomorOrg,
      nama,
      email,
      telepon,
      verified: false,
      createdAt: new Date()
    });

    // Reset form
    orgForm.reset();

    statusMsg.textContent = "✅ Registrasi organisasi berhasil! Periksa email untuk verifikasi.";
    statusMsg.style.color = "green";

  } catch (error) {
    console.error("Error register organisasi:", error);
    statusMsg.textContent = "❌ Gagal registrasi: " + error.message;
    statusMsg.style.color = "red";
  }
});
