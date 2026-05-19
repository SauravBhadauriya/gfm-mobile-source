# Vercel HTTPS Backend Configuration

## Issue

Mixed Content Error: The HTTPS Vercel app was trying to call HTTP backend, which browsers block.

## Solution

Configure the backend URL for production in Vercel dashboard.

---

## Steps to Configure in Vercel

### 1. Go to Vercel Dashboard

- Visit: https://vercel.com/dashboard
- Select your project: **gully-fame-admin**

### 2. Navigate to Settings

- Click **Settings** tab
- Go to **Environment Variables**

### 3. Add Production Backend URL

Add a new environment variable:

| Key                             | Value                                 | Scope      |
| ------------------------------- | ------------------------------------- | ---------- |
| `NEXT_PUBLIC_API_BASE_URL_PROD` | `https://103.194.228.68:3552/v1/api/` | Production |

**Note:** If your backend doesn't have HTTPS, you'll need to:

- Set up HTTPS on the backend, OR
- Use a reverse proxy/API gateway with HTTPS

### 4. Redeploy

- Go to **Deployments**
- Click the latest deployment
- Click **Redeploy** button

---

## Alternative: Use Backend with HTTPS

If the backend doesn't support HTTPS, you have these options:

### Option A: Enable HTTPS on Backend

Contact your backend team to enable HTTPS on `103.194.228.68:3552`

### Option B: Use API Gateway/Proxy

Set up a reverse proxy (nginx, Cloudflare, etc.) that:

- Accepts HTTPS requests
- Forwards to HTTP backend
- Example: `https://api.gullyfame.com/v1/api/` → `http://103.194.228.68:3552/v1/api/`

### Option C: Use Vercel API Routes (Current Setup)

The app already uses Vercel API routes as proxy:

- Browser → `https://gully-fame-admin.vercel.app/api/admin/login` (HTTPS)
- Vercel Server → `http://103.194.228.68:3552/v1/api/admin/login` (HTTP)

This works because the server-to-server call doesn't have mixed content restrictions.

---

## Current Configuration

### Local Development (.env.local)

```
NEXT_PUBLIC_API_BASE_URL=http://103.194.228.68:3552/v1/api/
NEXT_PUBLIC_ENV=development
```

### Production (Vercel - Set in Dashboard)

```
NEXT_PUBLIC_API_BASE_URL_PROD=https://103.194.228.68:3552/v1/api/
```

### API Routes (Automatic)

The API routes automatically use:

1. `NEXT_PUBLIC_API_BASE_URL_PROD` (if set) - for production
2. `NEXT_PUBLIC_API_BASE_URL` (fallback) - for development
3. Default: `http://103.194.228.68:3552/v1/api/`

---

## Testing After Configuration

1. **Clear Browser Cache**
   - Open DevTools (F12)
   - Settings → Network → Disable cache
   - Hard refresh (Ctrl+Shift+R)

2. **Test Login**
   - Go to: https://gully-fame-admin.vercel.app/login
   - Enter credentials:
     - Email: `admin@gullyfame.com`
     - Password: `admin123`
   - Check browser console for errors

3. **Verify No Mixed Content Errors**
   - Open DevTools Console
   - Should NOT see "Mixed Content" warning
   - Should see successful login

---

## Troubleshooting

### Still Getting Mixed Content Error?

1. Check Vercel environment variables are set
2. Verify `NEXT_PUBLIC_API_BASE_URL_PROD` uses HTTPS
3. Hard refresh browser (Ctrl+Shift+R)
4. Check Vercel deployment logs

### Backend Connection Refused?

1. Verify backend is running: `http://103.194.228.68:3552/v1/api/`
2. Check firewall/network access
3. Verify HTTPS certificate (if using HTTPS)

### Still Getting "Failed to fetch"?

1. Check Vercel function logs
2. Verify backend URL is correct
3. Test backend directly with curl/Postman

---

## Files Modified

- `vercel.json` - Added `NEXT_PUBLIC_API_BASE_URL_PROD` config
- `apps/gully-fame-admin/app/api/admin/login/route.ts` - Updated to use HTTPS URL
- `apps/gully-fame-admin/app/api/admin/getDetails/route.ts` - Updated to use HTTPS URL
- `apps/gully-fame-admin/.env.local` - Added production URL reference

---

## Next Steps

1. ✅ Code deployed to Vercel
2. ⏳ **Set environment variable in Vercel dashboard** (YOU DO THIS)
3. ⏳ Redeploy on Vercel
4. ⏳ Test login on https://gully-fame-admin.vercel.app/login

---

**Status:** Waiting for Vercel environment variable configuration
