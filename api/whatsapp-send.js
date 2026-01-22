// WhatsApp Business API - Backend Endpoint
// This file should be deployed as a serverless function (Vercel, Netlify, etc.)

/**
 * WhatsApp Business API Integration
 * 
 * Prerequisites:
 * 1. WhatsApp Business API account from Meta
 * 2. Access Token from Meta for Developers
 * 3. Phone Number ID from Meta Business
 * 4. Verify Token (for webhook verification)
 * 
 * Setup Instructions:
 * 1. Go to https://developers.facebook.com/
 * 2. Create a Meta App
 * 3. Add WhatsApp product to your app
 * 4. Get your Access Token and Phone Number ID
 * 5. Update the configuration below
 */

// Configuration - Replace with your actual values
const WHATSAPP_CONFIG = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN_HERE',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'YOUR_PHONE_NUMBER_ID_HERE',
  recipientPhoneNumber: process.env.RECIPIENT_PHONE_NUMBER || '2348036007786', // Your WhatsApp Business number
  apiVersion: 'v18.0' // Update to latest API version
}

// WhatsApp Business API endpoint
const WHATSAPP_API_URL = `https://graph.facebook.com/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`

/**
 * Send message with image via WhatsApp Business API
 * @param {string} recipientPhone - Recipient phone number (with country code, no +)
 * @param {string} imageUrl - Full URL of the image
 * @param {string} caption - Caption text for the image
 * @returns {Promise<Object>} API response
 */
async function sendWhatsAppImage(recipientPhone, imageUrl, caption) {
  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'image',
        image: {
          link: imageUrl, // Must be publicly accessible HTTPS URL
          caption: caption
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`WhatsApp API Error: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}

/**
 * Send text message via WhatsApp Business API
 * @param {string} recipientPhone - Recipient phone number
 * @param {string} message - Message text
 * @returns {Promise<Object>} API response
 */
async function sendWhatsAppText(recipientPhone, message) {
  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'text',
        text: {
          body: message
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`WhatsApp API Error: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}

// Export for Vercel serverless function
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { productName, productPrice, imageUrl, recipientPhone } = req.body

    // Validate required fields
    if (!productName || !imageUrl) {
      return res.status(400).json({ error: 'Missing required fields: productName and imageUrl' })
    }

    // Use recipient phone from request or default
    const phoneNumber = recipientPhone || WHATSAPP_CONFIG.recipientPhoneNumber

    // Format the message
    let caption = `Hello! I'm interested in ordering:\n\n📦 *Product Name:* ${productName}\n`
    
    if (productPrice && productPrice.trim() !== '' && !productPrice.toLowerCase().includes('contact')) {
      caption += `💰 *Price:* ${productPrice}\n`
    }
    
    caption += `\nPlease provide more details about this product.`

    // Send image with caption
    const result = await sendWhatsAppImage(phoneNumber, imageUrl, caption)

    return res.status(200).json({
      success: true,
      message: 'WhatsApp message sent successfully',
      data: result
    })
  } catch (error) {
    console.error('Handler error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send WhatsApp message'
    })
  }
}

// For Node.js/Express server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handler, sendWhatsAppImage, sendWhatsAppText }
}
