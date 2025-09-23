import { db } from "./firebase.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", async () => {
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email") || null;

  if (!role || !email) {
    alert("Anda belum login!");
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("role").textContent = role;

  try {
    let ref, q, snap;

    if (role === "guru") {
      ref = collection(db, "DataGuru");
      q = query(ref, where("email", "==", email));
      snap = await getDocs(q);

      if (!snap.empty) {
        const data = snap.docs[0].data();
        document.getElementById("nama").textContent = data.nama;
        document.getElementById("email").textContent = data.email;
        document.getElementById("telepon").textContent = data.telepon;
        document.getElementById("createdAt").textContent = data.createdAt?.toDate().toLocaleString();
        document.getElementById("nomorRow").style.display = "block";
        document.getElementById("nomor").textContent = data.nomor;
      }

    } else if (role === "organisasi") {
      ref = collection(db, "DataOrganisasi");
      q = query(ref, where("email", "==", email));
      snap = await getDocs(q);

      if (!snap.empty) {
        const data = snap.docs[0].data();
        document.getElementById("nama").textContent = data.nama;
        document.getElementById("email").textContent = data.email;
        document.getElementById("telepon").textContent = data.telepon;
        document.getElementById("createdAt").textContent = data.createdAt?.toDate().toLocaleString();
        document.getElementById("nomorOrgRow").style.display = "block";
        document.getElementById("nomorOrg").textContent = data.nomorOrg;
        document.getElementById("ketuaRow").style.display = "block";
        document.getElementById("ketua").textContent = data.ketua;
      }

    } else if (role === "user") {
      ref = collection(db, "users");
      q = query(ref, where("email", "==", email));
      snap = await getDocs(q);

      if (!snap.empty) {
        const data = snap.docs[0].data();
        document.getElementById("nama").textContent = data.nama;
        document.getElementById("email").textContent = data.email;
        document.getElementById("telepon").textContent = data.telepon;
        document.getElementById("createdAt").textContent = data.createdAt?.toDate().toLocaleString();
        document.getElementById("nisnRow").style.display = "block";
        document.getElementById("nisn").textContent = data.nisn;
      }
    } else {
      document.getElementById("nama").textContent = "Tidak dikenali";
    }

  } catch (err) {
    console.error("❌ Gagal ambil data:", err);
    alert("Terjadi kesalahan mengambil data user!");
  }
});
