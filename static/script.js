window.addEventListener("DOMContentLoaded", () => {
  const socket          = io();

  const chatBox         = document.getElementById("chat-box");
  const micBtn          = document.getElementById("mic-btn");
  const urlNameInput    = document.getElementById("url-name-input");
  const urlAddressInput = document.getElementById("url-address-input");
  const addUrlBtn       = document.getElementById("add-url-btn");
  const urlFeedback     = document.getElementById("url-feedback");

  // ================== UI helper ==================
  function appendMessage(sender, msg) {
    const div = document.createElement("div");
    div.className  = sender.toLowerCase();
    div.textContent = `${sender}: ${msg}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ================== SpeechRecognition (Chrome) ==================
  let recognition = null;
  let usingBrowserSTT = false;

  function initBrowserSTT() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.lang = "id-ID";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = e => {
      const txt = e.results[e.results.length - 1][0].transcript.trim();
      if (txt) sendCommand(txt);
    };
    rec.onerror = e => {
      appendMessage("Asisten", `Error: ${e.error}`);
      stopSTT();
    };
    rec.onend = () => {
      if (usingBrowserSTT) rec.start();   // restart continuous
      micBtn.textContent = usingBrowserSTT ? "🎙️ Mendengarkan" : "🎙️ Mikrofon";
    };
    return rec;
  }

  function startSTT() {
    if (!recognition) recognition = initBrowserSTT();
    if (recognition) {
      usingBrowserSTT = true;
      recognition.start();
      micBtn.textContent = "🎙️ Mendengarkan";
      appendMessage("Asisten", "Mendengarkan perintah...");
      return;
    }
    startRecording();    // fallback ke server-side
  }

  function stopSTT() {
    usingBrowserSTT = false;
    if (recognition) try { recognition.stop(); } catch {}
    stopRecording();     // pastikan mic mati di server-side mode
    micBtn.textContent = "🎙️ Mikrofon";
  }

  // ================== MediaRecorder fallback (semua browser) ==================
  let mediaRecorder   = null;
  let recordStream    = null;
  let recordTimeout   = null;
  let chunks          = [];

  async function startRecording() {
    try {
      recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
                       ? "audio/webm"
                       : "audio/ogg";

      mediaRecorder = new MediaRecorder(recordStream, { mimeType });
      chunks = [];

      mediaRecorder.ondataavailable = e => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        // Gabung chunk → Blob
        const blob   = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => socket.emit("audio_blob", reader.result);
        reader.readAsDataURL(blob);

        // Matikan mic benar-benar
        if (recordStream) {
          recordStream.getTracks().forEach(t => t.stop());
          recordStream = null;
        }
        clearTimeout(recordTimeout);
        micBtn.textContent = "🎙️ Mikrofon";
      };

      mediaRecorder.start();

      // Auto-stop setelah 4 detik
      recordTimeout = setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
      }, 4000);

      micBtn.textContent = "🎙️ Mendengarkan";
      appendMessage("Asisten", "Mendengarkan perintah (server-side)...");
    } catch (err) {
      appendMessage("Asisten", "Gagal akses mikrofon: " + err.message);
      micBtn.textContent = "🎙️ Mikrofon";
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
    else if (recordStream) {
      recordStream.getTracks().forEach(t => t.stop());
      recordStream = null;
    }
    clearTimeout(recordTimeout);
  }

  // ================== hasil STT server-side ==================
  socket.on("stt_result", data => {
    if (data.text) sendCommand(data.text);
    else appendMessage("Asisten", "Maaf, tidak terdengar jelas.");
  });

  // ================== kirim perintah ke Flask ==================
  async function sendCommand(cmd) {
    appendMessage("Kamu", cmd);
    const res   = await fetch("/send_command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: cmd })
    });
    const json  = await res.json();
    appendMessage("Asisten", json.response);
    if (window.speechSynthesis) {
      const utt = new SpeechSynthesisUtterance(json.response);
      utt.lang  = "id-ID";
      window.speechSynthesis.speak(utt);
    }
  }

  // ================== UI Events ==================
  micBtn.onclick = () => micBtn.textContent.includes("Mendengarkan") ? stopSTT() : startSTT();

  addUrlBtn.onclick = async () => {
    const name = urlNameInput.value.trim();
    const url  = urlAddressInput.value.trim();
    if (!name || !url) {
      urlFeedback.textContent = "Nama dan URL harus diisi."; urlFeedback.style.color = "red";
      return;
    }
    const res  = await fetch("/add_url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url })
    });
    const json = await res.json();
    urlFeedback.textContent = json.message;
    urlFeedback.style.color = json.status === "success" ? "green" : "red";
    if (json.status === "success") { urlNameInput.value = ""; urlAddressInput.value = ""; }
  };

  // ================== Pesan awal ==================
  appendMessage("Asisten", "Halo! Aku asisten pribadimu berbasis web ✨");
  appendMessage("Asisten", "Klik 🎙️ lalu ucapkan perintah. Mic otomatis berhenti setelah 4 detik.");
});
