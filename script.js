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
 * @param {string} productName - Name of the product/service
 * @param {string} productPrice - Price of the product (can be "Contact for pricing" if no price)
 * @param {string} imageUrl - Full URL of the product image
 */
function openWhatsAppOrder(productName, productPrice, imageUrl) {
  // Get the current page URL to construct full image URL
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '')
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}/${imageUrl}`
  
  // Create the message template
  const message = `Hello! I'm interested in ordering:\n\n` +
    `📦 *Product Name:* ${productName}\n` +
    `💰 *Price:* ${productPrice}\n` +
    `🖼️ *Image:* ${fullImageUrl}\n\n` +
    `Please provide more details about this product.`
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message)
  
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
    
    // Default price - can be customized per item if needed
    const productPrice = "Contact for pricing"
    
    const overlay = document.createElement("div")
    overlay.className = "portfolio-overlay"
    overlay.innerHTML = `
      <h3>${productName}</h3>
      <p>Professional branding & design</p>
    `
    
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
    
    // Add click event to WhatsApp button
    whatsappBtn.addEventListener("click", (e) => {
      e.stopPropagation() // Prevent triggering overlay click
      openWhatsAppOrder(productName, productPrice, imagePath)
    })
    
    item.appendChild(img)
    item.appendChild(overlay)
    item.appendChild(whatsappBtn)
    
    // Store product data as data attributes for easy access
    item.setAttribute("data-product-name", productName)
    item.setAttribute("data-product-price", productPrice)
    item.setAttribute("data-product-image", imagePath)
    
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