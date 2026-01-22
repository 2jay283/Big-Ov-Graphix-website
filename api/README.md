# WhatsApp Business API Setup Guide

This guide explains how to set up WhatsApp Business API to send product images directly to WhatsApp.

## Option 1: Using WhatsApp Business API (Recommended for Production)

### Prerequisites
1. Meta Business Account
2. WhatsApp Business API access (can be obtained through Meta Business Partners)
3. Server/hosting with environment variables support (Vercel, Netlify, etc.)

### Setup Steps

#### 1. Create Meta App
1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Choose "Business" type
4. Add "WhatsApp" product to your app

#### 2. Get API Credentials
1. In your Meta App dashboard, go to WhatsApp → API Setup
2. Copy your:
   - **Access Token** (temporary token available, permanent requires verification)
   - **Phone Number ID** (found in API Setup)
   - **Business Account ID**

#### 3. Deploy Backend API

**For Vercel:**
1. Create `api/whatsapp-send.js` (already created)
2. Set environment variables in Vercel dashboard:
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `RECIPIENT_PHONE_NUMBER` (optional, defaults to your number)

**For Netlify:**
1. Create `netlify/functions/whatsapp-send.js`
2. Set environment variables in Netlify dashboard

**For Node.js/Express Server:**
```javascript
const express = require('express')
const { handler } = require('./api/whatsapp-send')
const app = express()

app.use(express.json())
app.post('/api/whatsapp-send', handler)

app.listen(3000, () => console.log('Server running on port 3000'))
```

#### 4. Update Frontend JavaScript
The frontend code will automatically detect if the API is available and use it.

### Important Notes
- **Access Token**: Temporary tokens expire in 24 hours. For production, you need to verify your app and get a permanent token.
- **Image URLs**: Must be publicly accessible HTTPS URLs
- **Rate Limits**: WhatsApp Business API has rate limits (check Meta documentation)
- **Costs**: WhatsApp Business API may have usage costs

## Option 2: Using Web Share API (Simple, No Backend Required)

The current implementation uses Web Share API which:
- ✅ Works on mobile devices (iOS Safari, Chrome Android)
- ✅ Allows sharing images directly
- ✅ No backend required
- ❌ Doesn't work on desktop browsers
- ❌ Falls back to WhatsApp link on desktop

## Testing

1. **Test Web Share API**: Use a mobile device and click "Order Now"
2. **Test WhatsApp Business API**: 
   - Deploy the backend API
   - Update frontend to use API endpoint
   - Test from any device

## Troubleshooting

### Images not showing in WhatsApp
- Ensure image URLs are publicly accessible
- Check CORS headers on image server
- Verify image URL is HTTPS (not HTTP)

### API Errors
- Check Access Token is valid
- Verify Phone Number ID is correct
- Ensure recipient phone number format is correct (country code + number, no +)

### Web Share API not working
- Only works on mobile devices
- Requires HTTPS connection
- User must have WhatsApp installed
