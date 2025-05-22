from flask import Flask, render_template, request, jsonify
from assistant_logic import eksekusi_perintah
from handling_tambah_url import tambah_url, get_url

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/send_command', methods=['POST'])
def send_command():
    user_command = request.json.get('command')
    if not user_command:
        return jsonify({'response': 'Perintah kosong.'})

    response_text = eksekusi_perintah(user_command, get_url)
    return jsonify({'response': response_text})

@app.route('/add_url', methods=['POST'])
def add_url():
    data = request.json
    name = data.get('name')
    url = data.get('url')

    if not name or not url:
        return jsonify({'status': 'error', 'message': 'Nama dan URL tidak boleh kosong!'})

    success, message = tambah_url(name, url)

    if success:
        return jsonify({'status': 'success', 'message': message})
    else:
        return jsonify({'status': 'error', 'message': message})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')