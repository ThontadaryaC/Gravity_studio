// Gravity Studios - UI Interaction & Animation Controller (Vibrant & Family-Friendly)

// Initialize Supabase Client (Syncs with cloud database)
const supabaseUrl = 'https://kivfatgytkjqoreltuyu.supabase.co';
const supabaseKey = 'sb_publishable_NGdByzMeaQrwJPw1YKGjnA_issJf05b';
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// Force clear local admin locks and sessions on first load after this fix
if (!localStorage.getItem('gravity-force-cleared-locks-v1')) {
  localStorage.removeItem('gravity-admin-locks');
  localStorage.removeItem('gravity-user-session');
  localStorage.setItem('gravity-force-cleared-locks-v1', 'true');
}

// Razorpay Integration Configuration
const RAZORPAY_CONFIG = {
  // Enter your Razorpay Key ID here (e.g. "rzp_test_xxxxxxxxxx")
  // Leave empty "" to run in Simulated Sandbox Mode.
  keyId: localStorage.getItem('gravity_razorpay_key') || "",
  currency: "INR" // Currency code (INR is standard for Indian transactions)
};

// Default service prices catalog
const DEFAULT_SERVICE_PRICES = [
  // 1. AI Services
  { id: "ai_chatbot", name: "AI Chatbot", priceINR: 24999, priceUSD: 799, priceMaxINR: 120000, priceMaxUSD: 4000, rangeINR: "₹25,000–₹1,20,000", rangeUSD: "$800–$4,000" },
  { id: "ai_voice_agent", name: "AI Voice Agent", priceINR: 49999, priceUSD: 1999, priceMaxINR: 300000, priceMaxUSD: 10000, rangeINR: "₹50,000–₹3,00,000", rangeUSD: "$2,000–$10,000" },
  { id: "ai_receptionist", name: "AI Receptionist", priceINR: 60000, priceUSD: 2500, priceMaxINR: 350000, priceMaxUSD: 12000, rangeINR: "₹60,000–₹3,50,000", rangeUSD: "$2,500–$12,000" },
  { id: "ai_customer_support", name: "AI Customer Support", priceINR: 40000, priceUSD: 1500, priceMaxINR: 200000, priceMaxUSD: 8000, rangeINR: "₹40,000–₹2,00,000", rangeUSD: "$1,500–$8,000" },
  { id: "ai_sales_agent", name: "AI Sales Agent", priceINR: 50000, priceUSD: 2000, priceMaxINR: 300000, priceMaxUSD: 10000, rangeINR: "₹50,000–₹3,00,000", rangeUSD: "$2,000–$10,000" },
  { id: "ai_appointment_booking", name: "AI Appointment Booking", priceINR: 30000, priceUSD: 1200, priceMaxINR: 150000, priceMaxUSD: 5000, rangeINR: "₹30,000–₹1,50,000", rangeUSD: "$1,200–$5,000" },
  { id: "ai_workflow_automation", name: "AI Workflow Automation", priceINR: 39999, priceUSD: 1499, priceMaxINR: 300000, priceMaxUSD: 12000, rangeINR: "₹40,000–₹3,00,000", rangeUSD: "$2,000–$12,000" },
  { id: "custom_ai_solution", name: "Custom AI Solution", priceINR: 100000, priceUSD: 5000, priceMaxINR: 500000, priceMaxUSD: 25000, rangeINR: "₹1,00,000+", rangeUSD: "Starting at $5,000" },

  // 2. Web & App Development
  { id: "business_website", name: "Business Website", priceINR: 19999, priceUSD: 799, priceMaxINR: 80000, priceMaxUSD: 3000, rangeINR: "₹20,000–₹80,000", rangeUSD: "$800–$3,000" },
  { id: "premium_website", name: "Premium Website", priceINR: 80000, priceUSD: 3000, priceMaxINR: 250000, priceMaxUSD: 10000, rangeINR: "₹80,000–₹2,50,000", rangeUSD: "$3,000–$10,000" },
  { id: "web_application", name: "Web Application", priceINR: 100000, priceUSD: 5000, priceMaxINR: 1000000, priceMaxUSD: 50000, rangeINR: "₹1,00,000–₹10,00,000", rangeUSD: "$5,000–$50,000" },
  { id: "mobile_app", name: "Mobile App", priceINR: 99999, priceUSD: 4999, priceMaxINR: 1500000, priceMaxUSD: 60000, rangeINR: "₹1,00,000–₹15,00,000", rangeUSD: "$5,000–$60,000" },
  { id: "saas_platform", name: "SaaS Platform", priceINR: 299999, priceUSD: 9999, priceMaxINR: 3000000, priceMaxUSD: 100000, rangeINR: "₹3,00,000–₹30,00,000", rangeUSD: "$10,000–$100,000" },
  { id: "crm_erp_system", name: "CRM/ERP System", priceINR: 200000, priceUSD: 8000, priceMaxINR: 2000000, priceMaxUSD: 80000, rangeINR: "₹2,00,000–₹20,00,000", rangeUSD: "$8,000–$80,000" },
  { id: "dashboard_development", name: "Dashboard Development", priceINR: 50000, priceUSD: 2000, priceMaxINR: 500000, priceMaxUSD: 20000, rangeINR: "₹50,000–₹5,00,000", rangeUSD: "$2,000–$20,000" },

  // 3. Design & Branding
  { id: "logo_design", name: "Logo Design", priceINR: 5000, priceUSD: 300, priceMaxINR: 30000, priceMaxUSD: 1200, rangeINR: "₹5,000–₹30,000", rangeUSD: "$300–$1,200" },
  { id: "brand_identity", name: "Brand Identity & Design", priceINR: 14999, priceUSD: 599, priceMaxINR: 150000, priceMaxUSD: 5000, rangeINR: "₹20,000–₹1,50,000", rangeUSD: "$800–$5,000" },
  { id: "ui_ux_design", name: "UI/UX Design", priceINR: 20000, priceUSD: 800, priceMaxINR: 200000, priceMaxUSD: 8000, rangeINR: "₹20,000–₹2,00,000", rangeUSD: "$800–$8,000" },
  { id: "presentation_design", name: "Presentation Design", priceINR: 8000, priceUSD: 300, priceMaxINR: 50000, priceMaxUSD: 2000, rangeINR: "₹8,000–₹50,000", rangeUSD: "$300–$2,000" },
  { id: "graphic_design", name: "Graphic Design", priceINR: 5000, priceUSD: 250, priceMaxINR: 25000, priceMaxUSD: 1200, rangeINR: "₹5,000+", rangeUSD: "$250+" },

  // 4. Video & Animation
  { id: "ai_video", name: "AI Video Production", priceINR: 19999, priceUSD: 899, priceMaxINR: 200000, priceMaxUSD: 8000, rangeINR: "₹15,000–₹2,00,000", rangeUSD: "$700–$8,000" },
  { id: "animation", name: "Animation", priceINR: 30000, priceUSD: 1500, priceMaxINR: 500000, priceMaxUSD: 20000, rangeINR: "₹30,000–₹5,00,000", rangeUSD: "$1,500–$20,000" },
  { id: "explainer_video", name: "Explainer Video", priceINR: 20000, priceUSD: 800, priceMaxINR: 200000, priceMaxUSD: 8000, rangeINR: "₹20,000–₹2,00,000", rangeUSD: "$800–$8,000" },
  { id: "motion_graphics", name: "Motion Graphics", priceINR: 15000, priceUSD: 600, priceMaxINR: 150000, priceMaxUSD: 6000, rangeINR: "₹15,000–₹1,50,000", rangeUSD: "$600–$6,000" },
  { id: "product_advertisement", name: "Product Advertisement", priceINR: 25000, priceUSD: 1200, priceMaxINR: 300000, priceMaxUSD: 12000, rangeINR: "₹25,000–₹3,00,000", rangeUSD: "$1,200–$12,000" },

  // 5. Digital Marketing
  { id: "seo", name: "SEO (Monthly)", priceINR: 15000, priceUSD: 700, rangeINR: "₹15,000/month", rangeUSD: "$700/month" },
  { id: "social_media", name: "Social Media Marketing (Monthly)", priceINR: 20000, priceUSD: 800, rangeINR: "₹20,000/month", rangeUSD: "$800/month" },
  { id: "google_ads", name: "Google Ads Management (Monthly)", priceINR: 25000, priceUSD: 1000, rangeINR: "₹25,000/month", rangeUSD: "$1,000/month" },
  { id: "meta_ads", name: "Meta Ads Management (Monthly)", priceINR: 25000, priceUSD: 1000, rangeINR: "₹25,000/month", rangeUSD: "$1,000/month" },
  { id: "email_marketing", name: "Email Marketing (Monthly)", priceINR: 15000, priceUSD: 600, rangeINR: "₹15,000/month", rangeUSD: "$600/month" },

  // 6. Tech Support & Cloud
  { id: "domain_hosting", name: "Domain & Hosting Setup", priceINR: 5000, priceUSD: 200, rangeINR: "₹5,000", rangeUSD: "$200" },
  { id: "website_maintenance", name: "Website Maintenance (Monthly)", priceINR: 5000, priceUSD: 200, rangeINR: "₹5,000/month", rangeUSD: "$200/month" },
  { id: "security_audit", name: "Security Audit", priceINR: 25000, priceUSD: 1000, rangeINR: "₹25,000", rangeUSD: "$1,000" },
  { id: "api_integration", name: "API Integration", priceINR: 20000, priceUSD: 800, priceMaxINR: 200000, priceMaxUSD: 8000, rangeINR: "₹20,000–₹2,00,000", rangeUSD: "$800–$8,000" },
  { id: "cloud_deployment", name: "Cloud Deployment", priceINR: 30000, priceUSD: 1500, priceMaxINR: 300000, priceMaxUSD: 12000, rangeINR: "₹30,000–₹3,00,000", rangeUSD: "$1,500–$12,000" },

  // 7. Consulting & Enterprise
  { id: "ai_consulting", name: "AI Strategy Consulting (Hourly)", priceINR: 5000, priceUSD: 200, rangeINR: "₹5,000/hour", rangeUSD: "$200/hour" },
  { id: "cto_service", name: "CTO as a Service (Monthly)", priceINR: 100000, priceUSD: 5000, rangeINR: "₹1,00,000/month", rangeUSD: "$5,000/month" },
  { id: "startup_mvp", name: "Startup MVP Development", priceINR: 200000, priceUSD: 10000, priceMaxINR: 1500000, priceMaxUSD: 75000, rangeINR: "₹2,00,000–₹15,00,000", rangeUSD: "$10,000–$75,000" },
  { id: "enterprise_ai", name: "Enterprise AI Solutions", priceINR: 500000, priceUSD: 25000, priceMaxINR: 2500000, priceMaxUSD: 100000, rangeINR: "₹5,00,000+ (Custom Quote)", rangeUSD: "Starting at $25,000 (Custom Quote)" }
];

const ADMIN_ROLE_DETAILS = {
  'f0000000-0000-0000-0000-000000000001': {
    username: 'Ajay Raj B.K',
    title: 'Founder & Creative Director'
  },
  'c0000000-0000-0000-0000-000000000002': {
    username: 'Shashank Raj B.K',
    title: 'Co-Founder & CEO'
  },
  'a0000000-0000-0000-0000-000000000003': {
    username: 'Thontadaraya',
    title: 'CTO (Technology Head)'
  },
  'd0000000-0000-0000-0000-000000000004': {
    username: 'Pruthvi Raj',
    title: 'CIO (IT Head)'
  },
  'e0000000-0000-0000-0000-000000000005': {
    username: 'Shreyas',
    title: 'COO & Site Engineer'
  },
  'b0000000-0000-0000-0000-000000000006': {
    username: 'Munish',
    title: 'CMO (Marketing Head)'
  },
  'b0000000-0000-0000-0000-000000000007': {
    username: 'Subhash',
    title: 'Sales & Pricing Lead'
  },
  'b0000000-0000-0000-0000-000000000008': {
    username: 'Pavan Krishna',
    title: 'CHRO (HR Head)'
  }
};

function getServicePrices() {
  const stored = localStorage.getItem('gravity_service_prices');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.length === DEFAULT_SERVICE_PRICES.length && parsed[0].hasOwnProperty('priceMaxINR')) {
        return parsed;
      }
    } catch (e) {
      console.error("Error parsing stored prices, resetting:", e);
    }
  }
  localStorage.setItem('gravity_service_prices', JSON.stringify(DEFAULT_SERVICE_PRICES));
  return DEFAULT_SERVICE_PRICES;
}

function detectUserCountry(session) {
  if (!session) return 'Other';
  const email = (session.email || '').toLowerCase();
  const phone = (session.phone || '');
  const locale = (session.locale || '').toUpperCase();
  if (email.endsWith('.in') || phone.startsWith('+91') || phone.startsWith('91') || locale.endsWith('-IN') || locale.includes('IN')) {
    return 'India';
  }
  return session.country || 'Other';
}


document.addEventListener('DOMContentLoaded', () => {
  // Safe retry for Lucide icons rendering to avoid race conditions
  function renderAllIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    } else {
      setTimeout(renderAllIcons, 250);
    }
  }
  renderAllIcons();

  // Decode obfuscated email in footer to protect against bots
  function initEmailObfuscation() {
    document.querySelectorAll('.obfuscated-email').forEach(el => {
      const user = el.getAttribute('data-user');
      const domain = el.getAttribute('data-domain');
      if (user && domain) {
        const email = `${user}@${domain}`;
        const link = document.createElement('a');
        link.href = `mailto:${email}`;
        link.textContent = email;
        link.style.color = 'inherit';
        link.style.textDecoration = 'none';
        el.innerHTML = '';
        el.appendChild(link);
      }
    });
  }
  initEmailObfuscation();

  initThemeToggle();
  initPortalAuth();
  initIntroLoader();
  initNavbarScroll();
  initAccessibilityControls();
  initMagicPaint();
  initMediaGallery();
  initOrgChart();
  initOrgCarousel();
  initRevenueChart();
  initTimelineReveal();
  initDepartmentFilter();
});

/* ==========================================================================
   0. THEME SWITCHER (LIGHT BY DEFAULT, SWITCHABLE TO DARK)
   ========================================================================== */
function initThemeToggle() {
  const themeBtn = document.querySelector('[data-action="theme-toggle"]');
  let isDark = document.body.classList.contains('dark-theme');

  if (themeBtn) {
    // Sync button state with initial body class
    if (isDark) {
      themeBtn.classList.add('active');
      themeBtn.setAttribute('aria-pressed', 'true');
    }

    themeBtn.addEventListener('click', () => {
      isDark = document.body.classList.toggle('dark-theme');
      localStorage.setItem('gravity-theme', isDark ? 'dark' : 'light');
      
      if (window.updateSceneTheme) {
        window.updateSceneTheme(isDark);
      }
      
      themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    });
  }
}

/* ==========================================================================
   1. 10-SECOND INTRO LOADER (WITH CANVAS VORTEX FALLBACK)
   ========================================================================== */
function initIntroLoader() {
  const loader = document.getElementById('intro-loader');
  const progressBar = document.querySelector('.intro-progress-bar');
  const timerText = document.querySelector('.intro-timer');
  const skipBtn = document.querySelector('.skip-intro-btn');
  const fallbackCanvas = document.getElementById('intro-canvas-fallback');
  const introVideo = document.querySelector('.intro-video-container');

  let duration = 10; 
  let elapsed = 0;
  let interval;
  let canvasCtx;
  let particles = [];
  let animFrameId;

  document.body.style.overflow = 'hidden';

  if (introVideo) {
    introVideo.addEventListener('error', () => {
      startFallbackAnimation();
    });
    introVideo.play().catch(() => {
      startFallbackAnimation();
    });
    introVideo.onended = () => {
      completeIntro();
    };
  } else {
    startFallbackAnimation();
  }

  const stepTime = 30;
  const totalSteps = (duration * 1000) / stepTime;
  
  interval = setInterval(() => {
    elapsed++;
    const percent = (elapsed / totalSteps) * 100;
    if (progressBar) progressBar.style.width = `${percent}%`;
    
    const remainingSec = Math.max(0, duration - Math.floor((elapsed * stepTime) / 1000));
    if (timerText) {
      timerText.textContent = `GRAVITATIONAL SYNC... ${remainingSec}S`;
    }

    if (elapsed >= totalSteps) {
      completeIntro();
    }
  }, stepTime);

  if (skipBtn) {
    skipBtn.addEventListener('click', completeIntro);
  }

  function completeIntro() {
    clearInterval(interval);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.style.display = 'none';
        document.body.style.overflow = 'auto';
        checkTimelineInView();
      }, 1000);
    }
  }

  // Draw colorful particle fallbacks for kids during intro
  function startFallbackAnimation() {
    if (!fallbackCanvas) return;
    
    const resizeCanvas = () => {
      fallbackCanvas.width = window.innerWidth;
      fallbackCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    canvasCtx = fallbackCanvas.getContext('2d');
    
    const pCount = 130;
    particles = [];
    const colors = ['#00f0ff', '#b026ff', '#ff0055', '#ffaa00', '#39ff14'];

    for (let i = 0; i < pCount; i++) {
      particles.push({
        x: Math.random() * fallbackCanvas.width,
        y: Math.random() * fallbackCanvas.height,
        radius: 1 + Math.random() * 2.5,
        speed: 0.7 + Math.random() * 1.6,
        angle: Math.random() * Math.PI * 2,
        distance: 120 + Math.random() * 450,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    function renderFallback() {
      canvasCtx.fillStyle = 'rgba(4, 3, 7, 0.15)';
      canvasCtx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);

      const centerX = fallbackCanvas.width / 2;
      const centerY = fallbackCanvas.height / 2;

      // Glow core
      const glowGrad = canvasCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 90);
      glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
      glowGrad.addColorStop(0.5, 'rgba(176, 38, 255, 0.1)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      canvasCtx.fillStyle = glowGrad;
      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, 90, 0, Math.PI * 2);
      canvasCtx.fill();

      // Draw particles orbiting
      particles.forEach(p => {
        p.angle += (p.speed * 0.015);
        p.distance -= 0.7;

        if (p.distance <= 12) {
          p.distance = 350 + Math.random() * 250;
          p.angle = Math.random() * Math.PI * 2;
        }

        p.x = centerX + Math.cos(p.angle) * p.distance;
        p.y = centerY + Math.sin(p.angle) * p.distance;

        canvasCtx.fillStyle = p.color;
        canvasCtx.beginPath();
        canvasCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        canvasCtx.fill();
      });

      animFrameId = requestAnimationFrame(renderFallback);
    }

    renderFallback();
  }
}

/* ==========================================================================
   2. NAVBAR SCROLL ACTIVE STATE
   ========================================================================== */
function initNavbarScroll() {
  const header = document.querySelector('header');
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - 160) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   3. ACCESSIBILITY CONTROLS (READABILITY MODE FOR ELDERS)
   ========================================================================== */
function initAccessibilityControls() {
  const readabilityBtn = document.querySelector('[data-action="readability"]');
  
  if (readabilityBtn) {
    readabilityBtn.addEventListener('click', () => {
      const isActive = document.body.classList.toggle('large-text');
      if (isActive) {
        readabilityBtn.classList.add('active');
        readabilityBtn.setAttribute('aria-pressed', 'true');
      } else {
        readabilityBtn.classList.remove('active');
        readabilityBtn.setAttribute('aria-pressed', 'false');
      }
    });
  }
}

/* ==========================================================================
   4. MAGIC PAINT INTERACTION (PLAYFUL CURSOR TRAIL FOR KIDS)
   ========================================================================== */
let isMagicPaintActive = false;

function initMagicPaint() {
  const magicBtn = document.querySelector('[data-action="magicpaint"]');
  const canvas = document.getElementById('magic-paint-canvas');
  if (!canvas) return;

  let ctx = canvas.getContext('2d');
  let paintParticles = [];
  let animId;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Color options
  const colors = ['#00f0ff', '#b026ff', '#ff0055', '#ffaa00', '#39ff14'];

  function addParticle(e) {
    if (!isMagicPaintActive) return;
    const x = e.clientX;
    const y = e.clientY;

    for (let i = 0; i < 2; i++) {
      paintParticles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 0.5, // Float slightly upwards
        radius: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.015
      });
    }
  }

  // Bind mouse and touch events
  window.addEventListener('mousemove', addParticle);
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      addParticle(e.touches[0]);
    }
  });

  // Toggle button click
  if (magicBtn) {
    magicBtn.addEventListener('click', () => {
      isMagicPaintActive = !isMagicPaintActive;
      if (isMagicPaintActive) {
        magicBtn.classList.add('active');
        magicBtn.setAttribute('aria-pressed', 'true');
        canvas.style.display = 'block';
        startLoop();
      } else {
        magicBtn.classList.remove('active');
        magicBtn.setAttribute('aria-pressed', 'false');
        canvas.style.display = 'none';
        cancelAnimationFrame(animId);
        paintParticles = [];
      }
    });
  }

  function startLoop() {
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      paintParticles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.radius = Math.max(0.1, p.radius - 0.1);

        if (p.alpha <= 0 || p.radius <= 0.2) {
          paintParticles.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    }
    draw();
  }
}

/* ==========================================================================
   5. MEDIA SHOWCASE & LIGHTBOX SYSTEM
   ========================================================================== */
let galleryAssets = [
  {
    type: 'image',
    category: 'posters',
    title: 'Civil Construction Services',
    desc: 'Professional civil site management and structural execution.',
    src: 'https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/Civil_construction_services.jpeg',
    fallbackColor: '#b026ff'
  },
  {
    type: 'image',
    category: 'posters',
    title: 'Logo Designs',
    desc: 'High-end vector corporate branding and visual assets design.',
    src: 'https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/Logo_designs.jpeg',
    fallbackColor: '#00f0ff'
  },
  {
    type: 'image',
    category: 'posters',
    title: 'YouTube Thumbnail Creations',
    desc: 'Creative graphic layouts and high-click-through cover arts.',
    src: 'https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/Youtube_thumbnail_creations.jpeg',
    fallbackColor: '#ff0055'
  },
  {
    type: 'image',
    category: 'posters',
    title: 'Our Services',
    desc: 'Full overview of our creative and technical ecosystem offerings.',
    src: 'https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/our_services.jpeg',
    fallbackColor: '#39ff14'
  },
  {
    type: 'image',
    category: 'posters',
    title: 'Price Quotations',
    desc: 'Competitive project valuations, packages, and custom quotes.',
    src: 'https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/price_quations.jpeg',
    fallbackColor: '#ffaa00'
  },
  {
    type: 'image',
    category: 'posters',
    title: 'Team & Department Structure',
    desc: 'Organization grid highlighting active divisions and reporting lines.',
    src: 'https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/team_memebers_with_department.jpeg',
    fallbackColor: '#00f0ff'
  }
];

