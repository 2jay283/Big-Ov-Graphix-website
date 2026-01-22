// =======================================
// WhatsApp Configuration
// =======================================

// Easy to change WhatsApp number in one place
// Format: Use phone number with country code (e.g., "2348036007786" for Nigeria)
// Or use QR code link format: "qr/KZWYMGJISBQXL1"
const WHATSAPP_CONFIG = {
  // Option 1: Use phone number (recommended for wa.me links)
  phoneNumber: "2348036007786", // Change this to your WhatsApp number
  
  // Option 2: Use QR code (if you prefer QR code format)
  //
   qrCode: "KZWYMGJISBQXL1", // Uncomment and use this if preferred
}

// =======================================
// WhatsApp Order/Message Function
// =======================================

/**
 * Opens WhatsApp with a pre-filled message containing product details
 * Reads product data from HTML data attributes (data-product-name, data-product-price, data-product-image)
 * Can be called as: openWhatsAppOrder() or openWhatsAppOrder(this)
 * @param {HTMLElement|string} buttonElementOrName - The button element or product name (for backward compatibility)
 */
function openWhatsAppOrder(buttonElementOrName) {
  // Get the button element - check if first parameter is a button element or a string
  let button = null
  
  // Check if first argument is a button element (has nodeType property)
  if (buttonElementOrName && typeof buttonElementOrName === 'object' && buttonElementOrName.nodeType === 1) {
    button = buttonElementOrName
  } else {
    // If it's a string or not provided, get from event (backward compatibility with old onclick format)
    const event = window.event
    if (event && event.target) {
      button = event.target.closest('.portfolio-whatsapp-btn') || event.target
    }
  }
  
  // Get the parent portfolio item
  const portfolioItem = button?.closest('.portfolio-item')
  if (!portfolioItem) {
    console.error('Could not find portfolio item. Make sure the button is inside a portfolio-item.')
    return
  }
  
  // Read product data from HTML data attributes (HTML is the source of truth)
  let productName = portfolioItem.getAttribute('data-product-name') || ''
  let productPrice = portfolioItem.getAttribute('data-product-price') || ''
  let imageUrl = portfolioItem.getAttribute('data-product-image') || ''
  
  // If imageUrl is missing, try to get it from the img element
  if (!imageUrl) {
    const imgElement = portfolioItem.querySelector('img')
    if (imgElement && imgElement.src) {
      imageUrl = imgElement.src
    }
  }
  
  // If data-price is empty or says "Contact for pricing", try to get actual price from overlay
  if (!productPrice || productPrice.trim() === '' || productPrice.toLowerCase().includes('contact')) {
    const overlay = portfolioItem.querySelector('.portfolio-overlay p')
    if (overlay) {
      const overlayText = overlay.textContent.trim()
      // Check if overlay has a price (contains ₦ or numbers, but not "Price:")
      if (overlayText && 
          (overlayText.includes('₦') || overlayText.includes('&#8358;') || (/\d/.test(overlayText))) && 
          !overlayText.toLowerCase().includes('price:') &&
          !overlayText.toLowerCase().includes('contact')) {
        productPrice = overlayText.replace('&#8358;', '₦')
      }
    }
  }
  
  // Get the current page URL to construct full image URL
  // Handle both relative and absolute paths
  let fullImageUrl = imageUrl
  
  // If it's already a full URL (starts with http), use it as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    fullImageUrl = imageUrl
  } else {
    // If it's a relative path, construct the full URL
    // Check if img element has a full URL we can use
    const imgElement = portfolioItem.querySelector('img')
    if (imgElement && imgElement.src && imgElement.src.startsWith('http')) {
      fullImageUrl = imgElement.src
    } else {
      // Construct URL from relative path
      const currentPath = window.location.pathname
      // Remove the filename from the path to get the directory
      let basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1)
      // If basePath is empty or just '/', it means we're at root
      if (basePath === '/' || basePath === '') {
        basePath = '/'
      }
      // Remove leading ./ if present
      const cleanImagePath = imageUrl.replace(/^\.\//, '')
      // Construct full URL
      fullImageUrl = window.location.origin + basePath + cleanImagePath
    }
  }
  
  // Encode the URL properly (especially for spaces and special characters in path)
  // We need to encode each path segment separately to handle spaces like "images & logo"
  try {
    const urlObj = new URL(fullImageUrl)
    // Split pathname and encode each segment (to handle spaces like "images & logo")
    const pathSegments = urlObj.pathname.split('/').filter(seg => seg !== '')
    const encodedPath = '/' + pathSegments.map(segment => encodeURIComponent(segment)).join('/')
    urlObj.pathname = encodedPath
    fullImageUrl = urlObj.toString()
  } catch (e) {
    // Fallback: manual encoding if URL constructor fails
    // Split the URL into parts
    const match = fullImageUrl.match(/^(https?:\/\/[^\/]+)(\/.*)$/)
    if (match) {
      const [, base, path] = match
      // Encode each path segment
      const encodedPath = path.split('/').map(segment => {
        // Skip empty segments
        if (!segment) return ''
        return encodeURIComponent(segment)
      }).join('/')
      fullImageUrl = base + encodedPath
    }
  }
  
  // Check if product has a price (not "Contact for pricing" or empty)
  const hasPrice = productPrice && 
                   productPrice.trim() !== '' && 
                   productPrice.toLowerCase() !== 'contact for pricing' &&
                   !productPrice.toLowerCase().includes('contact')
  
  // Format price with ₦ symbol if it exists
  let priceText = ''
  if (hasPrice) {
    // Check if price already has ₦ symbol
    if (productPrice.includes('₦') || productPrice.includes('&#8358;')) {
      priceText = productPrice.replace('&#8358;', '₦')
    } else {
      priceText = `₦ ${productPrice.trim()}`
    }
  }
  
  // Create the message template
  let message = `Hello! I'm interested in ordering:\n\n` +
    `📦 *Product Name:* ${productName}\n`
  
  // Only include price if it exists
  if (hasPrice) {
    message += `💰 *Price:* ${priceText}\n`
  }
  
  message += `🖼️ *Image:* ${fullImageUrl}\n\n` +
    `Please provide more details about this product.`
  
  // Try WhatsApp Business API first (if backend is available)
  // Then fall back to Web Share API (mobile), then WhatsApp link
  sendViaWhatsAppAPI(productName, productPrice, fullImageUrl, message)
    .catch(() => {
      // API not available, try Web Share API
      tryWebShareAPI(productName, fullImageUrl, message)
    })
  
  /**
   * Try to send via WhatsApp Business API (backend)
   */
  async function sendViaWhatsAppAPI(productName, productPrice, imageUrl, messageText) {
    // API endpoint - automatically detects if running on Vercel or local
    const apiEndpoint = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api/whatsapp-send'
      : '/api/whatsapp-send'
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: productName,
          productPrice: productPrice,
          imageUrl: imageUrl,
          recipientPhone: WHATSAPP_CONFIG.phoneNumber || undefined
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Show success message
          alert('Order sent successfully! The designer will receive your order with the product image.')
          return Promise.resolve()
        }
      }
      throw new Error('API request failed')
    } catch (error) {
      // API not available or failed, throw to trigger fallback
      return Promise.reject(error)
    }
  }
  
  /**
   * Try Web Share API for sharing image (works on mobile devices)
   */
  function tryWebShareAPI(productName, imageUrl, messageText) {
    if (navigator.share && navigator.canShare) {
      // Fetch the image as a blob to share it
      fetch(imageUrl)
        .then(response => {
          if (!response.ok) throw new Error('Image fetch failed')
          return response.blob()
        })
        .then(blob => {
          // Create a File object from the blob
          const imageFile = new File([blob], `${productName.replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' })
          
          // Check if we can share files
          const shareData = {
            title: `Order: ${productName}`,
            text: messageText,
            files: [imageFile]
          }
          
          if (navigator.canShare(shareData)) {
            // Share with image file (mobile devices)
            navigator.share(shareData)
              .then(() => console.log('Shared successfully via Web Share API'))
              .catch(err => {
                console.log('Share failed, falling back to WhatsApp link:', err)
                openWhatsAppLink(messageText)
              })
          } else {
            // Can't share files, fall back to WhatsApp link
            openWhatsAppLink(messageText)
          }
        })
        .catch(err => {
          console.log('Image fetch failed, using WhatsApp link:', err)
          openWhatsAppLink(messageText)
        })
    } else {
      // Web Share API not available, use WhatsApp link
      openWhatsAppLink(messageText)
    }
  }
  
  /**
   * Helper function to open WhatsApp with message (fallback)
   */
  function openWhatsAppLink(messageText) {
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(messageText)
    
    // Construct WhatsApp URL
    let whatsappUrl
    if (WHATSAPP_CONFIG.phoneNumber) {
      // Use phone number format
      whatsappUrl = `https://wa.me/${WHATSAPP_CONFIG.phoneNumber}?text=${encodedMessage}`
    } else if (WHATSAPP_CONFIG.qrCode) {
      // Use QR code format
      whatsappUrl = `https://wa.me/qr/${WHATSAPP_CONFIG.qrCode}?text=${encodedMessage}`
    } else {
      // Fallback to the default QR code from the website
      whatsappUrl = `https://wa.me/qr/KZWYMGJISBQXL1?text=${encodedMessage}`
    }
    
    // Open WhatsApp in a new tab/window
    window.open(whatsappUrl, '_blank')
  }
}

// =======================================
// Mobile Menu Toggle
// =======================================

const hamburger = document.getElementById("hamburger")
const navMenu = document.getElementById("navMenu")

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active")
  navMenu.classList.toggle("active")
})

