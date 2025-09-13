// verify.js
import { auth, db } from "./firebase.js";
import { applyActionCode } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const statusEl = document.getElementById("status");
const goLogin = document.getElementById("goLogin");

// Ambil kode verifikasi dari URL
const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get("oobCode");

if (!oobCode) {
  statusEl.textContent = "❌ Kode verifikasi tidak ditemukan!";
} else {
  verifyEmail(oobCode);
}

async function verifyEmail(code) {
  try {
    // 🔹 Terapkan kode verifikasi
    await applyActionCode(auth, code);

    // 🔹 Ambil UID dari user yg sedang login (opsional, atau dari pendingUsers)
    const user = auth.currentUser;

    if (user) {
      const pendingRef = doc(db, "pendingUsers", user.uid);
      const snap = await getDoc(pendingRef);

      if (snap.exists()) {
        // 🔹 Pindahkan data ke users
        await setDoc(doc(db, "users", user.uid), {
          ...snap.data(),
          verified: true,
          verifiedAt: new Date()
        });

        // 🔹 Hapus dari pendingUsers
        await deleteDoc(pendingRef);
      }
    }

    statusEl.textContent = "✅ Email berhasil diverifikasi!";
    goLogin.style.display = "inline-block";

    // 🔹 Auto redirect setelah 5 detik
    setTimeout(() => {
      window.location.href = "login.html";
    }, 5000);

  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ Verifikasi gagal: " + err.message;
  }
}
