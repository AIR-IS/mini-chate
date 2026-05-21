const fs = require("fs");
const path = require("path");
const { uploadsDir, respondJSON } = require("../utils");

module.exports = (req, res) => {
  if (req.method !== "GET") {
    return respondJSON(res, 405, { success: false, message: "Méthode non autorisée" });
  }

  const filename = req.query.filename;
  if (!filename) {
    return respondJSON(res, 400, { success: false, message: "Nom de fichier requis" });
  }

  const filepath = path.join(uploadsDir, filename);
  if (!filepath.startsWith(uploadsDir) || !fs.existsSync(filepath)) {
    return respondJSON(res, 404, { success: false, message: "Fichier non trouvé" });
  }

  res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filename)}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  const stream = fs.createReadStream(filepath);
  stream.pipe(res);
};
