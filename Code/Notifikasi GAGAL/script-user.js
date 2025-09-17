import { messaging } from "./firebase.js";
import { getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging.js";

const debugDiv = document.getElementById("debug");
function log(msg) {
  const p = document.createElement("p");
  p.textContent = msg;
  debugDiv.appendChild(p);
  debugDiv.scrollTop = debugDiv.scrollHeight;
}

const currentUserRole = "user";
document.getElementById("role").textContent = currentUserRole;

log("Memulai inisialisasi user...");

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./firebase-messaging-sw.js')
    .then(registration => console.log('Service Worker terdaftar:', registration.scope))
    .catch(err => console.log('Service Worker gagal:', err));
}


// Izin notifikasi & ambil token
Notification.requestPermission().then(permission => {
  if (permission === "granted") {
    log("Izin notifikasi granted.");
    getToken(messaging, { vapidKey: "BPsL_FHMxiawROaakIYymGb-7DwFRA1au3lwpmSAcVbgQrCJIwxSGF1znnkyxh44JGp0Q7BNc3J1VaneigyRVXM" })
  .then(token => {
        log("FCM Token (user): " + token);
        fetch("/register-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, role: currentUserRole })
        }).then(() => log("Token user dikirim ke backend"));
      }).catch(err => log("Gagal ambil token: " + err));
  } else log("Notifikasi ditolak user");
});

// Tangkap notifikasi saat tab aktif
onMessage(messaging, payload => {
  const { title, body } = payload.notification;
  log(`Notifikasi diterima (user): ${title} - ${body}`);
  alert(`Notifikasi: ${title} - ${body}`);
});
document.getElementById("notify-btn").addEventListener("click", () => {
  const message = "User menekan tombol!";
  const url = `/send-notification?message=${encodeURIComponent(message)}`;

  fetch(url)
    .then(res => res.text())
    .then(text => log("Response backend: " + text))
    .catch(err => log("Gagal kirim notifikasi: " + err));
});

