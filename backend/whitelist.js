// whitelist.js
import { users, saveUsers } from "./utils/fileHandler.js";

const pendingUsers = [
  { email: "alice@example.com", phone: "+33612345678", name: "Alice Dupont" },
  { email: "test@test.com", phone: "+123456789", name: "Test User" },
];

export function isPendingUser({ email, phone, name }) {
  return pendingUsers.some(
    (u) =>
      (u.email === email && u.phone === phone) ||
      (u.email === email && u.name === name) ||
      (u.phone === phone && u.name === name)
  );
}

export function isWhitelisted(wallet) {
  return users[wallet]?.status === "whitelist";
}

export function addToWhitelist(wallet, info) {
  users[wallet] = { ...info, status: "whitelist" };
  saveUsers();
}

export function addToGreylist(wallet, info) {
  users[wallet] = { ...info, status: "greylist" };
  saveUsers();
}

export function getStatus(wallet) {
  return users[wallet]?.status || "unknown";
}

export function validateUser(wallet) {
  if (users[wallet]) {
    users[wallet].status = "whitelist";
    saveUsers();
    return true;
  }
  return false;
}