// Close menu when nav link is clicked
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active")
    navMenu.classList.remove("active")
  })
})

// =======================================
// Sticky Navigation on Scroll
// =======================================

const navbar = document.getElementById("navbar")

window.addEventListener("scroll", () => {
  if (window.scrollY > 100) {
    navbar.classList.add("scrolled")
  } else {
    navbar.classList.remove("scrolled")
  }
})

// =======================================
// Intersection Observer for Scroll Animations
// =======================================

const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible")
    }
  })
}, observerOptions)

// Add fade-in animation to service cards on load
document.addEventListener("DOMContentLoaded", () => {
  const serviceCards = document.querySelectorAll(".service-card")
  const portfolioItems = document.querySelectorAll(".portfolio-item")
  const stats = document.querySelectorAll(".stat")

  serviceCards.forEach((card) => {
    card.classList.add("fade-in")
    observer.observe(card)
  })

  portfolioItems.forEach((item) => {
    item.classList.add("fade-in")
    observer.observe(item)
  })

  stats.forEach((stat) => {
    stat.classList.add("fade-in")
    observer.observe(stat)
  })
})

// =======================================
// Contact Form Submission
// =======================================

const contactForm = document.getElementById("contactForm")
const successModal = document.getElementById("successModal")

contactForm.addEventListener("submit", (e) => {
  e.preventDefault()

  // Get form data
  const firstName = document.getElementById("firstName").value.trim()
  const lastName = document.getElementById("lastName").value.trim()
  const email = document.getElementById("email").value.trim()
  const phone = document.getElementById("phone").value.trim()
  const service = document.getElementById("service").value
  const message = document.getElementById("message").value.trim()

  // Basic validation
  if (!firstName || !lastName || !email || !service || !message) {
    alert("Please fill in all required fields.")
    return
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address.")
    return
  }

  // Simulate form submission
  console.log("[v0] Form submitted with data:", {
    firstName,
    lastName,
    email,
    phone,
    service,
    message,
  })

  // Show success modal
  successModal.classList.add("show")
  successModal.style.display = "flex"

  // Reset form
  contactForm.reset()

  // Auto-hide modal after 5 seconds
  setTimeout(() => {
    successModal.classList.remove("show")
    successModal.style.display = "none"
  }, 5000)
})

