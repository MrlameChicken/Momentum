# Momentum — Personal Execution System

**Published site (after GitHub Pages is enabled):** https://mrlamechicken.github.io/Momentum/


## Important: not deployed yet

The website's **code is public** on GitHub Pages. Your records are stored in Supabase with row-level security. Do not put private data or secrets in GitHub files.

## 1. Database

Supabase → SQL Editor → New query → paste and run `supabase-setup.sql`.

## 2. Authorize only your account

Supabase → Authentication → Users → Add user → Create new user (enter your own email and set a strong temporary password, or use invitation if available). Confirm the user appears. Then go to Authentication → Providers → Email and **disable Allow new users to sign up** (the wording may vary; sometimes Authentication → Settings → User Signups). Keep email OTP/magic-link sign-in enabled. Do not share the temporary password. An existing authorized user can receive sign-in links with `shouldCreateUser: false`.

For stronger exclusivity, optionally configure an additional restrictive database policy keyed to your auth user ID; the existing RLS isolates users from each other, but does not by itself prevent other accounts from having their own records.

## 3. Publish

Create a **new personal** GitHub repository named `Momentum` (public is fine: no private records are committed). Upload `index.html` to the repository root. GitHub → Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save. GitHub Pages cannot make this website itself private. The app is behind a sign-in screen, but public users can download its HTML/JS.

## 4. Redirect URL

Supabase → Authentication → URL Configuration: Site URL and Redirect URLs should include `https://mrlamechicken.github.io/Momentum/` (exact deployed URL). Email link redirects require this allowlist. You may also include your local development URL for testing.

## 5. Verify before using

- Open site in incognito: dashboard should be inaccessible without login.
- Sign in using your authorized email and create a harmless test entry; confirm status `Synced ✓`.
- Open on another browser/device and sign in; verify same test entry appears.
- Log out; dashboard should be hidden.
- Supabase → Table Editor → momentum_data: verify only your user ID owns the row.
- Try another email: should not create a new user or expose your records.
- Keep backups; free Supabase projects can be paused after inactivity and free plans have limits.

## Security notes

The publishable key and project URL are intentionally included in browser code; they are not secret. **Never put service_role keys, secret keys, or database passwords into frontend code.** RLS is the actual data boundary. Cloud data is not end-to-end encrypted. Do not use the app to store sensitive company information.

## Local data migration

If you have entries in the original offline version, export JSON there and import using the Backup tab of the new version. The new version does not silently upload existing local entries.

## Known limitations

The app syncs a single JSON record for one user. Simultaneous editing on multiple devices may cause last-write-wins overwrites; avoid editing on both at once. The client needs an internet connection to save. This version is not an offline-first PWA. The app uses a CDN for Supabase JS, so it needs network access.