// Gravity Studios - UI Interaction & Animation Controller (Vibrant & Family-Friendly)

document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  initThemeToggle();
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
const galleryAssets = [
  {
    type: 'image',
    category: 'posters',
    title: 'Civil Construction Services',
    desc: 'Professional civil site management and structural execution.',
    src: 'assets/images/posters/Civil_construction_services.jpeg',
    fallbackColor: '#b026ff'
  },
  {
    type: 'image',
    category: 'posters',
    title: 'Logo Designs',
    desc: 'High-end vector corporate branding and visual assets design.',
    src: 'assets/images/posters/Logo_designs.jpeg',
    fallbackColor: '#00f0ff'
  },
  {
    type: 'image',
    category: 'posters',
    title: 'YouTube Thumbnail Creations',
    desc: 'Creative graphic layouts and high-click-through cover arts.',
    src: 'assets/images/posters/Youtube_thumbnail_creations.jpeg',
    fallbackColor: '#ff0055'
  },
  {
    type: 'image',
    category: 'posters',
    title: 'Our Services',
    desc: 'Full overview of our creative and technical ecosystem offerings.',
    src: 'assets/images/posters/our_services.jpeg',
    fallbackColor: '#39ff14'
  },
  {
    type: 'image',
    category: 'posters',
    title: 'Price Quotations',
    desc: 'Competitive project valuations, packages, and custom quotes.',
    src: 'assets/images/posters/price_quations.jpeg',
    fallbackColor: '#ffaa00'
  },
  {
    type: 'image',
    category: 'posters',
    title: 'Team & Department Structure',
    desc: 'Organization grid highlighting active divisions and reporting lines.',
    src: 'assets/images/posters/team_memebers_with_department.jpeg',
    fallbackColor: '#00f0ff'
  }
];

let currentLightboxIdx = 0;

function initMediaGallery() {
  const cards = document.querySelectorAll('.gallery-card');
  const modal = document.getElementById('lightbox-modal');
  const modalWrapper = document.querySelector('.lightbox-content-wrapper');
  const modalCaption = document.querySelector('.lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const leftArrow = document.querySelector('.lightbox-arrow.left');
  const rightArrow = document.querySelector('.lightbox-arrow.right');

  // Open Lightbox
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-index'));
      openLightbox(idx);
    });
  });

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
      // Add custom fallback background for local files
      video.style.background = 'radial-gradient(circle, rgba(176,38,255,0.15) 0%, #000 100%)';
      
      // On error, show fallback card inside lightbox
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
    
    // Lucide support for poster fallbacks
    const iconName = item.type === 'video' ? 'video' : 'image';
    cardFallback.innerHTML = `
      <div class="gallery-placeholder-icon" style="color:${item.fallbackColor}; border-color:${item.fallbackColor}; background:${item.fallbackColor}15">
        <i data-lucide="${iconName}"></i>
      </div>
      <h4 class="gallery-placeholder-title">${item.title}</h4>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">[ Place real media in assets folder ]</p>
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