// Close modal when button is clicked
document.querySelectorAll(".modal button").forEach((button) => {
  button.addEventListener("click", () => {
    successModal.classList.remove("show")
    successModal.style.display = "none"
  })
})

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === successModal) {
    successModal.classList.remove("show")
    successModal.style.display = "none"
  }
})

// =======================================
// Smooth Scroll Enhancement
// =======================================

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href")
    if (href !== "#") {
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }
  })
})

// =======================================
// Form Input Styling
// =======================================

const inputs = document.querySelectorAll(".contact-form input, .contact-form select, .contact-form textarea")

inputs.forEach((input) => {
  input.addEventListener("focus", function () {
    this.parentElement.classList.add("focused")
  })

  input.addEventListener("blur", function () {
    this.parentElement.classList.remove("focused")
  })
})

// =======================================
// Active Link Highlighting
// =======================================

const sections = document.querySelectorAll("section[id]")
const navLinks = document.querySelectorAll(".nav-link")

window.addEventListener("scroll", () => {
  let current = ""

  sections.forEach((section) => {
    const sectionTop = section.offsetTop
    const sectionHeight = section.clientHeight

    if (scrollY >= sectionTop - 200) {
      current = section.getAttribute("id")
    }
  })

  navLinks.forEach((link) => {
    link.classList.remove("active")
    if (link.getAttribute("href").slice(1) === current) {
      link.classList.add("active")
    }
  })
})

