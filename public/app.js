// Connexion au serveur Socket.IO
const socket = io();

// Récupération du username depuis le localStorage
const username = localStorage.getItem("username");
if (!username) {
    window.location = "login.html";
}

// Référence vers la zone des messages
const messages = document.getElementById("messages");

// Fonction utilitaire pour ajouter un message dans la zone
function addMessage(html, className = "message") {
    const div = document.createElement("div");
    div.classList.add(className);
    div.innerHTML = html;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

// --- Gestion des groupes ---
function joinGroup() {
    const group = document.getElementById("group").value;
    socket.emit("joinGroup", { username, group });
}

// --- Envoi de message ---
function sendMessage() {
    const input = document.getElementById("messageInput");
    const message = input.value;
    const group = document.getElementById("group").value;

    if (message.trim() !== "") {
        socket.emit("chat message", { group, message });
        input.value = "";
    }
}

// --- Réception des messages ---
socket.on("chat message", (data) => {
    addMessage(`<strong>${data.user}</strong><br>${data.text}`);
});

socket.on("system", (msg) => {
    addMessage(msg, "system");
});

// --- Upload de fichier ---
async function uploadFile(uploadBtn) {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    
    if (!file) {
        alert("Veuillez sélectionner un fichier");
        return;
    }

    // Vérifier la taille (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        alert("Le fichier est trop volumineux (max: 50MB)");
        return;
    }

    if (!uploadBtn) {
        uploadBtn = document.querySelector("button[onclick^=uploadFile]");
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "⏳ Chargement...";

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("username", username);

        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            const message = `
                <strong>📁 ${result.fileName}</strong> (${result.fileSize})<br>
                <a class="file-link" href="/download/${encodeURIComponent(result.savedFileName)}" target="_blank" rel="noopener">Télécharger</a><br>
                <small>👤 Partagé par: ${result.firstUploader}</small><br>
                <small>🕐 ${result.uploadedAt}</small>
            `;
            
            socket.emit("chat message", {
                group: document.getElementById("group").value,
                message: message
            });

            fileInput.value = "";
            uploadBtn.textContent = "📤 Partager fichier";
            uploadBtn.disabled = false;
        } else {
            alert("❌ Erreur: " + (result.message || "Échec du téléchargement"));
            uploadBtn.textContent = "📤 Partager fichier";
            uploadBtn.disabled = false;
        }
    } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        alert("❌ Erreur de connexion: " + error.message);
        uploadBtn.textContent = "📤 Partager fichier";
        uploadBtn.disabled = false;
    }
}

// --- Ajout d'émojis ---
function addEmoji(emoji) {
    const input = document.getElementById("messageInput");
    input.value += emoji;
    input.focus();
}

// --- Déconnexion ---
function logout() {
    localStorage.removeItem("username");
    window.location = "login.html";
}

// --- Connexion automatique au groupe choisi ---
joinGroup();
