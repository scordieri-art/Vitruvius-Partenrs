"""
One colour treatment for the indicative photographs of the home page: natural daylight.

Every photograph keeps its colour, but they are brought to the same light: white balance
pulled halfway towards neutral and then set a touch warm, exposure brought towards one
middle grey, saturation slightly restrained, shadows leaning towards the brand navy and
highlights towards a warm paper white, a soft matte floor and a gentle S-curve. The
photographs read as one series shot on the same day; the group's own published images
are never graded.

  python3 -I tools/grade_colour.py <src dir> <out dir>

Sources are the ungraded, resized files (assets/stock/colour-src); outputs go to
web/public/images/home. Re-running is safe: it always starts from the sources.
"""
import sys, os
import numpy as np
from PIL import Image

NAVY = np.array([10, 35, 66]) / 255.0
WARM = np.array([250, 244, 232]) / 255.0
LUMA = np.array([0.2126, 0.7152, 0.0722])

WB = 0.5          # share of the colour cast removed (grey world on mid-tones)
WARMTH = np.array([1.025, 1.0, 0.965])  # the common, slightly warm white
MID = 0.46        # target median luminance
EXPOSE = 0.6      # share of the way to the target
SAT = 0.88        # share of the original saturation kept
SHADOW = 0.12     # navy in the shadows
HIGHLIGHT = 0.10  # warm paper in the highlights
FLOOR = 0.035     # matte black point
CURVE = 0.10      # S-curve strength
LONG = 2400       # long side, px


def grade(im: Image.Image) -> Image.Image:
    a = np.asarray(im.convert("RGB"), dtype=np.float64) / 255.0
    lum = a @ LUMA
    # white balance: grey world on mid-tones, halfway, then the common warm white
    mask = (lum > 0.15) & (lum < 0.85)
    mean = a[mask].mean(axis=0) if mask.any() else a.reshape(-1, 3).mean(axis=0)
    gain = (mean.mean() / mean) ** WB
    a = np.clip(a * gain * WARMTH, 0, 1)
    # exposure: move the median luminance part of the way to the target (as a gamma)
    lum = a @ LUMA
    med = float(np.median(lum))
    if 0.02 < med < 0.98:
        g = np.log(MID) / np.log(med)
        g = 1 + (g - 1) * EXPOSE
        a = np.clip(a, 1e-6, 1) ** g
    # saturation
    lum = (a @ LUMA)[..., None]
    a = lum + (a - lum) * SAT
    # split tone: navy shadows, warm highlights
    l = np.clip(lum, 0, 1)
    sh = (1 - l) ** 2 * SHADOW
    hi = l ** 2 * HIGHLIGHT
    a = a * (1 - sh - hi) + NAVY * sh + WARM * hi
    # gentle S-curve, then the matte floor
    a = np.clip(a, 0, 1)
    a = a + CURVE * (a - 0.5) * (1 - np.abs(a - 0.5) * 2)
    a = FLOOR + a * (1 - FLOOR)
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if not f.lower().endswith((".jpg", ".jpeg")):
            continue
        im = Image.open(os.path.join(src, f))
        im.thumbnail((LONG, LONG), Image.LANCZOS)
        g = grade(im)
        g.save(os.path.join(dst, f), quality=84, optimize=True, progressive=True)
        print(f, g.size, os.path.getsize(os.path.join(dst, f)) // 1024, "KB")
