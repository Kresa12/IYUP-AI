// script.js
// const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const chatBox = document.getElementById('chat-box');

// Elemen untuk manajemen URL
const urlNameInput = document.getElementById('url-name-input');
const urlAddressInput = document.getElementById('url-address-input');
const addUrlBtn = document.getElementById('add-url-btn');
const urlFeedback = document.getElementById('url-feedback');

// --- MODIFIKASI UNTUK TOGGLE MIKROFON DAN PERBAIKAN BUG ---
let recognition = null;
let isListening = false;
let lastProcessedCommand = ''; // Variabel untuk menyimpan perintah terakhir yang diproses

// Fungsi untuk inisialisasi SpeechRecognition
function initializeSpeechRecognition() {
    // if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    //     alert("Maaf, browser Anda tidak mendukung Web Speech API untuk input suara.");
    //     return null;
    // }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'id-ID';
    rec.interimResults = false; // Hanya berikan hasil final
    rec.maxAlternatives = 1;
    rec.continuous = true; // Penting: Mode continuous agar tetap mendengarkan

    // Event saat hasil pengenalan suara tersedia
    rec.onresult = (event) => {
        // Ambil hasil yang paling relevan (resultKey = 0)
        // dan transcript dari alternatif pertama (alternativeKey = 0)
        const transcript = event.results[event.results.length - 1][0].transcript.trim();

        // Debugging: lihat apa yang didengar
        // console.log("Dengar:", transcript);

        // Hanya proses jika ada transcript dan berbeda dari perintah terakhir
        // if (transcript && transcript.toLowerCase() !== lastProcessedCommand.toLowerCase()) {
        //     userInput.value = transcript; // Tampilkan di input
        //     lastProcessedCommand = transcript; // Simpan sebagai perintah terakhir
        //     sendCommand(); // Kirim perintah
        // }

        if (transcript && transcript.toLowerCase() !== lastProcessedCommand.toLowerCase()) {
            // Kita tidak lagi menampilkan di input teks, jadi baris ini dihapus
            // userInput.value = transcript;

            lastProcessedCommand = transcript; // Simpan sebagai perintah terakhir
            
            // --- INI PERBAIKAN PENTING ---
            // Panggil sendCommand dan TERUSKAN `transcript` sebagai argumen
            sendCommand(transcript); 
            // --- AKHIR PERBAIKAN PENTING ---
        }
    };

    // Event saat terjadi error pada pengenalan suara
    rec.onerror = (event) => {
        // console.error('Speech recognition error', event);
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
            // Ini normal jika tidak ada suara, jangan terlalu banyak error feedback
            // Atau jika mikrofon terputus.
        } else {
            // Beri feedback error hanya jika memang sedang mendengarkan
            if (isListening) {
                appendMessage('Asisten', 'Maaf, aku tidak bisa mendengar atau mengenali suara Anda. Mohon ulangi.');
            }
        }
        // Jangan panggil stopListening() di sini jika kita ingin continuous listening.
        // `onend` akan dipanggil setelah `onerror`.
    };

    // Event saat proses pengenalan suara berakhir (misal karena jeda terlalu lama, atau dihentikan manual)
    rec.onend = () => {
        if (isListening) { // Jika mikrofon masih seharusnya aktif, mulai lagi mendengarkan
            // console.log("Recognition ended, restarting...");
            // Tambahkan sedikit jeda sebelum memulai ulang untuk menghindari loop cepat
            setTimeout(() => {
                if (isListening) { // Pastikan masih ingin mendengarkan setelah jeda
                    recognition.start();
                }
            }, 500); // Jeda 500ms (0.5 detik)
        } else {
            // console.log("Recognition stopped manually.");
            micBtn.textContent = 'Mikrofon';
            micBtn.classList.remove('listening');
        }
    };
    return rec;
}

// Fungsi untuk memulai mendengarkan
function startListening() {
    if (!recognition) {
        recognition = initializeSpeechRecognition();
        if (!recognition) return;
    }
    isListening = true;
    micBtn.textContent = 'Mendengarkan';
    micBtn.classList.add('listening');
    recognition.start();
    appendMessage('Asisten', 'Mendengarkan perintah...');
    lastProcessedCommand = ''; // Reset perintah terakhir saat mulai mendengarkan
}

// Fungsi untuk menghentikan mendengarkan
function stopListening() {
    if (recognition && isListening) {
        isListening = false;
        recognition.stop();
        // console.log("Microphone stopped.");
    }
    micBtn.textContent = 'Mikrofon';
    micBtn.classList.remove('listening');
}
// --- AKHIR MODIFIKASI TOGGLE MIKROFON DAN PERBAIKAN BUG ---


// Fungsi untuk menampilkan pesan di chat box
function appendMessage(sender, message) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add(sender);
    msgDiv.textContent = `${sender}: ${message}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Fungsi untuk mengirim perintah asisten ke Flask backend
async function sendCommand(command) {
    // const command = userInput.value.trim();
    if (command === "") return;

    appendMessage('Kamu', command);
    // userInput.value = '';

    try {
        const response = await fetch('/send_command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command: command })
        });
        const data = await response.json();
        appendMessage('Asisten', data.response);

        // OPSIONAL: Jika ingin asisten bicara di browser
        const synth = window.speechSynthesis;
        if (synth) {
            const utterance = new SpeechSynthesisUtterance(data.response);
            utterance.lang = 'id-ID';
            synth.speak(utterance);
        }

    } catch (error) {
        console.error('Error:', error);
        appendMessage('Asisten', 'Maaf, terjadi kesalahan saat berkomunikasi dengan server.');
    }
}

// --- Event listener untuk tombol Mikrofon (toggle) ---
micBtn.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

// --- Fungsionalitas Tambah URL ---
addUrlBtn.addEventListener('click', async () => {
    const name = urlNameInput.value.trim().toLowerCase();
    const url = urlAddressInput.value.trim();

    try {
        const response = await fetch('/add_url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name, url: url })
        });
        const data = await response.json();
        urlFeedback.textContent = data.message;
        urlFeedback.style.color = data.status === 'success' ? 'green' : 'red';

        if (data.status === 'success') {
            urlNameInput.value = '';
            urlAddressInput.value = '';
        }
    } catch (error) {   
        console.error('Error adding URL:', error);
        urlFeedback.textContent = "Terjadi kesalahan saat menambahkan URL.";
        urlFeedback.style.color = 'red';
    }
});


// Pesan sambutan awal saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    appendMessage('Asisten', 'Halo! Aku adalah asisten pribadimu berbasis web.');
    appendMessage('Asisten', 'Silakan ketik atau ucapkan perintahmu. Klik tombol Mikrofon untuk mengaktifkan/menonaktifkan mode mendengarkan.');
});