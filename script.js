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