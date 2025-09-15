const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

// Fungsi hapus user + Firestore berdasarkan NISN
exports.deleteUsersByNISN = onRequest(async (req, res) => {
  const nisn = req.query.nisn;
  if (!nisn) return res.status(400).send("NISN dibutuhkan");

  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("nisn", "==", nisn).get();

    for (const docSnap of snapshot.docs) {
      const userData = docSnap.data();
      const uid = userData.uid;

      // Hapus user di Firebase Auth
      if (uid) {
        await admin.auth().deleteUser(uid);
      }

      // Hapus dokumen Firestore
      await usersRef.doc(docSnap.id).delete();
    }

    res.send(`Semua user dengan NISN ${nisn} berhasil dihapus`);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});