let currentLightboxIdx = 0;

async function initMediaGallery() {
  const grid = document.querySelector('.gallery-grid');
  const modal = document.getElementById('lightbox-modal');
  const modalWrapper = document.querySelector('.lightbox-content-wrapper');
  const modalCaption = document.querySelector('.lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const leftArrow = document.querySelector('.lightbox-arrow.left');
  const rightArrow = document.querySelector('.lightbox-arrow.right');

  // Bind click events to the initial static cards immediately for zero-latency interaction
  setupCardListeners();

  // Fetch and sync with Supabase if the client is active
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('gallery_assets')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Map database records to the galleryAssets structure
        galleryAssets = data.map(item => ({
          type: item.type || 'image',
          category: item.category || 'posters',
          title: item.title,
          desc: item.description || item.desc || '',
          src: item.src,
          fallbackColor: item.fallback_color || item.fallbackColor || '#00f0ff'
        }));

        // Re-render the gallery grid dynamically
        if (grid) {
          grid.innerHTML = galleryAssets.map((item, index) => {
            const iconName = item.type === 'video' ? 'video' : 'image';
            const tagText = item.type === 'video' ? 'Video' : 'Poster';
            return `
              <div class="gallery-card" data-category="${item.category}" data-index="${index}" role="button" aria-label="View ${item.title} ${tagText}">
                <div class="gallery-media-wrapper">
                  <img src="${item.src}" alt="${item.title}" onerror="this.style.display='none';">
                  <div class="gallery-placeholder" style="background: radial-gradient(circle, ${item.fallbackColor}33 0%, #0a0814 100%)">
                    <div class="gallery-placeholder-icon" style="color:${item.fallbackColor}; border-color:${item.fallbackColor}; background:${item.fallbackColor}15">
                      <i data-lucide="${iconName}"></i>
                    </div>
                    <h4 class="gallery-placeholder-title">${item.title}</h4>
                    <span class="gallery-placeholder-tag">${tagText}</span>
                  </div>
                </div>
                <div class="gallery-hover-overlay">
                  <div class="gallery-hover-btn"><i data-lucide="maximize-2"></i></div>
                  <div class="gallery-info">
                    <h3 class="gallery-title">${item.title}</h3>
                    <p class="gallery-desc">${item.desc}</p>
                  </div>
                </div>
              </div>
            `;
          }).join('');

          // Re-render Lucide icons for the newly injected DOM elements
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }

          // Bind click events to the new dynamically rendered cards
          setupCardListeners();
        }
      }
    } catch (err) {
      console.warn('Failed to load gallery assets from Supabase. Using local fallbacks.', err);
    }
  }

  function setupCardListeners() {
    const cards = document.querySelectorAll('.gallery-card');
    cards.forEach(card => {
      // Remove old listeners by cloning and replacing, or just add since grid is entirely rebuilt
      // upon successful fetch, ensuring no duplicate listeners are active.
      card.replaceWith(card.cloneNode(true));
    });

    // Re-select and attach fresh listeners to active DOM nodes
    const activeCards = document.querySelectorAll('.gallery-card');
    activeCards.forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-index'));
        openLightbox(idx);
      });
    });
  }

  function openLightbox(idx) {
    currentLightboxIdx = idx;
    const item = galleryAssets[idx];
    if (!item) return;

    modalWrapper.innerHTML = ''; // clear

    if (item.type === 'video') {
      const video = document.createElement('video');
      video.className = 'lightbox-media';
      video.src = item.src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.style.background = 'radial-gradient(circle, rgba(176,38,255,0.15) 0%, #000 100%)';
      
      video.onerror = () => {
        showLightboxFallback(item);
      };
      modalWrapper.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.className = 'lightbox-media';
      img.src = item.src;
      img.alt = item.title;
      
      img.onerror = () => {
        showLightboxFallback(item);
      };
      modalWrapper.appendChild(img);
    }

    modalCaption.textContent = `${item.title} — ${item.desc}`;
    modal.classList.add('visible');
  }

  function showLightboxFallback(item) {
    modalWrapper.innerHTML = '';
    const cardFallback = document.createElement('div');
    cardFallback.className = 'gallery-placeholder';
    cardFallback.style.width = '640px';
    cardFallback.style.height = '400px';
    cardFallback.style.maxWidth = '100%';
    cardFallback.style.background = `radial-gradient(circle, ${item.fallbackColor}33 0%, #0a0814 100%)`;
    
    const iconName = item.type === 'video' ? 'video' : 'image';
    cardFallback.innerHTML = `
      <div class="gallery-placeholder-icon" style="color:${item.fallbackColor}; border-color:${item.fallbackColor}; background:${item.fallbackColor}15">
        <i data-lucide="${iconName}"></i>
      </div>
      <h4 class="gallery-placeholder-title">${item.title}</h4>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">[ Place real media in assets folder or upload to Supabase Storage ]</p>
      <p style="font-size:0.8rem; color:${item.fallbackColor}; letter-spacing:0.1rem; text-transform:uppercase;">${item.category}</p>
    `;
    modalWrapper.appendChild(cardFallback);
    if (window.lucide) { lucide.createIcons(); }
  }

  // Close Lightbox
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLightbox();
    });
  }

  function closeLightbox() {
    modal.classList.remove('visible');
    modalWrapper.innerHTML = ''; // Pause video and clear references
  }

  // Navigate Lightbox
  if (leftArrow) {
    leftArrow.addEventListener('click', () => {
      let prevIdx = currentLightboxIdx - 1;
      if (prevIdx < 0) prevIdx = galleryAssets.length - 1;
      openLightbox(prevIdx);
    });
  }

  if (rightArrow) {
    rightArrow.addEventListener('click', () => {
      let nextIdx = currentLightboxIdx + 1;
      if (nextIdx >= galleryAssets.length) nextIdx = 0;
      openLightbox(nextIdx);
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('visible')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') leftArrow.click();
    if (e.key === 'ArrowRight') rightArrow.click();
  });
}

/* ==========================================================================
   6. INTERACTIVE ORGANIZATION CHART (WITH MULTI-COLOR THEME UPDATES)
   ========================================================================== */
const memberDetails = {
  'ajay': {
    name: 'Ajay Raj B.K',
    role: 'Founder & Creative Director',
    glowColor: 'var(--neon-purple)',
    glowShadow: 'var(--neon-purple-glow)',
    responsibilities: [
      'Establishing startup strategy and overall company vision',
      'Overseeing global creative direction across VFX, Anime & Films',
      'Orchestrating brand development and media design guidelines',
      'Driving strategic partnerships and business scale',
      'Spearheading core innovation in entertainment technologies'
    ],
    skills: ['Creative Direction', 'Brand Strategy', 'Film Production', 'VFX Pipeline', 'Executive Leadership']
  },
  'shashank': {
    name: 'Shashank Raj B.K',
    role: 'Co-Founder & CEO',
    glowColor: 'var(--neon-amber)',
    glowShadow: 'var(--neon-amber-glow)',
    responsibilities: [
      'Governing business operations, legal, and operational strategy',
      'Directing overall management and policy setting',
      'Forging enterprise partnerships and venture associations',
      'Managing high-value client acquisitions and retention',
      'Structuring global footprint expansion plans'
    ],
    skills: ['Business Operations', 'Strategic Management', 'Client Relations', 'Joint Ventures', 'Global Expansion']
  },
  'thontadaraya': {
    name: 'Thontadaraya',
    role: 'CTO (Technology Head)',
    glowColor: 'var(--neon-cyan)',
    glowShadow: 'var(--neon-cyan-glow)',
    responsibilities: [
      'Leading overall software development and system administration',
      'Architecting deep AI systems and research methodologies',
      'Formulating secure technical architectures and infrastructure systems',
      'Supervising digital product design and coding standards',
      'Pioneering software innovations for studio rendering systems'
    ],
    skills: ['Software Architecture', 'Artificial Intelligence', 'System Administration', 'Cloud Infrastructure', 'R&D']
  },
  'munish': {
    name: 'Munish',
    role: 'CMO (Marketing Head)',
    glowColor: 'var(--neon-pink)',
    glowShadow: 'var(--neon-pink-glow)',
    responsibilities: [
      'Devising comprehensive marketing and growth hacking strategy',
      'Managing social media presence and community ecosystems',
      'Directing promotional advertising campaigns and budgeting',
      'Governing multimedia content marketing pipelines',
      'Enhancing global brand equity and visibility'
    ],
    skills: ['Marketing Strategy', 'Growth Hacking', 'Public Relations', 'Social Media Analytics', 'Ad Strategy']
  },
  'pavan': {
    name: 'Pavan Krishna',
    role: 'CHRO (HR Head)',
    glowColor: 'var(--neon-green)',
    glowShadow: 'var(--neon-green-glow)',
    responsibilities: [
      'Managing recruitment protocols and hiring funnels',
      'Nurturing organizational talent and employee engagement',
      'Coordinating team-building activities and workshops',
      'Designing skill-development modules for junior employees',
      'Cultivating a collaborative, progressive corporate culture'
    ],
    skills: ['Recruitment Operations', 'Talent Retention', 'Corporate Culture', 'Employee Training', 'HR Analytics']
  },
  'pruthvi': {
    name: 'Pruthvi Raj',
    role: 'CIO (IT Head)',
    glowColor: 'var(--neon-cyan)',
    glowShadow: 'var(--neon-cyan-glow)',
    responsibilities: [
      'Maintaining core IT infrastructure and system uptime',
      'Configuring cybersecurity operations and access permissions',
      'Structuring database architectures and storage security',
      'Managing network systems and server farm connections',
      'Providing internal technology support protocols'
    ],
    skills: ['IT Infrastructure', 'Cybersecurity', 'Database Operations', 'Network Engineering', 'Tech Support']
  },
  'shreyas': {
    name: 'Shreyas',
    role: 'COO & Site Engineer',
    glowColor: 'var(--neon-purple)',
    glowShadow: 'var(--neon-purple-glow)',
    responsibilities: [
      'Managing operational execution, logistics, and resource flows',
      'Coordinating cross-functional project deadlines',
      'Supervising physical studio sites and hardware structures',
      'Implementing strict quality-control mechanisms',
      'Governing equipment, space, and facility setups'
    ],
    skills: ['Operations Management', 'Project Coordination', 'Logistics', 'Quality Assurance', 'Facility Planning']
  },
  'subhash': {
    name: 'Subhash',
    role: 'Sales & Pricing Lead',
    glowColor: 'var(--neon-amber)',
    glowShadow: 'var(--neon-amber-glow)',
    responsibilities: [
      'Supervising sales teams and lead conversion funnels',
      'Formulating dynamic pricing models for complex deliverables',
      'Negotiating high-value B2B enterprise deals',
      'Fostering revenue streams through direct client reach',
      'Conducting market-competitive sales analysis'
    ],
    skills: ['Sales Strategy', 'Pricing Strategy', 'Negotiation', 'B2B Sales', 'Market Intelligence']
  }
};

function initOrgChart() {
  const nodes = document.querySelectorAll('.org-node');
  const detailsPanel = document.getElementById('node-details-panel');
  const closeBtn = document.querySelector('.node-details-close');
  
  const panelName = document.querySelector('.node-details-title');
  const panelRole = document.querySelector('.node-details-subtitle');
  const panelList = document.querySelector('.node-details-list');
  const panelSkills = document.querySelector('.node-details-skills');

  nodes.forEach(node => {
    node.addEventListener('click', () => {
      const memberId = node.getAttribute('data-member');
      const data = memberDetails[memberId];

      if (!data) return;

      nodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');

      // Set dynamic colored variables on details panel
      detailsPanel.style.setProperty('--panel-glow-color', data.glowColor);
      detailsPanel.style.setProperty('--panel-glow-shadow', data.glowShadow);

      panelName.textContent = data.name;
      panelRole.textContent = data.role;
      
      panelList.innerHTML = '';
      data.responsibilities.forEach(resp => {
        const li = document.createElement('li');
        li.style.marginBottom = '0.5rem';
        li.style.fontSize = '0.9rem';
        li.innerHTML = `<span style="color:${data.glowColor}; margin-right:8px;">▪</span>${resp}`;
        panelList.appendChild(li);
      });

      panelSkills.innerHTML = '';
      data.skills.forEach(skill => {
        const span = document.createElement('span');
        span.className = 'skill-badge';
        span.textContent = skill;
        span.style.borderColor = data.glowColor;
        panelSkills.appendChild(span);
      });

      detailsPanel.classList.add('visible');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      detailsPanel.classList.remove('visible');
      nodes.forEach(n => n.classList.remove('active'));
    });
  }
}

/* ==========================================================================
   7. REVENUE PATH DOT HOVER EFFECT
   ========================================================================== */
function initRevenueChart() {
  const dots = document.querySelectorAll('.chart-dot');
  const chartValText = document.querySelector('.chart-val');
  const chartTitleText = document.querySelector('.chart-title');

  const milestoneData = [
    { year: 'Phase 1', desc: 'Startup Setup & Infrastructure Integration', valuation: '$150K Valuation' },
    { year: 'Phase 2', desc: 'Anime Studio & VFX Lab Setup', valuation: '$500K Valuation' },
    { year: 'Phase 3', desc: 'AI Innovation Hub & Game Dev Branch', valuation: '$1.5M Valuation' },
    { year: 'Phase 4', desc: 'Joint Venture Partnerships & Web3 Dev', valuation: '$3.5M Valuation' },
    { year: 'Phase 5', desc: 'Global Market Footprint Expansion', valuation: '$7.5M+ Valuation' }
  ];

  dots.forEach(dot => {
    dot.addEventListener('mouseenter', () => {
      const idx = parseInt(dot.getAttribute('data-index'));
      const data = milestoneData[idx];

      if (data) {
        chartValText.textContent = data.valuation;
        chartTitleText.textContent = `${data.year} : ${data.desc}`;
        chartValText.style.color = '#ffffff';
        chartValText.style.textShadow = '0 0 10px rgba(255,255,255,0.8)';
      }
    });

    dot.addEventListener('mouseleave', () => {
      chartValText.textContent = '$7.5M+ Goal';
      chartTitleText.textContent = 'Valuation Forecast';
      chartValText.style.color = 'var(--neon-amber)';
      chartValText.style.textShadow = '0 0 8px var(--neon-amber-glow)';
    });
  });
}

/* ==========================================================================
   8. TIMELINE SCROLL REVEAL (INTERSECTION OBSERVER)
   ========================================================================== */
function initTimelineReveal() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    timelineItems.forEach(item => observer.observe(item));
  } else {
    window.addEventListener('scroll', checkTimelineInView);
  }
}

function checkTimelineInView() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  const triggerBottom = window.innerHeight * 0.85;

  timelineItems.forEach(item => {
    const itemTop = item.getBoundingClientRect().top;
    if (itemTop < triggerBottom) {
      item.classList.add('revealed');
    }
  });
}

/* ==========================================================================
   9. DEPARTMENT grid FILTERING & SEARCH
   ========================================================================== */
const deptCategoryMapping = {
  'Technology & IT': 'tech',
  'Marketing': 'core',
  'Human Resources': 'core',
  'Operations': 'core',
  'Sales & Pricing': 'core',
  'Revenue & Business Growth': 'core',
  'Support & Administration': 'core',
  'Animation Studio': 'creative',
  'Anime Production': 'creative',
  'AI Research & Innovation': 'tech',
  'VFX Studio': 'creative',
  'Game Development': 'tech',
  'Film Production': 'creative',
  'Music & Sound Production': 'creative',
  'Branding & Marketing': 'core',
  'Architecture & Visualization': 'creative',
  'Website Development': 'tech',
  'Mobile App Development': 'tech'
};

function initDepartmentFilter() {
  const searchInput = document.querySelector('.dept-search-input');
  const filterBtns = document.querySelectorAll('.dept-filter-btn');
  const cards = document.querySelectorAll('.dept-card');

  let activeCategory = 'all';
  let searchQuery = '';

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      activeCategory = btn.getAttribute('data-filter');
      applyFilter();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyFilter();
    });
  }

  function applyFilter() {
    cards.forEach(card => {
      const deptTitle = card.querySelector('.dept-title').textContent;
      const deptCategory = deptCategoryMapping[deptTitle] || 'other';

      const matchesCategory = (activeCategory === 'all' || deptCategory === activeCategory);
      const matchesSearch = deptTitle.toLowerCase().includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        card.classList.remove('hidden');
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      } else {
        card.classList.add('hidden');
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
      }
    });
  }
}

/* ==========================================================================
   11. 3D ROTATING ORG CHART CAROUSEL (360-DEGREE SCROLL)
   ========================================================================== */
function initOrgCarousel() {
  const spinner = document.getElementById('org-carousel-spinner');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const viewport = document.querySelector('.org-carousel-viewport');
  
  if (!spinner) return;

  const nodes = spinner.querySelectorAll('.org-node');
  const nodeCount = nodes.length;
  const angleStep = 360 / nodeCount;
  let currAngle = 0;
  let currIndex = 0;

  // Set initial active card
  updateActiveCard();

  function rotateCarousel(direction) {
    if (direction === 'next') {
      currIndex++;
      currAngle -= angleStep;
    } else {
      currIndex--;
      currAngle += angleStep;
    }
    spinner.style.transform = `rotateY(${currAngle}deg)`;
    updateActiveCard();
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rotateCarousel('prev');
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rotateCarousel('next');
    });
  }

  function updateActiveCard() {
    nodes.forEach((node, idx) => {
      // Calculate normalized index
      const normalizedIndex = ((currIndex % nodeCount) + nodeCount) % nodeCount;
      if (idx === normalizedIndex) {
        node.classList.add('active-3d');
      } else {
        node.classList.remove('active-3d');
      }
    });
  }

  // Drag and Swipe support
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  const dragThreshold = 50; 

  if (viewport) {
    // Mouse Events
    viewport.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.pageX;
      currentX = startX;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      currentX = e.pageX;
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      const diff = currentX - startX;
      if (Math.abs(diff) > dragThreshold) {
        if (diff > 0) {
          rotateCarousel('prev');
        } else {
          rotateCarousel('next');
        }
      }
      startX = 0;
      currentX = 0;
    });

    // Touch Events
    viewport.addEventListener('touchstart', (e) => {
      isDragging = true;
      startX = e.touches[0].pageX;
      currentX = startX;
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].pageX;
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      const diff = currentX - startX;
      if (Math.abs(diff) > dragThreshold) {
        if (diff > 0) {
          rotateCarousel('prev');
        } else {
          rotateCarousel('next');
        }
      }
      startX = 0;
      currentX = 0;
    });
  }
}

/* ==========================================================================
   X. PORTAL AUTHENTICATION & SESSION MANAGEMENT
   ========================================================================== */