// =======================================
// Accessibility: Skip to Main Content
// =======================================

const skipLink = document.createElement("a")
skipLink.href = "#services"
skipLink.className = "skip-link"
skipLink.textContent = "Skip to main content"
skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--primary-color);
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
`

skipLink.addEventListener("focus", () => {
  skipLink.style.top = "0"
})

skipLink.addEventListener("blur", () => {
  skipLink.style.top = "-40px"
})

document.body.insertBefore(skipLink, document.body.firstChild)

// =======================================
// Portfolio Gallery - Dynamic Image Loading
// =======================================

document.addEventListener("DOMContentLoaded", () => {
  const portfolioGrid = document.getElementById("portfolioGrid")
  const loadMoreBtn = document.getElementById("loadMoreBtn")
  
  // List of all image files - filter out files with "vid" in name and logo
 
    
  
  // Filter to only include files with "img" in name (case-insensitive), exclude "vid" and "logo"
  const imageFiles = allFiles.filter(file => {
    const lowerFile = file.toLowerCase()
    return lowerFile.includes('img') && !lowerFile.includes('vid') && !lowerFile.includes('logo') && 
           (lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg') || lowerFile.endsWith('.png'))
  })

  let currentIndex = 0
  const itemsPerLoad = 12

  function createPortfolioItem(imageFile) {
    const item = document.createElement("div")
    item.className = "portfolio-item fade-in"
    
    const img = document.createElement("img")
    const imagePath = `./images & logo/${imageFile}`
    img.src = imagePath
    img.alt = `Big Ov Graphix portfolio - ${imageFile}`
    img.loading = "lazy"
    
    // Extract product name from filename (remove extension and format)
    const productName = imageFile
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[_-]/g, " ") // Replace underscores and hyphens with spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    
    // Default price - no price by default (will not show price in overlay)
    const productPrice = "" // Empty means no price
    
    // Store product data as data attributes (HTML source of truth)
    item.setAttribute("data-product-name", productName)
    item.setAttribute("data-product-price", productPrice)
    item.setAttribute("data-product-image", imagePath)
    
    const overlay = document.createElement("div")
    overlay.className = "portfolio-overlay"
    // Only show price if it exists
    if (productPrice && productPrice.trim() !== '') {
      overlay.innerHTML = `
        <h3>${productName}</h3>
        <p>${productPrice}</p>
      `
    } else {
      overlay.innerHTML = `
        <h3>${productName}</h3>
      `
    }
    
    // Create WhatsApp button
    const whatsappBtn = document.createElement("button")
    whatsappBtn.className = "portfolio-whatsapp-btn"
    whatsappBtn.setAttribute("aria-label", `Order ${productName} via WhatsApp`)
    whatsappBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
      <span>Order Now</span>
    `
    
    // Add click event to WhatsApp button - reads from data attributes
    whatsappBtn.addEventListener("click", (e) => {
      e.stopPropagation() // Prevent triggering overlay click
      openWhatsAppOrder(whatsappBtn) // Pass button element
    })
    
    item.appendChild(img)
    item.appendChild(overlay)
    item.appendChild(whatsappBtn)
    
    return item
  }

  function loadMoreImages() {
    const endIndex = Math.min(currentIndex + itemsPerLoad, imageFiles.length)
    
    for (let i = currentIndex; i < endIndex; i++) {
      const item = createPortfolioItem(imageFiles[i])
      portfolioGrid.appendChild(item)
      
      // Observe for fade-in animation
      observer.observe(item)
    }
    
    currentIndex = endIndex
    
    // Hide button if all images are loaded
    if (currentIndex >= imageFiles.length) {
      loadMoreBtn.style.display = "none"
    } else {
      loadMoreBtn.style.display = "block"
    }
  }

  // Initial load
  if (portfolioGrid) {
    loadMoreImages()
    
    // Load more button click handler
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", loadMoreImages)
    }
  }
})

