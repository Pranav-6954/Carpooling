// src/utils/jwt.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8084";

export const saveToken = (token) => localStorage.setItem("token", token);
export const getToken = () => localStorage.getItem("token");
export const clearToken = () => localStorage.removeItem("token");

// parse JWT or legacy base64 JSON
export const parseToken = (token) => {
  if (!token) return null;
  try {
    if (token.split(".").length === 3) {
      const payload = token.split(".")[1];
      const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=");
      return JSON.parse(atob(padded));
    } else {
      return JSON.parse(atob(token));
    }
  } catch { return null; }
};

export const verifyJWT = (token) => {
  const info = parseToken(token || getToken());
  if (!info) return null;
  const exp = info.exp ? (info.exp * (String(info.exp).length === 10 ? 1000 : 1)) : null;
  if (exp && Number(exp) < Date.now()) return null;
  // Normalize shape: server may use sub/email + role
  return {
    email: info.sub || info.email || info.user?.email,
    role: (() => {
      let r = (info.role || info.user?.role || "ROLE_USER").toUpperCase();
      if (!r.startsWith("ROLE_")) r = "ROLE_" + r;
      return r;
    })(),
    superAdmin: !!info.superAdmin,
    name: info.name || info.user?.name,
    exp: exp || info.exp,
  };
};

export const apiFetch = async (path, opts = {}) => {
  const token = getToken();
  const headers = Object.assign({ "Content-Type": "application/json", Accept: "application/json" }, opts.headers || {});
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, Object.assign({}, opts, { headers }));
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    const err = new Error((body?.error || res.statusText || "Request failed") + ` (Status: ${res.status})`);
    err.status = res.status; err.body = body;
    throw err;
  }
  return body;
};

export default { API_BASE, saveToken, getToken, clearToken, parseToken, verifyJWT, apiFetch };
