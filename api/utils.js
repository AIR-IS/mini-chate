const fs = require("fs");
const os = require("os");
const path = require("path");

let kvClient;
try {
  const { kv } = require("@vercel/kv");
  kvClient = kv;
} catch (err) {
  kvClient = null;
}

const usersFile = path.join(os.tmpdir(), "users.json");
const uploadsDir = path.join(os.tmpdir(), "uploads");
let usersCache;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function isKVEnabled() {
  return Boolean(kvClient && process.env.VERCEL_KV_URL);
}

async function loadUsers() {
  if (usersCache) {
    return usersCache;
  }

  if (isKVEnabled()) {
    try {
      const data = await kvClient.get("users");
      usersCache = Array.isArray(data) ? data : [];
      return usersCache;
    } catch (err) {
      console.error("Erreur lecture KV users:", err);
    }
  }

  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, "utf8");
      usersCache = JSON.parse(data) || [];
      return usersCache;
    }
  } catch (err) {
    console.error("Erreur lecture users:", err);
  }

  usersCache = [];
  return usersCache;
}

async function saveUsers(users) {
  usersCache = users;

  if (isKVEnabled()) {
    try {
      await kvClient.set("users", users);
    } catch (err) {
      console.error("Erreur sauvegarde KV users:", err);
    }
  }

  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Erreur sauvegarde users:", err);
  }
}

function ensureUploadsDir() {
  ensureDir(uploadsDir);
}

function respondJSON(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

module.exports = {
  usersFile,
  uploadsDir,
  ensureUploadsDir,
  loadUsers,
  saveUsers,
  respondJSON
};