// =======================================
// Video Play Functionality
// =======================================

document.addEventListener("DOMContentLoaded", () => {
  const videoItems = document.querySelectorAll(".video-item")
  const allVideos = document.querySelectorAll(".portfolio-video")
  
  // Function to pause all videos except the current one
  function pauseAllVideosExcept(currentVideo) {
    allVideos.forEach((v) => {
      if (v !== currentVideo && !v.paused) {
        v.pause()
        const item = v.closest(".video-item")
        if (item) {
          item.classList.remove("playing")
          const playBtn = item.querySelector(".video-play-button")
          if (playBtn) playBtn.style.opacity = "1"
        }
      }
    })
  }
  
  videoItems.forEach((item) => {
    const video = item.querySelector(".portfolio-video")
    const playButton = item.querySelector(".video-play-button")
    const fullscreenBtn = item.querySelector(".video-fullscreen-button")
    
    if (video && playButton) {
      // Click to play/pause
      item.addEventListener("click", (e) => {
        // Don't trigger if clicking on fullscreen button
        if (e.target.closest(".video-fullscreen-button")) return
        
        if (video.paused) {
          // Pause all other videos first
          pauseAllVideosExcept(video)
          video.play()
          item.classList.add("playing")
          playButton.style.opacity = "0"
        } else {
          video.pause()
          item.classList.remove("playing")
          playButton.style.opacity = "1"
        }
      })
      
      // Pause other videos when this one starts playing
      video.addEventListener("play", () => {
        pauseAllVideosExcept(video)
        item.classList.add("playing")
        playButton.style.opacity = "0"
      })
      
      // Show play button when video ends
      video.addEventListener("ended", () => {
        item.classList.remove("playing")
        playButton.style.opacity = "1"
      })
      
      // Show play button when video is paused
      video.addEventListener("pause", () => {
        if (video.currentTime > 0) {
          item.classList.remove("playing")
          playButton.style.opacity = "1"
        }
      })
    }
    
    // Fullscreen functionality
    if (fullscreenBtn && video) {
      fullscreenBtn.addEventListener("click", (e) => {
        e.stopPropagation() // Prevent triggering the play/pause
        
        if (video.requestFullscreen) {
          video.requestFullscreen()
        } else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen()
        } else if (video.mozRequestFullScreen) {
          video.mozRequestFullScreen()
        } else if (video.msRequestFullscreen) {
          video.msRequestFullscreen()
        }
      })
    }
  })
  
  // Exit fullscreen when pressing ESC
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      allVideos.forEach((video) => {
        if (!video.paused) {
          video.pause()
        }
      })
    }
  })
})

