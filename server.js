const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("📁 Dossier 'uploads' créé");
}

// Configuration de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}_${timestamp}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// --- Fichier de persistance ---
const USERS_FILE = "./users.json";

// Charger les utilisateurs depuis le fichier
function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, "utf8");
            return JSON.parse(data) || [];
        }
    } catch (err) {
        console.error("Erreur lors de la lecture des utilisateurs:", err);
    }
    return [];
}

// Sauvegarder les utilisateurs dans le fichier
function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
    } catch (err) {
        console.error("Erreur lors de la sauvegarde des utilisateurs:", err);
    }
}

let users = loadUsers();
let filesDB = {};

// --- Authentification ---
function registerHandler(req, res) {
    const { username, password } = req.body;
    
    if (!username || !password || username.trim() === "" || password.trim() === "") {
        return res.json({ success: false, message: "Nom d'utilisateur et mot de passe requis" });
    }
    
    const exist = users.find(u => u.username === username);
    if (exist) {
        return res.json({ success: false, message: "Utilisateur existe déjà" });
    }
    
    users.push({ username, password });
    saveUsers(users); // 💾 Sauvegarde
    res.json({ success: true });
}

function loginHandler(req, res) {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: "Veuillez remplir tous les champs" });
    }
    
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.json({ success: false, message: "Identifiants incorrects" });
    }
    res.json({ success: true, username });
}

app.post("/register", registerHandler);
app.post("/api/register", registerHandler);

app.post("/login", loginHandler);
app.post("/api/login", loginHandler);

// --- Upload de fichier ---
app.post("/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Aucun fichier sélectionné" });
        }

        const filename = req.file.filename;
        const originalname = req.file.originalname;
        const filesize = req.file.size;
        const username = req.body.username;

        const fileHash = `${filename}_${filesize}`;
        if (!filesDB[fileHash]) {
            filesDB[fileHash] = {
                originalname: originalname,
                filename: filename,
                size: filesize,
                uploader: username,
                timestamp: new Date().toISOString()
            };
        }

        res.json({
            success: true,
            fileName: originalname,
            savedFileName: filename,
            fileSize: (filesize / 1024).toFixed(2) + " KB",
            firstUploader: username,
            uploadedAt: new Date().toLocaleTimeString('fr-FR')
        });
    } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        res.status(500).json({ success: false, message: "Erreur lors du téléchargement" });
    }
});

app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Aucun fichier sélectionné" });
        }

        const filename = req.file.filename;
        const originalname = req.file.originalname;
        const filesize = req.file.size;
        const username = req.body.username;

        const fileHash = `${filename}_${filesize}`;
        if (!filesDB[fileHash]) {
            filesDB[fileHash] = {
                originalname: originalname,
                filename: filename,
                size: filesize,
                uploader: username,
                timestamp: new Date().toISOString()
            };
        }

        res.json({
            success: true,
            fileName: originalname,
            savedFileName: filename,
            fileSize: (filesize / 1024).toFixed(2) + " KB",
            firstUploader: username,
            uploadedAt: new Date().toLocaleTimeString('fr-FR')
        });
    } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        res.status(500).json({ success: false, message: "Erreur lors du téléchargement" });
    }
});

// --- Télécharger un fichier ---
app.get("/download/:filename", (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(uploadsDir, filename);

        // Sécurité : vérifier que le chemin est dans le dossier uploads
        if (!filepath.startsWith(uploadsDir)) {
            return res.status(403).json({ success: false, message: "Accès non autorisé" });
        }

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: "Fichier non trouvé" });
        }

        res.download(filepath);
    } catch (error) {
        console.error("Erreur lors du téléchargement:", error);
        res.status(500).json({ success: false, message: "Erreur lors du téléchargement" });
    }
});

app.get("/api/download/:filename", (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(uploadsDir, filename);

        if (!filepath.startsWith(uploadsDir)) {
            return res.status(403).json({ success: false, message: "Accès non autorisé" });
        }

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: "Fichier non trouvé" });
        }

        res.download(filepath);
    } catch (error) {
        console.error("Erreur lors du téléchargement:", error);
        res.status(500).json({ success: false, message: "Erreur lors du téléchargement" });
    }
});

// --- Chat avec 5 groupes ---
io.on("connection", (socket) => {
    socket.on("joinGroup", ({ username, group }) => {
        socket.username = username;
        socket.group = group;
        socket.join(group);
        io.to(group).emit("system", `${username} a rejoint ${group}`);
    });

    socket.on("chat message", ({ group, message }) => {
        io.to(group).emit("chat message", { user: socket.username, text: message });
    });

    socket.on("disconnect", () => {
        if (socket.username && socket.group) {
            io.to(socket.group).emit("system", `${socket.username} a quitté ${socket.group}`);
        }
    });
});

server.listen(3000, () => {
    console.log("Serveur lancé sur http://localhost:3000");
    console.log(`${users.length} utilisateur(s) chargé(s)`);
});
