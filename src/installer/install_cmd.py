from colorama import Fore, Back, Style, just_fix_windows_console
import os
import urllib.request
from urllib.parse import urlparse
from tqdm import tqdm
import subprocess

just_fix_windows_console()

def download_file(url, destination):
    with urllib.request.urlopen(url) as response:
        total_size = int(response.getheader('Content-Length'))
    
    with tqdm(total=total_size, unit='B', unit_scale=True, desc="Downloading") as pbar:
        def reporthook(blocknum, blocksize, totalsize):
            downloaded = blocknum * blocksize
            pbar.update(downloaded - pbar.n)
        
        urllib.request.urlretrieve(url, destination, reporthook=reporthook)

    print(Fore.GREEN+f"Downloaded {destination} successfully")
    print(Style.RESET_ALL)

print(Fore.LIGHTCYAN_EX+"000000000                                                                             000      000")
print("000    000                                                                           00000     000")
print("000    000  00000000   000000000   00000000    0000000  00000000   00000000         000 000    000")
print("000000000         000  000    000        000 0000      000    000       000        000   000   000")
print("000         000000000  000    000  000000000 000       0000000000  00000000       00000000000  000")
print("000        000    000  000    000 000    000 0000      000        000   000      000      000  000")
print("000         000000000  000    000  000000000  00000000  000000000  00000000     0000       000 000")

print(Style.RESET_ALL)
print(Fore.LIGHTYELLOW_EX+"Checking if Ollama is installed...")
try: 
    ollamacheck = subprocess.run('ollama --version', capture_output=True, text=True, check=True, shell=True)
    print(ollamacheck.stdout.strip())
except (subprocess.CalledProcessError, FileNotFoundError):
    print(Fore.RED+"Ollama not installed, installing Ollama")
    print(Style.RESET_ALL)
    download_file("https://ollama.com/download/OllamaSetup.exe", "OllamaSetup.exe")
    print(Fore.LIGHTYELLOW_EX+"Running OllamaSetup.exe...")
    subprocess.run("OllamaSetup.exe", check=True, shell=True)

print("")
print(Fore.LIGHTYELLOW_EX+"Checking for AI Models...")
try:
    modelcheck = subprocess.run("ollama list", capture_output=True, text=True, shell=True, check=True)
    models = [line.split()[0] for line in modelcheck.stdout.strip().split("\n")[1:]]
    if models:
        print("AI Models found:")
        for i in models:
            print(i)
    else:
        print("No AI Models found. Attepting to install models")
        print("")
        raw = subprocess.run("wmic ComputerSystem get TotalPhysicalMemory", capture_output=True, shell=True, check=True, text=True)
        ram = int(raw/1073741824)
        print("Available System RAM: "+ram+" GB")
        
except subprocess.CalledProcessError:
    print(Fore.RED + "Error checking AI models. Make sure Ollama is properly installed.")
    print(Style.RESET_ALL)
    exit()



print(Fore.LIGHTYELLOW_EX+"Fetching binaries from github.com...")
print(Style.RESET_ALL)
binary_list = ["https://raw.githubusercontent.com/codeowais/Panacea-AI/main/dist/config.json", "https://raw.githubusercontent.com/codeowais/Panacea-AI/main/dist/model_config.exe", "https://raw.githubusercontent.com/codeowais/Panacea-AI/main/dist/panacea.exe"]
os.mkdir("bin")
for i in binary_list:
    parsed_url = urlparse(i)
    filename = os.path.basename(parsed_url.path)
    if os.path.exists("bin"):
        folder = 'bin'   
    else:
        os.mkdir("bin")
        folder = "bin"
    download_file(i, os.path.join(folder, filename))
input(Fore.LIGHTCYAN_EX+"Installation completed. Press Enter to exit")
print(Style.RESET_ALL)
