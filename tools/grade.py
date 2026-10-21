"""
One colour treatment for every indicative stock photograph on the site.

Cool and desaturated, shadows leaning towards the brand navy, highlights towards
paper: the photographs read as one family and never compete with the real
project images published by the group (which are never graded).

  python3 -I tools/grade.py <src dir> <out dir>

Sources are the ungraded, resized files (assets/stock/web-src); outputs go to
web/public/images/placeholder. Re-running is safe: it always starts from the sources.
"""
import sys, os
import numpy as np
from PIL import Image

NAVY = np.array([10, 35, 66]) / 255.0
PAPER = np.array([250, 250, 249]) / 255.0
SAT = 0.38      # share of the original saturation kept
TONE = 0.28     # strength of the navy → paper gradient map
GAMMA = 1.08    # slightly deeper mid-tones

def grade(im: Image.Image) -> Image.Image:
    a = np.asarray(im.convert("RGB"), dtype=np.float64) / 255.0
    lum = (a @ np.array([0.2126, 0.7152, 0.0722]))[..., None]
    desat = lum + (a - lum) * SAT
    l = np.clip(lum, 0, 1) ** GAMMA
    gm = NAVY * (1 - l) + PAPER * l
    out = desat * (1 - TONE) + gm * TONE
    # gentle S-curve on luminance for depth without crushing
    out = np.clip(out, 0, 1)
    out = out + 0.06 * (out - 0.5) * (1 - np.abs(out - 0.5) * 2)
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if not f.lower().endswith((".jpg", ".jpeg")):
            continue
        im = Image.open(os.path.join(src, f))
        g = grade(im)
        g.save(os.path.join(dst, f), quality=84, optimize=True, progressive=True)
        print(f, im.size, os.path.getsize(os.path.join(dst, f)) // 1024, "KB")
