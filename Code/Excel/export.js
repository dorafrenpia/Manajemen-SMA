import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// 🔹 Konfigurasi Firebase
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

// 🔹 Tambahkan tombol export ke Excel di HTML
const exportBtn = document.createElement('button');
exportBtn.id = 'exportBtn';
exportBtn.textContent = 'Export ke Excel';
exportBtn.style.cssText = "padding:10px 20px; font-size:16px; cursor:pointer; background:#3498db; color:white; border:none; border-radius:5px; margin:10px 0;";
document.querySelector('.dashboard-container').prepend(exportBtn);

// 🔹 Event export
exportBtn.addEventListener('click', async () => {
  try {
    const snapshot = await getDocs(collection(db, "barangMasuk"));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('BarangMasuk');

    // Header
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Kode', key: 'kode', width: 20 },
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Merek', key: 'merek', width: 15 },
      { header: 'Kategori', key: 'kategori', width: 15 },
      { header: 'Jumlah', key: 'jumlah', width: 10 },
      { header: 'Satuan', key: 'satuan', width: 10 },
      { header: 'Harga', key: 'harga', width: 15 },
      { header: 'JenisDana', key: 'jenisDana', width: 15 },
      { header: 'TanggalBarang', key: 'tanggal', width: 15 },
      { header: 'Keterangan', key: 'keterangan', width: 20 },
      { header: 'Foto1', key: 'foto', width: 25 }
    ];

    // Styling header
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF3498DB'} };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style:'thin' }, bottom: { style:'thin' },
        left: { style:'thin' }, right: { style:'thin' }
      };
    });

    // Masukkan data
    let no = 1;
    snapshot.forEach(doc => {
      const d = doc.data();
      const fotoLink = d.fotoLinks?.[0] || '';
      worksheet.addRow({
        no: no++,
        id: doc.id,
        kode: d.kodeBarang,
        nama: d.namaBarang,
        merek: d.merek,
        kategori: d.kategori,
        jumlah: d.jumlahBarang,
        satuan: d.satuan,
        harga: d.hargaBarang,
        jenisDana: d.jenisDana,
        tanggal: d.tanggalBarang,
        keterangan: d.keterangan,
        foto: { formula: `HYPERLINK("${fotoLink}","Link")` }
      });
    });

    // Format harga jadi Rupiah
    worksheet.getColumn('harga').numFmt = '"Rp"#,##0.00;[Red]\-"Rp"#,##0.00';

    // Export Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'BarangMasuk.xlsx';
    link.click();

    alert('Export berhasil! Excel rapi dan enak dilihat.');
  } catch(err) {
    console.error(err);
    alert('Gagal export Excel!');
  }
});