function initPortalAuth() {
  const loginBtn = document.getElementById('portal-login-btn');
  const overlay = document.getElementById('portal-modal-overlay');
  const closeBtn = document.getElementById('portal-modal-close');
  
  const userLoginInterface = document.getElementById('user-login-interface');
  const adminLoginInterface = document.getElementById('admin-login-interface');
  const adminDashboardInterface = document.getElementById('admin-dashboard-interface');

  // Vertical Sidebar and Window Elements
  const sidebar = document.getElementById('user-sidebar');
  const sidebarBackdrop = document.getElementById('user-sidebar-backdrop');
  const sidebarClose = document.getElementById('sidebar-close-btn');
  const sidebarLogout = document.getElementById('sidebar-logout-btn');

  // Admin Sidebar Elements
  const adminSidebar = document.getElementById('admin-sidebar');
  const adminSidebarBackdrop = document.getElementById('admin-sidebar-backdrop');
  const adminSidebarClose = document.getElementById('admin-sidebar-close-btn');
  const adminSidebarLogout = document.getElementById('admin-sidebar-logout-btn');
  const profileForm = document.getElementById('profile-settings-form');
  const dockBtns = document.querySelectorAll('.dock-btn');
  let highestZIndex = 1040;
  let pendingAvatarUrl = '';

  function updateSidebarAvatar() {
    const avatarElem = document.getElementById('sidebar-avatar-placeholder');
    const adminAvatarElem = document.getElementById('admin-sidebar-avatar-placeholder');

    if (avatarElem) {
      if (currentSession && currentSession.avatarUrl) {
        avatarElem.style.backgroundImage = `url(${currentSession.avatarUrl})`;
        avatarElem.style.backgroundSize = 'cover';
        avatarElem.style.backgroundPosition = 'center';
        avatarElem.innerText = '';
        avatarElem.style.boxShadow = '0 0 15px rgba(176, 38, 255, 0.5)';
      } else {
        avatarElem.style.backgroundImage = '';
        const firstLetter = (currentSession && currentSession.username ? currentSession.username : 'U').charAt(0).toUpperCase();
        avatarElem.innerText = firstLetter;
        avatarElem.style.boxShadow = '0 0 15px rgba(176, 38, 255, 0.3)';
      }
    }

    if (adminAvatarElem) {
      if (currentSession && currentSession.avatarUrl) {
        adminAvatarElem.style.backgroundImage = `url(${currentSession.avatarUrl})`;
        adminAvatarElem.style.backgroundSize = 'cover';
        adminAvatarElem.style.backgroundPosition = 'center';
        adminAvatarElem.innerText = '';
        adminAvatarElem.style.boxShadow = '0 0 15px rgba(176, 38, 255, 0.5)';
      } else {
        adminAvatarElem.style.backgroundImage = '';
        const firstLetter = (currentSession && currentSession.username ? currentSession.username : 'A').charAt(0).toUpperCase();
        adminAvatarElem.innerText = firstLetter;
        adminAvatarElem.style.boxShadow = '0 0 15px rgba(176, 38, 255, 0.3)';
      }
    }
  }

  function updateProfileAvatarPreview() {
    const previewElem = document.getElementById('profile-avatar-preview');
    if (!previewElem) return;
    if (pendingAvatarUrl) {
      previewElem.style.backgroundImage = `url(${pendingAvatarUrl})`;
      previewElem.style.backgroundSize = 'cover';
      previewElem.style.backgroundPosition = 'center';
      previewElem.innerText = '';
    } else {
      previewElem.style.backgroundImage = '';
      const firstLetter = (currentSession && currentSession.username ? currentSession.username : 'U').charAt(0).toUpperCase();
      previewElem.innerText = firstLetter;
    }
  }
  
  if (!loginBtn || !overlay || !sidebar) return;

  // Bind catalog booking buttons
  document.querySelectorAll('.catalog-pay-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const serviceId = btn.getAttribute('data-service-id');
      const serviceName = btn.getAttribute('data-service-name');
      const totalCost = parseFloat(btn.getAttribute('data-price'));
      const payAmount = parseFloat(btn.getAttribute('data-advance'));
      
      initiateRazorpayPayment({
        type: 'booking',
        serviceId: serviceId,
        serviceName: serviceName,
        totalCost: totalCost,
        payAmount: payAmount
      });
    });
  });

  // Initialize Session
  let currentSession = JSON.parse(localStorage.getItem('gravity-user-session')) || null;
  updateAuthUI();
  if (currentSession) {
    const usernameElem = document.getElementById('sidebar-username');
    if (usernameElem) usernameElem.innerText = currentSession.username || 'User';
    updateSidebarAvatar();
  }

  // Sync session with Supabase if active
  if (supabaseClient) {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (!currentSession || currentSession.uid !== session.user.id) {
          supabaseClient.from('profiles').select('username, avatar_url').eq('id', session.user.id).single().then(({ data: profile }) => {
            let sessionObj = {
              role: 'user',
              username: profile ? profile.username : session.user.email.split('@')[0],
              email: session.user.email,
              uid: session.user.id,
              avatarUrl: profile ? profile.avatar_url : '',
              phone: (currentSession && currentSession.uid === session.user.id) ? (currentSession.phone || '') : '',
              country: (currentSession && currentSession.uid === session.user.id) ? (currentSession.country || '') : ''
            };

            if (ADMIN_ROLE_DETAILS[sessionObj.uid]) {
              const details = ADMIN_ROLE_DETAILS[sessionObj.uid];
              sessionObj.role = 'admin';
              sessionObj.username = details.username;
            }

            currentSession = sessionObj;
            localStorage.setItem('gravity-user-session', JSON.stringify(currentSession));
            updateAuthUI();
            
            const usernameElem = document.getElementById('sidebar-username');
            if (usernameElem) usernameElem.innerText = currentSession.username;
            updateSidebarAvatar();
          });
        }
      }
    });
  }

  // URL Hash Trigger for Admin Modal
  function checkHashRoute() {
    if (window.location.hash === '#admin') {
      openPortal('admin-login');
      window.location.hash = ''; // Clear hash
    }
  }
  checkHashRoute();
  window.addEventListener('hashchange', checkHashRoute);

  // Secret Footer Trigger (Removed double click to keep admin portal hidden)
  const footerLogo = document.querySelector('.footer-logo img');
  if (footerLogo) {
    footerLogo.style.cursor = 'default';
  }

  // Header Login Button Click detection (Single/Double click = User Portal, Triple click = Secret Admin Login)
  let headerClickCount = 0;
  let headerClickTimer = null;

  loginBtn.addEventListener('click', (e) => {
    headerClickCount++;
    
    if (headerClickTimer) {
      clearTimeout(headerClickTimer);
    }

    headerClickTimer = setTimeout(() => {
      if (headerClickCount >= 3) {
        // Triple click: Open the secret Admin login portal
        openPortal('admin-login');
      } else {
        // Single/Double click: Normal user login or workspace toggle
        if (!currentSession) {
          openPortal('user-login');
        } else {
          toggleSidebar();
        }
      }
      headerClickCount = 0;
    }, 350); // 350ms click interval detection
  });

  closeBtn.addEventListener('click', closePortal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePortal();
  });

  // Sidebar Open/Close/Toggle Handlers
  function toggleSidebar() {
    const isCtrlOpen = (currentSession && currentSession.role === 'admin') 
      ? adminSidebar.classList.contains('open')
      : sidebar.classList.contains('open');

    if (isCtrlOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function openSidebar() {
    closePortal(); // Ensure modal is closed
    const isAdmin = currentSession && currentSession.role === 'admin';
    const targetSidebar = isAdmin ? adminSidebar : sidebar;
    const targetBackdrop = isAdmin ? adminSidebarBackdrop : sidebarBackdrop;

    targetSidebar.style.display = 'flex';
    targetSidebar.offsetHeight; // Trigger reflow
    targetSidebar.classList.add('open');
    if (targetBackdrop) {
      targetBackdrop.classList.add('open');
    }

    if (isAdmin) {
      // Admin sidebar updates
      initAdminEvents();
      const dept = getDepartmentForEmail(currentSession.email);
      const isSuper = (dept === 'all');
      
      // Update admin details in sidebar
      const adminUsernameElem = document.getElementById('admin-sidebar-username');
      if (adminUsernameElem) {
        adminUsernameElem.innerText = currentSession.username || 'System Admin';
      }

      // Dynamic badge-tier update for admins
      const adminBadgeElem = document.querySelector('#admin-sidebar .badge-tier');
      if (adminBadgeElem) {
        const uid = currentSession.uid;
        if (ADMIN_ROLE_DETAILS[uid]) {
          adminBadgeElem.innerText = ADMIN_ROLE_DETAILS[uid].title;
        } else {
          adminBadgeElem.innerText = 'System Operator';
        }
      }
      
      // Show/hide Founder/CEO only menu buttons
      document.querySelectorAll('#admin-sidebar .super-admin-only').forEach(elem => {
        elem.style.display = isSuper ? 'flex' : 'none';
      });
    } else {
      // Standard client sidebar updates
      if (currentSession) {
        document.getElementById('profile-username').value = currentSession.username || 'User';
        document.getElementById('profile-phone').value = currentSession.phone || '';
        document.getElementById('profile-email').value = currentSession.email || '';
        document.getElementById('sidebar-username').innerText = currentSession.username || 'User';
        
        // Load avatar info
        pendingAvatarUrl = currentSession.avatarUrl || '';
        const avatarUrlInput = document.getElementById('profile-avatar-url');
        if (avatarUrlInput) avatarUrlInput.value = pendingAvatarUrl;
        const avatarFileInput = document.getElementById('profile-avatar-file');
        if (avatarFileInput) avatarFileInput.value = '';
        
        updateProfileAvatarPreview();
        updateSidebarAvatar();
      }
      
      // Trigger rendering of dynamic views for user
      renderNotifications();
      renderPayments();
      renderPurchasedServices();
      renderServiceTracking();
    }
    
    // Trigger Lucide SVG rendering inside Sidebar
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.remove('open');
    }
    adminSidebar.classList.remove('open');
    if (adminSidebarBackdrop) {
      adminSidebarBackdrop.classList.remove('open');
    }
    
    // Close all open floating windows as well
    closeAllWindows();
    
    setTimeout(() => {
      if (!sidebar.classList.contains('open')) {
        sidebar.style.display = 'none';
      }
      if (!adminSidebar.classList.contains('open')) {
        adminSidebar.style.display = 'none';
      }
    }, 400);
  }

  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }
  if (adminSidebarClose) {
    adminSidebarClose.addEventListener('click', closeSidebar);
  }
  if (adminSidebarBackdrop) {
    adminSidebarBackdrop.addEventListener('click', closeSidebar);
  }
  if (sidebarLogout) {
    sidebarLogout.addEventListener('click', () => {
      closeSidebar();
      performLogout();
    });
  }
  if (adminSidebarLogout) {
    adminSidebarLogout.addEventListener('click', () => {
      closeSidebar();
      performLogout();
    });
  }

  // Bind sidebar dock buttons to toggle windows
  if (dockBtns) {
    dockBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const windowId = btn.getAttribute('data-window');
        toggleWindow(windowId, btn);
      });
    });
  }

  // Bind close buttons for dashboard windows
  const windowCloseBtns = document.querySelectorAll('.window-close-btn');
  windowCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const windowId = btn.getAttribute('data-close');
      const dockBtn = document.querySelector(`.dock-btn[data-window="${windowId}"]`);
      closeWindow(windowId, dockBtn);
    });
  });

  // Profile Avatar Interactive Handlers
  const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
  const removeAvatarBtn = document.getElementById('remove-avatar-btn');
  const avatarFileInput = document.getElementById('profile-avatar-file');
  const avatarUrlInput = document.getElementById('profile-avatar-url');

  if (uploadAvatarBtn && avatarFileInput) {
    uploadAvatarBtn.addEventListener('click', () => {
      avatarFileInput.click();
    });
  }

  if (avatarFileInput) {
    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert("Image size should be less than 2MB.");
          avatarFileInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          pendingAvatarUrl = event.target.result;
          if (avatarUrlInput) avatarUrlInput.value = ''; // Clear URL input when file is uploaded
          updateProfileAvatarPreview();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (avatarUrlInput) {
    avatarUrlInput.addEventListener('input', (e) => {
      pendingAvatarUrl = e.target.value.trim();
      updateProfileAvatarPreview();
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', () => {
      pendingAvatarUrl = '';
      if (avatarUrlInput) avatarUrlInput.value = '';
      if (avatarFileInput) avatarFileInput.value = '';
      updateProfileAvatarPreview();
    });
  }

  // Profile Form Edit Handler
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedUsername = document.getElementById('profile-username').value.trim();
    const updatedPhone = document.getElementById('profile-phone').value.trim();
    
    // Auto-detect country based on manual country code prefix in phone number
    const normalizedPhone = updatedPhone.replace(/\s+/g, '');
    let updatedCountry = 'Other';
    if (normalizedPhone.startsWith('+91') || normalizedPhone.startsWith('91')) {
      updatedCountry = 'India';
    }
    if (updatedUsername.length < 3) {
      alert("Username must be at least 3 characters long.");
      return;
    }

    // Update Supabase profiles table if active
    if (supabaseClient && currentSession && currentSession.uid && !currentSession.uid.startsWith('local_')) {
      try {
        // Try updating username and avatar_url
        const { error } = await supabaseClient
          .from('profiles')
          .update({ 
            username: updatedUsername,
            avatar_url: pendingAvatarUrl
          })
          .eq('id', currentSession.uid);
          
        if (error) {
          // If error occurs, fallback to only updating username (e.g. if avatar_url doesn't exist)
          console.warn("Avatar sync failed, trying username only update", error.message);
          await supabaseClient
            .from('profiles')
            .update({ 
              username: updatedUsername
            })
            .eq('id', currentSession.uid);
        }
      } catch (err) {
        console.warn("Failed to sync profile settings to Supabase", err);
      }
    }

    currentSession.username = updatedUsername;
    currentSession.phone = updatedPhone;
    currentSession.country = updatedCountry;
    currentSession.avatarUrl = pendingAvatarUrl;
    localStorage.setItem('gravity-user-session', JSON.stringify(currentSession));
    
    // Update local registrations list if user registered locally
    const users = JSON.parse(localStorage.getItem('gravity-registered-users')) || [];
    const userIndex = users.findIndex(u => u.email === currentSession.email);
    if (userIndex !== -1) {
      users[userIndex].username = updatedUsername;
      users[userIndex].phone = updatedPhone;
      users[userIndex].country = updatedCountry;
      users[userIndex].avatarUrl = pendingAvatarUrl;
      localStorage.setItem('gravity-registered-users', JSON.stringify(users));
    }

    // Update UI elements
    document.getElementById('sidebar-username').innerText = updatedUsername;
    updateSidebarAvatar();
    updateAuthUI();
    renderPayments(); // Re-render payment catalog with country pricing
    
    alert("Profile settings updated successfully.");
  });

  /* ==========================================================================
     ECOSYSTEM DATABASE & DYNAMIC STATE RENDER ENGINE
     ========================================================================== */

  // Seed default notifications if empty
  const defaultNotifications = [
    { id: 1, title: 'Welcome to Gravity Studio Workspace', desc: 'Book creative technology services, pay advances securely via Razorpay, track rendering milestones in real-time, and manage invoices directly in your portal.', time: '1h ago', read: false }
  ];

  if (!localStorage.getItem('gravity-system-notifications')) {
    localStorage.setItem('gravity-system-notifications', JSON.stringify(defaultNotifications));
  }

  // Render Notifications
  async function renderNotifications() {
    const container = document.getElementById('notifications-list-container');
    if (!container) return;

    let notifs = [];
    if (supabaseClient && currentSession) {
      const { data, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const filtered = data.filter(n => !n.user_id || n.user_id === currentSession.uid);
        notifs = filtered.map(n => ({
          id: n.id,
          title: n.title,
          desc: n.desc_text,
          time: n.time_label,
          read: n.is_read
        }));
      } else {
        notifs = JSON.parse(localStorage.getItem('gravity-system-notifications')) || [];
        notifs = notifs.filter(n => !n.userId || n.userId === currentSession.uid);
      }
    } else {
      notifs = JSON.parse(localStorage.getItem('gravity-system-notifications')) || [];
      if (currentSession) {
        notifs = notifs.filter(n => !n.userId || n.userId === currentSession.uid);
      }
    }

    container.innerHTML = '';

    if (notifs.length === 0) {
      container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 2rem 0;">No notifications received yet.</p>`;
      const badge = document.getElementById('sidebar-notif-count');
      if (badge) badge.style.display = 'none';
      return;
    }

    // Show count of unread
    const unreadCount = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('sidebar-notif-count');
    if (badge) {
      if (unreadCount > 0) {
        badge.innerText = unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    notifs.forEach(notif => {
      const div = document.createElement('div');
      div.className = `notif-item ${notif.read ? '' : 'unread'}`;
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
          <div style="flex:1;">
            <div class="notif-title" style="font-weight:700; color:var(--text-pure);">${notif.title}</div>
            <div class="notif-desc" style="font-size:0.85rem; color:var(--text-muted); margin:0.25rem 0;">${notif.desc}</div>
            <div class="notif-time" style="font-size:0.75rem; color:var(--neon-cyan);">${notif.time}</div>
          </div>
          <button class="notif-share-btn" title="Share Notification" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; padding:0.25rem; border-radius:4px; display:flex; align-items:center; justify-content:center; transition: all 0.2s; margin-top: -2px;">
            <i data-lucide="share-2" style="width:14px; height:14px;"></i>
          </button>
        </div>
      `;

      // Mark as read when clicked or viewed
      div.addEventListener('click', async () => {
        if (!notif.read) {
          notif.read = true;
          if (supabaseClient) {
            await supabaseClient
              .from('notifications')
              .update({ is_read: true })
              .eq('id', notif.id);
          } else {
            localStorage.setItem('gravity-system-notifications', JSON.stringify(notifs));
          }
          await renderNotifications();
        }
      });

      // Share button click handler
      const shareBtn = div.querySelector('.notif-share-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Avoid triggering mark-as-read click event
          const shareText = `Gravity Update: ${notif.title}\n\n${notif.desc}`;
          if (navigator.share) {
            navigator.share({
              title: notif.title,
              text: notif.desc,
            }).catch(err => console.warn("Share failed:", err));
          } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
              alert("Notification copied to clipboard!");
            }).catch(() => {
              alert("Failed to copy notification.");
            });
          }
        });
      }

      container.appendChild(div);
    });
  }

  // Render Payments & Billing Tab
  async function renderPayments() {
    const container = document.getElementById('invoices-list-container');
    if (!container) return;

    // Render the dynamic catalog first
    const catalogGrid = document.querySelector('.service-catalog-grid');
    if (catalogGrid) {
      const prices = getServicePrices();
      catalogGrid.innerHTML = '';
      const isIndian = currentSession && (currentSession.country === 'India' || (currentSession.phone && currentSession.phone.startsWith('+91')));
      const symbol = isIndian ? '₹' : '$';
      
      prices.forEach(s => {
        const totalMin = isIndian ? s.priceINR : s.priceUSD;
        const totalMax = isIndian ? (s.priceMaxINR || totalMin) : (s.priceMaxUSD || totalMin);
        const hasRange = totalMax > totalMin;
        const range = isIndian ? (s.rangeINR || `${symbol}${totalMin.toLocaleString()}`) : (s.rangeUSD || `${symbol}${totalMin.toLocaleString()}`);
        
        const card = document.createElement('div');
        card.className = 'catalog-card';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.padding = '0.75rem 1rem';
        card.style.background = 'rgba(255,255,255,0.02)';
        card.style.border = '1px solid var(--glass-border)';
        card.style.borderRadius = '8px';
        
        let selectHtml = '';
        if (hasRange) {
          selectHtml = `
            <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
              <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold;">Quality Tier:</label>
              <select class="tier-select" data-id="${s.id}" style="background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); color: #fff; font-size: 0.75rem; padding: 0.2rem 0.4rem; border-radius: 4px; outline: none; font-family: inherit; cursor: pointer;">
                <option value="min">Standard Tier (Min - ${symbol}${totalMin.toLocaleString()})</option>
                <option value="max">Premium Tier (Max - ${symbol}${totalMax.toLocaleString()})</option>
              </select>
            </div>
          `;
        }
        
        card.innerHTML = `
          <div style="flex: 1;">
            <h6 style="margin: 0; font-size: 0.95rem; color: var(--text-pure);">${s.name}</h6>
            <span class="price-desc" style="font-size: 0.8rem; color: var(--text-muted);">Est. Range: ${range} <br><span class="advance-label" style="opacity:0.6;">(50% Booking Advance: ${symbol}${(totalMin / 2).toLocaleString()})</span></span>
            ${selectHtml}
          </div>
          <button class="catalog-pay-btn" data-service-id="${s.id}" data-service-name="${s.name}" data-price="${totalMin}" data-advance="${totalMin / 2}" data-tier="Standard Tier" style="padding: 0.5rem 0.75rem; background: rgba(176, 38, 255, 0.15); border: 1px solid var(--neon-purple); border-radius: 6px; color: var(--neon-purple); font-weight: 600; font-family: inherit; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; margin-left: 0.5rem;">Book for ${symbol}${(totalMin / 2).toLocaleString()}</button>
        `;
        catalogGrid.appendChild(card);
      });

      // Bind tier selection changes
      catalogGrid.querySelectorAll('.tier-select').forEach(select => {
        select.addEventListener('change', (e) => {
          const serviceId = select.getAttribute('data-id');
          const value = e.target.value;
          const card = select.closest('.catalog-card');
          const button = card.querySelector('.catalog-pay-btn');
          const serviceObj = prices.find(p => p.id === serviceId);
          
          if (serviceObj && button) {
            const isIndian = currentSession && (currentSession.country === 'India' || (currentSession.phone && currentSession.phone.startsWith('+91')));
            const symbol = isIndian ? '₹' : '$';
            
            const selectedTotal = value === 'max' 
              ? (isIndian ? serviceObj.priceMaxINR : serviceObj.priceMaxUSD)
              : (isIndian ? serviceObj.priceINR : serviceObj.priceUSD);
            
            const selectedAdvance = selectedTotal / 2;
            const selectedTier = value === 'max' ? 'Premium Tier' : 'Standard Tier';
            
            // Update button attributes
            button.setAttribute('data-price', selectedTotal);
            button.setAttribute('data-advance', selectedAdvance);
            button.setAttribute('data-tier', selectedTier);
            
            // Update button label
            button.innerText = `Book for ${symbol}${selectedAdvance.toLocaleString()}`;
            
            // Update advance label text
            const advanceLabel = card.querySelector('.advance-label');
            if (advanceLabel) {
              advanceLabel.innerText = `(50% Booking Advance: ${symbol}${selectedAdvance.toLocaleString()})`;
            }
          }
        });
      });

      // Bind dynamic click triggers for catalog booking buttons
      catalogGrid.querySelectorAll('.catalog-pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const serviceId = btn.getAttribute('data-service-id');
          let serviceName = btn.getAttribute('data-service-name');
          const tier = btn.getAttribute('data-tier') || '';
          if (tier && tier !== '') {
            serviceName = `${serviceName} (${tier})`;
          }
          const totalCost = parseFloat(btn.getAttribute('data-price'));
          const payAmount = parseFloat(btn.getAttribute('data-advance'));
          
          initiateRazorpayPayment({
            type: 'booking',
            serviceId: serviceId,
            serviceName: serviceName,
            totalCost: totalCost,
            payAmount: payAmount
          });
        });
      });
    }

    let purchases = [];
    if (supabaseClient && currentSession && currentSession.uid && !currentSession.uid.startsWith('local_')) {
      const { data, error } = await supabaseClient
        .from('purchases')
        .select('*')
        .eq('user_id', currentSession.uid)
        .order('created_at', { ascending: false });

      if (!error && data) {
        purchases = data.map(p => ({
          id: p.id,
          serviceId: p.service_id,
          serviceName: p.service_name,
          totalCost: parseFloat(p.total_cost),
          paidAmount: parseFloat(p.paid_amount),
          currency: p.currency || (parseFloat(p.total_cost) > 500 ? 'INR' : 'USD'),
          status: p.status,
          date: p.date,
          deliveryDeadline: p.delivery_deadline,
          postponed: p.postponed
        }));
      } else {
        purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
      }
    } else {
      purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
    }

    purchases.forEach(p => {
      if (!p.deliveryDeadline) {
        const purchaseTime = new Date(p.date || Date.now()).getTime();
        p.deliveryDeadline = new Date(purchaseTime + 24 * 60 * 60 * 1000).toISOString();
        p.postponed = false;
      }
      checkAndApplyPostponement(p);
    });

    container.innerHTML = '';

    if (purchases.length === 0) {
      container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 1.5rem 0; font-size: 0.9rem;">No transactions recorded. Book a service above to generate your first invoice.</p>`;
      return;
    }

    const table = document.createElement('table');
    table.className = 'billing-table';
    table.style.width = '100%';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Service Item</th>
          <th>Total Cost</th>
          <th>Amount Paid</th>
          <th>Remaining</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="invoices-table-body"></tbody>
    `;
    container.appendChild(table);

    const tbody = document.getElementById('invoices-table-body');
    purchases.forEach(p => {
      const tr = document.createElement('tr');
      
      let statusClass = 'status-paid';
      let statusText = 'Fully Paid';
      let actionHtml = '';
      const viewReceiptBtnHtml = `<button class="invoice-action-btn view-bill-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:4px; color:#fff; font-size:0.75rem; font-weight:bold; cursor:pointer; margin-left:0.35rem;">Receipt</button>`;

      if (p.status === 'advance_paid') {
        statusClass = 'status-pending';
        statusText = 'Advance (50%)';
        actionHtml = `<button class="invoice-action-btn pay-final-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; background:rgba(0, 240, 255, 0.15); border:1px solid var(--neon-cyan); border-radius:4px; color:var(--neon-cyan); font-size:0.75rem; font-weight:bold; cursor:pointer;">Pay Final 50%</button>${viewReceiptBtnHtml}`;
      } else if (p.status === 'completed') {
        statusClass = 'status-pending';
        statusText = 'Awaiting Final';
        actionHtml = `
          <div style="display:flex; gap:0.35rem; align-items:center;">
            <button class="invoice-action-btn pay-final-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; background:rgba(0, 240, 255, 0.15); border:1px solid var(--neon-cyan); border-radius:4px; color:var(--neon-cyan); font-size:0.75rem; font-weight:bold; cursor:pointer;">Pay Final 50%</button>
            <button class="invoice-action-btn dispute-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; background:rgba(255, 51, 102, 0.15); border:1px solid #ff3366; border-radius:4px; color:#ff3366; font-size:0.75rem; font-weight:bold; cursor:pointer;">File Dispute</button>
            ${viewReceiptBtnHtml}
          </div>
        `;
      } else if (p.status === 'refund_requested') {
        statusClass = 'status-pending';
        statusText = 'Disputed';
        actionHtml = `<span style="font-size:0.75rem; color:var(--neon-amber);">Reviewing Proof</span>${viewReceiptBtnHtml}`;
      } else if (p.status === 'refund_approved') {
        statusClass = 'status-refunded';
        statusText = 'Refunded (100%)';
        actionHtml = `<span style="font-size:0.75rem; color:#ff3366;">Funds Returned</span>${viewReceiptBtnHtml}`;
      } else if (p.status === 'refund_denied') {
        statusClass = 'status-pending';
        statusText = 'Dispute Denied';
        actionHtml = `<button class="invoice-action-btn pay-final-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; background:rgba(0, 240, 255, 0.15); border:1px solid var(--neon-cyan); border-radius:4px; color:var(--neon-cyan); font-size:0.75rem; font-weight:bold; cursor:pointer;">Pay Final 50%</button>${viewReceiptBtnHtml}`;
      } else {
        actionHtml = viewReceiptBtnHtml;
      }

      const remainingAmount = p.totalCost - p.paidAmount;
      const symbol = p.currency === 'INR' ? '₹' : '$';
      tr.innerHTML = `
        <td style="font-size:0.8rem;">${p.date}</td>
        <td>
          <div style="font-weight:bold; font-size:0.85rem; color:#fff;">${p.serviceName}</div>
        </td>
        <td style="font-size:0.85rem; color:#fff;">${symbol}${p.totalCost.toLocaleString()}</td>
        <td style="font-size:0.85rem; font-weight:bold; color:var(--neon-cyan);">${symbol}${p.paidAmount.toLocaleString()}</td>
        <td style="font-size:0.85rem; font-weight:bold; color:${remainingAmount > 0 ? 'var(--neon-amber)' : '#39ff14'};">${symbol}${remainingAmount.toLocaleString()}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
        <td>${actionHtml}</td>
      `;
      tbody.appendChild(tr);
    });

    // Attach listeners to dynamic buttons
    document.querySelectorAll('.pay-final-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const purchaseId = btn.getAttribute('data-id');
        const item = purchases.find(p => p.id === purchaseId);
        if (item) {
          const remainingAmount = item.totalCost - item.paidAmount;
          initiateRazorpayPayment({
            type: 'final',
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            totalCost: item.totalCost,
            payAmount: remainingAmount,
            purchaseId: item.id
          });
        }
      });
    });

    // Attach view receipt listeners
    document.querySelectorAll('.view-bill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const purchaseId = btn.getAttribute('data-id');
        const item = purchases.find(p => p.id === purchaseId);
        if (item) {
          showInvoiceBill(item);
        }
      });
    });

    document.querySelectorAll('.dispute-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const purchaseId = btn.getAttribute('data-id');
        showRefundPanel(purchaseId);
      });
    });
  }

  // Render Purchased Services History Tab
  async function renderPurchasedServices() {
    const container = document.getElementById('purchased-services-list-container');
    if (!container) return;

    let purchases = [];
    if (supabaseClient && currentSession && currentSession.uid && !currentSession.uid.startsWith('local_')) {
      const { data, error } = await supabaseClient
        .from('purchases')
        .select('*')
        .eq('user_id', currentSession.uid)
        .order('created_at', { ascending: false });

      if (!error && data) {
        purchases = data.map(p => ({
          id: p.id,
          serviceId: p.service_id,
          serviceName: p.service_name,
          totalCost: parseFloat(p.total_cost),
          paidAmount: parseFloat(p.paid_amount),
          status: p.status,
          date: p.date
        }));
      } else {
        purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
      }
    } else {
      purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
    }

    container.innerHTML = '';

    if (purchases.length === 0) {
      container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 2rem 0; font-size: 0.9rem;">No purchased services found. Complete an advance payment in the Billing tab to start.</p>`;
      return;
    }

    purchases.forEach(p => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'service-item';
      
      let iconName = 'clapperboard';
      if (p.serviceId === 'youtube_intro') iconName = 'tv';
      if (p.serviceId === 'anime_design') iconName = 'smile';

      let statusText = 'Active';
      if (p.status === 'fully_paid') statusText = 'Completed & Delivered';
      if (p.status === 'refund_requested') statusText = 'Dispute Pending';
      if (p.status === 'refund_approved') statusText = 'Refunded';

      itemDiv.innerHTML = `
        <div class="service-icon"><i data-lucide="${iconName}"></i></div>
        <div class="service-info" style="flex:1;">
          <h5 style="margin:0; font-size:0.95rem; color:#fff;">${p.serviceName}</h5>
          <p style="margin:0.15rem 0 0; font-size:0.8rem; color:var(--text-muted);">Purchased: ${p.date} • Paid: $${p.paidAmount.toFixed(2)}/$${p.totalCost.toFixed(2)}</p>
        </div>
        <span class="service-status" style="background:rgba(0, 240, 255, 0.1); border-color:var(--neon-cyan); color:var(--neon-cyan);">${statusText}</span>
      `;
      container.appendChild(itemDiv);
    });
    if (window.lucide) lucide.createIcons();
  }

  // Render Active Service Tracking Tab
  async function renderServiceTracking() {
    const container = document.getElementById('service-tracking-list-container');
    if (!container) return;

    let purchases = [];
    if (supabaseClient && currentSession && currentSession.uid && !currentSession.uid.startsWith('local_')) {
      const { data, error } = await supabaseClient
        .from('purchases')
        .select('*')
        .eq('user_id', currentSession.uid)
        .order('created_at', { ascending: false });

      if (!error && data) {
        purchases = data.map(p => ({
          id: p.id,
          serviceId: p.service_id,
          serviceName: p.service_name,
          totalCost: parseFloat(p.total_cost),
          paidAmount: parseFloat(p.paid_amount),
          status: p.status,
          date: p.date,
          deliveryDeadline: p.delivery_deadline,
          postponed: p.postponed
        }));
      } else {
        purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
      }
    } else {
      purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
    }

    container.innerHTML = '';

    // Filter active (non-refunded) services
    const activeTrackings = purchases.filter(p => p.status !== 'refund_approved');

    if (activeTrackings.length === 0) {
      container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 2rem 0; font-size: 0.9rem;">No active services currently in development.</p>`;
      return;
    }

    activeTrackings.forEach(p => {
      if (!p.deliveryDeadline) {
        const purchaseTime = new Date(p.date || Date.now()).getTime();
        p.deliveryDeadline = new Date(purchaseTime + 24 * 60 * 60 * 1000).toISOString();
        p.postponed = false;
      }
      checkAndApplyPostponement(p);

      const div = document.createElement('div');
      div.className = 'tracking-item';
      div.style.marginBottom = '1.5rem';
      div.style.background = 'rgba(255,255,255,0.01)';
      div.style.border = '1px solid var(--glass-border)';
      div.style.padding = '1.25rem';
      div.style.borderRadius = '12px';

      let statusMsg = '';
      let percent = 0;
      let simulateBtnHtml = '';
      let finalPayBtnHtml = '';

      // Set up progress steps list
      const steps = [
        { key: 'progress_planning', label: 'Planning' },
        { key: 'progress_modeling', label: 'Modeling' },
        { key: 'progress_developing', label: 'Developing' },
        { key: 'progress_preprocessing', label: 'Preprocessing' },
        { key: 'progress_testing', label: 'Testing' },
        { key: 'progress_ready_to_produce', label: 'Ready to Produce' }
      ];

      let currentStepIndex = 0;
      if (p.status === 'advance_paid' || p.status === 'progress_planning') {
        currentStepIndex = 0;
        statusMsg = `Planning Phase active. Designing blueprints and layout drafts for your ${p.serviceName.toLowerCase()}.`;
      } else if (p.status === 'progress_modeling') {
        currentStepIndex = 1;
        statusMsg = `Modeling Phase active. Building wireframes, design drafts, and 3D mockup assets.`;
      } else if (p.status === 'progress_developing') {
        currentStepIndex = 2;
        statusMsg = `Development Phase active. Coding system logic, styling user interface, and structuring assets.`;
      } else if (p.status === 'progress_preprocessing') {
        currentStepIndex = 3;
        statusMsg = `Preprocessing Phase active. Compiling assets, database configurations, and optimization algorithms.`;
      } else if (p.status === 'progress_testing') {
        currentStepIndex = 4;
        statusMsg = `Testing & Quality Assurance active. Performing security audits, stress checks, and bug sweeps.`;
      } else if (p.status === 'completed') {
        currentStepIndex = 5;
        statusMsg = p.postponed 
          ? `Production completed! Waiting for final payment. Delivery postponed by 24 hours because the final 50% payment was not received 12 hours prior to the original deadline.`
          : `Production completed! Awaiting remaining 50% final payment to release source files. Note: Payment must be made at least 12 hours before the deadline: ${new Date(p.deliveryDeadline).toLocaleString()}.`;
        finalPayBtnHtml = `
          <div style="margin-top:1rem; display:flex; gap:0.5rem; align-items:center;">
            <button class="invoice-action-btn pay-final-btn" data-id="${p.id}" style="padding:0.4rem 0.75rem; background:rgba(0, 240, 255, 0.15); border:1px solid var(--neon-cyan); border-radius:6px; color:var(--neon-cyan); font-weight:bold; font-size:0.8rem; cursor:pointer;">Pay Remaining 50% ($${(p.totalCost - p.paidAmount).toFixed(2)})</button>
            <button class="invoice-action-btn dispute-btn" data-id="${p.id}" style="padding:0.4rem 0.75rem; background:rgba(255, 51, 102, 0.15); border:1px solid #ff3366; border-radius:6px; color:#ff3366; font-weight:bold; font-size:0.8rem; cursor:pointer;">Dispute & Refund</button>
            <button class="invoice-action-btn view-bill-btn" data-id="${p.id}" style="padding:0.4rem 0.75rem; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:6px; color:#fff; font-weight:bold; font-size:0.8rem; cursor:pointer;">View Receipt</button>
          </div>
        `;
      } else if (p.status === 'refund_requested') {
        currentStepIndex = 5;
        statusMsg = `Dispute Filed. Under review by Gravity administration. Files held in escrow.`;
      } else if (p.status === 'refund_denied') {
        currentStepIndex = 5;
        statusMsg = p.postponed 
          ? `Refund Dispute Denied. Waiting for final payment. Delivery postponed by 24 hours because the final 50% payment was not received 12 hours prior to the original deadline.`
          : `Refund Dispute Denied by administration. Awaiting remaining 50% final payment to release source files. Note: Payment must be made at least 12 hours before the deadline: ${new Date(p.deliveryDeadline).toLocaleString()}.`;
        finalPayBtnHtml = `
          <div style="margin-top:1rem; display:flex; gap:0.5rem; align-items:center;">
            <button class="invoice-action-btn pay-final-btn" data-id="${p.id}" style="padding:0.4rem 0.75rem; background:rgba(0, 240, 255, 0.15); border:1px solid var(--neon-cyan); border-radius:6px; color:var(--neon-cyan); font-weight:bold; font-size:0.8rem; cursor:pointer;">Pay Remaining 50% ($${(p.totalCost - p.paidAmount).toFixed(2)})</button>
            <button class="invoice-action-btn view-bill-btn" data-id="${p.id}" style="padding:0.4rem 0.75rem; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:6px; color:#fff; font-weight:bold; font-size:0.8rem; cursor:pointer;">View Receipt</button>
          </div>
        `;
      } else if (p.status === 'fully_paid') {
        currentStepIndex = 6; // All complete
        statusMsg = `Delivered! Source files and production assets are ready for download.`;
        finalPayBtnHtml = `
          <div style="margin-top:1rem; display:flex; gap:0.5rem; align-items:center;">
            <button class="admin-action-btn download-assets-btn" style="background:rgba(57, 255, 20, 0.15); border:1px solid var(--neon-green); border-radius:6px; color:var(--neon-green); font-size:0.8rem; padding:0.5rem 1rem; cursor:pointer; font-weight:bold;" onclick="alert('Downloading standard zip package containing your compiled assets...')">
              <i data-lucide="download" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i> Download Production Package
            </button>
            <button class="invoice-action-btn view-bill-btn" data-id="${p.id}" style="padding:0.5rem 1rem; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:6px; color:#fff; font-weight:bold; font-size:0.8rem; cursor:pointer;">View Receipt</button>
          </div>
        `;
      }

      // Calculate fill bar percentage (e.g. from 0% to 100%)
      percent = p.status === 'fully_paid' ? 100 : Math.round((currentStepIndex / 5) * 100);

      // Generate stepper HTML
      let stepperNodesHtml = '';
      steps.forEach((step, idx) => {
        let nodeClass = '';
        if (p.status === 'fully_paid') {
          nodeClass = 'completed';
        } else if (idx < currentStepIndex) {
          nodeClass = 'completed';
        } else if (idx === currentStepIndex) {
          nodeClass = 'active';
        }

        stepperNodesHtml += `
          <li class="progress-step-node ${nodeClass}">
            <div class="step-dot">${idx + 1}</div>
            <div class="step-label">${step.label}</div>
          </li>
        `;
      });

      div.innerHTML = `
        <div class="tracking-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <h5 style="margin:0; font-size:1rem; color:#fff;">${p.serviceName}</h5>
          <span class="tracking-percent" style="font-size:0.9rem; font-weight:bold; color:var(--neon-cyan);">${percent}%</span>
        </div>
        <div class="tracking-bar-container" style="height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden; margin-bottom:1rem;">
          <div class="tracking-bar" style="width:${percent}%; height:100%; background:linear-gradient(90deg, var(--neon-purple), var(--neon-cyan)); border-radius:10px; transition: width 0.4s ease;"></div>
        </div>
        <p style="margin:0 0 0.5rem 0; font-size:0.85rem; color:var(--text-muted); line-height:1.4; border-left:2px solid var(--neon-purple); padding-left:8px;">
          <span style="font-weight:bold; color:#fff;">Status:</span> ${statusMsg}
        </p>
        <p style="margin:0 0 1rem 0; font-size:0.8rem; color:${p.postponed ? 'var(--neon-amber)' : 'var(--text-muted)'}; padding-left:10px;">
          <strong>Estimated Delivery Deadline:</strong> ${new Date(p.deliveryDeadline).toLocaleString()}
        </p>
        <ul class="progress-stepper" style="margin-bottom: 1.5rem;">
          <div class="progress-stepper-fill" style="width: ${percent === 100 ? '100%' : Math.max(0, percent - 8) + '%'}"></div>
          ${stepperNodesHtml}
        </ul>
        <div class="countdown-timer" data-deadline="${p.deliveryDeadline}" data-status="${p.status}" style="font-family: monospace; font-size: 0.85rem; color: var(--neon-cyan); margin: 0.5rem 0 1rem 10px; border-left:2px solid var(--neon-cyan); padding-left:8px;">
          Calculating remaining time...
        </div>
        ${simulateBtnHtml}
        ${finalPayBtnHtml}
      `;
      container.appendChild(div);
    });

    // Attach listeners for dynamic buttons inside tracker
    document.querySelectorAll('.simulate-complete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const purchaseId = btn.getAttribute('data-id');
        const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
        const index = purchases.findIndex(p => p.id === purchaseId);
        if (index !== -1) {
          purchases[index].status = 'completed';
          localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));
          
          if (supabaseClient) {
            await supabaseClient
              .from('purchases')
              .update({ status: 'completed' })
              .eq('id', purchaseId);
          }
          
          // Add notification
          await addSystemNotification(
            "Project Review Pending",
            `Your project '${purchases[index].serviceName}' has been successfully compiled and is ready for final review. Pay the remaining 50% to complete delivery.`
          );

          alert("DEVELOPER SIMULATOR: Project status updated to COMPLETED by the creative team!");
          
          await renderPayments();
          await renderPurchasedServices();
          await renderServiceTracking();
        }
      });
    });

    document.querySelectorAll('.pay-final-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const purchaseId = btn.getAttribute('data-id');
        const item = purchases.find(p => p.id === purchaseId);
        if (item) {
          const remainingAmount = item.totalCost - item.paidAmount;
          initiateRazorpayPayment({
            type: 'final',
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            totalCost: item.totalCost,
            payAmount: remainingAmount,
            purchaseId: item.id
          });
        }
      });
    });

    document.querySelectorAll('.dispute-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const purchaseId = btn.getAttribute('data-id');
        showRefundPanel(purchaseId);
      });
    });

    // Attach view receipt listeners inside tracker
    document.querySelectorAll('.view-bill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const purchaseId = btn.getAttribute('data-id');
        const item = purchases.find(p => p.id === purchaseId);
        if (item) {
          showInvoiceBill(item);
        }
      });
    });

    if (window.lucide) lucide.createIcons();

    // Start countdown timer interval if not already running
    if (window.countdownIntervalId) {
      clearInterval(window.countdownIntervalId);
    }
    const timers = document.querySelectorAll('.countdown-timer');
    if (timers.length > 0) {
      window.countdownIntervalId = setInterval(() => {
        const activeTimers = document.querySelectorAll('.countdown-timer');
        if (activeTimers.length === 0) {
          clearInterval(window.countdownIntervalId);
          window.countdownIntervalId = null;
          return;
        }
        
        activeTimers.forEach(timer => {
          const deadlineStr = timer.getAttribute('data-deadline');
          const purchaseStatus = timer.getAttribute('data-status');
          
          if (purchaseStatus === 'fully_paid') {
            timer.innerHTML = `<strong>Project status:</strong> <span style="font-weight:bold; color:var(--neon-green);">DELIVERED</span>`;
            return;
          }

          if (!deadlineStr) {
            timer.innerText = "No deadline configured.";
            return;
          }

          const diff = new Date(deadlineStr).getTime() - Date.now();
          if (diff <= 0) {
            timer.innerHTML = `<strong>Time status:</strong> <span style="font-weight:bold; color:var(--neon-pink);">TIME LIMIT REACHED</span>`;
            return;
          }

          const days = Math.floor(diff / (24 * 60 * 60 * 1000));
          const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
          const seconds = Math.floor((diff % (60 * 1000)) / 1000);

          let timeText = "";
          if (days > 0) timeText += `${days}d `;
          if (hours > 0 || days > 0) timeText += `${hours}h `;
          timeText += `${minutes}m ${seconds}s`;

          timer.innerHTML = `<strong>Time Remaining:</strong> <span style="font-weight:bold; color:var(--neon-cyan);">${timeText}</span>`;
        });
      }, 1000);
    }
  }

  // Add system notifications dynamically
  async function addSystemNotification(title, desc) {
    const notifs = JSON.parse(localStorage.getItem('gravity-system-notifications')) || [];
    notifs.unshift({
      id: Date.now(),
      title: title,
      desc: desc,
      time: "Just now",
      read: false
    });
    localStorage.setItem('gravity-system-notifications', JSON.stringify(notifs));

    if (supabaseClient) {
      try {
        const sessionRes = await supabaseClient.auth.getSession();
        const session = sessionRes.data.session;
        if (session) {
          const response = await fetch('/api/admin-action', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              action: 'publish-notification',
              payload: { title, desc }
            })
          });
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || `HTTP ${response.status}`);
          }
        } else {
          // Fallback if no active auth session
          await supabaseClient
            .from('notifications')
            .insert([{
              title: title,
              desc_text: desc,
              time_label: "Just now",
              is_read: false
            }]);
        }
      } catch (err) {
        console.warn("Secure admin action failed, falling back to direct client-side DB insert:", err);
        await supabaseClient
          .from('notifications')
          .insert([{
            title: title,
            desc_text: desc,
            time_label: "Just now",
            is_read: false
          }]);
      }
    }
    
    await renderNotifications();
  }

  /* ==========================================================================
     RAZORPAY GATEWAY CHECKOUT INTEGRATION
     ========================================================================== */
  let activePayment = null;

  const razorpayOverlay = document.getElementById('razorpay-checkout-overlay');
  const razorpayPayBtn = document.getElementById('razorpay-pay-button');
  const razorpayCancelBtn = document.getElementById('razorpay-cancel-button');
  const methodUpi = document.getElementById('razorpay-method-upi');
  const methodCard = document.getElementById('razorpay-method-card');
  const formUpi = document.getElementById('razorpay-form-upi');
  const formCard = document.getElementById('razorpay-form-card');

  // Unified Payment Success Handler
  async function processSuccessPayment(txId, methodUsed) {
    if (!activePayment) return;

    const isIndian = currentSession && (currentSession.country === 'India' || (currentSession.phone && currentSession.phone.startsWith('+91')));
    const purchaseCurrency = isIndian ? 'INR' : 'USD';
    const symbol = purchaseCurrency === 'INR' ? '₹' : '$';

    // Log transaction locally (Fallback)
    let txs = JSON.parse(localStorage.getItem('gravity-transactions')) || [];
    const localTx = {
      id: txId,
      user: currentSession ? currentSession.username : 'User',
      email: currentSession ? currentSession.email : 'anonymous@gravity.com',
      service: activePayment.serviceName,
      amount: activePayment.payAmount,
      currency: purchaseCurrency,
      method: methodUsed,
      type: activePayment.type,
      date: new Date().toLocaleString()
    };
    txs.unshift(localTx);
    localStorage.setItem('gravity-transactions', JSON.stringify(txs));

    // Sync transaction to Supabase
    if (supabaseClient) {
      await supabaseClient
        .from('transactions')
        .insert([{
          reference: txId,
          username: localTx.user,
          email: localTx.email,
          service: localTx.service,
          amount: localTx.amount,
          method: localTx.method,
          type: localTx.type,
          date: localTx.date
        }]);
    }

    // Update purchases state
    let purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
    
    if (activePayment.type === 'booking') {
      const purId = "PUR-" + Date.now().toString().substring(8);
      const newPurchase = {
        id: purId,
        serviceId: activePayment.serviceId,
        serviceName: activePayment.serviceName,
        totalCost: activePayment.totalCost,
        paidAmount: activePayment.payAmount,
        currency: purchaseCurrency,
        status: 'advance_paid',
        date: new Date().toLocaleDateString(),
        deliveryDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        postponed: false
      };
      purchases.unshift(newPurchase);
      localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));

      // Sync purchase to Supabase
      if (supabaseClient && currentSession && currentSession.uid && !currentSession.uid.startsWith('local_')) {
        try {
          await supabaseClient
            .from('purchases')
            .insert([{
              id: purId,
              user_id: currentSession.uid,
              service_id: newPurchase.serviceId,
              service_name: newPurchase.serviceName,
              total_cost: newPurchase.totalCost,
              paid_amount: newPurchase.paidAmount,
              status: newPurchase.status,
              date: newPurchase.date,
              delivery_deadline: newPurchase.deliveryDeadline,
              postponed: newPurchase.postponed
            }]);
        } catch (e) {
          console.warn("Failed to sync purchase with deadline to Supabase", e);
          // Fallback insert
          await supabaseClient
            .from('purchases')
            .insert([{
              id: purId,
              user_id: currentSession.uid,
              service_id: newPurchase.serviceId,
              service_name: newPurchase.serviceName,
              total_cost: newPurchase.totalCost,
              paid_amount: newPurchase.paidAmount,
              status: newPurchase.status,
              date: newPurchase.date
            }]);
        }
      }
      
      await addSystemNotification(
        "Booking Confirmed via Razorpay",
        `Successfully received 50% advance booking payment of ${symbol}${activePayment.payAmount.toLocaleString()} for '${activePayment.serviceName}'. Work starts immediately.`
      );
    } else if (activePayment.type === 'final') {
      // Update existing purchase
      const idx = purchases.findIndex(p => p.id === activePayment.purchaseId);
      if (idx !== -1) {
        purchases[idx].paidAmount = purchases[idx].totalCost;
        purchases[idx].status = 'fully_paid';
        localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));

        // Sync update to Supabase
        if (supabaseClient && currentSession && currentSession.uid && !currentSession.uid.startsWith('local_')) {
          await supabaseClient
            .from('purchases')
            .update({
              paid_amount: purchases[idx].totalCost,
              status: 'fully_paid'
            })
            .eq('id', activePayment.purchaseId);
        }
        
        await addSystemNotification(
          "Project Successfully Delivered",
          `Received final 50% payment of ${symbol}${activePayment.payAmount.toLocaleString()} for '${activePayment.serviceName}'. Source files are released for download.`
        );
      }
    }

    alert(`Razorpay Payment Complete!\nTransaction Reference: ${txId}\nAmount: $${activePayment.payAmount.toFixed(2)}`);
    
    // Find the item to display in the receipt modal
    let showItem = purchases.find(p => p.id === (activePayment.purchaseId || ''));
    if (!showItem && activePayment.type === 'booking') {
      showItem = purchases[0]; // The one we just unshifted
    }
    
    // Reset and close simulated overlay just in case
    if (razorpayOverlay) razorpayOverlay.style.display = 'none';
    activePayment = null;

    // Refresh views
    await renderPayments();
    await renderPurchasedServices();
    await renderServiceTracking();
    await renderAdminDashboard();

    // Trigger Bill Overlay display dynamically
    if (showItem) {
      setTimeout(() => {
        showInvoiceBill(showItem);
      }, 600);
    }
  }

  async function initiateRazorpayPayment(data) {
    if (!currentSession) {
      alert("Please log in and complete your profile to make a payment.");
      openPortal('user-login');
      return;
    }

    if (!currentSession.email || currentSession.email.trim() === '' || !currentSession.phone || currentSession.phone.trim() === '') {
      alert("Please complete your profile (email and contact number) to make a payment.");
      openSidebar();
      openWindow('profile-settings', document.querySelector('.dock-btn[data-window="profile-settings"]'));
      return;
    }

    activePayment = data;

    const isIndian = currentSession && (currentSession.country === 'India' || (currentSession.phone && currentSession.phone.startsWith('+91')));
    const symbol = isIndian ? '₹' : '$';
    const currencyCode = isIndian ? "INR" : "USD";
    const rawAmount = Math.round(data.payAmount * 100); // minor units (paise/cents)

    // Fetch Razorpay Key ID dynamically if not already loaded
    if (!RAZORPAY_CONFIG.keyId) {
      try {
        const keyRes = await fetch('/api/get-razorpay-key');
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          if (keyData.keyId) {
            RAZORPAY_CONFIG.keyId = keyData.keyId;
          }
        }
      } catch (err) {
        console.error("Error fetching Razorpay key dynamically:", err);
      }
    }

    if (typeof Razorpay === 'undefined') {
      alert("Razorpay Payment Gateway SDK is not loaded. Please check your internet connection.");
      return;
    }

    if (!RAZORPAY_CONFIG.keyId) {
      alert("Razorpay Key ID is not configured. Please set the RAZORPAY_KEY_ID environment variable on your server.");
      return;
    }

    try {
      // 1. Fetch secure order ID from serverless function
      const orderRes = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: rawAmount,
          currency: currencyCode,
          receipt: `rcpt_${data.id || Date.now()}`
        })
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        throw new Error(errData.error?.message || `HTTP error ${orderRes.status}`);
      }

      const orderData = await orderRes.json();
      
      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: orderData.amount, // Synchronized with Razorpay backend order response
        currency: orderData.currency, // Synchronized with Razorpay backend order response
        name: "Gravity Studios",
        description: `${data.type === 'booking' ? '50% Booking Advance' : '50% Final Settlement'} for ${data.serviceName}`,
        image: "https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/logo.png",
        order_id: orderData.id,
        handler: async function (response) {
          // 2. Verify payment signature on the server side
          try {
            const verifyRes = await fetch('/api/verify-razorpay-signature', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            });

            if (!verifyRes.ok) {
              const errJson = await verifyRes.json();
              throw new Error(errJson.error?.message || "Signature verification failed.");
            }

            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              const txId = response.razorpay_payment_id;
              processSuccessPayment(txId, 'Razorpay SDK');
            } else {
              alert("Payment verification failed: Signature mismatch.");
            }
          } catch (err) {
            console.error("Razorpay secure verification error:", err);
            alert(`Payment Verification Failed: ${err.message}. Please contact support.`);
          }
        },
        prefill: {
          name: currentSession ? currentSession.username : 'User',
          email: currentSession ? currentSession.email : 'client@gravity.com',
          contact: (currentSession && currentSession.phone ? currentSession.phone : '+919892010101').replace(/[^+\d]/g, '')
        },
        theme: {
          color: "#b026ff"
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error("Error setting up Razorpay SDK transaction:", err);
      alert(`Razorpay SDK setup error: ${err.message}`);
    }
  }

  /* ==========================================================================
     REFUND DISPUTE FILE UPLOADER
     ========================================================================== */
  const refundPanel = document.getElementById('refund-request-panel');
  const disputeForm = document.getElementById('refund-dispute-form');
  const uploadBox = document.getElementById('refund-upload-box');
  const fileInput = document.getElementById('refund-proof-file');
  const uploadText = document.getElementById('upload-status-text');
  const cancelRefundBtn = document.getElementById('cancel-refund-btn');

  let selectedFile = null;

  function showRefundPanel(purchaseId) {
    document.getElementById('refund-target-purchase-id').value = purchaseId;
    refundPanel.style.display = 'block';
    refundPanel.scrollIntoView({ behavior: 'smooth' });
  }

  if (cancelRefundBtn) {
    cancelRefundBtn.addEventListener('click', () => {
      disputeForm.reset();
      refundPanel.style.display = 'none';
      selectedFile = null;
      uploadText.innerText = "Drag & Drop or Click to Select File";
    });
  }

  // Handle Drag & Drop Events
  if (uploadBox && fileInput) {
    uploadBox.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        uploadText.innerHTML = `File Selected: <strong style="color:#ff3366;">${selectedFile.name}</strong> (${(selectedFile.size/1024).toFixed(1)} KB)`;
      }
    });

    uploadBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadBox.classList.add('drag-over');
    });

    uploadBox.addEventListener('dragleave', () => {
      uploadBox.classList.remove('drag-over');
    });

    uploadBox.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadBox.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        selectedFile = e.dataTransfer.files[0];
        uploadText.innerHTML = `File Dropped: <strong style="color:#ff3366;">${selectedFile.name}</strong> (${(selectedFile.size/1024).toFixed(1)} KB)`;
      }
    });
  }

  // Submit Dispute Form
  if (disputeForm) {
    disputeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const purchaseId = document.getElementById('refund-target-purchase-id').value;
      const explanation = document.getElementById('refund-explanation').value.trim();

      if (!selectedFile) {
        alert("Please upload a PDF, JPG, or PNG document proving your dispute.");
        return;
      }

      // Add to refunds log locally (Fallback)
      let refunds = JSON.parse(localStorage.getItem('gravity-refunds')) || [];
      const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
      const item = purchases.find(p => p.id === purchaseId);
      
      if (item) {
        // Change status to refund_requested locally
        item.status = 'refund_requested';
        localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));

        const refId = "REF-" + Date.now().toString().substring(8);
        const localRefund = {
          id: refId,
          purchaseId: purchaseId,
          user: currentSession ? currentSession.username : 'User',
          serviceName: item.serviceName,
          explanation: explanation,
          fileName: selectedFile.name,
          fileSize: `${(selectedFile.size/1024).toFixed(1)} KB`,
          amount: item.paidAmount,
          status: 'pending',
          date: new Date().toLocaleString()
        };
        refunds.unshift(localRefund);
        localStorage.setItem('gravity-refunds', JSON.stringify(refunds));

        // Sync dispute and upload file to Supabase if active
        let evidenceUrl = null;
        if (supabaseClient && currentSession && currentSession.uid && !currentSession.uid.startsWith('local_')) {
          const fileExt = selectedFile.name.split('.').pop();
          const uniqueFileName = `${purchaseId}_${Date.now()}.${fileExt}`;
          const filePath = `disputes/${uniqueFileName}`;
          
          // Upload evidence to 'refund-evidence' bucket
          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('refund-evidence')
            .upload(filePath, selectedFile);
          
          if (!uploadError) {
            const { data: urlData } = supabaseClient.storage
              .from('refund-evidence')
              .getPublicUrl(filePath);
            evidenceUrl = urlData.publicUrl;
          } else {
            console.warn("Storage Bucket Warning: File uploaded locally only. (Ensure 'refund-evidence' bucket exists in Supabase Dashboard)");
            evidenceUrl = `https://mock-storage.supabase.co/refund-evidence/${filePath}`;
          }

          // Insert refund record
          await supabaseClient
            .from('refunds')
            .insert([{
              id: refId,
              purchase_id: purchaseId,
              explanation: explanation,
              evidence_url: evidenceUrl,
              status: 'pending'
            }]);

          // Update purchase status in Supabase
          await supabaseClient
            .from('purchases')
            .update({ status: 'refund_requested' })
            .eq('id', purchaseId);
        }

        await addSystemNotification(
          "Refund Claim Filed",
          `Dispute case filed for '${item.serviceName}'. Evidence file '${selectedFile.name}' uploaded. Under administrative review.`
        );

        alert("Dispute Filed Successfully!\nYour refund request and uploaded proof are submitted to the administration mainframe.");
        
        // Reset & Close
        disputeForm.reset();
        refundPanel.style.display = 'none';
        selectedFile = null;
        uploadText.innerText = "Drag & Drop or Click to Select File";

        // Refresh
        await renderPayments();
        await renderPurchasedServices();
        await renderServiceTracking();
        await renderAdminDashboard();
      }
    });
  }

  /* ==========================================================================
     ADMIN CONSOLE DASHBOARD EVENT HANDLERS
     ========================================================================== */

  // Publish Notification Form
  const adminNotifForm = document.getElementById('admin-notification-form');
  if (adminNotifForm) {
    adminNotifForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('admin-notif-title').value.trim();
      const desc = document.getElementById('admin-notif-desc').value.trim();

      await addSystemNotification(title, desc);
      
      adminNotifForm.reset();
      alert(`[ADMIN MAINFRAME] Notification published successfully! All active users will receive it.`);
      await renderAdminDashboard();
    });
  }

  // Render Admin Dashboard Lists
  // Render Admin Dashboard Lists
  async function renderAdminDashboard() {
    const refundListContainer = document.getElementById('admin-refund-claims-list');
    const paymentsListContainer = document.getElementById('admin-payments-log-list');

    // Render Refund Claims
    if (refundListContainer) {
      let refunds = [];
      if (supabaseClient) {
        const { data, error } = await supabaseClient
          .from('refunds')
          .select('*, purchases(*, profiles(*))')
          .order('created_at', { ascending: false });

        if (!error && data) {
          refunds = data.map(r => ({
            id: r.id,
            purchaseId: r.purchase_id,
            user: r.purchases && r.purchases.profiles ? r.purchases.profiles.username : 'User',
            serviceName: r.purchases ? r.purchases.service_name : 'Service',
            explanation: r.explanation,
            fileName: r.evidence_url ? (r.evidence_url.includes('/') ? r.evidence_url.split('/').pop() : r.evidence_url) : 'Evidence',
            fileSize: "N/A",
            amount: r.purchases ? parseFloat(r.purchases.paid_amount) : 0,
            status: r.status,
            evidenceUrl: r.evidence_url
          }));
        } else {
          refunds = JSON.parse(localStorage.getItem('gravity-refunds')) || [];
        }
      } else {
        refunds = JSON.parse(localStorage.getItem('gravity-refunds')) || [];
      }

      refundListContainer.innerHTML = '';

      if (refunds.length === 0) {
        refundListContainer.innerHTML = `<p class="text-muted">> Awaiting refund dispute submissions...</p>`;
      } else {
        refunds.forEach(ref => {
          const p = document.createElement('div');
          p.className = 'admin-refund-row';
          p.style.padding = '0.5rem';
          p.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
          p.style.marginBottom = '0.5rem';

          let buttonsHtml = '';
          if (ref.status === 'pending') {
            buttonsHtml = `
              <div style="margin-top:0.35rem; display:flex; gap:0.5rem;">
                <button class="admin-claim-btn approve" data-id="${ref.id}" style="background:#4caf50; color:#fff; border:none; padding:0.2rem 0.5rem; font-family:inherit; font-size:0.7rem; font-weight:bold; border-radius:3px; cursor:pointer;">Approve & Return $${ref.amount.toFixed(2)}</button>
                <button class="admin-claim-btn deny" data-id="${ref.id}" style="background:#ff3366; color:#fff; border:none; padding:0.2rem 0.5rem; font-family:inherit; font-size:0.7rem; font-weight:bold; border-radius:3px; cursor:pointer;">Deny Dispute</button>
              </div>
            `;
          } else {
            buttonsHtml = `<div style="font-size:0.7rem; color:${ref.status === 'approved' ? 'var(--neon-green)' : 'var(--neon-pink)'}; font-weight:bold; margin-top:0.25rem;">> CLAIM ${ref.status.toUpperCase()}</div>`;
          }

          let proofHtml = '';
          if (ref.evidenceUrl && ref.evidenceUrl.startsWith('http')) {
            proofHtml = `<div style="color:var(--neon-amber); font-size:0.75rem; margin-top:0.15rem;">Proof File: <a href="${ref.evidenceUrl}" target="_blank" style="color:var(--neon-amber); text-decoration:underline;">View Evidence Document</a></div>`;
          } else {
            proofHtml = `<div style="color:var(--neon-amber); font-size:0.75rem; margin-top:0.15rem;">Proof File: [${ref.fileName}] (${ref.fileSize})</div>`;
          }

          p.innerHTML = `
            <div style="color:#fff; font-weight:bold;">User: ${ref.user} • Claim ID: ${ref.id}</div>
            <div style="color:var(--neon-cyan); font-size:0.8rem;">Service: ${ref.serviceName} ($${ref.amount.toFixed(2)} disputed)</div>
            <div style="color:var(--text-muted); font-size:0.75rem; margin-top:0.15rem;">Reason: "${ref.explanation}"</div>
            ${proofHtml}
            ${buttonsHtml}
          `;
          refundListContainer.appendChild(p);
        });

        // Attach event listeners for Admin refund buttons
        document.querySelectorAll('.admin-claim-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const action = btn.classList.contains('approve') ? 'approve' : 'deny';
            processRefundClaim(id, action);
          });
        });
      }
    }

    // Render Payments Log
    if (paymentsListContainer) {
      let txs = [];
      if (supabaseClient) {
        const { data, error } = await supabaseClient
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          txs = data.map(t => ({
            id: t.reference,
            user: t.username,
            email: t.email,
            service: t.service,
            amount: parseFloat(t.amount),
            method: t.method,
            type: t.type,
            date: t.date
          }));
        } else {
          txs = JSON.parse(localStorage.getItem('gravity-transactions')) || [];
        }
      } else {
        txs = JSON.parse(localStorage.getItem('gravity-transactions')) || [];
      }

      paymentsListContainer.innerHTML = '';

      if (txs.length === 0) {
        paymentsListContainer.innerHTML = `<p class="text-muted">> No payment transactions recorded yet.</p>`;
      } else {
        txs.forEach(t => {
          const div = document.createElement('div');
          div.className = 'admin-payment-row';
          div.style.padding = '0.4rem 0';
          div.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
          
          let actionLabel = t.type === 'booking' ? '50% ADVANCE' : '50% FINAL';
          if (t.amount < 0) actionLabel = 'REFUND RETURN';

          const symbol = t.currency === 'INR' ? '₹' : '$';
          div.innerHTML = `
            <span class="text-green">> [${t.date}]</span>
            <span style="color:#fff; font-weight:bold;">${symbol}${Math.abs(t.amount).toLocaleString()}</span>
            <span>via ${t.method}</span>
            <span style="color:var(--neon-cyan);">(${actionLabel})</span>
            <span style="color:var(--text-muted);">by ${t.user} (${t.service})</span>
          `;
          paymentsListContainer.appendChild(div);
        });
      }
    }
    if (typeof renderAdminPricingEditor === 'function') {
      renderAdminPricingEditor();
    }
  }

  // Admin processes refund claim
  async function processRefundClaim(claimId, action) {
    let refunds = JSON.parse(localStorage.getItem('gravity-refunds')) || [];
    const refIdx = refunds.findIndex(r => r.id === claimId);

    // Fetch from Supabase if active
    let claim = null;
    let purchaseId = null;
    let serviceName = null;
    let amount = 0;
    let username = 'User';

    if (supabaseClient) {
      const { data: dbClaim, error } = await supabaseClient
        .from('refunds')
        .select('*, purchases(*, profiles(*))')
        .eq('id', claimId)
        .single();
      
      if (!error && dbClaim) {
        claim = dbClaim;
        purchaseId = dbClaim.purchase_id;
        serviceName = dbClaim.purchases ? dbClaim.purchases.service_name : 'Service';
        amount = dbClaim.purchases ? parseFloat(dbClaim.purchases.paid_amount) : 0;
        username = dbClaim.purchases && dbClaim.purchases.profiles ? dbClaim.purchases.profiles.username : 'User';
      }
    }

    // Fallback to local
    if (!claim && refIdx !== -1) {
      claim = refunds[refIdx];
      purchaseId = claim.purchaseId;
      serviceName = claim.serviceName;
      amount = claim.amount;
      username = claim.user;
    }

    if (claim) {
      let purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
      const purIdx = purchases.findIndex(p => p.id === purchaseId);
      const newStatus = action === 'approve' ? 'refund_approved' : 'refund_denied';

      // Update local purchase state
      if (purIdx !== -1) {
        purchases[purIdx].status = newStatus;
        localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));
      }

      // Update local refund status
      if (refIdx !== -1) {
        refunds[refIdx].status = action === 'approve' ? 'approved' : 'denied';
        localStorage.setItem('gravity-refunds', JSON.stringify(refunds));
      }

      // Sync to Supabase
      if (supabaseClient) {
        try {
          const sessionRes = await supabaseClient.auth.getSession();
          const session = sessionRes.data.session;
          if (session) {
            const response = await fetch('/api/admin-action', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                action: 'process-refund',
                payload: {
                  claimId,
                  purchaseId,
                  status: action === 'approve' ? 'approved' : 'denied',
                  newStatus
                }
              })
            });
            if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error?.message || `HTTP ${response.status}`);
            }
          } else {
            // Fallback if no active admin session
            await supabaseClient
              .from('refunds')
              .update({ status: action === 'approve' ? 'approved' : 'denied' })
              .eq('id', claimId);
            await supabaseClient
              .from('purchases')
              .update({ status: newStatus })
              .eq('id', purchaseId);
          }
        } catch (err) {
          console.warn("Secure refund claim action failed, falling back to client-side DB updates:", err);
          await supabaseClient
            .from('refunds')
            .update({ status: action === 'approve' ? 'approved' : 'denied' })
            .eq('id', claimId);
          await supabaseClient
            .from('purchases')
            .update({ status: newStatus })
            .eq('id', purchaseId);
        }
      }

      if (action === 'approve') {
        const txId = "refund_" + Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Log transaction locally
        let txs = JSON.parse(localStorage.getItem('gravity-transactions')) || [];
        const localTx = {
          id: txId,
          user: username,
          email: 'system-refund@gravity.com',
          service: serviceName,
          amount: -amount, // Negative amount
          method: 'Razorpay Refund Routing',
          type: 'refund',
          date: new Date().toLocaleString()
        };
        txs.unshift(localTx);
        localStorage.setItem('gravity-transactions', JSON.stringify(txs));

        // Sync transaction to Supabase
        if (supabaseClient) {
          await supabaseClient
            .from('transactions')
            .insert([{
              reference: txId,
              username: localTx.user,
              email: localTx.email,
              service: localTx.service,
              amount: localTx.amount,
              method: localTx.method,
              type: localTx.type,
              date: localTx.date
            }]);
        }

        await addSystemNotification(
          "Refund Approved by Admin",
          `Dispute case for '${serviceName}' approved. Refund of $${amount.toFixed(2)} returned. Original booking advance fully reversed.`
        );
        alert(`[ADMIN MAINFRAME] Refund dispute case ${claimId} approved! Capital has been returned to the user.`);

      } else if (action === 'deny') {
        await addSystemNotification(
          "Dispute Claim Rejected",
          `Dispute claim for '${serviceName}' has been reviewed and rejected by system administrators. Awaiting final payment to complete release.`
        );
        alert(`[ADMIN MAINFRAME] Dispute claim case ${claimId} has been reviewed and denied. Milestone timeline resumed.`);
      }

      // Refresh
      await renderPayments();
      await renderPurchasedServices();
      await renderServiceTracking();
      await renderAdminDashboard();
    }
  }

  // Attach Admin triggers
  const adminToggleSandbox = document.getElementById('admin-toggle-sandbox');
  if (adminToggleSandbox) {
    adminToggleSandbox.addEventListener('click', () => {
      let sandbox = localStorage.getItem('gravity-sandbox-mode') === 'true';
      sandbox = !sandbox;
      localStorage.setItem('gravity-sandbox-mode', sandbox);
      alert(`[SYSTEM CONTROL] Sandbox Mode set to ${sandbox ? 'ACTIVE' : 'INACTIVE'}`);
    });
  }

  const adminResetSystem = document.getElementById('admin-reset-system');
  if (adminResetSystem) {
    adminResetSystem.addEventListener('click', () => {
      if (confirm("WARNING: Are you sure you want to restore default application configs? This clears session caches and transaction history.")) {
        localStorage.clear();
        alert("System caches flushed. Re-initializing ecosystem...");
        window.location.reload();
      }
    });
  }

  // Pre-load Admin Dashboard lists when admin enters
  const origOpenPortal = openPortal;
  openPortal = function(targetInterface) {
    origOpenPortal(targetInterface);
    if (targetInterface === 'admin-dashboard') {
      renderAdminDashboard();
    }
  };

  // Toggle dynamic window
  function toggleWindow(windowId, dockBtn) {
    const targetWindow = document.getElementById(`window-${windowId}`);
    if (!targetWindow) return;

    if (targetWindow.classList.contains('open')) {
      closeWindow(windowId, dockBtn);
    } else {
      openWindow(windowId, dockBtn);
    }
  }

  // Open dynamic window
  function openWindow(windowId, dockBtn) {
    const targetWindow = document.getElementById(`window-${windowId}`);
    if (!targetWindow) return;

    // Bring clicked window to the top by adjusting z-index
    highestZIndex++;
    targetWindow.style.zIndex = highestZIndex;

    targetWindow.style.display = 'flex';
    targetWindow.offsetHeight; // Trigger reflow
    targetWindow.classList.add('open');

    if (dockBtn) {
      dockBtn.classList.add('active');
    }

    // Dynamic rendering hooks based on window opening
    if (windowId === 'notifications') renderNotifications();
    if (windowId === 'payments') renderPayments();
    if (windowId === 'buyed-services') renderPurchasedServices();
    if (windowId === 'track-services') renderServiceTracking();
    
    if (windowId === 'admin-overview') {
      const dept = getDepartmentForEmail(currentSession?.email);
      loadAdminOverviewStats(dept);
    }
    if (windowId === 'admin-notifications') {
      const targetSelect = document.getElementById('admin-window-notif-target');
      const userSelectContainer = document.getElementById('admin-window-notif-user-select-container');
      if (targetSelect && userSelectContainer) {
        if (targetSelect.value === 'individual') {
          userSelectContainer.style.display = 'block';
          populateNotificationUserSelect();
        } else {
          userSelectContainer.style.display = 'none';
        }
      }
    }
    if (windowId === 'admin-progress') {
      const dept = getDepartmentForEmail(currentSession?.email);
      loadProgressClientDropdown(dept);
    }
    if (windowId === 'admin-refunds') {
      loadAdminRefundsList();
    }
    if (windowId === 'admin-payments') {
      loadAdminPaymentsList();
    }
    if (windowId === 'admin-pricing') {
      loadAdminPricingManager();
    }

    // Trigger Lucide SVG rendering inside the window
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Close dynamic window
  function closeWindow(windowId, dockBtn) {
    const targetWindow = document.getElementById(`window-${windowId}`);
    if (!targetWindow) return;

    targetWindow.classList.remove('open');
    if (dockBtn) {
      dockBtn.classList.remove('active');
    }

    setTimeout(() => {
      if (!targetWindow.classList.contains('open')) {
        targetWindow.style.display = 'none';
      }
    }, 400);
  }

  function closeAllWindows() {
    const windows = document.querySelectorAll('.dashboard-window-container');
    windows.forEach(win => {
      win.classList.remove('open');
      setTimeout(() => {
        if (!win.classList.contains('open')) {
          win.style.display = 'none';
        }
      }, 400);
    });
    
    dockBtns.forEach(btn => btn.classList.remove('active'));
  }

  // Portal Opening Controller (Modals)
  function openPortal(targetInterface) {
    closeSidebar(); // Ensure sidebar is closed when opening modals
    overlay.style.display = 'flex';
    overlay.offsetHeight; // Trigger paint reflow for animation transition
    overlay.classList.add('open');

    // Hide all interfaces first
    userLoginInterface.style.display = 'none';
    adminLoginInterface.style.display = 'none';
    adminDashboardInterface.style.display = 'none';

    if (targetInterface === 'user-login') {
      userLoginInterface.style.display = 'block';
      switchTab('user-signin-form');
    } else if (targetInterface === 'admin-login') {
      adminLoginInterface.style.display = 'block';
      updateAdminRoleSelectDropdown().then(() => {
        const adminEmailInput = document.getElementById('admin-email');
        if (adminEmailInput) {
          adminEmailInput.dispatchEvent(new Event('input'));
        }
      });
    } else if (targetInterface === 'admin-dashboard') {
      adminDashboardInterface.style.display = 'block';
      renderAdminDashboard();
    }
  }

  function closePortal() {
    overlay.classList.remove('open');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 400); // Match transition duration
  }

  // Update Header Icons and Tooltips based on Session state
  function updateAuthUI() {
    const userIcon = loginBtn.querySelector('.portal-user-icon');
    const adminIcon = loginBtn.querySelector('.portal-admin-icon');
    const sidebarAdminBtn = document.getElementById('sidebar-admin-btn');
    
    loginBtn.className = 'control-btn'; // Reset classes

    // Always show the user login icon and hide the admin icon to keep the admin portal hidden
    if (userIcon) userIcon.style.display = 'block';
    if (adminIcon) adminIcon.style.display = 'none';

    if (!currentSession) {
      if (sidebarAdminBtn) sidebarAdminBtn.style.display = 'none';
      loginBtn.setAttribute('data-tooltip', 'Portal Sign-In');
      loginBtn.setAttribute('aria-label', 'Open Login Portal');
    } else {
      // Both admin and standard users visual styling are identical in header
      if (sidebarAdminBtn) {
        sidebarAdminBtn.style.display = (currentSession.role === 'admin') ? 'flex' : 'none';
      }
      loginBtn.classList.add('logged-in-user');
      const displayName = currentSession.username || (currentSession.role === 'admin' ? 'Member' : 'User');
      loginBtn.setAttribute('data-tooltip', `User Portal (${displayName})`);
      loginBtn.setAttribute('aria-label', 'Open User Workspace');
    }
  }

  // User tab toggling (Sign In vs Sign Up)
  const tabButtons = document.querySelectorAll('.portal-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchTab(btn.getAttribute('data-target'));
    });
  });

  // Switch tabs
  function switchTab(targetFormId) {
    const forms = document.querySelectorAll('.portal-form');
    forms.forEach(form => {
      if (form.id === targetFormId) {
        form.classList.add('active');
      } else if (form.id !== 'admin-login-form') {
        form.classList.remove('active');
      }
    });
    // Sync tab button active classes just in case
    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-target') === targetFormId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // User Sign-In Form Handler
  const userSigninForm = document.getElementById('user-signin-form');
  const userSigninError = document.getElementById('user-signin-error');
  userSigninForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    userSigninError.style.display = 'none';

    const loginInput = document.getElementById('user-signin-email').value.trim();
    const passwordInput = document.getElementById('user-signin-password').value;

    if (passwordInput.length < 6) {
      showError(userSigninError, 'Password must be at least 6 characters.');
      return;
    }

    if (supabaseClient) {
      const submitBtn = userSigninForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : "SIGN IN";
      if (submitBtn) {
        submitBtn.innerText = "AUTHENTICATING...";
        submitBtn.disabled = true;
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: loginInput,
        password: passwordInput
      });

      if (submitBtn) {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }

      if (error) {
        showError(userSigninError, `AUTH ERROR: ${error.message}`);
      } else if (data.user) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .single();

        loginSuccess({
          role: 'user',
          username: profile ? profile.username : loginInput.split('@')[0],
          email: data.user.email,
          uid: data.user.id
        });
      }
    } else {
      // Retrieve local registered users list (Fallback)
      const users = JSON.parse(localStorage.getItem('gravity-registered-users')) || [];
      const foundUser = users.find(u => u.email === loginInput || u.username === loginInput);

      if (foundUser) {
        if (foundUser.password === passwordInput) {
          loginSuccess({
            role: 'user',
            username: foundUser.username,
            email: foundUser.email,
            phone: foundUser.phone || '',
            country: foundUser.country || '',
            avatarUrl: foundUser.avatarUrl || ''
          });
        } else {
          showError(userSigninError, 'Incorrect password.');
        }
      } else {
        const defaultUsername = loginInput.split('@')[0];
        loginSuccess({
          role: 'user',
          username: defaultUsername,
          email: loginInput.includes('@') ? loginInput : `${loginInput}@gravity.com`
        });
      }
    }
  });

  // User Sign-Up Form Handler
  const userSignupForm = document.getElementById('user-signup-form');
  const userSignupError = document.getElementById('user-signup-error');
  userSignupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    userSignupError.style.display = 'none';

    const username = document.getElementById('user-signup-username').value.trim();
    const email = document.getElementById('user-signup-email').value.trim();
    const password = document.getElementById('user-signup-password').value;

    if (username.length < 3) {
      showError(userSignupError, 'Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      showError(userSignupError, 'Password must be at least 6 characters.');
      return;
    }

    if (supabaseClient) {
      const submitBtn = userSignupForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : "CREATE ACCOUNT";
      if (submitBtn) {
        submitBtn.innerText = "REGISTERING...";
        submitBtn.disabled = true;
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (submitBtn) {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }

      if (error) {
        showError(userSignupError, `REGISTRATION ERROR: ${error.message}`);
      } else if (data.user) {
        // Upsert user into profiles table
        await supabaseClient
          .from('profiles')
          .upsert({ id: data.user.id, username: username, email: email });

        loginSuccess({
          role: 'user',
          username: username,
          email: email,
          uid: data.user.id
        });

        if (data.session === null) {
          alert("Ecosystem Activation: A verification email has been sent. Please confirm to verify your database credentials.");
        }
      }
    } else {
      // LocalStorage Fallback
      const users = JSON.parse(localStorage.getItem('gravity-registered-users')) || [];
      if (users.some(u => u.email === email || u.username === username)) {
        showError(userSignupError, 'Username or email already registered.');
        return;
      }

      users.push({ username, email, password });
      localStorage.setItem('gravity-registered-users', JSON.stringify(users));

      loginSuccess({
        role: 'user',
        username: username,
        email: email
      });
    }
  });

  // Live Google Sign-In Initializer
  function initLiveGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: "495105565473-fkb903hmrvl9nrc25uarfj9m2qs0di9p.apps.googleusercontent.com",
        callback: handleGoogleCredentialResponse
      });
      google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "outline", size: "large", width: 380 }
      );
    } else {
      setTimeout(initLiveGoogleSignIn, 150);
    }
  }

  // Client-side UUID generator
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Handle Google OAuth JWT Response Token
  async function handleGoogleCredentialResponse(response) {
    const payload = decodeJwtResponse(response.credential);
    const detectedCountry = (payload.locale && (payload.locale.toUpperCase().endsWith('-IN') || payload.locale.toUpperCase().includes('IN'))) ? 'India' : 'Other';
    const googleAvatarUrl = (payload.picture || '') + '?provider=google';

    // Record Google logins in local list for dashboard drop-downs
    const localUsers = JSON.parse(localStorage.getItem('gravity-registered-users')) || [];
    if (!localUsers.some(u => u.email === payload.email)) {
      localUsers.push({
        username: payload.name,
        email: payload.email,
        avatarUrl: googleAvatarUrl
      });
      localStorage.setItem('gravity-registered-users', JSON.stringify(localUsers));
    }
    
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) {
        console.warn(`Supabase Google Authentication failed: ${error.message}. Falling back to local authentication session.`);
        // Fallback: Generate UUID and sync profile in database even in local fallback mode
        const fallbackUid = generateUUID();
        try {
          const { error: upsertError } = await supabaseClient
            .from('profiles')
            .upsert({ 
              id: fallbackUid, 
              username: payload.name, 
              email: payload.email,
              avatar_url: googleAvatarUrl
            });
          
          if (upsertError) {
            console.warn("Local fallback upsert with avatar_url failed, trying basic insert:", upsertError.message);
            await supabaseClient
              .from('profiles')
              .upsert({ 
                id: fallbackUid, 
                username: payload.name, 
                email: payload.email
              });
          }
        } catch (dbErr) {
          console.warn("Database sync error during local fallback:", dbErr.message);
        }

        loginSuccess({
          role: 'user',
          username: payload.name,
          email: payload.email,
          country: detectedCountry,
          locale: payload.locale,
          uid: fallbackUid,
          avatarUrl: googleAvatarUrl
        });
      } else if (data.user) {
        try {
          const { error: upsertError } = await supabaseClient
            .from('profiles')
            .upsert({ 
              id: data.user.id, 
              username: payload.name, 
              email: payload.email,
              avatar_url: googleAvatarUrl
            });
          
          if (upsertError) {
            console.warn("Google profile upsert with avatar_url failed, falling back to basic insert:", upsertError.message);
            // Fallback: Try updating profiles without avatar_url in case the column is missing in their database
            await supabaseClient
              .from('profiles')
              .upsert({ 
                id: data.user.id, 
                username: payload.name, 
                email: payload.email
              });
          }
        } catch (err) {
          console.warn("Failed to sync Google profile details:", err.message);
        }

        loginSuccess({
          role: 'user',
          username: payload.name,
          email: payload.email,
          uid: data.user.id,
          country: detectedCountry,
          locale: payload.locale,
          avatarUrl: googleAvatarUrl
        });
      }
    } else {
      const fallbackUid = generateUUID();
      try {
        await supabaseClient
          .from('profiles')
          .upsert({ 
            id: fallbackUid, 
            username: payload.name, 
            email: payload.email
          });
      } catch (dbErr) {
        console.warn("Offline fallback profile upsert skipped or failed:", dbErr.message);
      }

      loginSuccess({
        role: 'user',
        username: payload.name,
        email: payload.email,
        country: detectedCountry,
        locale: payload.locale,
        uid: fallbackUid,
        avatarUrl: googleAvatarUrl
      });
    }
  }

  // Client-side decoder for Google JWT Identity Token
  function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }

  // Trigger Google Sign-In Button Rendering
  initLiveGoogleSignIn();

  // Admin Secure Sign-In Form Handler
  const adminLoginForm = document.getElementById('admin-login-form');
  const adminLoginError = document.getElementById('admin-login-error');
  const ADMIN_ROLE_UUIDS = {
    'founder': 'f0000000-0000-0000-0000-000000000001',
    'ceo': 'c0000000-0000-0000-0000-000000000002',
    'ai': 'a0000000-0000-0000-0000-000000000003',
    'dev': 'd0000000-0000-0000-0000-000000000004',
    'design': 'e0000000-0000-0000-0000-000000000005',
    'video': 'b0000000-0000-0000-0000-000000000006',
    'marketing': 'b0000000-0000-0000-0000-000000000007',
    'support': 'b0000000-0000-0000-0000-000000000008'
  };

  function getRoleKeyByEmail(email) {
    if (!email) return 'none';
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'founder@gravitystudios.com' || cleanEmail === 'ajay@gravitystudios.com') {
      return 'founder';
    }
    if (cleanEmail === 'ceo@gravitystudios.com' || cleanEmail === 'shashank@gravitystudios.com') {
      return 'ceo';
    }
    const prefix = cleanEmail.split('@')[0];
    if (prefix === 'ai' || prefix === 'thontadaraya' || prefix === 'thontadarya') return 'ai';
    if (prefix === 'dev' || prefix === 'web' || prefix === 'pruthvi') return 'dev';
    if (prefix === 'design' || prefix === 'shreyas') return 'design';
    if (prefix === 'video' || prefix === 'munish') return 'video';
    if (prefix === 'marketing' || prefix === 'subhash') return 'marketing';
    if (prefix === 'support' || prefix === 'pavan') return 'support';
    return 'none';
  }

  async function fetchClaimedRoles() {
    const claimed = {};
    
    // 1. Fetch from serverless function first (if running and service role key is configured)
    try {
      const res = await fetch('/api/get-claimed-roles');
      if (res.ok) {
        const result = await res.json();
        if (result && result.claimed) {
          Object.assign(claimed, result.claimed);
        }
      }
    } catch (apiErr) {
      console.warn("Could not fetch claimed roles from serverless API, falling back to direct database query:", apiErr.message);
    }

    // 2. Direct Supabase Query (always active, public select allowed on profiles)
    if (Object.keys(claimed).length === 0 && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('id, email, username');
        
        if (!error && data) {
          data.forEach(profile => {
            const email = (profile.email || '').toLowerCase().trim();
            if (email) {
              const roleKey = getRoleKeyByEmail(email);
              if (roleKey && roleKey !== 'none') {
                claimed[roleKey] = {
                  email: email,
                  username: profile.username
                };
              }
            }
          });
        }
      } catch (dbErr) {
        console.warn("Direct query failed to fetch claimed roles:", dbErr.message);
      }
    }
    
    // 3. Fetch from Local Storage Locks (fallback/offline mode)
    const localLocks = JSON.parse(localStorage.getItem('gravity-admin-locks')) || {};
    Object.keys(localLocks).forEach(roleKey => {
      if (!claimed[roleKey]) {
        claimed[roleKey] = {
          email: (localLocks[roleKey].email || '').toLowerCase().trim(),
          username: `admin_role:${roleKey}|pwd:${localLocks[roleKey].password}`
        };
      }
    });
    
    return claimed;
  }

  async function updateAdminRoleSelectDropdown() {
    const selectElem = document.getElementById('admin-role-select');
    if (!selectElem) return;
    
    const claimed = await fetchClaimedRoles();
    const currentValue = selectElem.value;
    
    // Update diagnostics box
    const diagBox = document.getElementById('admin-diagnostics-box');
    if (diagBox) {
      let diagHtml = '<p style="color: #ff3366; font-weight: bold; margin-bottom: 5px;">> DIAGNOSTICS ACTIVE:</p>';
      
      // Check server key configuration status
      let keyStatusHtml = '<span style="color: #ff3366;">CHECKING...</span>';
      let foundEnvKeys = 'None';
      try {
        const checkRes = await fetch('/api/get-claimed-roles');
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.keyConfigured) {
            keyStatusHtml = '<span style="color: #00ff66; font-weight: bold;">CONNECTED (OK)</span>';
          } else {
            keyStatusHtml = '<span style="color: #ff3333; font-weight: bold;">MISSING (ERROR)</span>';
          }
          if (checkData.foundKeys && checkData.foundKeys.length > 0) {
            foundEnvKeys = checkData.foundKeys.join(', ');
          }
        } else {
          keyStatusHtml = '<span style="color: #ff9900; font-weight: bold;">UNREACHABLE</span>';
        }
      } catch (err) {
        keyStatusHtml = `<span style="color: #ff3333; font-weight: bold;">API ERROR (${err.message})</span>`;
      }
      diagHtml += `<p style="color: #eee; margin-left: 10px; margin-bottom: 5px;"> - Server Key Status: ${keyStatusHtml}</p>`;
      diagHtml += `<p style="color: #888; margin-left: 10px; margin-bottom: 5px;"> - Detected Env Keys: [ ${foundEnvKeys} ]</p>`;

      const localLocks = JSON.parse(localStorage.getItem('gravity-admin-locks')) || {};
      diagHtml += `<p style="color: #aaa; margin-left: 10px; margin-bottom: 5px;"> - Local Locks: ${Object.keys(localLocks).join(', ') || 'None'}</p>`;
      
      const dbClaimedKeys = [];
      if (supabaseClient) {
        try {
          const roleUuids = Object.values(ADMIN_ROLE_UUIDS);
          const { data } = await supabaseClient.from('profiles').select('id').in('id', roleUuids);
          if (data) {
            data.forEach(p => {
              const rKey = Object.keys(ADMIN_ROLE_UUIDS).find(k => ADMIN_ROLE_UUIDS[k] === p.id);
              if (rKey) dbClaimedKeys.push(rKey);
            });
          }
        } catch (e) {
          console.warn("Diagnostics failed to fetch database claims:", e.message);
        }
      }
      diagHtml += `<p style="color: #aaa; margin-left: 10px; margin-bottom: 5px;"> - Database Claims: ${dbClaimedKeys.join(', ') || 'None'}</p>`;
      
      if (dbClaimedKeys.includes('founder')) {
        diagHtml += `<button id="diag-delete-founder-btn" style="background: #ff3366; color: white; border: none; padding: 4px 8px; margin-top: 8px; cursor: pointer; border-radius: 4px; font-size: 11px; font-family: monospace; display: block;">[ DELETE FOUNDER FROM DATABASE ]</button>`;
      }
      
      diagBox.innerHTML = diagHtml;

      const delBtn = document.getElementById('diag-delete-founder-btn');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          delBtn.disabled = true;
          delBtn.innerText = "DELETING...";
          try {
            const res = await fetch('/api/delete-profile?email=founder@gravitystudios.com', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
              alert(data.message || "Founder deleted successfully!");
              window.location.reload();
            } else {
              alert("Error: " + (data.error?.message || "Failed to delete"));
              delBtn.disabled = false;
              delBtn.innerText = "[ DELETE FOUNDER FROM DATABASE ]";
            }
          } catch (err) {
            alert("Error: " + err.message);
            delBtn.disabled = false;
            delBtn.innerText = "[ DELETE FOUNDER FROM DATABASE ]";
          }
        });
      }
    }
    
    const ALL_ROLE_OPTIONS = [
      { value: 'founder', text: 'Founder & Creative Director' },
      { value: 'ceo', text: 'Co-Founder & CEO' },
      { value: 'ai', text: 'CTO (Technology Head)' },
      { value: 'video', text: 'CMO (Marketing Head)' },
      { value: 'support', text: 'CHRO (HR Head)' },
      { value: 'dev', text: 'CIO (IT Head)' },
      { value: 'design', text: 'COO & Site Engineer' },
      { value: 'marketing', text: 'Sales & Pricing Lead' }
    ];
    
    selectElem.innerHTML = '';
    
    let count = 0;
    ALL_ROLE_OPTIONS.forEach(opt => {
      if (!claimed[opt.value]) {
        const option = document.createElement('option');
        option.value = opt.value;
        option.innerText = opt.text;
        selectElem.appendChild(option);
        count++;
      }
    });

    if (currentValue && Array.from(selectElem.options).some(opt => opt.value === currentValue)) {
      selectElem.value = currentValue;
    }
    
    const inputGroup = selectElem.closest('.portal-input-group');
    if (count === 0) {
      if (inputGroup) {
        inputGroup.style.display = 'none';
      }
      selectElem.removeAttribute('required');
    } else {
      if (inputGroup) {
        inputGroup.style.display = 'block';
      }
      selectElem.setAttribute('required', 'required');
    }
  }

  // Populate dropdown on script load
  updateAdminRoleSelectDropdown();

  // Reset local locks and sessions handler
  const resetLocksBtn = document.getElementById('admin-reset-locks');
  if (resetLocksBtn) {
    resetLocksBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('gravity-admin-locks');
      localStorage.removeItem('gravity-user-session');
      alert('Local admin locks and active sessions cleared successfully!');
      window.location.reload();
    });
  }

  // Dynamic Role Selection visibility based on typed email
  const adminEmailInput = document.getElementById('admin-email');
  if (adminEmailInput) {
    adminEmailInput.addEventListener('input', async () => {
      const emailVal = adminEmailInput.value.trim().toLowerCase();
      const claimed = await fetchClaimedRoles();
      
      let isBound = false;
      Object.keys(claimed).forEach(roleKey => {
        if (claimed[roleKey].email === emailVal) {
          isBound = true;
        }
      });
      
      const selectElem = document.getElementById('admin-role-select');
      const inputGroup = selectElem ? selectElem.closest('.portal-input-group') : null;
      
      if (isBound) {
        if (inputGroup) {
          inputGroup.style.display = 'none';
        }
        if (selectElem) selectElem.removeAttribute('required');
      } else {
        await updateAdminRoleSelectDropdown();
      }
    });
  }

  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    adminLoginError.style.display = 'none';

    const email = document.getElementById('admin-email').value.trim().toLowerCase();
    const password = document.getElementById('admin-password').value;
    const selectedRole = document.getElementById('admin-role-select')?.value;

    const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerText : "INITIALIZE OVERRIDE";

    if (submitBtn) {
      submitBtn.innerText = "AUTHENTICATING...";
      submitBtn.disabled = true;
    }

    try {
      const claimed = await fetchClaimedRoles();
      
      let boundRole = null;
      Object.keys(claimed).forEach(roleKey => {
        if (claimed[roleKey].email === email) {
          boundRole = roleKey;
        }
      });

      if (boundRole) {
        const roleUuid = ADMIN_ROLE_UUIDS[boundRole];
        let loginOk = false;

        if (supabaseClient) {
          try {
            const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
              email: email,
              password: password
            });

            if (!authError && authData && authData.user) {
              loginOk = true;
            } else {
              console.warn("Supabase Auth signIn failed:", authError?.message);
            }
          } catch (dbErr) {
            console.warn("Could not query role binding from database:", dbErr.message);
          }
        }

        if (!loginOk) {
          const localLocks = JSON.parse(localStorage.getItem('gravity-admin-locks')) || {};
          if (localLocks[boundRole] && localLocks[boundRole].password === password) {
            loginOk = true;
          }
        }

        if (submitBtn) {
          submitBtn.innerText = originalText;
          submitBtn.disabled = false;
        }

        if (loginOk) {
          loginSuccess({
            role: 'admin',
            email: email,
            uid: roleUuid,
            username: `${boundRole.toUpperCase()} Head`
          });
        } else {
          showError(adminLoginError, `ACCESS DENIED: Incorrect password for this corporate position.`);
        }
      } else {
        if (!selectedRole) {
          if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
          }
          showError(adminLoginError, `ACCESS DENIED: No available positions left to claim. Please check with the system administrator.`);
          return;
        }

        const roleUuid = ADMIN_ROLE_UUIDS[selectedRole];
        if (!roleUuid) {
          if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
          }
          showError(adminLoginError, 'SYSTEM ERROR: Invalid role selection.');
          return;
        }

        if (claimed[selectedRole]) {
          if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
          }
          showError(adminLoginError, `ACCESS DENIED: The position of ${selectedRole.toUpperCase()} is already claimed.`);
          return;
        }

        let emailAlreadyClaimed = Object.values(claimed).some(c => c.email === email);
        if (emailAlreadyClaimed) {
          if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
          }
          showError(adminLoginError, `ACCESS DENIED: This email is already associated with another corporate position.`);
          return;
        }

        const displayUsername = `${selectedRole.toUpperCase()} Head`;

        let claimSuccess = false;

        try {
          // Call the serverless backend to claim the role securely (RLS bypass)
          const claimRes = await fetch('/api/claim-admin-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: selectedRole, email, password })
          });

          if (claimRes.ok) {
            claimSuccess = true;
          } else {
            const errData = await claimRes.json();
            showError(adminLoginError, `REGISTRATION FAILED: ${errData.error?.message || 'Server error'}`);
          }
        } catch (apiErr) {
          console.warn("Backend Claim API failed, falling back to local simulation:", apiErr.message);
          // If offline or local testing without serverless functions running
          if (!supabaseClient) {
            claimSuccess = true;
          } else {
            showError(adminLoginError, `REGISTRATION FAILED: Could not reach backend serverless function.`);
          }
        }

        if (claimSuccess) {
          const localLocks = JSON.parse(localStorage.getItem('gravity-admin-locks')) || {};
          localLocks[selectedRole] = { email, password };
          localStorage.setItem('gravity-admin-locks', JSON.stringify(localLocks));

          if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
          }

          loginSuccess({
            role: 'admin',
            email: email,
            uid: roleUuid,
            username: displayUsername
          });
        } else {
          if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
          }
          return;
        }
      }
    } catch (err) {
      if (submitBtn) {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }
      showError(adminLoginError, `SYSTEM ERROR: ${err.message}`);
    }
  });

  // Logout Handlers
  function performLogout() {
    localStorage.removeItem('gravity-user-session');
    currentSession = null;
    updateAuthUI();
    closePortal();
    closeSidebar(); // Reset state and hide sidebar and windows
  }

  function loginSuccess(sessionData) {
    // Intercept corporate/admin role by UUID to assign role: 'admin' and their real name
    if (ADMIN_ROLE_DETAILS[sessionData.uid]) {
      const details = ADMIN_ROLE_DETAILS[sessionData.uid];
      sessionData.role = 'admin';
      sessionData.username = details.username;
      alert(`Welcome, ${details.title}!`);
    } else {
      alert(`Welcome back, ${sessionData.username}!`);
    }

    if (!sessionData.country) {
      sessionData.country = detectUserCountry(sessionData);
    }
    // Retain phone/country if same user and already exists in currentSession (since they aren't stored in Supabase profiles table)
    if (currentSession && (currentSession.email === sessionData.email || currentSession.uid === sessionData.uid)) {
      if (currentSession.phone && !sessionData.phone) {
        sessionData.phone = currentSession.phone;
      }
      if (currentSession.country && !sessionData.country) {
        sessionData.country = currentSession.country;
      }
    }
    localStorage.setItem('gravity-user-session', JSON.stringify(sessionData));
    currentSession = sessionData;
    updateAuthUI();
    
    // Open correct dashboard/sidebar
    closePortal();
    openSidebar();
  }

  function showError(elem, text) {
    elem.innerText = text;
    elem.style.display = 'block';
  }

  // Admin Console Action Trigger Details
  const toggleSandboxBtn = document.getElementById('admin-toggle-sandbox');
  if (toggleSandboxBtn) {
    toggleSandboxBtn.addEventListener('click', () => {
      let sandbox = localStorage.getItem('gravity-sandbox-mode') === 'true';
      sandbox = !sandbox;
      localStorage.setItem('gravity-sandbox-mode', sandbox);
      alert(`[SYSTEM CONTROL] Sandbox Mode set to ${sandbox ? 'ACTIVE (Offline AI Mocking)' : 'INACTIVE (Live API keys)'}`);
      console.log(`[ADMIN OVERRIDE] Toggle sandbox mode: ${sandbox}`);
    });
  }

  const adjustRevenueBtn = document.getElementById('admin-adjust-revenue');
  if (adjustRevenueBtn) {
    adjustRevenueBtn.addEventListener('click', () => {
      const newTarget = prompt("Enter new Revenue Growth Target (millions USD):", "150");
      if (newTarget) {
        alert(`[SYSTEM CONTROL] Revenue Target adjusted to $${newTarget}M. Main dashboard graphics updated.`);
        console.log(`[ADMIN OVERRIDE] Revenue goal updated: $${newTarget}M`);
      }
    });
  }

  const resetSystemBtn = document.getElementById('admin-reset-system');
  if (resetSystemBtn) {
    resetSystemBtn.addEventListener('click', () => {
      if (confirm("WARNING: Are you sure you want to restore default application configs? This clears session caches.")) {
        localStorage.clear();
        alert("System caches flushed. Re-initializing ecosystem...");
        window.location.reload();
      }
    });
  }

  // --- DYNAMIC BILLING RECEIPT MODAL EVENT HANDLERS & HELPERS ---
  const receiptOverlay = document.getElementById('receipt-modal-overlay');
  const closeReceiptBtn = document.getElementById('close-receipt-btn');
  const closeReceiptBottomBtn = document.getElementById('close-receipt-bottom-btn');
  const printReceiptBtn = document.getElementById('print-receipt-btn');
  let activeReceiptItem = null;

  if (closeReceiptBtn) {
    closeReceiptBtn.addEventListener('click', () => {
      if (receiptOverlay) receiptOverlay.style.display = 'none';
      activeReceiptItem = null;
    });
  }
  if (closeReceiptBottomBtn) {
    closeReceiptBottomBtn.addEventListener('click', () => {
      if (receiptOverlay) receiptOverlay.style.display = 'none';
      activeReceiptItem = null;
    });
  }
  if (printReceiptBtn) {
    printReceiptBtn.addEventListener('click', () => {
      if (activeReceiptItem) {
        printReceiptWindow(activeReceiptItem);
      }
    });
  }

  function printReceiptWindow(purchase) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocked! Please allow popups to print the receipt.");
      return;
    }
    
    let headName = "Thontadaraya (CTO & Tech Head)";
    if (purchase.serviceId === 'youtube_intro' || purchase.serviceId === 'vfx_package') {
      headName = "Munish (Director of VFX & Animation)";
    } else if (purchase.serviceId === 'anime_design') {
      headName = "Ajay Raj B.K (Founder & Creative Director)";
    }
    
    const remaining = purchase.totalCost - purchase.paidAmount;
    const isFinal = remaining <= 0;
    const custName = currentSession ? currentSession.username : 'Valued Client';
    const custContact = currentSession && currentSession.phone ? currentSession.phone : '+91 98920 10101';
    
    const purchaseCurrency = purchase.currency || (purchase.totalCost > 500 ? 'INR' : 'USD');
    const symbol = purchaseCurrency === 'INR' ? '₹' : '$';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice Receipt - ${purchase.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 2rem; color: #333; line-height: 1.5; }
            .receipt-box { max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 2rem; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .logo { height: 40px; vertical-align: middle; margin-right: 10px; }
            .title { font-size: 1.5rem; font-weight: bold; color: #111; letter-spacing: 1px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
            .panel { background: #f9f9f9; padding: 1rem; border-radius: 6px; border: 1px solid #eee; }
            .panel h3 { margin: 0 0 0.5rem 0; font-size: 0.95rem; color: #b026ff; border-bottom: 1px solid #eee; padding-bottom: 0.25rem; }
            .totals { border-top: 2px dashed #eee; padding-top: 1rem; margin-top: 1rem; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
            .total-row.bold { font-weight: bold; font-size: 1.1rem; color: #000; }
            .footer-msg { text-align: center; margin-top: 2rem; padding: 1rem; border-radius: 6px; background: ${isFinal ? '#e8f5e9' : '#fff3e0'}; border: 1px solid ${isFinal ? '#4caf50' : '#ffb74d'}; font-weight: bold; font-size: 0.9rem; }
            @media print {
              body { padding: 0; }
              .receipt-box { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div style="display:flex; align-items:center;">
                <img class="logo" src="https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/logo.png" alt="Company Logo">
                <span class="title">GRAVITY STUDIOS</span>
              </div>
              <div style="text-align:right; font-size:0.85rem;">
                <strong>Invoice Reference:</strong> TXN-${purchase.id.substring(4)}<br>
                <strong>Date:</strong> ${purchase.date}
              </div>
            </div>
            
            <div class="grid">
              <div class="panel">
                <h3>Customer Details</h3>
                <strong>Name:</strong> ${custName}<br>
                <strong>Contact Number:</strong> ${custContact}
              </div>
              
              <div class="panel">
                <h3>Service Information</h3>
                <strong>Service Booked:</strong> ${purchase.serviceName}<br>
                <strong>Founder:</strong> Ajay Raj B.K<br>
                <strong>CEO:</strong> Shashank Raj B.K<br>
                <strong>Dept. Head:</strong> ${headName}
              </div>
            </div>
            
            <div class="totals">
              <div class="total-row">
                <span>Total Project Cost:</span>
                <span>${symbol}${purchase.totalCost.toLocaleString()}</span>
              </div>
              <div class="total-row" style="color: #4caf50; font-weight: bold;">
                <span>Amount Paid This Term:</span>
                <span>${symbol}${(isFinal ? purchase.totalCost / 2 : purchase.paidAmount).toLocaleString()}</span>
              </div>
              <div class="total-row bold">
                <span>Remaining Balance:</span>
                <span>${symbol}${remaining.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="footer-msg">
              ${isFinal 
                ? "Thank you for using our service. If any other service is required, please visit us again." 
                : "Waiting for your final payment. Final payment must be made at least 12 hours prior to delivery."
              }
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function showInvoiceBill(purchase) {
    activeReceiptItem = purchase;
    const content = document.getElementById('receipt-content');
    if (!content) return;
    
    const remaining = purchase.totalCost - purchase.paidAmount;
    const isFinal = remaining <= 0;
    
    let headName = "Thontadaraya (CTO & Tech Head)";
    if (purchase.serviceId === 'youtube_intro' || purchase.serviceId === 'vfx_package') {
      headName = "Munish (Director of VFX & Animation)";
    } else if (purchase.serviceId === 'anime_design') {
      headName = "Ajay Raj B.K (Founder & Creative Director)";
    }
    
    const custName = currentSession ? currentSession.username : 'Valued Client';
    const custContact = currentSession && currentSession.phone ? currentSession.phone : '+91 98920 10101';
    
    const purchaseCurrency = purchase.currency || (purchase.totalCost > 500 ? 'INR' : 'USD');
    const symbol = purchaseCurrency === 'INR' ? '₹' : '$';
    
    content.innerHTML = `
      <div style="font-size:0.85rem; line-height:1.6;">
        <div style="display:flex; justify-content:space-between; margin-bottom:1rem; font-size:0.8rem; color:var(--text-muted);">
          <div>
            <strong>Receipt:</strong> TXN-${purchase.id.substring(4)}<br>
            <strong>Date:</strong> ${purchase.date}
          </div>
          <div style="text-align:right;">
            <strong>Service ID:</strong> ${purchase.serviceId || 'N/A'}<br>
            <strong>Purchase ID:</strong> ${purchase.id}
          </div>
        </div>
        
        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:0.75rem; border-radius:8px; margin-bottom:1rem;">
          <h6 style="margin:0 0 0.5rem 0; font-size:0.9rem; color:var(--neon-cyan); font-weight:700;">Customer Details</h6>
          <strong>Name:</strong> ${custName}<br>
          <strong>Contact Number:</strong> ${custContact}
        </div>

        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:0.75rem; border-radius:8px; margin-bottom:1rem;">
          <h6 style="margin:0 0 0.5rem 0; font-size:0.9rem; color:var(--neon-purple); font-weight:700;">Service Information</h6>
          <strong>Service Name:</strong> ${purchase.serviceName}<br>
          <strong>Founder Name:</strong> Ajay Raj B.K<br>
          <strong>CEO Name:</strong> Shashank Raj B.K<br>
          <strong>Service Provider Head Name:</strong> ${headName}
        </div>

        <div style="border-bottom:1px solid var(--glass-border); padding-bottom:0.5rem; margin-bottom:0.5rem;">
          <div style="display:flex; justify-content:space-between;">
            <span>Total Cost:</span>
            <span>${symbol}${purchase.totalCost.toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:bold; color:var(--neon-green);">
            <span>Amount Paid This Term:</span>
            <span>${symbol}${(isFinal ? purchase.totalCost / 2 : purchase.paidAmount).toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:bold;">
            <span>Remaining Amount:</span>
            <span style="color:${remaining > 0 ? 'var(--neon-amber)' : 'var(--neon-green)'}">${symbol}${remaining.toLocaleString()}</span>
          </div>
        </div>

        <div style="text-align:center; margin-top:1.25rem; padding:0.75rem; border-radius:8px; background:${isFinal ? 'rgba(57,255,20,0.1)' : 'rgba(255,170,0,0.1)'}; border:1px solid ${isFinal ? 'var(--neon-green)' : 'var(--neon-amber)'}; font-weight:bold; font-size:0.8rem; line-height:1.4;">
          ${isFinal 
            ? "Thank you for using our service. If any other service is required, please visit us again." 
            : "Waiting for your final payment. Final payment must be made at least 12 hours prior to delivery."
          }
        </div>
      </div>
    `;
    
    if (receiptOverlay) receiptOverlay.style.display = 'flex';
  }

  function checkAndApplyPostponement(p) {
    if (p.status !== 'completed' && p.status !== 'refund_denied') {
      return; // Only applies to projects ready for final delivery
    }

    const now = Date.now();
    const deadline = new Date(p.deliveryDeadline).getTime();
    const timeRemaining = deadline - now;

    // If less than 12 hours remaining and not postponed yet, postpone it by 24 hours
    if (timeRemaining < 12 * 60 * 60 * 1000 && !p.postponed) {
      p.postponed = true;
      p.deliveryDeadline = new Date(deadline + 24 * 60 * 60 * 1000).toISOString();
      
      // Save updated state
      let localPurchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
      const idx = localPurchases.findIndex(item => item.id === p.id);
      if (idx !== -1) {
        localPurchases[idx].postponed = true;
        localPurchases[idx].deliveryDeadline = p.deliveryDeadline;
        localStorage.setItem('gravity-user-purchases', JSON.stringify(localPurchases));
      }

      if (supabaseClient && currentSession && currentSession.uid && !currentSession.uid.startsWith('local_')) {
        supabaseClient
          .from('purchases')
          .update({
            postponed: true,
            delivery_deadline: p.deliveryDeadline
          })
          .eq('id', p.id)
          .then(({ error }) => {
            if (error) console.warn("Failed to sync postponement update to Supabase", error);
          });
      }

      addSystemNotification(
        "Project Delivery Postponed",
        `Delivery of '${p.serviceName}' has been postponed by 24 hours because the final payment was not received 12 hours prior to the deadline.`
      );
    }
  }

  // --- SERVICE PRICING MANAGER (ADMIN CONTROL) ---
  function renderAdminPricingEditor() {
    const container = document.getElementById('admin-pricing-inputs');
    if (!container) return;
    
    const prices = getServicePrices();
    container.innerHTML = '';
    
    prices.forEach(s => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.gap = '0.25rem';
      row.style.padding = '0.5rem';
      row.style.background = 'rgba(255,255,255,0.02)';
      row.style.border = '1px solid rgba(255,255,255,0.05)';
      row.style.borderRadius = '6px';
      
      row.innerHTML = `
        <div style="font-weight:bold; color:var(--neon-cyan); font-size:0.8rem;">${s.name}</div>
        <div style="display:flex; gap:0.5rem;">
          <div style="flex:1; display:flex; align-items:center; gap:0.25rem;">
            <span style="font-size:0.75rem; color:var(--text-muted);">INR:</span>
            <input type="number" class="price-input-inr" data-id="${s.id}" value="${s.priceINR}" style="width:100%; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; padding:0.25rem; font-family:monospace; font-size:0.8rem; border-radius:4px;">
          </div>
          <div style="flex:1; display:flex; align-items:center; gap:0.25rem;">
            <span style="font-size:0.75rem; color:var(--text-muted);">USD:</span>
            <input type="number" class="price-input-usd" data-id="${s.id}" value="${s.priceUSD}" style="width:100%; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; padding:0.25rem; font-family:monospace; font-size:0.8rem; border-radius:4px;">
          </div>
        </div>
      `;
      container.appendChild(row);
    });
  }

  const pricingForm = document.getElementById('admin-pricing-form');
  if (pricingForm) {
    pricingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const prices = getServicePrices();
      const updatedPrices = prices.map(s => {
        const inrInput = pricingForm.querySelector(`.price-input-inr[data-id="${s.id}"]`);
        const usdInput = pricingForm.querySelector(`.price-input-usd[data-id="${s.id}"]`);
        return {
          ...s,
          priceINR: inrInput ? parseFloat(inrInput.value) || 0 : s.priceINR,
          priceUSD: usdInput ? parseFloat(usdInput.value) || 0 : s.priceUSD
        };
      });
      
      localStorage.setItem('gravity_service_prices', JSON.stringify(updatedPrices));
      
      // Sync with Supabase if active
      if (supabaseClient) {
        try {
          supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
              const response = await fetch('/api/admin-action', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  action: 'update-pricing',
                  payload: { updatedPrices }
                })
              });
              if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || `HTTP ${response.status}`);
              }
            } else {
              throw new Error("No active admin session found.");
            }
          }).catch(err => {
            console.warn("Secure pricing update failed, falling back to direct client-side DB upsert:", err);
            supabaseClient
              .from('service_catalog')
              .upsert(updatedPrices.map(u => ({
                id: u.id,
                name: u.name,
                price_inr: u.priceINR,
                price_usd: u.priceUSD
              })))
              .then(({ error }) => {
                if (error) console.warn("Supabase pricing sync warning:", error.message);
              });
          });
        } catch(err) {
          console.warn("Supabase pricing upsert error:", err);
        }
      }
      
      alert("Service pricing updated successfully inside the system database!");
      renderPayments();
      renderServiceTracking();
    });
  }

