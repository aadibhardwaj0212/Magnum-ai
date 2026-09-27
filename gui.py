from PyQt5.QtWidgets import QApplication, QLabel, QWidget, QVBoxLayout
from PyQt5.QtCore import Qt
import sys

app = None
window = None

class MagnumGUI(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Magnum Assistant")
        self.setFixedSize(300, 120)
        self.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint)
        self.label = QLabel("Magnum Assistant Ready")
        self.label.setAlignment(Qt.AlignCenter)
        self.label.setStyleSheet("font-size: 16px;")
        layout = QVBoxLayout(); layout.addWidget(self.label); self.setLayout(layout)
        screen = QApplication.primaryScreen().geometry()
        self.move(screen.width() - self.width() - 20, screen.height() - self.height() - 50)

def start_gui():
    global app, window
    app = QApplication(sys.argv); window = MagnumGUI()
def show_listening(): window.label.setText("🎤 Listening..."); window.show()
def show_thinking(): window.label.setText("🧠 Thinking...")
def show_response(text): window.label.setText("💬 " + text)
def hide_gui(): window.hide()
def run_app(): sys.exit(app.exec_())
