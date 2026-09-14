# Staff Register — K.B Argentina

## What's new: employee codes

The lock screen now has two tabs:

- **Password** — the existing access code, for full admin access (add, edit, delete, everything as before).
- **Employee code** — a personal code, one per profile, that shows only that one person's own record. No directory, no edit button, no delete button — view only.

**How it works:**
1. When a profile is saved for the first time, the server automatically generates a random 8-character code for it (letters and numbers, avoiding easily-confused characters like `0`/`O` or `1`/`I`).
2. Open that profile in the admin view and you'll see an **"Employee code"** row with a **Copy** button. Share that code with the employee however you like (text, print, etc.).
3. They go to the site, tap the **Employee code** tab, enter it, and see only their own details — no way to browse, edit, or delete anything.
4. Every profile gets its own distinct code — one person's code can never open anyone else's record.

Codes are stored in a small separate file that maps code → profile, so looking one up stays fast no matter how large the register grows, and deleting a profile automatically retires its code.

## Everything else in this build
Same as before — access-code gate, animated intro (now using your actual logo file), paid/not-paid status, sort/search/filter, light/dark theme, accent colors, background customization, backup/restore, phone reveal, and per-profile cloud storage (no more "storage full" errors, and no giant single-file bottleneck — each profile is saved and loaded independently).

## Deploy to Vercel

1. Push the whole folder to GitHub — `index.html`, `kb-argentina-logo.png`, `package.json`, and the `api` folder (including the `profiles` subfolder) together.
2. Import the repo on vercel.com, leave build settings blank, and deploy.
3. Storage → Create Database → **Blob** → connect it to this project (skip this if you already have Blob connected from before).
4. Redeploy from the Deployments tab so the app picks up any changes.
5. Done — open the site, and both the Password and Employee code tabs will work immediately for any new profiles you add. Existing profiles will get a code assigned automatically the next time you open and save them (edit → Save profile), or just leave them — they'll pick one up the first time anyone edits them.

## A note on scale
This uses one small file per profile plus one small code-index file — a good fit for a register in the hundreds to low thousands. If you're expecting to grow toward tens of thousands of profiles or more, the admin listing (which currently loads every profile at once) will eventually want to move to a real paginated database — happy to help with that when you're closer to that scale.