// ==========================================================================
// XI. ROLE-BASED ADMIN CONTROL & CLIENT PROGRESS TRACKING HELPER FUNCTIONS
// ==========================================================================

function getDepartmentForEmail(email) {
  if (currentSession && currentSession.role === 'admin') {
    const uid = currentSession.uid;
    if (uid === 'f0000000-0000-0000-0000-000000000001' || uid === 'c0000000-0000-0000-0000-000000000002') {
      return 'all';
    }
    if (uid === 'a0000000-0000-0000-0000-000000000003') return 'ai';
    if (uid === 'd0000000-0000-0000-0000-000000000004') return 'dev';
    if (uid === 'e0000000-0000-0000-0000-000000000005') return 'design';
    if (uid === 'b0000000-0000-0000-0000-000000000006') return 'video';
    if (uid === 'b0000000-0000-0000-0000-000000000007') return 'marketing';
    if (uid === 'b0000000-0000-0000-0000-000000000008') return 'support';
  }

  if (!email) return 'none';
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === 'founder@gravitystudios.com' || cleanEmail === 'ceo@gravitystudios.com' || cleanEmail === 'admin@gravitystudios.com' || cleanEmail === 'ajay@gravitystudios.com' || cleanEmail === 'shashank@gravitystudios.com') {
    return 'all';
  }
  const prefix = cleanEmail.split('@')[0];
  if (prefix === 'ai' || prefix === 'thontadaraya' || prefix === 'thontadarya') return 'ai';
  if (prefix === 'dev' || prefix === 'web' || prefix === 'pruthvi') return 'dev';
  if (prefix === 'design' || prefix === 'shreyas') return 'design';
  if (prefix === 'video' || prefix === 'munish') return 'video';
  if (prefix === 'marketing' || prefix === 'subhash') return 'marketing';
  if (prefix === 'support' || prefix === 'pavan') return 'support';
  return 'none';
}

