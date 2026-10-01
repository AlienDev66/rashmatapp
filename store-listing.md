# App Store listing copy (EN)

Keep Subtitle ≤ **30 characters** (Apple hard limit).

| Field | Value | Chars |
|--------|--------|------:|
| **Name** | `RASHMAT - Train or monetize` | (as in Connect) |
| **Subtitle** | `Train with creators` | 19 |
| **Support URL** | `https://rashmat.com/support` | |
| **Marketing URL** | `https://rashmat.com` | |
| **Privacy** | `https://rashmat.com/privacy` | |

Previous subtitle `Martial arts camps & creator studio` was **35** chars → rejected / truncated.

Alternates (also ≤30): `Camps & creator studio` (22), `Camps from creators` (20).

## App Review demo account

Created in Supabase Auth (confirm email once — see below):

| | |
|--|--|
| **Email** | `review@rashmat.com` |
| **Password** | `RashmatReview2026!` |

### Confirm email (required once)

Supabase Dashboard → **SQL Editor** → run:

```sql
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'review@rashmat.com';
```

(`confirmed_at` is a generated column — do not set it.)

Or: Authentication → Users → `review@rashmat.com` → Confirm user.
