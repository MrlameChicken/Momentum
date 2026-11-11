# Momentum

A deliberately small, mobile-friendly workspace for choosing what matters, doing it, and leaving work behind.

**Open the app:** https://mrlamechicken.github.io/Momentum/

## What changed

- **Today:** one priority, a concrete next step, and an optional definition of done.
- **Also on your list:** add up to three secondary tasks only when needed.
- **Focus:** a small 5/25/50-minute timer.
- **Close out the day:** optional evidence of progress and tomorrow's first step.
- **Week:** seven-day history, completed priorities, focus minutes, and a single reflection.
- **Settings:** backup/restore and sign-out, away from the primary workflow.
- **Sign-in:** email **and password** instead of sending an email link every time. Your browser keeps the session for return visits.

The visual design intentionally has no streaks, scores, confetti, large charts, coaching speeches, or compulsory multi-step rituals. It draws on patterns in well-established task apps and on progressive disclosure in interaction design.

## One-time Supabase setup

The app uses Supabase project `ihtcxdlcgpqajrtodpqa` and database table `public.momentum_data`.

1. **Database:** In Supabase SQL Editor, run `supabase-setup.sql` if you have not already. It enables row-level security (RLS) and grants authenticated users access **only to their own records**.
2. **Create/confirm your account:** Under Authentication → Users, make sure your own email account exists, is *confirmed*, and **has a password set**. The simplest no-email route for a new account is **Add user → Create new user**, set a strong unique password, and use **Auto Confirm User**.
3. **If you already have an unconfirmed invitation:** A pending invitation alone does not necessarily establish a password. Do **not** delete an account with existing records. If there are no records for that user, you can remove the unconfirmed invitation account and then use **Create new user** instead. If it already has data, preserve the user ID and use a supported Supabase account recovery/admin flow rather than deleting the user.
4. **Restrict access:** Authentication → Providers / Sign In → disable **Allow new users to sign up** and disable anonymous sign-ins. Leave Email authentication and password sign-in enabled.
5. **GitHub Pages:** Repository Settings → Pages → **Deploy from a branch**, branch **main**, folder **/(root)**.
6. **URL Configuration:** Set Site URL to `https://mrlamechicken.github.io/Momentum/`. This is no longer needed for daily password login, but keep it correct for future account recovery.

## Day-to-day usage

Open the site on phone or laptop. On the first visit, enter your existing Supabase user's email and password. Later visits on the same browser typically reopen the workspace automatically; manually signing out or clearing browser storage requires signing in again.

Type the **one result** that matters today. Write the **first step** in plain language. Use `Also on your list` only if needed. Mark the priority done only after verifying the result. At the end of your day, optionally note evidence and the first move for tomorrow.

The app **autosaves to Supabase**. Wait for **Saved** in the header before leaving. A network connection is required to save.

On Android Chrome, use the browser's menu → **Add to Home screen** to create a convenient shortcut.

## Privacy and security

- The website files are **publicly readable** on GitHub Pages, including the Supabase **publishable** key and project URL. This is expected for browser applications.
- **Personal records** live in Supabase, protected by authenticated access and RLS based on `auth.uid()`. Never turn off RLS or add an unfiltered public read policy.
- **Do not** put your account password, Supabase service-role/secret key, or personal notes into repository files. Passwords are submitted only to Supabase Authentication via HTTPS; the app does not store them itself.
- Signups should stay disabled, preventing additional self-registered accounts. RLS still ensures that an authorized account cannot read someone else's data.
- Cloud-hosted data is **not end-to-end encrypted**. Avoid storing confidential employer information.
- Use a **strong unique password**; if you shared one in chat or elsewhere, rotate it.

## Data compatibility and backups

Momentum keeps using the existing Supabase JSON payload with `days` and `weeks` maps. Earlier priority, definition, focus, evidence, next-day notes, and close-out status remain intact. The old `deliver`, `understand`, and `advance` fields are migrated to optional secondary tasks. Legacy fields remain in the saved JSON.

Settings → **Download JSON** gives you a backup. The restore control is behind a disclosure and asks before replacing your saved data.

## Limitations and smoke checks

- The app uses one JSON row per user, so **editing on multiple devices simultaneously may overwrite changes**. Use one active device at a time.
- Offline edits are not guaranteed to persist. Watch for the **Saved** status.
- Supabase free projects can pause after inactivity.
- On a new browser: verify you see only the password form; no tasks are visible without login.
- Sign in, create a harmless test priority, wait for **Saved**, and confirm it appears on a second device signed into the same account.
- Sign out and confirm the private workspace disappears.
- GitHub Pages deployment must be enabled by the repo owner; the connector cannot toggle Pages settings.

## Source

The app is plain HTML, CSS, and JavaScript. No build system or framework is necessary for this small use case.

- `index.html` — semantic interface
- `styles.css` — responsive design
- `app.js` — behavior, authentication, synchronization
- `supabase-setup.sql` — database schema and privacy policies