function serviceMatchesDepartment(serviceId, department) {
  if (!serviceId) return false;
  if (department === 'all') return true;
  const cleanId = serviceId.toLowerCase();
  if (department === 'ai') {
    return cleanId.startsWith('ai_') || cleanId === 'custom_ai_solution' || cleanId === 'enterprise_ai';
  }
  if (department === 'dev') {
    return [
      'business_website', 'premium_website', 'web_application', 'mobile_app', 
      'saas_platform', 'crm_erp_system', 'dashboard_development', 
      'api_integration', 'cloud_deployment', 'startup_mvp', 'cto_service'
    ].includes(cleanId);
  }
  if (department === 'design') {
    return ['logo_design', 'brand_identity', 'ui_ux_design', 'presentation_design', 'graphic_design'].includes(cleanId);
  }
  if (department === 'video') {
    return ['ai_video', 'animation', 'explainer_video', 'motion_graphics', 'product_advertisement'].includes(cleanId);
  }
  if (department === 'marketing') {
    return ['seo', 'social_media', 'google_ads', 'meta_ads', 'email_marketing'].includes(cleanId);
  }
  if (department === 'support') {
    return ['domain_hosting', 'website_maintenance', 'security_audit'].includes(cleanId);
  }
  return false;
}

function initAdminEvents() {
  if (window.adminEventsBound) return;

  const targetSelect = document.getElementById('admin-window-notif-target');
  const userSelectContainer = document.getElementById('admin-window-notif-user-select-container');
  if (targetSelect && userSelectContainer) {
    targetSelect.addEventListener('change', async () => {
      if (targetSelect.value === 'individual') {
        userSelectContainer.style.display = 'block';
        await populateNotificationUserSelect();
      } else {
        userSelectContainer.style.display = 'none';
      }
    });
  }

  const notifForm = document.getElementById('admin-window-notification-form');
  if (notifForm) {
    notifForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('admin-window-notif-title').value.trim();
      const desc = document.getElementById('admin-window-notif-desc').value.trim();
      const target = targetSelect ? targetSelect.value : 'group';
      const userSelect = document.getElementById('admin-window-notif-user-select');
      const targetUserId = target === 'individual' && userSelect ? userSelect.value : null;

      try {
        await publishTargetedNotification(title, desc, targetUserId);
        alert(`Notification successfully dispatched to ${target === 'group' ? 'all users' : 'selected user'}!`);
        notifForm.reset();
        if (userSelectContainer) userSelectContainer.style.display = 'none';
      } catch (err) {
        alert(`Error sending notification: ${err.message}`);
      }
    });
  }

  const clientSelect = document.getElementById('admin-progress-client-select');
  const progressControls = document.getElementById('admin-progress-controls');
  if (clientSelect && progressControls) {
    clientSelect.addEventListener('change', () => {
      const purchaseId = clientSelect.value;
      if (!purchaseId) {
        progressControls.style.display = 'none';
        return;
      }
      
      progressControls.style.display = 'block';
      loadClientProjectDetails(purchaseId);
    });
  }

  const progressForm = document.getElementById('admin-progress-update-form');
  if (progressForm) {
    progressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const purchaseId = document.getElementById('admin-progress-client-select').value;
      const step = document.getElementById('admin-progress-step-select').value;
      
      try {
        await updateClientProjectProgress(purchaseId, step);
        alert("Client project progress successfully updated!");
        
        // Refresh dropdown and stats
        const dept = getDepartmentForEmail(currentSession?.email);
        await loadProgressClientDropdown(dept);
        await loadAdminOverviewStats(dept);
        
        if (typeof renderServiceTracking === 'function') {
          renderServiceTracking();
        }
      } catch (err) {
        alert(`Error saving progress: ${err.message}`);
      }
    });
  }

  const addTimeBtn = document.getElementById('admin-progress-add-time-btn');
  if (addTimeBtn) {
    addTimeBtn.addEventListener('click', async () => {
      const purchaseId = document.getElementById('admin-progress-client-select').value;
      const minutes = parseInt(document.getElementById('admin-progress-time-input').value) || 0;
      if (!purchaseId || minutes <= 0) {
        alert("Please select a client project and enter minutes.");
        return;
      }

      try {
        const deadline = new Date(Date.now() + minutes * 60 * 1000).toISOString();
        await updateClientProjectDeadline(purchaseId, deadline);
        alert(`Timer successfully set! Estimated delivery deadline updated.`);
        
        // Refresh progress view and stats
        const dept = getDepartmentForEmail(currentSession?.email);
        await loadAdminOverviewStats(dept);
        loadClientProjectDetails(purchaseId);
        
        if (typeof renderServiceTracking === 'function') {
          renderServiceTracking();
        }
      } catch (err) {
        alert(`Error updating deadline: ${err.message}`);
      }
    });
  }

  window.adminEventsBound = true;
}

