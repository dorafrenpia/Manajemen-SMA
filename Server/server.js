// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const { google } = require("googleapis");
const { PassThrough } = require("stream");

// ===== Express setup =====
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Multer setup (memoryStorage) =====
const upload = multer({ storage: multer.memoryStorage() });

// ===== Google Drive setup =====
const KEYFILEPATH = path.join(__dirname, "service-account.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const auth = new google.auth.GoogleAuth({ keyFile: KEYFILEPATH, scopes: SCOPES });
const drive = google.drive({ version: "v3", auth });

// ===== Folder ID Google Drive =====
const FOLDER_ID = "13JY_VRcLnsLIYbQ3hlxcpu5gv12XNfpB";

// ===== Upload endpoint =====
app.post("/upload", upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "File foto tidak ada" });

    // Buat buffer menjadi readable stream
    const bufferStream = new PassThrough();
    bufferStream.end(req.file.buffer);

    // Upload ke Google Drive
    const fileMetadata = { name: req.file.originalname, parents: [FOLDER_ID] };
    const media = { mimeType: req.file.mimetype, body: bufferStream };
    const file = await drive.files.create({ resource: fileMetadata, media: media, fields: "id, webViewLink" });

    // Kirim link kembali ke front-end
    res.json({ success: true, link: file.data.webViewLink });
  } catch (err) {
    console.error("❌ Error upload ke Drive:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Jalankan server =====
const PORT = 3000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
