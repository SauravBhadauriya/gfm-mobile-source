# Backend URL Configuration for Vercel

## Problem

Vercel servers cannot reach your backend at `http://103.194.228.68:3552` because it's a private/local IP address not accessible from the internet.

## Solution

Configure a public backend URL in Vercel dashboard.

---

## Option 1: Use Public Backend URL (Recommended)

### Step 1: Get Public Backend URL

You need a **public URL** for your backend. This could be:

- A public IP with domain: `https://api.yourdomain.com`
- A cloud server: `https://backend.example.com`
- A tunnel service: `https://your-tunnel-url.ngrok.io`

### Step 2: Configure in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select: **gully-fame-admin** project
3. Click: **Settings** tab
4. Go to: **Environment Variables**
5. Add new variable:
   - **Key:** `BACKEND_URL`
   - **Value:** `https://your-public-backend-url/v1/api/` (replace with your actual URL)
   - **Scope:** Production

6. Click **Save**
7. Go to **Deployments** and click **Redeploy** on latest deployment

### Step 3: Test

- Go to: https://gully-fame-admin.vercel.app/login
- Try logging in with: `admin@gullyfame.com` / `admin123`

---

## Option 2: Use ngrok Tunnel (Temporary Testing)

If you don't have a public backend URL yet, use ngrok to create a temporary tunnel:

### Step 1: Install ngrok

```bash
# Download from https://ngrok.com/download
# Or use: choco install ngrok (if using Chocolatey)
```

### Step 2: Start Tunnel

```bash
ngrok http 3552
```

This will output something like:

```
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3552
```

### Step 3: Configure in Vercel

1. Go to Vercel dashboard
2. Add environment variable:
   - **Key:** `BACKEND_URL`
   - **Value:** `https://abc123def456.ngrok.io/v1/api/`
   - **Scope:** Production

3. Redeploy

### Step 4: Test

- Login at: https://gully-fame-admin.vercel.app/login

**Note:** ngrok tunnel URL changes each time you restart. You'll need to update Vercel environment variable each time.

---

## Option 3: Deploy Backend to Cloud

Move your backend to a cloud provider with a public URL:

- **AWS EC2** - Get public IP and domain
- **DigitalOcean** - Get public IP and domain
- **Heroku** - Get public URL
- **Railway** - Get public URL
- **Render** - Get public URL

Then use that public URL in Vercel environment variable.

---

## Current Configuration

### Local Development

- Backend: `http://103.194.228.68:3552/v1/api/` ✅ (works locally)
- App: `http://localhost:3000` ✅

### Vercel Production

- Backend: Needs public URL (configure via `BACKEND_URL` env var)
- App: `https://gully-fame-admin.vercel.app` ✅

---

## How It Works

### API Route Logic

```typescript
if (process.env.VERCEL_ENV === "production") {
  // Use public backend URL from environment variable
  endpoint = process.env.BACKEND_URL || "http://103.194.228.68:3552/v1/api/";
} else {
  // Use local backend for development
  endpoint = "http://103.194.228.68:3552/v1/api/";
}
```

---

## Troubleshooting

### Still Getting "Failed to fetch"?

1. **Check Vercel Logs**
   - Go to Vercel dashboard
   - Click on latest deployment
   - Check **Function Logs** for errors

2. **Verify Backend URL**
   - Test the URL manually: `curl https://your-backend-url/v1/api/admin/login`
   - Should return a response (not connection error)

3. **Check Environment Variable**
   - Go to Vercel Settings → Environment Variables
   - Verify `BACKEND_URL` is set correctly
   - Verify it's in **Production** scope

4. **Redeploy**
   - After setting environment variable, always redeploy
   - Go to Deployments → Click latest → Click Redeploy

### Backend Connection Refused?

- Verify backend is running
- Verify backend URL is correct
- Check firewall/network access
- Test with curl/Postman first

### Still Using Local IP?

- Make sure `BACKEND_URL` environment variable is set
- Check that it's in **Production** scope (not Preview)
- Redeploy after setting variable

---

## Files Modified

- `vercel.json` - Added `BACKEND_URL` environment variable config
- `apps/gully-fame-admin/app/api/admin/login/route.ts` - Added environment detection
- `apps/gully-fame-admin/app/api/admin/getDetails/route.ts` - Added environment detection

---

## Next Steps

1. ✅ Code deployed to Vercel
2. ⏳ **Get public backend URL** (ngrok, cloud provider, etc.)
3. ⏳ **Set `BACKEND_URL` in Vercel dashboard**
4. ⏳ **Redeploy on Vercel**
5. ⏳ **Test login**

---

**Status:** Waiting for public backend URL configuration