// =======================================
// Hero Slideshow Animation
// =======================================

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".hero-slide")
  const dotsContainer = document.querySelector(".hero-dots")
  let currentSlide = 0
  let slideInterval

  // Create navigation dots
  if (slides.length > 1 && dotsContainer) {
    slides.forEach((_, index) => {
      const dot = document.createElement("button")
      dot.className = "hero-dot"
      if (index === 0) dot.classList.add("active")
      dot.setAttribute("aria-label", `Go to slide ${index + 1}`)
      dot.addEventListener("click", () => goToSlide(index))
      dotsContainer.appendChild(dot)
    })
  }

  // Function to show a specific slide
  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index)
    })

    // Update dots
    const dots = document.querySelectorAll(".hero-dot")
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index)
    })

    currentSlide = index
  }

  // Function to go to a specific slide
  function goToSlide(index) {
    showSlide(index)
    resetSlideInterval()
  }

  // Function to go to next slide
  function nextSlide() {
    const next = (currentSlide + 1) % slides.length
    showSlide(next)
  }

  // Function to start automatic slideshow
  function startSlideInterval() {
    slideInterval = setInterval(nextSlide, 5000) // Change slide every 5 seconds
  }

  // Function to reset slide interval
  function resetSlideInterval() {
    clearInterval(slideInterval)
    startSlideInterval()
  }

  // Initialize slideshow if there are slides
  if (slides.length > 0) {
    showSlide(0)
    if (slides.length > 1) {
      startSlideInterval()
    }

    // Pause slideshow on hover (optional)
    const hero = document.querySelector(".hero")
    if (hero) {
      hero.addEventListener("mouseenter", () => {
        clearInterval(slideInterval)
      })

      hero.addEventListener("mouseleave", () => {
        if (slides.length > 1) {
          startSlideInterval()
        }
      })
    }
  }
})

// =======================================
// Folder-Based Gallery System
// =======================================

