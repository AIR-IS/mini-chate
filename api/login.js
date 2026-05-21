const { loadUsers, respondJSON } = require("./utils");

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
    if (!username || !password) {
      return respondJSON(res, 400, { success: false, message: "Veuillez remplir tous les champs" });
    }

    const users = await loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      return respondJSON(res, 401, { success: false, message: "Identifiants incorrects" });
    }

    return respondJSON(res, 200, { success: true, username });
  } catch (err) {
    console.error("Erreur /login:", err);
    return respondJSON(res, 500, { success: false, message: "Erreur serveur" });
  }
};
