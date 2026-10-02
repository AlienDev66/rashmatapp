# App Store listing + review (EN)

Keep Subtitle ≤ **30 characters** (Apple hard limit).

| Field | Value |
|--------|--------|
| **Name** | `RASHMAT - Train with creators` |
| **Subtitle** | `Train with creators` (19) |
| **Support URL** | `https://rashmat.com/support` |
| **Marketing URL** | `https://rashmat.com` |
| **Privacy** | `https://rashmat.com/privacy` |
| **Bundle ID** | `com.rashmat.app` |
| **Version** | `1.0.0` |
| **EAS project** | `@aliendev/rashmat` (`1587fc58-b4f9-4ade-a6f3-95493145e27f`) |

> Soft launch: avoid “monetize / payouts / Pro pricing” in name, screenshots, and description until StoreKit is live (`app/src/lib/billing.ts` → `storeKitEnabled`).

## Pricing (App Store Connect)

1. Open the app → **Pricing and Availability**
2. **Price Schedule** → **Free**
3. **Availability** → all territories (or your markets)
4. **IAP:** none for 1.0 (soft launch)

## Encryption (App Store Connect + Xcode/EAS)

- Uses standard HTTPS only → **exempt**
- In build: `ITSAppUsesNonExemptEncryption = NO` (set in `app.json`)
- Connect: answered when attaching a build / TestFlight compliance — select **No**

## App Review demo account

| | |
|--|--|
| **Sign-in required** | Yes |
| **User name** | `review@rashmat.com` |
| **Password** | `RashmatReview2026!` |

Confirm email once in Supabase (SQL):

```sql
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'review@rashmat.com';
```

Also apply account-deletion RPC before review:

```bash
# from app/ — push migration 20261002000000_delete_own_account.sql
supabase db push
# or run the SQL in the Supabase SQL editor
```

## App Review Notes (paste into Connect)

```
RASHMAT is a martial arts training app for athletes.

Demo account (Sign-in required):
Email: review@rashmat.com
Password: RashmatReview2026!

After sign-in:
1. Complete Mat profile (short onboarding) if prompted
2. Open Home / Train — start or browse a camp
3. Open Creators — follow a creator (optional)
4. Open a program → Unlock free (soft launch, no payment) → Start session
5. Progress / XP may update after completing a session
6. Settings → Delete account is available (App Store 5.1.1)

Creator Studio (publish programs) is web-based:
https://rashmat.com/studio
It does not need full review inside the iOS binary.

This build is a free soft launch: no In-App Purchases and no card checkout.
Camps unlock for free until StoreKit billing ships.

Privacy: https://rashmat.com/privacy
Terms: https://rashmat.com/terms
Support: https://rashmat.com/support

Contact: support@rashmat.com
```

## Phase 2 (StoreKit) — keep ready

Flip in `app/src/lib/billing.ts`:

```ts
storeKitEnabled: true
```

Then restore priced paywall + checkout card/StoreKit path (already gated in `paywall.tsx` / `checkout.tsx` / `subscriptions.tsx`).

## EAS build (iOS → TestFlight)

After these compliance fixes, ship a new build (icon + review fixes):

```bash
cd app
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production --latest
```

### Connect checklist

- [ ] Pricing → **Free**
- [ ] Encryption → **No** (if asked)
- [ ] Support / Privacy / Marketing URLs
- [ ] Screenshots (avoid “Create & Monetize” until payouts exist)
- [ ] App name without “monetize”
- [ ] App Review demo account + updated notes
- [ ] Build with delete-account + free unlock attached to 1.0
- [ ] Submit for review
