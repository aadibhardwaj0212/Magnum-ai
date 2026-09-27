from PyQt5.QtCore import QTimer
from gui import start_gui, show_response, run_app
from speak import speak
from listen import listen
from wake_word import listen_for_wake_word
from brain import process_command

start_gui()

def assistant_flow():
    print("Waiting for wake word..."); listen_for_wake_word()
    show_response("✨ Yes sir?"); speak("Yes sir, I am listening")
    text = listen(); show_response("You said: " + text); process_command(text)

def loop_forever():
    assistant_flow(); QTimer.singleShot(100, loop_forever)

QTimer.singleShot(2000, loop_forever)
run_app()
