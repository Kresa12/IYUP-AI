from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from assistant_logic import eksekusi_perintah
from handling_tambah_url import tambah_url, get_url
import speech_recognition as sr
from pydub import AudioSegment
import base64, io, os, re

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "iyup-secret")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ---------- ROUTES ---------- #
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/send_command", methods=["POST"])
def send_command():
    user_command = request.json.get("command", "").strip()
    if not user_command:
        return jsonify({"response": "Perintah kosong."})

    response_text = eksekusi_perintah(user_command, get_url)
    return jsonify({"response": response_text})

@app.route("/add_url", methods=["POST"])
def add_url():
    data = request.json or {}
    name, url = data.get("name"), data.get("url")
    if not name or not url:
        return jsonify({"status": "error", "message": "Nama dan URL tidak boleh kosong!"})

    success, message = tambah_url(name, url)
    status = "success" if success else "error"
    return jsonify({"status": status, "message": message})

# ---------- SOCKET EVENTS ---------- #
@socketio.on("audio_blob")
def handle_audio_blob(data_uri):
    """
    Terima data URI (audio/webm atau audio/ogg), konversi ke WAV PCM,
    lalu transkripsi dgn Google Speech.
    """
    header, b64data = data_uri.split(",", 1)
    mime = header.split(";")[0].replace("data:", "")  # contoh: audio/webm

    raw_bytes = base64.b64decode(b64data)

    # --- Ubah ke WAV (PCM 16-bit 16 kHz mono) ---
    try:
        # auto-detect format (butuh ffmpeg)
        audio_seg = AudioSegment.from_file(io.BytesIO(raw_bytes))
    except Exception as e:
        print("ffmpeg decode error:", e)
        emit("stt_result", {"text": ""})
        return

    wav_buf = io.BytesIO()
    audio_seg.set_channels(1).set_frame_rate(16000).export(wav_buf, format="wav")
    wav_buf.seek(0)

    # --- SpeechRecognition ---
    rec = sr.Recognizer()
    with sr.AudioFile(wav_buf) as src:
        audio = rec.record(src)

    try:
        text = rec.recognize_google(audio, language="id-ID")
    except sr.UnknownValueError:
        text = ""

    emit("stt_result", {"text": text})



if __name__ == "__main__":
    # Gunakan `python app.py` | http://127.0.0.1:5000
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)