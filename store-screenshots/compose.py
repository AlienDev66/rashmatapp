#!/usr/bin/env python3
"""Cinematic App Store screenshots — iPhone 6.5" + iPad 12.9"."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

YELLOW = (245, 196, 16)
WHITE = (255, 255, 255)
MUTED = (198, 198, 198)

ROOT = Path(__file__).resolve().parent
ASSETS = Path(
    "/Users/domingoscapitango/.cursor/projects/"
    "Users-domingoscapitango-Coding-rashmat/assets"
)
BGS = ROOT / "bgs"
LOGO = Path("/Users/domingoscapitango/Coding/rashmat/app/src/assets/rashmat_logo_yellow.png")

FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_ITALIC = "/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf"

# App Store Connect sizes
TARGETS = [
    {
        "key": "iphone-6.5",
        "w": 1284,
        "h": 2778,
        "layout": "stack",  # copy on top, phone below
    },
    {
        "key": "ipad-12.9",
        "w": 2048,
        "h": 2732,
        "layout": "split",  # copy left, phone right
    },
]

SLIDES = [
    {
        "file": "01-welcome.png",
        "src": "IMG_6425_1-cde74c49-2a94-4b36-bb91-9a8d5fa77ebc.png",
        "bg": "bg-warrior-glow.jpg",
        "headline": ("Accelerate your", "Progress"),
        "sub": "Structured programs. Real results. Built for the mat.",
        "features": ["Personalized camps", "Expert drills", "Real progress"],
        "tilt": 9,
    },
    {
        "file": "02-signin.png",
        "src": "IMG_6439_1-f8ecdc71-0feb-445e-ad05-970efa229840.png",
        "bg": "bg-belt-embers.jpg",
        "headline": ("Train with", "Creators"),
        "sub": "Follow coaches who live your sport — BJJ, MMA, striking.",
        "features": ["Sign in fast", "Secure accounts", "Ready to train"],
        "tilt": -7,
    },
    {
        "file": "03-creators.png",
        "src": "Screenshot_2026-09-24_at_01.15.08_1-e0e466a6-368e-4502-a66a-3e5acfb2b133.png",
        "bg": "bg-section-creators.jpg",
        "headline": ("Follow real", "Systems"),
        "sub": "Discover verified creators and unlock their programs.",
        "features": ["Verified coaches", "Program previews", "One tap follow"],
        "tilt": 8,
    },
    {
        "file": "04-creator-profile.png",
        "src": "Screenshot_2026-09-24_at_01.16.10_1-b6d34ebe-c722-4024-ad34-c4ccf0ec4711.png",
        "bg": "bg-section-plan.jpg",
        "headline": ("Train with a", "Creator"),
        "sub": "Follow, unlock, and run their structured camps.",
        "features": ["Creator profiles", "Camp unlocks", "Train →"],
        "tilt": -8,
    },
    {
        "file": "05-program.png",
        "src": "IMG_6444_1-b63b6da2-ea32-4252-aaa6-4fb0cce0c62d.png",
        "bg": "bg-hero-landing.jpg",
        "headline": ("Structured", "Camps"),
        "sub": "Weeks, sessions, and progress — built for the mat.",
        "features": ["Weekly schedule", "Session timing", "Track progress"],
        "tilt": 7,
    },
    {
        "file": "06-session.png",
        "src": "IMG_6428_1-76393bf3-72c2-44ec-8f09-9839f859d807.png",
        "bg": "bg-dojo-mat.jpg",
        "headline": ("Drill. Rest.", "Repeat."),
        "sub": "Video loops, set logging, and rest timers in one flow.",
        "features": ["Live drills", "Rest timers", "Set logging"],
        "tilt": -9,
    },
    {
        "file": "07-medals.png",
        "src": "IMG_6465_1-456ddf87-f3bc-454b-909b-e35e2179f40f.png",
        "bg": "bg-belt-embers.jpg",
        "headline": ("Progress that", "Sticks"),
        "sub": "XP, medals, and milestones for every session you finish.",
        "features": ["XP rewards", "Milestones", "Veteran medals"],
        "tilt": 8,
    },
    {
        "file": "08-studio.png",
        "src": "IMG_6436_1-cdb34de6-a574-43b9-84d4-54dda9fd1a75.png",
        "bg": "bg-ig-section.jpg",
        "headline": ("Create &", "Monetize"),
        "sub": "Publish programs and watch student progress from Studio.",
        "features": ["Publish camps", "Student progress", "Creator tools"],
        "tilt": -7,
    },
]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def fit_cover(im: Image.Image, tw: int, th: int) -> Image.Image:
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale + 0.5), int(sh * scale + 0.5)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255
    )
    return mask


def find_coeffs(pa, pb):
    matrix = []
    for (x, y), (u, v) in zip(pa, pb):
        matrix.append([u, v, 1, 0, 0, 0, -u * x, -v * x])
        matrix.append([0, 0, 0, u, v, 1, -u * y, -v * y])
    B = [c for p in pa for c in p]
    n = 8
    M = [matrix[i][:] + [B[i]] for i in range(n)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(M[r][col]))
        M[col], M[pivot] = M[pivot], M[col]
        div = M[col][col] or 1e-12
        for j in range(col, n + 1):
            M[col][j] /= div
        for row in range(n):
            if row == col:
                continue
            factor = M[row][col]
            for j in range(col, n + 1):
                M[row][j] -= factor * M[col][j]
    return [M[i][n] for i in range(n)]


def make_phone(shot: Image.Image, phone_w: int, phone_h: int, scale: float = 1.0) -> Image.Image:
    bezel = max(12, int(14 * scale))
    radius = max(48, int(78 * scale))
    phone = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(phone)

    draw.rounded_rectangle(
        (0, 0, phone_w - 1, phone_h - 1), radius=radius, fill=(*YELLOW, 255)
    )
    inset = max(5, int(7 * scale))
    draw.rounded_rectangle(
        (inset, inset, phone_w - 1 - inset, phone_h - 1 - inset),
        radius=radius - 4,
        fill=(12, 12, 14, 255),
    )

    inner = (bezel, bezel, phone_w - bezel, phone_h - bezel)
    iw, ih = inner[2] - inner[0], inner[3] - inner[1]
    screen = fit_cover(shot.convert("RGB"), iw, ih).convert("RGBA")
    mask = rounded_mask((iw, ih), max(24, radius - bezel))
    phone.paste(screen, (inner[0], inner[1]), mask)

    island_w, island_h = int(phone_w * 0.28), max(22, int(28 * scale))
    ix = (phone_w - island_w) // 2
    iy = bezel + max(8, int(10 * scale))
    draw.rounded_rectangle(
        (ix, iy, ix + island_w, iy + island_h),
        radius=island_h // 2,
        fill=(0, 0, 0, 220),
    )
    return phone


def tilt_phone(phone: Image.Image, angle_deg: float) -> Image.Image:
    w, h = phone.size
    pad = int(max(w, h) * 0.18)
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    canvas.paste(phone, (pad, pad), phone)
    cw, ch = canvas.size

    k = math.tan(math.radians(abs(angle_deg))) * 0.35
    shrink = int(h * k * 0.55)
    shift = int(w * k * 0.35)
    pitch = int(h * 0.02)

    if angle_deg >= 0:
        dest = [
            (pad + shift, pad + shrink + pitch),
            (pad + w - shift // 3, pad + pitch // 2),
            (pad + w, pad + h - pitch // 2),
            (pad + shift // 2, pad + h - shrink),
        ]
    else:
        dest = [
            (pad + shift // 3, pad + pitch // 2),
            (pad + w - shift, pad + shrink + pitch),
            (pad + w - shift // 2, pad + h - shrink),
            (pad, pad + h - pitch // 2),
        ]

    src = [(pad, pad), (pad + w, pad), (pad + w, pad + h), (pad, pad + h)]
    coeffs = find_coeffs(dest, src)
    warped = canvas.transform(
        (cw, ch), Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC
    )

    alpha = warped.split()[-1]
    shade = Image.new("RGBA", (cw, ch), (0, 0, 0, 160))
    shade.putalpha(alpha.point(lambda a: int(a * 0.55)))
    shade = shade.filter(ImageFilter.GaussianBlur(28))
    out = Image.new("RGBA", (cw + 40, ch + 50), (0, 0, 0, 0))
    out.paste(shade, (28, 36), shade)
    out.alpha_composite(warped, (0, 0))
    return out


def cinematic_bg(path: Path, out_w: int, out_h: int) -> Image.Image:
    base = fit_cover(Image.open(path).convert("RGB"), out_w, out_h)
    base = ImageEnhance.Brightness(base).enhance(0.55)
    base = ImageEnhance.Contrast(base).enhance(1.15)
    base = ImageEnhance.Color(base).enhance(0.9)

    overlay = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    top_h = int(out_h * 0.33)
    for i in range(top_h):
        a = int(210 * (1 - i / top_h) ** 1.35)
        d.line([(0, i), (out_w, i)], fill=(0, 0, 0, a))
    bot_h = int(out_h * 0.2)
    for i in range(bot_h):
        y = out_h - 1 - i
        a = int(180 * (1 - i / bot_h) ** 1.2)
        d.line([(0, y), (out_w, y)], fill=(0, 0, 0, a))
    side = int(out_w * 0.12)
    for i in range(side):
        a = int(90 * (1 - i / side))
        d.line([(i, 0), (i, out_h)], fill=(0, 0, 0, a))
        d.line([(out_w - 1 - i, 0), (out_w - 1 - i, out_h)], fill=(0, 0, 0, a))
    wash = Image.new("RGBA", (out_w, out_h), (40, 22, 0, 45))
    return Image.alpha_composite(
        Image.alpha_composite(base.convert("RGBA"), wash), overlay
    ).convert("RGB")


def draw_features(
    draw: ImageDraw.ImageDraw,
    features: list[str],
    x: int,
    y: int,
    label_size: int,
    gap: int,
) -> int:
    f_label = font(FONT_REG, label_size)
    r = max(14, label_size // 2)
    for label in features:
        draw.ellipse((x, y + 4, x + r * 2, y + 4 + r * 2), fill=YELLOW)
        cx, cy = x + r, y + 4 + r
        draw.line((cx - 6, cy + 1, cx - 1, cy + 6), fill=(0, 0, 0), width=3)
        draw.line((cx - 1, cy + 6, cx + 8, cy - 5), fill=(0, 0, 0), width=3)
        draw.text((x + r * 2 + 14, y + 4), label, font=f_label, fill=WHITE)
        y += gap
    return y


def wrap_lines(draw, text: str, fnt, max_w: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def compose(slide: dict, target: dict) -> Image.Image:
    out_w, out_h = target["w"], target["h"]
    layout = target["layout"]
    # Scale typography relative to iPhone baseline width
    s = out_w / 1284

    canvas = cinematic_bg(BGS / slide["bg"], out_w, out_h).convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    pad_x = int(64 * s) if layout == "stack" else int(80 * s * 0.85)
    y = int(88 * s) if layout == "stack" else int(220 * (out_h / 2732))

    copy_max_w = (
        out_w - pad_x * 2 - 40
        if layout == "stack"
        else int(out_w * 0.42) - pad_x
    )

    # Brand
    logo_sz = max(48, int(56 * s))
    if LOGO.exists():
        logo = Image.open(LOGO).convert("RGBA").resize(
            (logo_sz, logo_sz), Image.Resampling.LANCZOS
        )
        canvas.paste(logo, (pad_x, y), logo)
        brand_f = font(FONT_ITALIC, max(30, int(36 * s)))
        draw.text((pad_x + logo_sz + 16, y + int(10 * s)), "RASHMAT", font=brand_f, fill=YELLOW)
    else:
        brand_f = font(FONT_ITALIC, max(30, int(36 * s)))
        draw.text((pad_x, y + int(10 * s)), "RASHMAT", font=brand_f, fill=YELLOW)
    y += int(78 * s)

    head1_f = font(FONT_BLACK, max(56, int(68 * s)))
    head2_f = font(FONT_BLACK, max(60, int(74 * s)))
    line1, accent = slide["headline"]
    draw.text((pad_x, y), line1, font=head1_f, fill=WHITE)
    y += int(78 * s)

    glow = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.text((pad_x, y), accent, font=head2_f, fill=(*YELLOW, 90))
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    canvas = Image.alpha_composite(canvas, glow)
    draw = ImageDraw.Draw(canvas)
    draw.text((pad_x, y), accent, font=head2_f, fill=YELLOW)
    y += int(88 * s)

    sub_f = font(FONT_REG, max(24, int(28 * s)))
    for line in wrap_lines(draw, slide["sub"], sub_f, copy_max_w)[:3]:
        draw.text((pad_x, y), line, font=sub_f, fill=MUTED)
        y += int(36 * s)
    y += int(18 * s)

    y = draw_features(
        draw,
        slide["features"],
        pad_x,
        y,
        label_size=max(24, int(26 * s)),
        gap=max(42, int(48 * s)),
    ) + int(10 * s)

    # Phone device
    shot = Image.open(ASSETS / slide["src"]).convert("RGB")
    if layout == "stack":
        phone_w, phone_h = int(860 * min(s, 1.15)), int(1760 * min(s, 1.15))
    else:
        phone_w, phone_h = int(980 * (out_h / 2732)), int(2000 * (out_h / 2732))

    phone = make_phone(shot, phone_w, phone_h, scale=s)
    tilted = tilt_phone(phone, slide["tilt"])

    if layout == "stack":
        max_phone_h = out_h - y - 40
        max_phone_w = out_w - 40
        tw, th = tilted.size
        scale = min(max_phone_w / tw, max_phone_h / th, 1.0)
        nw, nh = int(tw * scale), int(th * scale)
        tilted = tilted.resize((nw, nh), Image.Resampling.LANCZOS)
        px = (out_w - nw) // 2
        py = y + max(0, (out_h - y - nh) // 2) - 20
        py = min(py, out_h - nh - 24)
        canvas.alpha_composite(tilted, (px, max(py, y)))
    else:
        # Split: phone on right, vertically centered
        max_phone_h = int(out_h * 0.82)
        max_phone_w = int(out_w * 0.52)
        tw, th = tilted.size
        scale = min(max_phone_w / tw, max_phone_h / th)
        nw, nh = int(tw * scale), int(th * scale)
        tilted = tilted.resize((nw, nh), Image.Resampling.LANCZOS)
        px = out_w - nw - int(60 * (out_w / 2048))
        py = (out_h - nh) // 2 + 40
        canvas.alpha_composite(tilted, (px, py))

    return canvas.convert("RGB")


def main() -> None:
    for target in TARGETS:
        out_dir = ROOT / target["key"]
        out_dir.mkdir(parents=True, exist_ok=True)
        for slide in SLIDES:
            img = compose(slide, target)
            out = out_dir / slide["file"]
            img.save(out, "PNG", optimize=True)
            print(
                f"wrote {target['key']}/{out.name}  "
                f"{img.size[0]}x{img.size[1]}"
            )


if __name__ == "__main__":
    main()
