"""Build the tiny original UI tones bundled for offline play."""
from pathlib import Path
import math
import struct
import wave

folder = Path(__file__).resolve().parents[1] / "assets" / "audio"
folder.mkdir(parents=True, exist_ok=True)
rate = 22050

def render(name, length, notes):
    values = []
    for i in range(int(rate * length)):
        t = i / rate
        value = 0
        for start, frequency, duration, gain in notes:
            x = t - start
            if 0 <= x <= duration:
                envelope = min(1, x / .006) * math.exp(-7 * x / duration)
                value += gain * envelope * (
                    math.sin(2 * math.pi * frequency * x)
                    + .2 * math.sin(2 * math.pi * frequency * 2 * x)
                )
        values.append(struct.pack("<h", int(max(-1, min(1, value)) * 26000)))
    with wave.open(str(folder / name), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes(b"".join(values))

render("move.wav", .13, [(0, 750, .11, .21), (.01, 1100, .07, .1)])
render("win.wav", .68, [
    (0, 523.25, .24, .22),
    (.13, 659.25, .25, .22),
    (.26, 783.99, .33, .22),
    (.39, 1046.50, .28, .15),
])