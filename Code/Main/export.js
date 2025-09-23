  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
    import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyCAVsG_cBB_Ksbk4oqkXTH6oTlNKl-p-bU",
      authDomain: "manajemen-sma.firebaseapp.com",
      projectId: "manajemen-sma",
      storageBucket: "manajemen-sma.appspot.com",
      messagingSenderId: "1008287671477",
      appId: "1:1008287671477:web:7829d82b3da953d2598afc",
      measurementId: "G-ZSFSXW3C2C"
    };
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Export Excel
document.getElementById('exportBtn').addEventListener('click', async () => {
  try {
    const snapshot = await getDocs(collection(db, "barangMasuk"));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('BarangMasuk');

    worksheet.columns = [
  { header: 'No', key: 'no', width: 5 },
  { header: 'ID', key: 'id', width: 25 },
  { header: 'Kode', key: 'kode', width: 20 },
  { header: 'Nama', key: 'nama', width: 20 },
  { header: 'Merek', key: 'merek', width: 15 },
  { header: 'Kategori', key: 'kategori', width: 15 },
  { header: 'Jumlah', key: 'jumlah', width: 10 },
  { header: 'Satuan', key: 'satuan', width: 10 },
  { header: 'JenisDana', key: 'jenisDana', width: 15 },
  { header: 'TanggalBarang', key: 'tanggal', width: 15 },
  { header: 'Foto1', key: 'foto', width: 25 },       // Foto sebelum Keterangan
  { header: 'Keterangan', key: 'keterangan', width: 20 }
];

    // Styling header
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF3498DB'} };
      cell.alignment = { horizontal: 'center' };
      cell.border = { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} };
    });
// Fungsi ubah link Google Drive jadi direct download
function driveDirectLink(url) {
  if (!url) return '';
  const match = url.match(/\/d\/(.*?)\//);
  if (match && match[1]) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  return url;
}

let no = 1;
snapshot.forEach(doc => {
  const d = doc.data();

  // Gabungkan semua link foto dengan ' || ' dan ubah ke direct link
  const fotoLinks = (d.fotoLinks || []).map(link => driveDirectLink(link));
  const fotoCell = fotoLinks.join(' || '); // Semua link dalam satu baris

  // Tambahkan row ke worksheet
  worksheet.addRow({
    no: no++,
    id: doc.id,
    kode: d.kodeBarang,
    nama: d.namaBarang,
    merek: d.merek,
    kategori: d.kategori,
    jumlah: d.jumlahBarang,
    satuan: d.satuan,
    jenisDana: d.jenisDana,
    tanggal: d.tanggalBarang,
    foto: fotoCell,       // <-- semua link foto dalam satu sel
    keterangan: d.keterangan
  });
});



    // Export Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'BarangMasuk.xlsx';
    link.click();

    alert('Export berhasil! Excel rapi dan link foto muncul.');
  } catch(err) {
    console.error(err);
    alert('Gagal export Excel!');
  }
});
const exportSheetBtn = document.getElementById('exportSheetBtn');
const goToSheetBtn = document.getElementById('goToSheetBtn');
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyKGWwP4CQJKcnPXPxbmKAEa98h4Jh74FUYrzBgDR2Um8gMUMn6ezN1ejKL54NlmqiT/exec";

// ID Google Sheet
const SHEET_ID = "1OORQVn4dP3BCXM29G87_nGKYBpHzv1vzkPPfZvARlY8";

// URL langsung ke Google Sheet
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;

exportSheetBtn.addEventListener('click', async () => {
  try {
    exportSheetBtn.disabled = true;
    await fetch(WEB_APP_URL, { mode: 'no-cors' });
    alert('✅ Export ke Google Sheet berhasil!');
    exportSheetBtn.disabled = false;

    // Tampilkan tombol untuk pergi ke Google Sheet
    goToSheetBtn.style.display = 'inline-block';
  } catch(err) {
    console.error(err);
    alert('❌ Gagal export ke Google Sheet!');
    exportSheetBtn.disabled = false;
  }
});

// Tombol baru untuk buka Sheet
goToSheetBtn.addEventListener('click', () => {
  window.open(SHEET_URL, '_blank');
});

    // Filter Modal
    const modal = document.getElementById("filterModal");
    const btn = document.getElementById("openFilter");
    const span = document.getElementById("closeFilter");
    btn.onclick = () => modal.style.display = "block";
    span.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

    ["searchInput","searchTanggalBarang","searchTanggalInput"].forEach(id => {
      document.getElementById(id).addEventListener("input", applyFilters);
    });