document.addEventListener("DOMContentLoaded", () => {
  const portfolioGrid = document.getElementById("portfolioGrid")
  const categoryFoldersContainer = document.getElementById("categoryFoldersContainer")
  const categoryFoldersGrid = document.getElementById("categoryFoldersGrid")
  const backToGalleryBtn = document.getElementById("backToGalleryBtn")
  
  if (!portfolioGrid || !categoryFoldersContainer || !categoryFoldersGrid) {
    return // Exit if elements don't exist
  }
  
  // Get all portfolio items
  const allPortfolioItems = Array.from(portfolioGrid.querySelectorAll(".portfolio-item"))
  
  // Category mapping function - extracts category from product name
  function getCategoryFromProductName(productName) {
    const name = productName.toLowerCase().trim()
    
    // Define category patterns
    if (name.includes("frame award") || name.includes("award")) {
      return "Awards"
    }
    if (name.includes("paper bag")) {
      return "Paper Bags"
    }
    if (name.includes("brand identity")) {
      return "Brand Identity"
    }
    if (name.includes("brand shoot")) {
      return "Brand Shoot"
    }
    if (name.includes("business card") || name.includes("bussiness card")) {
      return "Business Cards"
    }
    if (name.includes("cloth tag")) {
      return "Cloth Tags"
    }
    if (name.includes("customized cap") || name.includes("customize cap")) {
      return "Customized Caps"
    }
    if (name.includes("customized pouch") || name.includes("customized  pouch")) {
      return "Customized Pouches"
    }
    if (name.includes("customized bottle")) {
      return "Customized Bottles"
    }
    if (name.includes("customized notepad")) {
      return "Customized Notepads"
    }
    if (name.includes("customized nylon")) {
      return "Customized Nylons"
    }
    if (name.includes("customized pen")) {
      return "Customized Pens"
    }
    if (name.includes("customized shirt")) {
      return "Customized Shirts"
    }
    if (name.includes("digital alarm clock")) {
      return "Digital Alarm Clocks"
    }
    if (name.includes("exercise book")) {
      return "Exercise Books"
    }
    if (name.includes("flyer")) {
      return "Flyers"
    }
    if (name.includes("key holder")) {
      return "Key Holders"
    }
    if (name.includes("logo")) {
      return "Logos"
    }
    if (name.includes("box")) {
      return "Boxes"
    }
    
    // Default category for unmatched items
    return "Other"
  }
  
  // Group products by category
  const categories = {}
  allPortfolioItems.forEach((item) => {
    const productName = item.getAttribute("data-product-name") || ""
    const category = getCategoryFromProductName(productName)
    
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(item)
  })
  
  // Add data-category attribute to each item for filtering
  allPortfolioItems.forEach((item) => {
    const productName = item.getAttribute("data-product-name") || ""
    const category = getCategoryFromProductName(productName)
    item.setAttribute("data-category", category)
  })
  
  // Get SVG icon for category
  function getCategoryIcon(categoryName) {
    const icons = {
      "Awards": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15L8 17L9 12.5L6 10L10.5 9.5L12 5L13.5 9.5L18 10L15 12.5L16 17L12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      "Paper Bags": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 6H21" stroke="currentColor" stroke-width="2"/>
        <path d="M8 10V14M16 10V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Brand Identity": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M9 9H15M9 12H15M9 15H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="7" cy="7" r="1" fill="currentColor"/>
      </svg>`,
      "Brand Shoot": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
        <path d="M12 1V3M12 21V23M23 12H21M3 12H1M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Business Cards": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M2 10H22" stroke="currentColor" stroke-width="2"/>
        <circle cx="7" cy="7" r="1" fill="currentColor"/>
        <path d="M7 14H11M7 17H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Cloth Tags": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 3H18C18.5304 3 19.0391 3.21071 19.4142 3.58579C19.7893 3.96086 20 4.46957 20 5V19C20 19.5304 19.7893 20.0391 19.4142 20.4142C19.0391 20.7893 18.5304 21 18 21H6C5.46957 21 4.96086 20.7893 4.58579 20.4142C4.21071 20.0391 4 19.5304 4 19V5C4 4.46957 4.21071 3.96086 4.58579 3.58579C4.96086 3.21071 5.46957 3 6 3Z" stroke="currentColor" stroke-width="2"/>
        <path d="M8 7H16M8 11H16M8 15H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Customized Caps": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3C8 3 4 5 4 8C4 10 6 12 8 13V19H16V13C18 12 20 10 20 8C20 5 16 3 12 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 3V1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Customized Pouches": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 7H20L19 21H5L4 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 7V5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5V7" stroke="currentColor" stroke-width="2"/>
        <path d="M12 11V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Customized Bottles": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 2V6M15 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 6H17C17.5304 6 18.0391 6.21071 18.4142 6.58579C18.7893 6.96086 19 7.46957 19 8V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V8C5 7.46957 5.21071 6.96086 5.58579 6.58579C5.96086 6.21071 6.46957 6 7 6Z" stroke="currentColor" stroke-width="2"/>
        <path d="M12 10V18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Customized Notepads": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H20C20.5304 4 21.0391 4.21071 21.4142 4.58579C21.7893 4.96086 22 5.46957 22 6V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V6C2 5.46957 2.21071 4.96086 2.58579 4.58579C2.96086 4.21071 3.46957 4 4 4Z" stroke="currentColor" stroke-width="2"/>
        <path d="M8 8H16M8 12H16M8 16H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Customized Nylons": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8H20L19 21H5L4 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 8V5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5V8" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      "Customized Pens": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 19L19 12L22 15L15 22L12 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18 13L21 10L19 8L16 11L18 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 2L2 9L5 12L12 5L9 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      "Customized Shirts": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H20L19 12C19 12.5304 18.7893 13.0391 18.4142 13.4142C18.0391 13.7893 17.5304 14 17 14H7C6.46957 14 5.96086 13.7893 5.58579 13.4142C5.21071 13.0391 5 12.5304 5 12L4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 4L9 2L12 4L15 2L20 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      "Digital Alarm Clocks": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Exercise Books": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H20C20.5304 4 21.0391 4.21071 21.4142 4.58579C21.7893 4.96086 22 5.46957 22 6V20C22 20.5304 21.7893 21.0391 21.4142 21.4142C21.0391 21.7893 20.5304 22 20 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V6C2 5.46957 2.21071 4.96086 2.58579 4.58579C2.96086 4.21071 3.46957 4 4 4Z" stroke="currentColor" stroke-width="2"/>
        <path d="M8 8H16M8 12H16M8 16H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Flyers": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 12H16M8 16H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Key Holders": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 2L19 4M11 12L9 14M3 8L5 6M19 4L12 11M19 4L21 6M12 11L9 14M12 11L14 9M9 14L7 16M14 9L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="19" cy="19" r="3" stroke="currentColor" stroke-width="2"/>
      </svg>`,
      "Logos": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M8 12H16M12 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Boxes": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H19C19.5304 18 20.0391 17.7893 20.4142 17.4142C20.7893 17.0391 21 16.5304 21 16Z" stroke="currentColor" stroke-width="2"/>
        <path d="M3 10H21M8 14H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      "Other": `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    }
    
    return icons[categoryName] || icons["Other"]
  }
  
  // Create category folder cards
  function createCategoryFolders() {
    categoryFoldersGrid.innerHTML = ""
    
    const sortedCategories = Object.keys(categories).sort()
    
    sortedCategories.forEach((categoryName) => {
      const categoryCount = categories[categoryName].length
      const categoryIcon = getCategoryIcon(categoryName)
      
      const folderCard = document.createElement("div")
      folderCard.className = "category-folder-card"
      folderCard.setAttribute("data-category", categoryName)
      
      folderCard.innerHTML = `
        <div class="category-folder-icon">
          ${categoryIcon}
        </div>
        <div class="category-folder-info">
          <h3 class="category-folder-name">${categoryName}</h3>
          <p class="category-folder-count">${categoryCount} ${categoryCount === 1 ? "item" : "items"}</p>
        </div>
      `
      
      folderCard.addEventListener("click", () => {
        showCategoryView(categoryName)
      })
      
      categoryFoldersGrid.appendChild(folderCard)
    })
  }
  
  // Show category view (products for selected category)
  function showCategoryView(categoryName) {
    // Hide category folders
    categoryFoldersContainer.style.display = "none"
    
    // Show back button
    backToGalleryBtn.style.display = "flex"
    
    // Hide featured videos section
    const videoGallerySection = document.querySelector(".video-gallery-section")
    if (videoGallerySection) {
      videoGallerySection.style.display = "none"
    }
    
    // Show portfolio grid
    portfolioGrid.style.display = "grid"
    
    // Hide all items first
    allPortfolioItems.forEach((item) => {
      item.style.display = "none"
    })
    
    // Show only items from selected category
    const categoryItems = allPortfolioItems.filter(
      (item) => item.getAttribute("data-category") === categoryName
    )
    
    categoryItems.forEach((item) => {
      item.style.display = "flex"
    })
    
    // Scroll to gallery section
    const gallerySection = document.getElementById("portfolio")
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }
  
  // Show main gallery view (category folders)
  function showMainGallery() {
    // Show category folders
    categoryFoldersContainer.style.display = "block"
    
    // Hide back button
    backToGalleryBtn.style.display = "none"
    
    // Show featured videos section again
    const videoGallerySection = document.querySelector(".video-gallery-section")
    if (videoGallerySection) {
      videoGallerySection.style.display = "block"
    }
    
    // Hide portfolio grid
    portfolioGrid.style.display = "none"
    
    // Scroll to gallery section
    const gallerySection = document.getElementById("portfolio")
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }
  
  // Back button click handler
  if (backToGalleryBtn) {
    backToGalleryBtn.addEventListener("click", () => {
      showMainGallery()
    })
  }
  
  // Initialize: Create category folders and hide portfolio grid
  createCategoryFolders()
  portfolioGrid.style.display = "none"
})