import os, webbrowser
from handling_tambah_url import load_url

WHITELIST_APPS = {
    "firefox": "firefox",
    "chrome": "google-chrome",
    "google chrome": "google-chrome",
    "edge": "microsoft-edge",
    "terminal": "gnome-terminal",
    "file manager": "xdg-open .",
    "files": "xdg-open .",
    "calculator": "gnome-calculator",
    "kalkulator": "gnome-calculator",
    "vscode": "code .",
    "android studio": "android-studio",
    "intellij": "intellij-idea-community",
    "netbeans": "netbeans"
}

def buka_aplikasi(app_name: str) -> str:
    cmd = WHITELIST_APPS.get(app_name.lower())
    if not cmd:
        return f"Aplikasi '{app_name}' tidak diizinkan untuk dibuka."
    os.system(cmd)
    return f"Mencoba membuka {app_name}"

def buka_web(url: str) -> str:
    webbrowser.open(url.replace(" ", ""))
    return f"Membuka {url} di browser"

def pencarian_google(query: str) -> str:
    webbrowser.open_new_tab(f"https://www.google.com/search?q={query}")
    return f"Mencari '{query}' di Google"

def eksekusi_perintah(command: str, get_custom_url):
    text = command.lower().strip()
    if text.startswith("buka aplikasi"):
        return buka_aplikasi(text.replace("buka aplikasi", "", 1).strip())

    if text.startswith("buka"):
        target = text.replace("buka", "", 1).strip()
        if not target:
            return "Perintah kurang jelas. Sebutkan apa yang ingin dibuka."

        custom_url = get_custom_url(target) or get_custom_url(target.replace(" ", ""))
        if custom_url:
            return buka_web(custom_url)
        if "." in target or target.startswith("www"):
            return buka_web("http://" + target if not target.startswith("http") else target)
        return buka_aplikasi(target)

    if text.startswith("cari"):
        return pencarian_google(text.replace("cari", "", 1).strip())

    if "tampilkan url" in text or "daftar url" in text:
        urls = load_url()
        if not urls:
            return "Belum ada URL yang tersimpan."
        listing = "\n".join(f"- {k}: {v}" for k, v in urls.items())
        return "Ini daftar URL yang tersimpan:\n" + listing

    return "Aku tidak mengerti. Gunakan kata kunci 'buka', 'buka aplikasi', atau 'cari'."