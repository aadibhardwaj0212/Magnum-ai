import sounddevice as sd
import queue
import json
from vosk import Model, KaldiRecognizer

q = queue.Queue()
model = Model("model")

def callback(indata, frames, time, status):
    q.put(bytes(indata))

def listen_for_wake_word():
    print("🔵 Wake word engine started... Say 'Hey Magnum'")
    rec = KaldiRecognizer(model, 16000)
    with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype="int16", channels=1, callback=callback):
        while True:
            data = q.get()
            if rec.AcceptWaveform(data):
                text = json.loads(rec.Result())["text"]
                print("Heard:", text)
                if "magnum" in text.lower():
                    print("🟢 Wake word detected!"); return
