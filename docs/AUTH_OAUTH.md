# OAuth setup (Google + Apple) — RASHMAT app

Native code is ready (`app/src/lib/oauth.ts`):

- **Apple (iOS):** native Sign in with Apple → Supabase `signInWithIdToken`
- **Google:** browser OAuth via Supabase + `rashmat://auth/callback` (PKCE)

Providers will still fail until the dashboards below are configured.

## 1) Supabase → Authentication → URL configuration

- **Site URL:** `https://rashmat.com`
- **Redirect URLs** (add all):
  - `rashmat://auth/callback`
  - `rashmat://**`
  - `exp://**` (Expo Go / dev)
  - `https://rashmat.com/**`

In Metro / Xcode logs, look for:

```text
[RASHMAT] OAuth (google) redirectTo — add to Supabase Redirect URLs: …
```

That exact URI must be allowed.

## 2) Google

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials  
2. Create **OAuth 2.0 Client ID** type **Web application**  
3. Authorized redirect URIs → use the Supabase callback:

```text
https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
```

(Project ref is in Supabase → Project Settings → API → Project URL)

4. Supabase → Authentication → Providers → **Google** → Enable  
5. Paste **Client ID** + **Client Secret** from the Web client  
6. Save

## 3) Apple

1. [Apple Developer](https://developer.apple.com/account) → Identifiers → `com.rashmat.app`  
2. Enable **Sign In with Apple** → Save  
3. Certificates, Identifiers & Profiles → **Keys** → create a key with **Sign In with Apple** (Services ID / primary App ID = `com.rashmat.app`)  
4. Download `.p8` once; note Key ID  
5. Supabase → Authentication → Providers → **Apple** → Enable  
6. Fill:
   - **Services ID** (or leave empty for native id_token on iOS — follow current Supabase Apple docs)
   - **Secret Key** (JWT generated from `.p8` — Supabase UI can help / see docs)
   - Team ID, Key ID  
7. EAS rebuild after enabling `usesAppleSignIn` (already in `app.json`)

For **native** Apple on device/TestFlight, the App ID capability is the critical part; Supabase must accept Apple id tokens for your bundle/team.

## 4) Rebuild

Apple Sign In is a native module — Expo Go may be limited. Use a **dev client** or **EAS production** build:

```bash
cd app
npx eas-cli build --platform ios --profile production
```

## 5) Quick test

| Provider | Expected |
|----------|----------|
| Apple on iPhone | System Apple sheet → lands in assessment/home |
| Google | Safari/ASWebAuthentication → back to app signed in |
| Cancel | Stay on sign-in (no error alert) |

If Google opens then returns without session: Redirect URL mismatch (step 1) or Google client redirect (step 2).

If Apple says not available / failed: capability missing on App ID, or need new build with `expo-apple-authentication`.
