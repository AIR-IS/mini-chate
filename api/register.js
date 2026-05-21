const { loadUsers, saveUsers, respondJSON } = require("./utils");

module.exports = (req, res) => {
  if (req.method !== "POST") {
    return respondJSON(res, 405, { success: false, message: "Méthode non autorisée" });
  }

  let body = "";
  req.on("data", chunk => { body += chunk.toString(); });
  req.on("end", () => {
    try {
      const { username, password } = JSON.parse(body || "{}");

      if (!username || !password || username.trim() === "" || password.trim() === "") {
        return respondJSON(res, 400, { success: false, message: "Nom d'utilisateur et mot de passe requis" });
      }

      const users = loadUsers();
      const exist = users.find(u => u.username === username);
      if (exist) {
        return respondJSON(res, 409, { success: false, message: "Utilisateur existe déjà" });
      }

      users.push({ username, password });
      saveUsers(users);
      return respondJSON(res, 200, { success: true });
    } catch (err) {
      console.error("Erreur /register:", err);
      return respondJSON(res, 500, { success: false, message: "Erreur serveur" });
    }
  });
};
