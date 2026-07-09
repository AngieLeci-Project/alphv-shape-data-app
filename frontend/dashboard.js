const STATS_URL = "http://localhost:3221/api/stats";
const DAILY_STATS_URL = "http://localhost:3221/api/stats/daily";

const SHAPE_CONFIG = {
  Triangle: { label: "Triangles", color: "#7C5CFC" },
  Square:   { label: "Squares",   color: "#3B82F6" },
  Circle:   { label: "Circles",   color: "#22C55E" },
  Other:    { label: "Others",    color: "#F59E0B" },
};

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

let distributionChart = null;
let dailyChart = null;

async function loadStats() {
  try {
    const response = await fetch(STATS_URL);
    const stats = await response.json();

    renderStatCards(stats);
    renderDistributionChart(stats);
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
}

async function loadDailyChart() {
  try {
    const response = await fetch(DAILY_STATS_URL);
    const dailyData = await response.json(); // array of {date, count}

    const labels = dailyData.map((d) => d.date.slice(5)); // show "MM-DD" only
    const counts = dailyData.map((d) => d.count);

    renderDailyChart(labels, counts);
  } catch (error) {
    console.error("Failed to load daily stats:", error);
  }
}


function renderStatCards(stats) {
  const container = document.getElementById("stat-cards");
  container.innerHTML = "";

  const total = stats.total || 0;

  Object.keys(SHAPE_CONFIG).forEach((shapeType) => {
    const config = SHAPE_CONFIG[shapeType];
    const count = stats.counts[shapeType] || 0;
    const percent = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;

    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `
      <div class="stat-card-label">${config.label}</div>
      <div class="stat-card-value">${count}</div>
      <div class="stat-card-bar">
        <div class="stat-card-bar-fill" style="width: ${percent}%; background-color: ${config.color};"></div>
      </div>
      <div class="stat-card-percent" style="color: ${config.color};">${percent}% of total</div>
    `;
    container.appendChild(card);
  });

  const totalCard = document.createElement("div");
  totalCard.className = "stat-card total-card";
  totalCard.innerHTML = `
    <div class="stat-card-label">Total Shapes</div>
    <div class="stat-card-value">${total}</div>
    <div class="stat-card-percent">All shapes collected</div>
  `;
  container.appendChild(totalCard);
}


function renderDistributionChart(stats) {
  const ctx = document.getElementById("distribution-chart");

  const labels = Object.keys(SHAPE_CONFIG).map((key) => SHAPE_CONFIG[key].label);
  const colors = Object.keys(SHAPE_CONFIG).map((key) => SHAPE_CONFIG[key].color);
  const data = Object.keys(SHAPE_CONFIG).map((key) => stats.counts[key] || 0);

  if (distributionChart) {
    distributionChart.data.datasets[0].data = data;
    distributionChart.update("none"); 
    return;
  }

  distributionChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}
function renderDailyChart(labels, counts) {
  const ctx = document.getElementById("daily-chart");

  if (dailyChart) {
    dailyChart.data.labels = labels;
    dailyChart.data.datasets[0].data = counts;
    dailyChart.update("none");
    return;
  }

  dailyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Entries added",
        data: counts,
        borderColor: "#7C5CFC",
        backgroundColor: "rgba(124, 92, 252, 0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

async function loadLatestEntries() {
  try {
    const response = await fetch("http://localhost:3221/api/shapes/latest");
    const entries = await response.json();
    renderLatestEntries(entries);
  } catch (error) {
    console.error("Failed to load latest entries:", error);
  }
}

function renderLatestEntries(entries) {
  const tbody = document.getElementById("latest-table-body");
  tbody.innerHTML = "";

  if (entries.length === 0) {
    tbody.innerHTML = "<tr><td colspan='3'>No entries yet.</td></tr>";
    return;
  }

  entries.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <span class="shape-icon-inline">
          ${shapeIconSVG(entry.shape, entry.color)}
          ${entry.shape}
        </span>
      </td>
      <td>${entry.color}</td>
      <td>${new Date(entry.timestamp).toLocaleDateString()}</td>
    `;
    tbody.appendChild(row);
  });
}


loadStats();
loadDailyChart();
loadLatestEntries(); 
setInterval(loadStats, 5000);
setInterval(loadDailyChart, 5000);
setInterval(loadLatestEntries, 5000);