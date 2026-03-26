const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handleJson(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return response.json();
}

export async function parseRfq(message, current) {
  const response = await fetch(`${API_BASE}/api/parse-rfq`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message, current })
  });
  return handleJson(response);
}

export async function fetchRfqs() {
  const response = await fetch(`${API_BASE}/api/rfqs`);
  return handleJson(response);
}

export async function createRfq(payload) {
  const response = await fetch(`${API_BASE}/api/rfqs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function login(payload) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function register(payload) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function forgotPassword(payload) {
  const response = await fetch(`${API_BASE}/api/auth/forgot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}
