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

const repoUsersFile = path.join(process.cwd(), "users.json");
const tmpUsersFile = path.join(os.tmpdir(), "users.json");
const uploadsDir = path.join(os.tmpdir(), "uploads");
let usersCache = null;

function isVercel() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function isKVEnabled() {
  return Boolean(kvClient && process.env.VERCEL_KV_URL);
}

function getUsersFilePath() {
  return isVercel() ? tmpUsersFile : repoUsersFile;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function loadUsers() {
  if (isKVEnabled()) {
    try {
      const data = await kvClient.get("users");
      usersCache = Array.isArray(data) ? data : [];
      return usersCache;
    } catch (err) {
      console.error("Erreur lecture KV users:", err);
    }
  }

  if (isVercel() && !isKVEnabled()) {
    console.warn("Vercel détecté sans KV : le stockage local /tmp n'est pas partagé entre les instances. Configurez VERCEL_KV_URL pour une persistance fiable.");
  }

  const filePath = getUsersFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      usersCache = JSON.parse(data) || [];
      return usersCache;
    }
  } catch (err) {
    console.error("Erreur lecture users:", err);
  }

  if (isVercel() && fs.existsSync(repoUsersFile)) {
    try {
      const data = fs.readFileSync(repoUsersFile, "utf8");
      usersCache = JSON.parse(data) || [];
      return usersCache;
    } catch (err) {
      console.error("Erreur lecture users depuis le dépôt:", err);
    }
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

  const filePath = getUsersFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf8");
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
  repoUsersFile,
  uploadsDir,
  ensureUploadsDir,
  loadUsers,
  saveUsers,
  respondJSON
};
