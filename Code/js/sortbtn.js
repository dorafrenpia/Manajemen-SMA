// ======= sortBtn.js =======

export function initSortButtons(tableId) {
  const table = document.getElementById(tableId);
  const headers = table.querySelectorAll("thead th");

  headers.forEach((th, index) => {
    const sortBtn = th.querySelector(".sort-btn");
    if (sortBtn) {
      let asc = true; // default ascending
      sortBtn.addEventListener("click", () => {
        sortTableByColumn(table, index, asc);
        asc = !asc; // toggle urutan
      });
    }
  });
}

function sortTableByColumn(table, colIndex, asc = true) {
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  rows.sort((a, b) => {
    const aText = a.children[colIndex].textContent.trim();
    const bText = b.children[colIndex].textContent.trim();

    // Jika angka
    const aNum = parseFloat(aText);
    const bNum = parseFloat(bText);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return asc ? aNum - bNum : bNum - aNum;
    }

    // Jika tanggal
    const aDate = Date.parse(aText);
    const bDate = Date.parse(bText);
    if (!isNaN(aDate) && !isNaN(bDate)) {
      return asc ? aDate - bDate : bDate - aDate;
    }

    // Default: string
    return asc 
      ? aText.localeCompare(bText) 
      : bText.localeCompare(aText);
  });

  // Re-append rows
  rows.forEach(row => tbody.appendChild(row));
}
