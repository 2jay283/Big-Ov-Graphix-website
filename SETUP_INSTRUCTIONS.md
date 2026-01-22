# WhatsApp Image Sending Setup Instructions

## Overview
Your website now supports sending product images directly to WhatsApp in three ways:
1. **WhatsApp Business API** (Best - sends image directly, works everywhere)
2. **Web Share API** (Good - works on mobile devices, no backend needed)
3. **WhatsApp Link** (Fallback - sends text with image URL)

## Current Implementation

The code automatically tries methods in this order:
1. First tries WhatsApp Business API (if backend is set up)
2. Falls back to Web Share API (on mobile devices)
3. Falls back to WhatsApp link (on desktop or if other methods fail)

## Option 1: WhatsApp Business API Setup (Recommended)

### Step 1: Get WhatsApp Business API Credentials

1. Go to https://developers.facebook.com/
2. Create a new app or use existing one
3. Add "WhatsApp" product to your app
4. Go to WhatsApp → API Setup
5. Copy your credentials:
   - **Access Token** (temporary token expires in 24 hours)
   - **Phone Number ID**
   - **Business Account ID**

### Step 2: Deploy Backend API

**For Vercel:**
1. The API file is already created at `api/whatsapp-send.js`
2. Go to your Vercel project dashboard
3. Go to Settings → Environment Variables
4. Add these variables:
   - `WHATSAPP_ACCESS_TOKEN` = Your access token
   - `WHATSAPP_PHONE_NUMBER_ID` = Your phone number ID
   - `RECIPIENT_PHONE_NUMBER` = 2348036007786 (your WhatsApp number)
5. Redeploy your site

**For Netlify:**
1. Create `netlify/functions/whatsapp-send.js` (copy from `api/whatsapp-send.js`)
2. Go to Site Settings → Environment Variables
3. Add the same variables as above
4. Redeploy

### Step 3: Test

1. Click "Order Now" on any product
2. Check your WhatsApp Business account
3. You should receive the image with product details

## Option 2: Web Share API (No Setup Required)

This already works on mobile devices! When users click "Order Now" on mobile:
- The image will be shared directly via WhatsApp
- No backend setup needed
- Works on iOS Safari and Chrome Android

## Option 3: WhatsApp Link (Current Fallback)

If neither API works, the system falls back to opening WhatsApp with a text message containing:
- Product name
- Price (if available)
- Image URL (clickable link)

## Troubleshooting

### Images not appearing in WhatsApp Business API
- Ensure image URLs are publicly accessible (HTTPS)
- Check that Access Token is valid
- Verify Phone Number ID is correct
- Check API response in browser console

### Web Share API not working
- Only works on mobile devices
- Requires HTTPS connection
- User must have WhatsApp installed

### API endpoint not found
- Ensure `api/whatsapp-send.js` is deployed
- Check Vercel/Netlify function logs
- Verify the endpoint URL matches your deployment

## Testing Checklist

- [ ] Test on mobile device (Web Share API)
- [ ] Test on desktop (WhatsApp link fallback)
- [ ] Test WhatsApp Business API (if set up)
- [ ] Verify image URLs are accessible
- [ ] Check that all products send correct data

## Important Notes

1. **WhatsApp Business API** requires Meta Business verification for permanent tokens
2. **Temporary tokens** expire in 24 hours - get permanent token for production
3. **Image URLs** must be publicly accessible HTTPS URLs
4. **Rate limits** apply to WhatsApp Business API (check Meta docs)
5. **Costs** may apply for WhatsApp Business API usage

## Support

If you need help setting up WhatsApp Business API:
- Meta Developer Docs: https://developers.facebook.com/docs/whatsapp
- WhatsApp Business API Guide: https://developers.facebook.com/docs/whatsapp/cloud-api
