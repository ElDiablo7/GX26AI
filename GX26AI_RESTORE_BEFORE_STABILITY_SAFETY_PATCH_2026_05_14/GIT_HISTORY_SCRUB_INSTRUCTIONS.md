# ⚠️ Git History Scrub Instructions

**Purpose:** Remove `.env` file and any committed secrets from git history.

> **WARNING:** This rewrites git history. After running, you MUST force-push and all collaborators must re-clone.

---

## Why This Is Needed

The `.env` file was committed in:
- `f7c82db` — "chore: add .env files"
- `e32aa89` — "chore: remove .env from tracking for security"

Even though `.env` is now `.gitignored`, the old file content (including API keys and passwords) remains in git history forever — accessible to anyone who clones the repo.

---

## Option A: BFG Repo Cleaner (Recommended — Simpler)

### Prerequisites
- Java installed
- Download BFG: https://rtyley.github.io/bfg-repo-cleaner/

### Steps

```bash
# 1. Clone a fresh mirror
git clone --mirror https://github.com/ElDiablo7/GX26AI.git gx26ai-mirror
cd gx26ai-mirror

# 2. Run BFG to remove .env files
java -jar bfg.jar --delete-files .env

# 3. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push
git push --force

# 5. Delete the mirror clone
cd ..
rm -rf gx26ai-mirror
```

---

## Option B: git filter-repo (Built-in)

### Prerequisites
- `git filter-repo` installed: `pip install git-filter-repo`

### Steps

```bash
# 1. Clone fresh
git clone https://github.com/ElDiablo7/GX26AI.git gx26ai-clean
cd gx26ai-clean

# 2. Remove .env from all history
git filter-repo --path server/.env --invert-paths
git filter-repo --path .env --invert-paths

# 3. Re-add remote
git remote add origin https://github.com/ElDiablo7/GX26AI.git

# 4. Force push
git push --force --all
git push --force --tags

# 5. Delete the clone
cd ..
rm -rf gx26ai-clean
```

---

## After Scrubbing

1. **All collaborators must re-clone** — their existing clones still have the old history
2. **Verify the scrub worked:**
   ```bash
   git log --all --oneline -- server/.env .env
   # Should return no results
   ```
3. **Rotate ALL credentials** that were in the old `.env` — they must be considered compromised
4. **Update any deployment environments** (Render, etc.) with the new credentials

---

## Files to Verify Are Gone

After scrubbing, these files should NOT appear in `git log`:
- `server/.env`
- `.env`

---

## ⚠️ Important Notes

- **Do NOT run this on a shared repo without warning collaborators first**
- **This cannot be undone** — make a backup before running
- **GitHub may cache old commits** for a period — contact GitHub support if needed
- **Forks will still have the old history** — notify fork owners

---

**Created:** May 2, 2026  
**Build:** v7.0.1-security-hardening