async function populateNotificationUserSelect() {
  const selectElem = document.getElementById('admin-window-notif-user-select');
  if (!selectElem) return;
  selectElem.innerHTML = '<option value="">-- Select User --</option>';

  let users = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, username, email, avatar_url');
    if (!error && data) {
      users = data.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        avatar_url: u.avatar_url
      }));
    }
  }
  
  const localUsers = JSON.parse(localStorage.getItem('gravity-registered-users')) || [];
  localUsers.forEach(lu => {
    const mockId = 'local_' + lu.username.toLowerCase().replace(/\s+/g, '_');
    if (!users.some(u => u.email === lu.email)) {
      users.push({
        id: mockId,
        username: lu.username,
        email: lu.email,
        avatar_url: lu.avatarUrl || lu.avatar_url
      });
    }
  });

  // Filter only for Google logins (excluding master admin accounts)
  const googleLogins = users.filter(u => {
    const isMasterAdmin = u.id === 'f0000000-0000-0000-0000-000000000001' || 
                          u.id === 'c0000000-0000-0000-0000-000000000002';
    return !isMasterAdmin;
  });

  googleLogins.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.innerText = `${u.username} (${u.email}) [Google]`;
    selectElem.appendChild(opt);
  });
}

async function loadAdminOverviewStats(dept) {
  const isSuper = (dept === 'all');
  const roleLabel = document.getElementById('admin-role-label');
  const deptLabel = document.getElementById('admin-dept-label');
  if (roleLabel) roleLabel.innerText = isSuper ? 'FOUNDER/CEO' : 'DEPARTMENT HEAD';
  if (deptLabel) deptLabel.innerText = dept.toUpperCase();

  let purchases = [];
  let txs = [];

  if (supabaseClient) {
    const { data: purData } = await supabaseClient.from('purchases').select('*');
    if (purData) purchases = purData;

    const { data: txData } = await supabaseClient.from('transactions').select('*');
    if (txData) txs = txData;
  } else {
    purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
    txs = JSON.parse(localStorage.getItem('gravity-transactions')) || [];
  }

  // Filter purchases by department
  const deptPurchases = purchases.filter(p => serviceMatchesDepartment(p.service_id || p.serviceId, dept));
  const activeCount = deptPurchases.filter(p => p.status !== 'refund_approved' && p.status !== 'fully_paid').length;

  // Filter transactions by department
  const deptTxs = txs.filter(t => {
    const prices = getServicePrices();
    const service = prices.find(s => s.name === t.service);
    return service ? serviceMatchesDepartment(service.id, dept) : (dept === 'all');
  });

  const totalRevenue = deptTxs.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const activeCountElem = document.getElementById('admin-stat-active-services');
  const revenueElem = document.getElementById('admin-stat-total-payments');

  if (activeCountElem) activeCountElem.innerText = activeCount;
  if (revenueElem) {
    const symbol = currentSession && currentSession.country === 'IN' ? '₹' : '$';
    revenueElem.innerText = `${symbol}${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

async function loadProgressClientDropdown(dept) {
  const selectElem = document.getElementById('admin-progress-client-select');
  if (!selectElem) return;
  
  const prevVal = selectElem.value;
  selectElem.innerHTML = '<option value="">-- Select Active Project --</option>';

  let purchases = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('purchases')
      .select('*, profiles(username, email)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      purchases = data;
    }
  } else {
    purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
  }

  // Filter to show active projects
  const activeProjects = purchases.filter(p => {
    const statusVal = p.status;
    const isAct = statusVal !== 'refund_approved' && statusVal !== 'fully_paid';
    const isMatch = serviceMatchesDepartment(p.service_id || p.serviceId, dept);
    return isAct && isMatch;
  });

  activeProjects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    const userLabel = p.profiles ? p.profiles.username : (p.username || 'Client');
    const emailLabel = p.profiles ? p.profiles.email : (p.email || '');
    opt.innerText = `${p.service_name || p.serviceName} (${userLabel} - ${emailLabel})`;
    selectElem.appendChild(opt);
  });

  if (prevVal) {
    selectElem.value = prevVal;
  }
}

async function loadClientProjectDetails(purchaseId) {
  let p = null;
  if (supabaseClient) {
    const { data } = await supabaseClient.from('purchases').select('*').eq('id', purchaseId).single();
    if (data) p = data;
  } else {
    const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
    p = purchases.find(item => item.id === purchaseId);
  }

  if (!p) return;

  const infoElem = document.getElementById('admin-progress-client-info');
  if (infoElem) {
    infoElem.innerText = `Updating: ${p.service_name || p.serviceName}`;
  }

  // Set step selection
  const stepSelect = document.getElementById('admin-progress-step-select');
  if (stepSelect) {
    let stepVal = p.status;
    if (stepVal === 'advance_paid') stepVal = 'progress_planning';
    if (stepVal === 'completed') stepVal = 'progress_ready_to_produce';
    stepSelect.value = stepVal;
  }

  // Set remaining time input
  const timeInput = document.getElementById('admin-progress-time-input');
  const deadline = p.delivery_deadline || p.deliveryDeadline;
  if (timeInput && deadline) {
    const deadlineTime = new Date(deadline).getTime();
    const remainingMin = Math.max(1, Math.round((deadlineTime - Date.now()) / (60 * 1000)));
    timeInput.value = remainingMin;
  } else if (timeInput) {
    timeInput.value = 120;
  }
}

async function updateClientProjectProgress(purchaseId, progressStep) {
  let dbStatus = progressStep;
  if (progressStep === 'progress_ready_to_produce') {
    dbStatus = 'completed';
  }

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('purchases')
      .update({ status: dbStatus })
      .eq('id', purchaseId);
    
    if (error) throw error;
  } else {
    const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
    const idx = purchases.findIndex(item => item.id === purchaseId);
    if (idx !== -1) {
      purchases[idx].status = dbStatus;
      localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));
    }
  }

  // Notify client
  let serviceName = "Your service";
  let clientId = null;
  
  if (supabaseClient) {
    const { data } = await supabaseClient.from('purchases').select('service_name, user_id').eq('id', purchaseId).single();
    if (data) {
      serviceName = data.service_name;
      clientId = data.user_id;
    }
  } else {
    const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
    const item = purchases.find(u => u.id === purchaseId);
    if (item) {
      serviceName = item.serviceName;
      clientId = 'local_user';
    }
  }

  const stepLabelsMap = {
    'progress_planning': 'Planning Phase',
    'progress_modeling': 'Modeling Phase',
    'progress_developing': 'Developing Phase',
    'progress_preprocessing': 'Preprocessing Phase',
    'progress_testing': 'Testing & QA Phase',
    'progress_ready_to_produce': 'Ready to Produce & Awaiting Final Invoice Payment',
    'completed': 'Ready to Produce & Awaiting Final Invoice Payment',
    'fully_paid': 'Delivered & Complete'
  };

  const friendlyStep = stepLabelsMap[progressStep] || progressStep;
  await publishTargetedNotification(
    `Project Status Update: ${serviceName}`,
    `Your creative team has updated the status of your project '${serviceName}' to: ${friendlyStep}.`,
    clientId
  );
}

async function updateClientProjectDeadline(purchaseId, deadlineIso) {
  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('purchases')
      .update({ delivery_deadline: deadlineIso })
      .eq('id', purchaseId);
    
    if (error) throw error;
  } else {
    const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
    const idx = purchases.findIndex(item => item.id === purchaseId);
    if (idx !== -1) {
      purchases[idx].deliveryDeadline = deadlineIso;
      localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));
    }
  }
}

async function loadAdminRefundsList() {
  const container = document.getElementById('admin-window-refund-claims-list');
  if (!container) return;

  let refunds = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('refunds')
      .select('*, purchases(*, profiles(*))')
      .order('created_at', { ascending: false });

    if (!error && data) {
      refunds = data.map(r => ({
        id: r.id,
        purchaseId: r.purchase_id,
        user: r.purchases && r.purchases.profiles ? r.purchases.profiles.username : 'User',
        serviceName: r.purchases ? r.purchases.service_name : 'Service',
        explanation: r.explanation,
        fileName: r.evidence_url ? r.evidence_url.split('/').pop() : 'Evidence',
        amount: r.purchases ? parseFloat(r.purchases.paid_amount) : 0,
        status: r.status,
        evidenceUrl: r.evidence_url
      }));
    }
  } else {
    refunds = JSON.parse(localStorage.getItem('gravity-refunds')) || [];
  }

  container.innerHTML = '';
  if (refunds.length === 0) {
    container.innerHTML = `<p class="text-muted">> Awaiting refund dispute submissions...</p>`;
  } else {
    refunds.forEach(ref => {
      const div = document.createElement('div');
      div.className = 'admin-refund-row';
      div.style.padding = '0.5rem';
      div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
      div.style.marginBottom = '0.5rem';

      let buttonsHtml = '';
      if (ref.status === 'pending') {
        buttonsHtml = `
          <div style="margin-top:0.35rem; display:flex; gap:0.5rem;">
            <button class="admin-window-claim-btn approve" data-id="${ref.id}" style="background:#4caf50; color:#fff; border:none; padding:0.2rem 0.5rem; font-family:inherit; font-size:0.7rem; font-weight:bold; border-radius:3px; cursor:pointer;">Approve</button>
            <button class="admin-window-claim-btn deny" data-id="${ref.id}" style="background:#ff3366; color:#fff; border:none; padding:0.2rem 0.5rem; font-family:inherit; font-size:0.7rem; font-weight:bold; border-radius:3px; cursor:pointer;">Deny</button>
          </div>
        `;
      } else {
        buttonsHtml = `<div style="font-size:0.7rem; color:${ref.status === 'approved' ? 'var(--neon-green)' : 'var(--neon-pink)'}; font-weight:bold; margin-top:0.25rem;">> CLAIM ${ref.status.toUpperCase()}</div>`;
      }

      let proofHtml = ref.evidenceUrl ? `<div style="font-size:0.75rem;"><a href="${ref.evidenceUrl}" target="_blank" style="color:var(--neon-amber); text-decoration:underline;">View Evidence</a></div>` : '';

      div.innerHTML = `
        <div style="color:#fff; font-weight:bold;">User: ${ref.user} • Service: ${ref.serviceName}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">Reason: "${ref.explanation}"</div>
        ${proofHtml}
        ${buttonsHtml}
      `;
      container.appendChild(div);
    });

    container.querySelectorAll('.admin-window-claim-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const action = btn.classList.contains('approve') ? 'approve' : 'deny';
        await processRefundClaim(id, action);
        await loadAdminRefundsList();
      });
    });
  }
}

async function loadAdminPaymentsList() {
  const container = document.getElementById('admin-window-payments-log-list');
  if (!container) return;

  let txs = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      txs = data;
    }
  } else {
    txs = JSON.parse(localStorage.getItem('gravity-transactions')) || [];
  }

  container.innerHTML = '';
  if (txs.length === 0) {
    container.innerHTML = `<p class="text-muted">> No payment transactions recorded yet.</p>`;
  } else {
    txs.forEach(t => {
      const div = document.createElement('div');
      div.className = 'admin-payment-row';
      div.style.padding = '0.3rem 0';
      div.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
      
      let label = t.type === 'booking' ? 'ADVANCE' : 'FINAL';
      if (t.amount < 0) label = 'REFUND';

      const symbol = t.currency === 'INR' ? '₹' : '$';
      div.innerHTML = `
        <span class="text-green">> [${t.date}]</span>
        <span style="color:#fff; font-weight:bold;">${symbol}${Math.abs(t.amount).toLocaleString()}</span>
        <span style="color:var(--neon-cyan);">(${label})</span>
        <span style="color:var(--text-muted);">by ${t.username} (${t.service})</span>
      `;
      container.appendChild(div);
    });
  }
}

async function loadAdminPricingManager() {
  const container = document.getElementById('admin-window-pricing-inputs');
  const form = document.getElementById('admin-window-pricing-form');
  if (!container || !form) return;

  const prices = getServicePrices();
  container.innerHTML = '';

  prices.forEach(s => {
    const row = document.createElement('div');
    row.className = 'pricing-edit-row';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.gap = '0.5rem';
    row.style.padding = '0.35rem 0';
    row.style.borderBottom = '1px solid rgba(255,255,255,0.03)';

    row.innerHTML = `
      <span style="color:#fff; font-size:0.8rem; font-weight:bold; flex:1;">${s.name}</span>
      <div style="display:flex; gap:0.25rem; align-items:center;">
        <span style="color:var(--text-muted); font-size:0.75rem;">₹</span>
        <input type="number" class="price-window-input-inr" data-id="${s.id}" value="${s.priceINR}" style="width:70px; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; padding:0.25rem; font-family:monospace; border-radius:3px;">
        <span style="color:var(--text-muted); font-size:0.75rem; margin-left:0.25rem;">$</span>
        <input type="number" class="price-window-input-usd" data-id="${s.id}" value="${s.priceUSD}" style="width:60px; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; padding:0.25rem; font-family:monospace; border-radius:3px;">
      </div>
    `;
    container.appendChild(row);
  });

  if (!window.adminPricingBound) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updatedPrices = prices.map(s => {
        const inrInput = form.querySelector(`.price-window-input-inr[data-id="${s.id}"]`);
        const usdInput = form.querySelector(`.price-window-input-usd[data-id="${s.id}"]`);
        return {
          ...s,
          priceINR: inrInput ? parseFloat(inrInput.value) || 0 : s.priceINR,
          priceUSD: usdInput ? parseFloat(usdInput.value) || 0 : s.priceUSD
        };
      });

      localStorage.setItem('gravity_service_prices', JSON.stringify(updatedPrices));

      if (supabaseClient) {
        try {
          const { data: { session } } = await supabaseClient.auth.getSession();
          if (session) {
            await fetch('/api/admin-action', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                action: 'update-pricing',
                payload: { updatedPrices }
              })
            });
          } else {
            await supabaseClient.from('service_catalog').upsert(updatedPrices.map(u => ({
              id: u.id,
              name: u.name,
              price_inr: u.priceINR,
              price_usd: u.priceUSD
            })));
          }
        } catch(err) {
          console.warn("Supabase pricing sync warning:", err);
        }
      }

      alert("Pricing catalog updated successfully!");
      if (typeof renderAdminPricingEditor === 'function') {
        renderAdminPricingEditor();
      }
    });
    window.adminPricingBound = true;
  }
}

async function publishTargetedNotification(title, desc, targetUserId) {
  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('notifications')
      .insert([{
        title: title,
        desc_text: desc,
        time_label: "Just now",
        is_read: false,
        user_id: targetUserId
      }]);
    if (error) throw error;
  } else {
    const notifs = JSON.parse(localStorage.getItem('gravity-system-notifications')) || [];
    notifs.unshift({
      id: Date.now(),
      title: title,
      desc: desc,
      time: "Just now",
      read: false,
      userId: targetUserId
    });
    localStorage.setItem('gravity-system-notifications', JSON.stringify(notifs));
  }
  
  if (typeof renderNotifications === 'function') {
    await renderNotifications();
  }
}
}

