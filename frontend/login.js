const LOGIN_URL = "/api/login";

const form = document.getElementById("login-form");
const messageEl = document.getElementById("login-message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = document.getElementById("input-password").value;

  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const result = await response.json();

    if (!response.ok) {
      messageEl.textContent = result.error || "Login failed.";
      return;
    }

    localStorage.setItem("adminToken", result.token);
    window.location.href = "admin.html";

  } catch (error) {
    console.error("Login request failed:", error);
    messageEl.textContent = "Could not connect to the server.";
  }
});