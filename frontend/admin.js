const API_URL = "http://localhost:3221/api/shapes";
const LOGOUT_URL = "http://localhost:3221/api/logout";

const form = document.getElementById("shape-form");
const messageEl = document.getElementById("form-message");

let editingId = null;
let allShapes = []; 


function shapeIconSVG(shape, color, size = 18) {
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


const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "login.html";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}


document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    await fetch(LOGOUT_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    localStorage.removeItem("adminToken");
    window.location.href = "login.html";
  }
});

async function loadShapes() {
  try {
    const response = await fetch(API_URL);
    const shapes = await response.json();
    allShapes = shapes;
    applySearchFilter();
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
}

function renderTable(shapes) {
  const tbody = document.getElementById("shape-table-body");
  tbody.innerHTML = "";

  if (shapes.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>No data yet.</td></tr>";
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
      <td>
        <button class="edit-btn" data-id="${shape.id}">Edit</button>
        <button class="delete-btn" data-id="${shape.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  attachButtonEvents(shapes);
}

function attachButtonEvents(shapes) {
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const shapeData = shapes.find((s) => s.id == id);
      startEdit(shapeData);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      handleDelete(id);
    });
  });
}


function startEdit(shapeData) {
  editingId = shapeData.id;

  document.getElementById("input-name").value = shapeData.name;
  document.getElementById("input-shape").value = shapeData.shape;
  document.getElementById("input-color").value = shapeData.color;
  document.getElementById("input-color-text").value = shapeData.color;
  document.getElementById("input-timestamp").value = shapeData.timestamp.slice(0, 16);

  document.querySelector("#shape-form button[type=submit]").textContent = "Update Entry";

  messageEl.textContent = `Editing entry #${shapeData.id}`;
  messageEl.style.color = "blue";

  updatePreview();
}


async function handleDelete(id) {
  const confirmed = confirm("Are you sure you want to delete this entry?");
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("adminToken");
      window.location.href = "login.html";
      return;
    }

    if (!response.ok) throw new Error("Failed to delete.");

    loadShapes();
  } catch (error) {
    console.error(error);
    alert("Failed to delete the entry.");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("input-name").value;
  const shape = document.getElementById("input-shape").value;
  const color = document.getElementById("input-color").value;
  const timestamp = document.getElementById("input-timestamp").value;

  const payload = { name, shape, color, timestamp };

  const url = editingId ? `${API_URL}/${editingId}` : API_URL;
  const method = editingId ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method: method,
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      localStorage.removeItem("adminToken");
      window.location.href = "login.html";
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      messageEl.textContent = "Error: " + result.errors.join(", ");
      messageEl.style.color = "red";
      return;
    }

    messageEl.textContent = editingId ? "Entry updated successfully!" : "Entry added successfully!";
    messageEl.style.color = "green";

    resetForm();
    loadShapes();

  } catch (error) {
    console.error("Failed to submit:", error);
    messageEl.textContent = "Could not connect to the server.";
    messageEl.style.color = "red";
  }
});

function resetForm() {
  form.reset();
  editingId = null;
  document.querySelector("#shape-form button[type=submit]").textContent = "Add Entry";
  updatePreview();
}

function applySearchFilter() {
  const keyword = document.getElementById("search-input").value.trim().toLowerCase();

  const filtered = keyword
    ? allShapes.filter((shape) =>
        shape.name.toLowerCase().includes(keyword) ||
        shape.shape.toLowerCase().includes(keyword)
      )
    : allShapes;

  renderTable(filtered);
  updateTotalCount(filtered.length, allShapes.length);
}

function updateTotalCount(shown, total) {
  const badge = document.getElementById("total-count");
  const keyword = document.getElementById("search-input").value.trim();

  badge.textContent = keyword
    ? `${shown} of ${total} entries`
    : `${total} entries`;
}

document.getElementById("search-input").addEventListener("input", applySearchFilter);


function updatePreview() {
  const shape = document.getElementById("input-shape").value;
  const color = document.getElementById("input-color").value;

  const preview = document.getElementById("shape-preview");
  preview.innerHTML = `${shapeIconSVG(shape, color, 22)} <span>${shape}</span>`;
}

document.getElementById("input-shape").addEventListener("change", updatePreview);

document.getElementById("input-color").addEventListener("input", () => {
  document.getElementById("input-color-text").value = document.getElementById("input-color").value;
  updatePreview();
});

document.getElementById("input-color-text").addEventListener("input", () => {
  const value = document.getElementById("input-color-text").value;
  if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(value)) {
    document.getElementById("input-color").value = value;
  }
  updatePreview();
});

document.getElementById("export-btn").addEventListener("click", async () => {
  try {
    const response = await fetch(API_URL); // fetch fresh full data
    const shapes = await response.json();
    exportToCSV(shapes, "alphv-shapes-admin-export.csv");
  } catch (error) {
    console.error("Export failed:", error);
    alert("Failed to export data.");
  }
});

updatePreview();


loadShapes();