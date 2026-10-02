# App Store screenshots

Cinematic marketing frames (lifestyle backgrounds, tilted phone, yellow accents).

## Sizes

| Folder | Size | App Store Connect slot |
|--------|------|------------------------|
| `iphone-6.5/` | **1284 × 2778** | iPhone 6.5" Display |
| `ipad-12.9/` | **2048 × 2732** | 12.9" iPad Pro Display |

Regenerate both:

```bash
.venv-screens/bin/python app/store-screenshots/compose.py
```

## Upload order (same for iPhone + iPad)

1. `01-welcome.png` — Accelerate your Progress  
2. `02-signin.png` — Train with Creators  
3. `03-creators.png` — Follow real Systems  
4. `04-creator-profile.png` — Train with a Creator  
5. `05-program.png` — Structured Camps  
6. `06-session.png` — Drill. Rest. Repeat.  
7. `07-medals.png` — Progress that Sticks  
8. `08-studio.png` — Publish on the Web  

In App Store Connect → version 1.0 → **Previews and Screenshots**:
- iPhone 6.5" → drag `iphone-6.5/` (at least 3)
- 12.9" iPad Pro → drag `ipad-12.9/` (at least 3)

`supportsTablet: true` in `app/app.json`, so iPad screenshots are required for review.
