import sounddevice as sd
import whisper
import scipy.io.wavfile as wav
import time

model = whisper.load_model("small")

def listen(duration=5, fs=16000):
    print("Listening... Speak now!"); time.sleep(0.5)
    recording = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype="int16")
    sd.wait(); wav.write("temp.wav", fs, recording)
    result = model.transcribe("temp.wav")
    print("You said:", result["text"])
    return result["text"].lower()
