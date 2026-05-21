const username = localStorage.getItem("username");
if (!username) {
    window.location = "login.html";
}

const messagesContainer = document.getElementById("messages");
const usernameInput = document.getElementById("username");
const storageKey = "mini-chat-messages";
let messages = JSON.parse(localStorage.getItem(storageKey) || "[]");

if (usernameInput) {
    usernameInput.value = username;
    usernameInput.disabled = true;
}

function saveMessages() {
    localStorage.setItem(storageKey, JSON.stringify(messages));
}

function renderMessages() {
    messagesContainer.innerHTML = "";
    messages.forEach(entry => {
        const div = document.createElement("div");
        div.classList.add(entry.className || "message");
        div.innerHTML = entry.html;
        messagesContainer.appendChild(div);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessage(html, className = "message") {
    const entry = { html, className, timestamp: Date.now() };
    messages.push(entry);
    saveMessages();
    renderMessages();
}

function sendMessage() {
    const input = document.getElementById("messageInput");
    const message = input.value.trim();
    const group = document.getElementById("group").value;

    if (!message) {
        return;
    }

    addMessage(`
        <strong>${username}</strong> <span class="group-label">[${group}]</span><br>
        ${message}
    `);
    input.value = "";
}

async function uploadFile(uploadBtn) {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Veuillez sélectionner un fichier");
        return;
    }

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

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            const message = `
                <strong>📁 ${result.fileName}</strong> (${result.fileSize})<br>
                <a class="file-link" href="${result.downloadUrl}" target="_blank" rel="noopener">Télécharger</a><br>
                <small>👤 Partagé par: ${result.firstUploader}</small><br>
                <small>🕐 ${result.uploadedAt}</small>
            `;
            addMessage(message, "file-message");
            fileInput.value = "";
        } else {
            alert("❌ Erreur: " + (result.message || "Échec du téléchargement"));
        }
    } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        alert("❌ Erreur de connexion: " + error.message);
    } finally {
        uploadBtn.textContent = "📤 Partager fichier";
        uploadBtn.disabled = false;
    }
}

function addEmoji(emoji) {
    const input = document.getElementById("messageInput");
    input.value += emoji;
    input.focus();
}

function logout() {
    localStorage.removeItem("username");
    window.location = "login.html";
}

renderMessages();
