from handling_tambah_url import load_url
import os
import webbrowser

def buka_aplikasi(app_name):
    app_name_lower = app_name.lower()

    if app_name_lower == 'firefox':
        cmd = 'firefox'
    elif app_name_lower in ['chrome', 'google chrome']:
        cmd = 'google-chrome'
    elif app_name_lower == 'terminal':
        cmd = 'gnome-terminal'
    elif app_name_lower in ['file manager', 'files']:
        cmd = 'xdg-open .'
    elif app_name_lower in ['calculator', 'kalkulator']:
        cmd = 'gnome-calculator'
    elif app_name_lower in ['vscode', 'vskode', 'vscod']:
        cmd = 'code .'
    elif app_name_lower == 'android studio':
        cmd = 'android-studio'
    elif app_name_lower in ['intelije', 'intelij']:
        cmd = 'intellij-idea-community'
    elif app_name_lower in ['netbeans', 'netbin']:
        cmd = 'netbeans'
    else:
        cmd = app_name

    os.system(cmd)
    return f"mencoba membuka {app_name}"

def buka_web(url):
    bersihkan_spasi_url = url.replace(" ", "")
    webbrowser.open(bersihkan_spasi_url)
    return f"membuka {url} di browser"

def pencarian_google(query):
    search_url = f"https://www.google.com/search?q={query}"
    webbrowser.open_new_tab(search_url)
    return f"Mencari '{query}' di Google"

def eksekusi_perintah(command_text, get_custom_url_func):
    command_text = command_text.lower().strip()
    response = ""

    if "buka aplikasi" in command_text:
        app = command_text.replace("buka aplikasi", "").strip()
        response = buka_aplikasi(app)

    elif "buka" in command_text:
        parts = command_text.split("buka", 1)
        if len(parts) > 1:
            target = parts[1].strip()

            custom_url = get_custom_url_func(target)
            if not custom_url:
                custom_url = get_custom_url_func(target.replace(" ", ""))

            if custom_url:
                response = buka_web(custom_url)
            elif "." in target or "www." in target:
                response = buka_web(target.replace(" ", ""))
            else:
                response = buka_aplikasi(target)
        else:
            response = "Perintah kurang jelas. sebutkan apa yang ingin dibuka."

    elif command_text.startswith("cari "):
        query = command_text.replace("cari", "").strip()
        response = pencarian_google(query)

    elif "tampilkan url" in command_text or "daftar url" in command_text:
        urls = load_url()
        if urls:
            response = "ini daftar URL yang tersimpan:\n"
            for name, url in urls.items():
                response += f"- {name}: {url}\n"
        else:
            response = "Belum ada URL yang tersimpan."

    else:
        response = "Aku ga ngerti yang kamu omongin, coba pake kata kunci 'buka' untuk buka aplikasi atau website, dan 'cari' untuk otomatis search di google"

    return response