import { SESSION_KEY, roles } from "./constants.js";

const iterations = 180000;

export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function setSession(userId) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId, startedAt: new Date().toISOString() }));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function currentUser(data) {
  const session = getSession();
  return data.users.find((user) => user.id === session?.userId) || null;
}

export async function createPasswordRecord(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  return {
    algorithm: "PBKDF2-SHA-256",
    iterations,
    salt: toBase64(salt),
    hash: toBase64(hash)
  };
}

export async function verifyPassword(password, record) {
  const salt = fromBase64(record.salt);
  const expected = fromBase64(record.hash);
  const actual = await hashPassword(password, salt);
  return timingSafeEqual(actual, expected);
}

export function canManageUsers(user) {
  return user?.role === "Administrator";
}

export function normaliseRole(role) {
  return roles.includes(role) ? role : "Adult";
}

async function hashPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let index = 0; index < a.byteLength; index += 1) diff |= a[index] ^ b[index];
  return diff === 0;
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}
