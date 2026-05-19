# Fix ChunkLoadError in Admin Panel

## Problem

```
ChunkLoadError: Loading chunk app/layout failed.
(timeout: http://localhost:3002/_next/static/chunks/app/layout.js)
```

## Root Cause

- Stale Next.js build cache
- Webpack chunks not properly generated
- Development server out of sync with build

## Solutions

### Solution 1: Clear Cache and Restart (Recommended)

#### Step 1: Stop the dev server

- Press `Ctrl + C` in the terminal running the dev server

#### Step 2: Clear Next.js cache

```bash
# Windows PowerShell
rm -r apps/gully-fame-admin/.next

# Or manually delete the folder:
# D:\New folder\gfm-mobile-source\apps\gully-fame-admin\.next
```

#### Step 3: Clear node_modules cache

```bash
npm cache clean --force
```

#### Step 4: Rebuild

```bash
npm run build:admin
```

#### Step 5: Start dev server again

```bash
npm run dev
# From: apps/gully-fame-admin directory
# Or: npm workspace gully-fame-admin run dev
```

---

### Solution 2: Hard Refresh Browser

If the server is running fine but browser shows error:

1. **Open DevTools** (F12)
2. **Go to Settings** (⚙️ icon)
3. **Check:** "Disable cache (while DevTools is open)"
4. **Hard Refresh:** `Ctrl + Shift + R`
5. **Close DevTools** (F12)
6. **Refresh again:** `F5`

---

### Solution 3: Clear Browser Cache

1. **Open DevTools** (F12)
2. **Application tab** → **Cache Storage**
3. **Delete all cache entries**
4. **Hard Refresh:** `Ctrl + Shift + R`

---

### Solution 4: Use Incognito/Private Window

1. **Open Incognito/Private window**
2. **Go to:** `http://localhost:3002`
3. **No cache issues in private mode**

---

### Solution 5: Change Port

If port 3002 is having issues:

```bash
# Start on different port
npm run dev -- -p 3003
```

Then visit: `http://localhost:3003`

---

## Prevention Tips

### 1. Always Stop Server Before Rebuilding

```bash
# Stop current server (Ctrl + C)
# Then rebuild
npm run build:admin
# Then start again
npm run dev
```

### 2. Use .gitignore for Cache

```
# .gitignore
.next/
.turbo/
node_modules/
```

### 3. Regular Cache Cleanup

```bash
# Weekly cleanup
npm cache clean --force
rm -r apps/gully-fame-admin/.next
```

### 4. Update Next.js

```bash
npm update next
```

---

## Quick Fix Checklist

- [ ] Stop dev server (Ctrl + C)
- [ ] Delete `.next` folder
- [ ] Run `npm cache clean --force`
- [ ] Run `npm run build:admin`
- [ ] Start dev server: `npm run dev`
- [ ] Hard refresh browser: `Ctrl + Shift + R`
- [ ] Clear browser cache if still failing
- [ ] Try incognito window

---

## If Still Not Working

### Check Port

```bash
# Check if port 3002 is in use
netstat -ano | findstr :3002

# Kill process if needed
taskkill /PID <PID> /F
```

### Check Node Version

```bash
node --version
# Should be 18+ for Next.js 14
```

### Reinstall Dependencies

```bash
rm -r apps/gully-fame-admin/node_modules
npm install
npm run build:admin
npm run dev
```

### Check for Errors

```bash
# Look for TypeScript errors
npm run build:admin 2>&1 | grep -i error

# Check for lint errors
npm run lint
```

---

## Development Server Commands

### From Root Directory

```bash
# Start admin dev server
npm workspace admin run dev

# Or build first
npm run build:admin
npm workspace admin run dev
```

### From Admin Directory

```bash
cd apps/gully-fame-admin
npm run dev
```

### With Custom Port

```bash
npm run dev -- -p 3003
```

---

## Expected Output When Starting

```
> admin@1.0.0 dev
> next dev

  ▲ Next.js 14.2.35
  - Local:        http://localhost:3002
  - Environments: .env.local

 ✓ Ready in 2.5s
```

---

## Troubleshooting

| Error               | Solution                                     |
| ------------------- | -------------------------------------------- |
| Port already in use | Use different port: `npm run dev -- -p 3003` |
| Module not found    | Run `npm install`                            |
| TypeScript errors   | Run `npm run build:admin` to see errors      |
| Chunk load timeout  | Clear cache and restart                      |
| Blank page          | Hard refresh: `Ctrl + Shift + R`             |

---

## Status After Fix

✅ Dev server running on `http://localhost:3002`
✅ No chunk loading errors
✅ Hot reload working
✅ Changes reflect immediately

---

**Last Updated:** May 13, 2026
**Status:** Ready to use
