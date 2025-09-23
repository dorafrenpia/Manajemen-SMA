
let barangCount = 1;

// Tambah barang
document.getElementById("addBarangBtn").addEventListener("click", () => {
  barangCount++;

  // Buat tab baru
  const tabBtn = document.createElement("button");
  tabBtn.type = "button";
  tabBtn.className = "tab-btn";
  tabBtn.dataset.index = barangCount;
  tabBtn.textContent = "Barang " + barangCount;

  // reset active tab sebelumnya
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  tabBtn.classList.add("active");

  document.getElementById("barangTabs").appendChild(tabBtn);
  document.getElementById("barangTabs").scrollLeft = document.getElementById("barangTabs").scrollWidth;

  // Buat field baru
  const newField = document.createElement("div");
  newField.className = "barang-field";
  newField.dataset.index = barangCount;
  newField.innerHTML = `
    <input type="text" id="namaBarang-${barangCount}" placeholder="Nama Barang" required>
    <input type="number" id="jumlahBarang-${barangCount}" placeholder="Jumlah Barang" required>
    <input type="number" id="hargaSatuan-${barangCount}" placeholder="Harga Satuan" required>
    <input type="number" id="totalHarga-${barangCount}" placeholder="Total Harga" readonly style="background:#f5f5f5;font-weight:bold;">
    <input type="text" id="catatanDivisi-${barangCount}" placeholder="Catatan Keperluan Divisi">
  `;

  // sembunyikan semua field lama
  document.querySelectorAll(".barang-field").forEach(f => f.style.display = "none");
  newField.style.display = "block";

  document.getElementById("barangFields").appendChild(newField);
});

// Hapus barang + reindex
document.getElementById("hapusBarangBtn").addEventListener("click", () => {
  const activeTab = document.querySelector("#barangTabs .tab-btn.active");
  if (!activeTab) return;
  const idx = parseInt(activeTab.dataset.index);

  // Hapus tab + field
  activeTab.remove();
  const activeField = document.querySelector(`.barang-field[data-index="${idx}"]`);
  if (activeField) activeField.remove();

  // Re-index semua tab dan field setelah penghapusan
  const tabs = document.querySelectorAll("#barangTabs .tab-btn");
  const fields = document.querySelectorAll("#barangFields .barang-field");

  tabs.forEach((tab, i) => {
    const newIndex = i + 1;
    tab.dataset.index = newIndex;
    tab.textContent = "Barang " + newIndex;
  });

  fields.forEach((field, i) => {
    const newIndex = i + 1;
    field.dataset.index = newIndex;
    field.querySelector(`#namaBarang-${idx+i}`) && (field.querySelector(`#namaBarang-${idx+i}`).id = `namaBarang-${newIndex}`);
    field.querySelector(`#jumlahBarang-${idx+i}`) && (field.querySelector(`#jumlahBarang-${idx+i}`).id = `jumlahBarang-${newIndex}`);
    field.querySelector(`#hargaSatuan-${idx+i}`) && (field.querySelector(`#hargaSatuan-${idx+i}`).id = `hargaSatuan-${newIndex}`);
    field.querySelector(`#totalHarga-${idx+i}`) && (field.querySelector(`#totalHarga-${idx+i}`).id = `totalHarga-${newIndex}`);
    field.querySelector(`#catatanDivisi-${idx+i}`) && (field.querySelector(`#catatanDivisi-${idx+i}`).id = `catatanDivisi-${newIndex}`);
  });

  // Aktifkan tab terakhir
  const allTabs = document.querySelectorAll(".tab-btn");
  if (allTabs.length > 0) {
    const lastTab = allTabs[allTabs.length - 1];
    lastTab.classList.add("active");

    document.querySelectorAll(".barang-field").forEach(f => f.style.display = "none");
    const lastField = document.querySelector(`.barang-field[data-index="${lastTab.dataset.index}"]`);
    if (lastField) lastField.style.display = "block";
  }

  barangCount = allTabs.length; // update jumlah tab terbaru
});

// Tab switch
document.getElementById("barangTabs").addEventListener("click", e => {
  if (e.target.classList.contains("tab-btn")) {
    const idx = e.target.dataset.index;
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");
    document.querySelectorAll(".barang-field").forEach(f => f.style.display = "none");
    document.querySelector(`.barang-field[data-index="${idx}"]`).style.display = "block";
  }
});

// Hitung total harga otomatis
document.getElementById("barangFields").addEventListener("input", e => {
  if (e.target.id.startsWith("jumlahBarang") || e.target.id.startsWith("hargaSatuan")) {
    const idx = e.target.id.split("-")[1];
    const jumlah = parseFloat(document.getElementById(`jumlahBarang-${idx}`).value) || 0;
    const harga = parseFloat(document.getElementById(`hargaSatuan-${idx}`).value) || 0;
    document.getElementById(`totalHarga-${idx}`).value = jumlah * harga;
  }
});
