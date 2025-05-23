import json, os, re

URLS_FILE = "tampung_urls.json"

HTTP_REGEX = re.compile(r"^(https?://)[\w\.-]+(\.[a-z]{2,6})([/\w\.-]*)*/?$", re.IGNORECASE)

def load_url():
    if not os.path.exists(URLS_FILE):
        return {}
    with open(URLS_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def simpan_url(urls):
    with open(URLS_FILE, "w") as f:
        json.dump(urls, f, indent=4)

def tambah_url(name, url):
    urls = load_url()
    key = name.lower()

    if not url.lower().startswith(("http://", "https://")):
        return False, "URL harus dimulai dengan http:// atau https://"
    if not HTTP_REGEX.match(url):
        return False, "Format URL tidak valid."
    if key in urls:
        return False, f"Nama '{name}' sudah ada. Gunakan nama lain atau hapus yang lama."

    urls[key] = url
    simpan_url(urls)
    return True, f"URL '{name}' berhasil ditambahkan."

def get_url(name):
    urls = load_url()
    key = name.lower()
    if key in urls:
        return urls[key]
    nospace = key.replace(" ", "")
    for stored, link in urls.items():
        if stored.replace(" ", "") == nospace:
            return link
    return None