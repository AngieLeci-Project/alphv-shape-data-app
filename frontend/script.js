const API_URL = "http://localhost:3221/api/shapes";
const POLL_INTERVAL_MS = 3000;


function shapeIconSVG(shape, color, size = 20) {
  switch (shape) {
    case "Triangle":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><polygon points="12,2 22,21 2,21" fill="${color}" /></svg>`;
    case "Square":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="${color}" /></svg>`;
    case "Circle":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${color}" /></svg>`;
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="${color}" transform="rotate(45 12 12)" /></svg>`;
  }
}

async function loadShapes() {
  try {
    const response = await fetch(API_URL);
    const shapes = await response.json();
    renderTable(shapes);
    updateTotalCount(shapes.length);
    document.getElementById("last-updated").textContent = new Date().toLocaleTimeString();
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
}

function renderTable(shapes) {
  const tbody = document.getElementById("shape-table-body");
  tbody.innerHTML = "";

  if (shapes.length === 0) {
    tbody.innerHTML = "<tr><td colspan='4'>No entries yet.</td></tr>";
    return;
  }

  shapes.forEach((shape) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(shape.timestamp).toLocaleString()}</td>
      <td><strong>${shape.name}</strong></td>
      <td>
        <span class="shape-cell">
          ${shapeIconSVG(shape.shape, shape.color)}
          ${shape.shape}
        </span>
      </td>
      <td>
        <span class="color-cell">
          <span class="color-swatch" style="background-color: ${shape.color};"></span>
          ${shape.color}
        </span>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function updateTotalCount(total) {
  document.getElementById("total-count").textContent = `${total} entries`;
}

loadShapes();
setInterval(loadShapes, POLL_INTERVAL_MS);