import json
import re
import os

URLS_FILE = 'tampung_urls.json'

def load_url():
    if not os.path.exists(URLS_FILE):
        return {}
    with open(URLS_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def tambah_url(name_url, url):
    urls = load_url()
    name_lower = name_url.lower()

    if not re.match(r"^(https?://)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$", url):
        return False, "Format URL ga valid, tidak boleh ada spasi"

    if name_lower in urls:
        return False, f"Nama '{name_url}' udah ada. pakai nama lain atau ganti url yang sudah ada."

    urls[name_lower] = url
    simpan_url(urls)
    return True, f"URL '{name_url}' berhasil ditambahkan."

def simpan_url(urls):
    with open(URLS_FILE, 'w') as f:
        json.dump(urls, f, indent=4)

def get_url(nama_url):
    urls = load_url()
    key = nama_url.lower()
    if key in urls:
        return urls.get(key)

    name_no_space = key.replace(" ", "")
    for stored_name, stored_url in urls.items():
        if stored_name.replace(" ", "") == name_no_space:
            return stored_url
    return None