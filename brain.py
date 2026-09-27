import webbrowser
import datetime
import os
from speak import speak
from ai import ask_ai
from web_search import web_search

chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe %s"
edge_path = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe %s"
try:
    browser = webbrowser.get(chrome_path)
except webbrowser.Error:
    try: browser = webbrowser.get(edge_path)
    except webbrowser.Error: browser = webbrowser


def process_command(command):
    command = command.lower().strip()
    if "open youtube" in command:
        speak("Opening YouTube"); browser.open("https://www.youtube.com"); return
    if "open google" in command:
        speak("Opening Google"); browser.open("https://www.google.com"); return
    if command in {"what time is it", "what is the time", "tell me the time"}:
        speak("The current time is " + datetime.datetime.now().strftime("%I:%M %p")); return
    if command in {"what is the date", "what's the date", "tell me the date"}:
        speak("Today's date is " + datetime.datetime.now().strftime("%d %B %Y")); return
    if command in {"exit", "quit", "stop", "shutdown", "close assistant"}:
        speak("Goodbye"); os._exit(0)
    speak("Let me check the web.")
    results = web_search(command)
    if results: ask_ai(command, results)
    else: speak("I couldn't access the web right now, so I can't give you a reliable current answer.")
