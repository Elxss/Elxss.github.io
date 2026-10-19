//   <!-- SCRIPT: Toggle See Also section -->
console.log("[controlPanel.js] Loading")

document.addEventListener("DOMContentLoaded", () => {
function toggleSeeAlso(header) {
    const content = header.nextElementSibling;
    if (content.style.display === "none") {
      content.style.display = "flex";
      header.querySelector(".toggle-arrow").textContent = "▼";
    } else {
      content.style.display = "none";
      header.querySelector(".toggle-arrow").textContent = "►";
    }
  }

  // Met à jour le compteur d'items dans la fenêtre
  function updateItemCount() {
    const grid = document.getElementById('control-panel-grid');
    const items = grid.querySelectorAll('.right-column-grid-item');
    const counter = document.getElementById('control-panel-items');
    counter.textContent = `${items.length} item(s)`;
  }

  // Exécution initiale pour mettre à jour le compteur
  updateItemCount();
});