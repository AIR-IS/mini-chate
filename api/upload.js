const fs = require("fs");
const path = require("path");
const formidable = require("formidable");
const { ensureUploadsDir, uploadsDir, respondJSON } = require("./utils");

module.exports = (req, res) => {
  if (req.method !== "POST") {
    return respondJSON(res, 405, { success: false, message: "Méthode non autorisée" });
  }

  ensureUploadsDir();

  const form = new formidable.IncomingForm({
    uploadDir: uploadsDir,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024,
    multiples: false
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Erreur formulaire upload:", err);
      return respondJSON(res, 500, { success: false, message: "Erreur lors du traitement du fichier" });
    }

    const file = files.file;
    if (!file) {
      return respondJSON(res, 400, { success: false, message: "Aucun fichier sélectionné" });
    }

    const originalname = file.originalFilename || file.name || "upload";
    const filesize = file.size || 0;
    const timestamp = Date.now();
    const ext = path.extname(originalname);
    const name = path.basename(originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
    const savedFileName = `${name}_${timestamp}${ext}`;
    const finalPath = path.join(uploadsDir, savedFileName);

    try {
      fs.renameSync(file.filepath, finalPath);
    } catch (renameErr) {
      console.error("Erreur renommage fichier:", renameErr);
      return respondJSON(res, 500, { success: false, message: "Erreur de stockage du fichier" });
    }

    return respondJSON(res, 200, {
      success: true,
      fileName: originalname,
      savedFileName,
      fileSize: (filesize / 1024).toFixed(2) + " KB",
      firstUploader: fields.username || "Invité",
      uploadedAt: new Date().toLocaleTimeString("fr-FR"),
      downloadUrl: `/api/download/${encodeURIComponent(savedFileName)}`
    });
  });
};
