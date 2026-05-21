const { loadUsers, saveUsers, respondJSON } = require("./utils");

function readJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return respondJSON(res, 405, { success: false, message: "Méthode non autorisée" });
  }

  try {
    const { username, password } = await readJSONBody(req);
    if (!username || !password || username.trim() === "" || password.trim() === "") {
      return respondJSON(res, 400, { success: false, message: "Nom d'utilisateur et mot de passe requis" });
    }

    const users = await loadUsers();
    const exist = users.find(u => u.username === username);
    if (exist) {
      return respondJSON(res, 409, { success: false, message: "Utilisateur existe déjà" });
    }

    users.push({ username, password });
    await saveUsers(users);
    return respondJSON(res, 200, { success: true });
  } catch (err) {
    console.error("Erreur /register:", err);
    return respondJSON(res, 500, { success: false, message: "Erreur serveur" });
  }
};
