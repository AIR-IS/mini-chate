const fs = require("fs");
const os = require("os");
const path = require("path");

const usersFile = path.join(os.tmpdir(), "users.json");
const uploadsDir = path.join(os.tmpdir(), "uploads");
let usersCache;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadUsers() {
  if (usersCache) {
    return usersCache;
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

function saveUsers(users) {
  usersCache = users;
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
