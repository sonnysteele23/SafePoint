# Push SafePoint to GitHub + enable preview

This file walks you through pushing the SafePoint folder to GitHub and turning on GitHub Pages so the preview goes live at a public URL.

---

## Prerequisites

1. **Git installed** — check with `git --version`. macOS usually has it pre-installed.
2. **GitHub account** — you said you have one.
3. **GitHub CLI** (`gh`) — optional but easier. Install with `brew install gh` if you want it. The instructions below work either with the CLI or without it.

---

## Step 1 — Open Terminal at the SafePoint folder

```bash
cd ~/Documents/GitHub/SafePoint
```

(Adjust the path if you extracted the zip somewhere else.)

Sanity-check you're in the right place:

```bash
ls
# You should see: index.html, assets/, dev/, docs/, README.md, LICENSE, ...
```

---

## Step 2 — Initialize a git repo

```bash
git init -b main
git add .
git commit -m "Initial commit — SafePoint prototype + IDD"
```

If git complains about your identity, set it once:

```bash
git config --global user.name "Sonny Steele"
git config --global user.email "you@example.com"
```

Then re-run the commit.

---

## Step 3 — Create a GitHub repo and push

### Option A — with the GitHub CLI (one command)

```bash
gh repo create SafePoint --public --source=. --push --description "Union-owned safety reporting for K-12 educators"
```

The `--push` flag pushes the local commit immediately. Done.

### Option B — without the CLI

1. Go to <https://github.com/new>
2. Repository name: `SafePoint`
3. Set to **Public** (required for free GitHub Pages — or use Private with a Pro account)
4. **Do not** initialize with a README, .gitignore, or license. The folder already has those.
5. Click *Create repository*.

GitHub will show you commands. Copy the "push an existing repository" block, which looks like:

```bash
git remote add origin https://github.com/<your-username>/SafePoint.git
git branch -M main
git push -u origin main
```

Run those.

---

## Step 4 — Enable GitHub Pages

After pushing:

1. On your repo page on GitHub, click **Settings** (top right of the repo nav).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment**:
   - **Source:** *Deploy from a branch*
   - **Branch:** `main`, folder: `/ (root)`
4. Click **Save**.

GitHub takes ~30–90 seconds to deploy. When it's done, the Pages settings page shows:

> Your site is live at `https://<your-username>.github.io/SafePoint/`

That URL is the live preview. You can share it with anyone.

---

## Step 5 — Verify

Open the live URL in a browser. You should see the SafePoint login screen. Click the "Demo accounts" toggle and pick one to enter as that role.

If the page is blank or the JS fails to load, the most common cause is the **base path**. Check that `vite.config.js` in `dev/` has `base: "./"` (relative). The repo is shipped that way already.

---

## Updating the preview later

If you edit code in `dev/src/` and want the live preview to reflect those changes, just run:

```bash
./rebuild.sh
git add .
git commit -m "Rebuild preview"
git push
```

`rebuild.sh` does everything in one step: installs dependencies if missing, runs the Vite build, inlines the JS+CSS into the root `index.html`, and copies the favicon. GitHub Pages picks up the push in ~30 seconds.

---

## If something goes wrong

- **`git push` fails with "permission denied"** — you need to authenticate. Either install `gh` and run `gh auth login`, or set up an SSH key per <https://docs.github.com/en/authentication/connecting-to-github-with-ssh>.
- **The Pages URL shows a 404** — wait another minute; deployment is slow on first publish. If still 404 after 5 minutes, double-check the branch and folder in Settings → Pages.
- **Page loads but shows blank** — open the browser console (Cmd-Opt-I on Mac). If you see JavaScript errors, the build is broken. Re-run `./rebuild.sh` and re-commit. If the issue persists, paste the console output to me.
- **Anything else** — paste the error to me and I'll debug.
