// Gravity Studios - UI Interaction & Animation Controller (Vibrant & Family-Friendly)

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
  const profileForm = document.getElementById('profile-settings-form');
  const dockBtns = document.querySelectorAll('.dock-btn');
  let highestZIndex = 1040;
  
  if (!loginBtn || !overlay || !sidebar) return;

  // Initialize Session
  let currentSession = JSON.parse(localStorage.getItem('gravity-user-session')) || null;
  updateAuthUI();

  // URL Hash Trigger for Admin Modal
  function checkHashRoute() {
    if (window.location.hash === '#admin') {
      openPortal('admin-login');
      window.location.hash = ''; // Clear hash
    }
  }
  checkHashRoute();
  window.addEventListener('hashchange', checkHashRoute);

  // Secret Footer Trigger
  const footerLogo = document.querySelector('.footer-logo img');
  if (footerLogo) {
    footerLogo.style.cursor = 'pointer';
    footerLogo.addEventListener('dblclick', () => {
      openPortal('admin-login');
    });
  }

  // Header Login Button Click / Double Click Events
  loginBtn.addEventListener('click', () => {
    if (!currentSession) {
      openPortal('user-login');
    } else if (currentSession.role === 'admin') {
      openPortal('admin-dashboard');
    } else {
      toggleSidebar();
    }
  });

  loginBtn.addEventListener('dblclick', (e) => {
    e.preventDefault();
    openPortal('admin-login');
  });

  closeBtn.addEventListener('click', closePortal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePortal();
  });

  // Sidebar Open/Close/Toggle Handlers
  function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function openSidebar() {
    closePortal(); // Ensure modal is closed
    sidebar.style.display = 'flex';
    sidebar.offsetHeight; // Trigger reflow
    sidebar.classList.add('open');
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.add('open');
    }

    // Update Profile values inside elements
    if (currentSession) {
      document.getElementById('profile-username').value = currentSession.username || 'User';
      document.getElementById('profile-email').value = currentSession.email || '';
      document.getElementById('sidebar-username').innerText = currentSession.username || 'User';
      
      // Avatar placeholder letter
      const firstLetter = (currentSession.username || 'U').charAt(0).toUpperCase();
      document.getElementById('sidebar-avatar-placeholder').innerText = firstLetter;
    }
    
    // Trigger rendering of dynamic views
    renderNotifications();
    renderPayments();
    renderPurchasedServices();
    renderServiceTracking();
    
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
    // Close all open floating windows as well
    closeAllWindows();
    setTimeout(() => {
      if (!sidebar.classList.contains('open')) {
        sidebar.style.display = 'none';
      }
    }, 400);
  }

  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }
  if (sidebarLogout) {
    sidebarLogout.addEventListener('click', () => {
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

  // Profile Form Edit Handler
  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const updatedUsername = document.getElementById('profile-username').value.trim();
    if (updatedUsername.length < 3) {
      alert("Username must be at least 3 characters long.");
      return;
    }

    currentSession.username = updatedUsername;
    localStorage.setItem('gravity-user-session', JSON.stringify(currentSession));
    
    // Update local registrations list if user registered locally
    const users = JSON.parse(localStorage.getItem('gravity-registered-users')) || [];
    const userIndex = users.findIndex(u => u.email === currentSession.email);
    if (userIndex !== -1) {
      users[userIndex].username = updatedUsername;
      localStorage.setItem('gravity-registered-users', JSON.stringify(users));
    }

    // Update UI elements
    document.getElementById('sidebar-username').innerText = updatedUsername;
    document.getElementById('sidebar-avatar-placeholder').innerText = updatedUsername.charAt(0).toUpperCase();
    updateAuthUI();
    
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
  function renderNotifications() {
    const container = document.getElementById('notifications-list-container');
    if (!container) return;

    const notifs = JSON.parse(localStorage.getItem('gravity-system-notifications')) || [];
    container.innerHTML = '';

    if (notifs.length === 0) {
      container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 2rem 0;">No notifications received yet.</p>`;
      document.getElementById('sidebar-notif-count').style.display = 'none';
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
        <div class="notif-title" style="font-weight:700; color:var(--text-pure);">${notif.title}</div>
        <div class="notif-desc" style="font-size:0.85rem; color:var(--text-muted); margin:0.25rem 0;">${notif.desc}</div>
        <div class="notif-time" style="font-size:0.75rem; color:var(--neon-cyan);">${notif.time}</div>
      `;
      // Mark as read when clicked or viewed
      div.addEventListener('click', () => {
        if (!notif.read) {
          notif.read = true;
          localStorage.setItem('gravity-system-notifications', JSON.stringify(notifs));
          renderNotifications();
        }
      });
      container.appendChild(div);
    });
  }

  // Render Payments & Billing Tab
  function renderPayments() {
    const container = document.getElementById('invoices-list-container');
    if (!container) return;

    const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
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
          <th>Amount Paid</th>
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

      if (p.status === 'advance_paid') {
        statusClass = 'status-pending';
        statusText = 'Advance (50%)';
        actionHtml = `<button class="invoice-action-btn pay-final-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; background:rgba(0, 240, 255, 0.15); border:1px solid var(--neon-cyan); border-radius:4px; color:var(--neon-cyan); font-size:0.75rem; font-weight:bold; cursor:pointer;">Pay Final 50%</button>`;
      } else if (p.status === 'completed') {
        statusClass = 'status-pending';
        statusText = 'Awaiting Final';
        actionHtml = `
          <div style="display:flex; gap:0.35rem;">
            <button class="invoice-action-btn pay-final-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; background:rgba(0, 240, 255, 0.15); border:1px solid var(--neon-cyan); border-radius:4px; color:var(--neon-cyan); font-size:0.75rem; font-weight:bold; cursor:pointer;">Pay Final 50%</button>
            <button class="invoice-action-btn dispute-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; background:rgba(255, 51, 102, 0.15); border:1px solid #ff3366; border-radius:4px; color:#ff3366; font-size:0.75rem; font-weight:bold; cursor:pointer;">File Dispute</button>
          </div>
        `;
      } else if (p.status === 'refund_requested') {
        statusClass = 'status-pending';
        statusText = 'Disputed';
        actionHtml = `<span style="font-size:0.75rem; color:var(--neon-amber);">Reviewing Proof</span>`;
      } else if (p.status === 'refund_approved') {
        statusClass = 'status-refunded';
        statusText = 'Refunded (100%)';
        actionHtml = `<span style="font-size:0.75rem; color:#ff3366;">Funds Returned</span>`;
      } else if (p.status === 'refund_denied') {
        statusClass = 'status-pending';
        statusText = 'Dispute Denied';
        actionHtml = `<button class="invoice-action-btn pay-final-btn" data-id="${p.id}" style="padding:0.25rem 0.5rem; background:rgba(0, 240, 255, 0.15); border:1px solid var(--neon-cyan); border-radius:4px; color:var(--neon-cyan); font-size:0.75rem; font-weight:bold; cursor:pointer;">Pay Final 50%</button>`;
      }

      tr.innerHTML = `
        <td style="font-size:0.8rem;">${p.date}</td>
        <td>
          <div style="font-weight:bold; font-size:0.85rem; color:#fff;">${p.serviceName}</div>
          <div style="font-size:0.7rem; color:var(--text-muted);">Total: $${p.totalCost.toFixed(2)}</div>
        </td>
        <td style="font-size:0.85rem; font-weight:bold; color:var(--neon-cyan);">$${p.paidAmount.toFixed(2)}</td>
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

    document.querySelectorAll('.dispute-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const purchaseId = btn.getAttribute('data-id');
        showRefundPanel(purchaseId);
      });
    });
  }

  // Render Purchased Services History Tab
  function renderPurchasedServices() {
    const container = document.getElementById('purchased-services-list-container');
    if (!container) return;

    const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
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
  function renderServiceTracking() {
    const container = document.getElementById('service-tracking-list-container');
    if (!container) return;

    const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
    container.innerHTML = '';

    // Filter active (non-refunded) services
    const activeTrackings = purchases.filter(p => p.status !== 'refund_approved');

    if (activeTrackings.length === 0) {
      container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 2rem 0; font-size: 0.9rem;">No active services currently in development.</p>`;
      return;
    }

    activeTrackings.forEach(p => {
      const div = document.createElement('div');
      div.className = 'tracking-item';
      div.style.marginBottom = '1.5rem';
      div.style.background = 'rgba(255,255,255,0.01)';
      div.style.border = '1px solid var(--glass-border)';
      div.style.padding = '1.25rem';
      div.style.borderRadius = '12px';

      let statusMsg = '';
      let percent = 50;
      let step1 = 'completed'; // Booking
      let step2 = 'active';    // Production
      let step3 = 'pending';   // Approval
      let step4 = 'pending';   // Delivery
      let simulateBtnHtml = '';
      let finalPayBtnHtml = '';

      if (p.status === 'advance_paid') {
        statusMsg = `Preparing the ${p.serviceName.toLowerCase()}. It will be provided within 2 hours.`;
        percent = 50;
        simulateBtnHtml = `<button class="admin-action-btn simulate-complete-btn" data-id="${p.id}" style="margin-top:1rem; background:rgba(176, 38, 255, 0.15); border:1px solid var(--neon-purple); border-radius:6px; color:var(--neon-purple); font-size:0.75rem; padding:0.4rem 0.6rem; cursor:pointer; font-weight:bold; transition:all 0.2s;">[Dev Simulate] Complete Production</button>`;
      } else if (p.status === 'completed') {
        statusMsg = `Production completed. Awaiting remaining 50% final payment to release files.`;
        percent = 75;
        step2 = 'completed';
        step3 = 'active';
        finalPayBtnHtml = `
          <div style="margin-top:1rem; display:flex; gap:0.5rem;">
            <button class="invoice-action-btn pay-final-btn" data-id="${p.id}" style="padding:0.4rem 0.75rem; background:rgba(0, 240, 255, 0.15); border:1px solid var(--neon-cyan); border-radius:6px; color:var(--neon-cyan); font-weight:bold; font-size:0.8rem; cursor:pointer;">Pay Remaining 50% ($${(p.totalCost - p.paidAmount).toFixed(2)})</button>
            <button class="invoice-action-btn dispute-btn" data-id="${p.id}" style="padding:0.4rem 0.75rem; background:rgba(255, 51, 102, 0.15); border:1px solid #ff3366; border-radius:6px; color:#ff3366; font-weight:bold; font-size:0.8rem; cursor:pointer;">Dispute & Refund</button>
          </div>
        `;
      } else if (p.status === 'refund_requested') {
        statusMsg = `Dispute Filed. Under review by Gravity administration. Files held in escrow.`;
        percent = 75;
        step2 = 'completed';
        step3 = 'active'; // In dispute state
      } else if (p.status === 'refund_denied') {
        statusMsg = `Refund Dispute Denied by administration. Awaiting remaining 50% final payment to release files.`;
        percent = 75;
        step2 = 'completed';
        step3 = 'active';
        finalPayBtnHtml = `
          <div style="margin-top:1rem; display:flex; gap:0.5rem;">
            <button class="invoice-action-btn pay-final-btn" data-id="${p.id}" style="padding:0.4rem 0.75rem; background:rgba(0, 240, 255, 0.15); border:1px solid var(--neon-cyan); border-radius:6px; color:var(--neon-cyan); font-weight:bold; font-size:0.8rem; cursor:pointer;">Pay Remaining 50% ($${(p.totalCost - p.paidAmount).toFixed(2)})</button>
          </div>
        `;
      } else if (p.status === 'fully_paid') {
        statusMsg = `Delivered! Source files and production assets are ready for download.`;
        percent = 100;
        step2 = 'completed';
        step3 = 'completed';
        step4 = 'completed';
        finalPayBtnHtml = `
          <button class="admin-action-btn download-assets-btn" style="margin-top:1rem; background:rgba(57, 255, 20, 0.15); border:1px solid var(--neon-green); border-radius:6px; color:var(--neon-green); font-size:0.8rem; padding:0.5rem 1rem; cursor:pointer; font-weight:bold;" onclick="alert('Downloading standard zip package containing your compiled assets...')">
            <i data-lucide="download" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i> Download Production Package
          </button>
        `;
      }

      div.innerHTML = `
        <div class="tracking-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <h5 style="margin:0; font-size:1rem; color:#fff;">${p.serviceName}</h5>
          <span class="tracking-percent" style="font-size:0.9rem; font-weight:bold; color:var(--neon-cyan);">${percent}%</span>
        </div>
        <div class="tracking-bar-container" style="height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden; margin-bottom:1rem;">
          <div class="tracking-bar" style="width:${percent}%; height:100%; background:linear-gradient(90deg, var(--neon-purple), var(--neon-cyan)); border-radius:10px; transition: width 0.4s ease;"></div>
        </div>
        <p style="margin:0 0 1rem 0; font-size:0.85rem; color:var(--text-muted); line-height:1.4; border-left:2px solid var(--neon-purple); padding-left:8px;">
          <span style="font-weight:bold; color:#fff;">Status:</span> ${statusMsg}
        </p>
        <ul class="tracking-steps" style="display:flex; justify-content:space-between; padding:0; margin:0; list-style:none; font-size:0.75rem;">
          <li class="${step1}" style="color:${step1 === 'completed' ? 'var(--neon-green)' : 'var(--text-muted)'}">Advance Paid</li>
          <li class="${step2}" style="color:${step2 === 'completed' ? 'var(--neon-green)' : (step2 === 'active' ? 'var(--neon-cyan)' : 'var(--text-muted)')}">Production</li>
          <li class="${step3}" style="color:${step3 === 'completed' ? 'var(--neon-green)' : (step3 === 'active' ? (p.status === 'refund_requested' ? 'var(--neon-amber)' : 'var(--neon-cyan)') : 'var(--text-muted)')}">${p.status === 'refund_requested' ? 'Disputed' : 'Final Approval'}</li>
          <li class="${step4}" style="color:${step4 === 'completed' ? 'var(--neon-green)' : 'var(--text-muted)'}">Delivered</li>
        </ul>
        ${simulateBtnHtml}
        ${finalPayBtnHtml}
      `;
      container.appendChild(div);
    });

    // Attach listeners for dynamic buttons inside tracker
    document.querySelectorAll('.simulate-complete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const purchaseId = btn.getAttribute('data-id');
        const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
        const index = purchases.findIndex(p => p.id === purchaseId);
        if (index !== -1) {
          purchases[index].status = 'completed';
          localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));
          
          // Add notification
          addSystemNotification(
            "Project Review Pending",
            `Your project '${purchases[index].serviceName}' has been successfully compiled and is ready for final review. Pay the remaining 50% to complete delivery.`
          );

          alert("DEVELOPER SIMULATOR: Project status updated to COMPLETED by the creative team!");
          
          renderPayments();
          renderPurchasedServices();
          renderServiceTracking();
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

    if (window.lucide) lucide.createIcons();
  }

  // Add system notifications dynamically
  function addSystemNotification(title, desc) {
    const notifs = JSON.parse(localStorage.getItem('gravity-system-notifications')) || [];
    notifs.unshift({
      id: Date.now(),
      title: title,
      desc: desc,
      time: "Just now",
      read: false
    });
    localStorage.setItem('gravity-system-notifications', JSON.stringify(notifs));
    renderNotifications();
  }

  /* ==========================================================================
     RAZORPAY SIMULATION LOGIC
     ========================================================================== */
  let activePayment = null;

  const razorpayOverlay = document.getElementById('razorpay-checkout-overlay');
  const razorpayPayBtn = document.getElementById('razorpay-pay-button');
  const razorpayCancelBtn = document.getElementById('razorpay-cancel-button');
  const methodUpi = document.getElementById('razorpay-method-upi');
  const methodCard = document.getElementById('razorpay-method-card');
  const formUpi = document.getElementById('razorpay-form-upi');
  const formCard = document.getElementById('razorpay-form-card');

  function initiateRazorpayPayment(data) {
    activePayment = data;
    
    document.getElementById('razorpay-item-name').innerText = `${data.type === 'booking' ? '50% Booking Advance' : '50% Final Settlement'} for ${data.serviceName}`;
    document.getElementById('razorpay-item-amount').innerText = `$${data.payAmount.toFixed(2)}`;
    razorpayPayBtn.innerText = `Pay $${data.payAmount.toFixed(2)}`;
    
    // Fill details from session
    if (currentSession) {
      document.getElementById('razorpay-user-email').innerText = currentSession.email || 'client@gravity.com';
      document.getElementById('razorpay-user-phone').innerText = '+91 98920 10101'; // Simulated local contact
    }

    razorpayOverlay.style.display = 'flex';
  }

  // Method switching
  if (methodUpi && methodCard) {
    methodUpi.addEventListener('click', () => {
      methodUpi.classList.add('active');
      methodCard.classList.remove('active');
      formUpi.style.display = 'block';
      formCard.style.display = 'none';
    });

    methodCard.addEventListener('click', () => {
      methodCard.classList.add('active');
      methodUpi.classList.remove('active');
      formCard.style.display = 'block';
      formUpi.style.display = 'none';
    });
  }

  // Cancel Payment
  if (razorpayCancelBtn) {
    razorpayCancelBtn.addEventListener('click', () => {
      razorpayOverlay.style.display = 'none';
      activePayment = null;
    });
  }

  // Submit Simulated Payment
  if (razorpayPayBtn) {
    razorpayPayBtn.addEventListener('click', () => {
      if (!activePayment) return;

      razorpayPayBtn.innerText = "Processing secure checkout...";
      razorpayPayBtn.disabled = true;

      // Simulate network delay
      setTimeout(() => {
        const methodUsed = methodUpi.classList.contains('active') ? 'UPI' : 'Card';
        
        // Log transaction
        let txs = JSON.parse(localStorage.getItem('gravity-transactions')) || [];
        const txId = "pay_" + Math.random().toString(36).substring(2, 10).toUpperCase();
        txs.unshift({
          id: txId,
          user: currentSession ? currentSession.username : 'User',
          email: currentSession ? currentSession.email : 'anonymous@gravity.com',
          service: activePayment.serviceName,
          amount: activePayment.payAmount,
          method: methodUsed,
          type: activePayment.type,
          date: new Date().toLocaleString()
        });
        localStorage.setItem('gravity-transactions', JSON.stringify(txs));

        // Update purchases state
        let purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
        
        if (activePayment.type === 'booking') {
          // New purchase record
          purchases.unshift({
            id: "PUR-" + Date.now().toString().substring(8),
            serviceId: activePayment.serviceId,
            serviceName: activePayment.serviceName,
            totalCost: activePayment.totalCost,
            paidAmount: activePayment.payAmount,
            status: 'advance_paid',
            date: new Date().toLocaleDateString()
          });
          
          addSystemNotification(
            "Booking Confirmed via Razorpay",
            `Successfully received 50% advance booking payment of $${activePayment.payAmount.toFixed(2)} for '${activePayment.serviceName}'. Work starts immediately.`
          );
        } else if (activePayment.type === 'final') {
          // Update existing purchase
          const idx = purchases.findIndex(p => p.id === activePayment.purchaseId);
          if (idx !== -1) {
            purchases[idx].paidAmount = purchases[idx].totalCost;
            purchases[idx].status = 'fully_paid';
            
            addSystemNotification(
              "Project Successfully Delivered",
              `Received final 50% payment of $${activePayment.payAmount.toFixed(2)} for '${activePayment.serviceName}'. Source files are released for download.`
            );
          }
        }
        localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));

        alert(`Razorpay Payment Complete!\nTransaction Reference: ${txId}\nAmount: $${activePayment.payAmount.toFixed(2)}`);
        
        // Reset and close
        razorpayPayBtn.disabled = false;
        razorpayOverlay.style.display = 'none';
        activePayment = null;

        // Refresh views
        renderPayments();
        renderPurchasedServices();
        renderServiceTracking();
        renderAdminDashboard();
      }, 1500);
    });
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
    disputeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const purchaseId = document.getElementById('refund-target-purchase-id').value;
      const explanation = document.getElementById('refund-explanation').value.trim();

      if (!selectedFile) {
        alert("Please upload a PDF, JPG, or PNG document proving your dispute.");
        return;
      }

      // Add to refunds log
      let refunds = JSON.parse(localStorage.getItem('gravity-refunds')) || [];
      const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
      const item = purchases.find(p => p.id === purchaseId);
      
      if (item) {
        // Change status to refund_requested
        item.status = 'refund_requested';
        localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));

        // Record refund claim
        refunds.unshift({
          id: "REF-" + Date.now().toString().substring(8),
          purchaseId: purchaseId,
          user: currentSession ? currentSession.username : 'User',
          serviceName: item.serviceName,
          explanation: explanation,
          fileName: selectedFile.name,
          fileSize: `${(selectedFile.size/1024).toFixed(1)} KB`,
          amount: item.paidAmount,
          status: 'pending',
          date: new Date().toLocaleString()
        });
        localStorage.setItem('gravity-refunds', JSON.stringify(refunds));

        addSystemNotification(
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
        renderPayments();
        renderPurchasedServices();
        renderServiceTracking();
        renderAdminDashboard();
      }
    });
  }

  /* ==========================================================================
     ADMIN CONSOLE DASHBOARD EVENT HANDLERS
     ========================================================================== */

  // Publish Notification Form
  const adminNotifForm = document.getElementById('admin-notification-form');
  if (adminNotifForm) {
    adminNotifForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('admin-notif-title').value.trim();
      const desc = document.getElementById('admin-notif-desc').value.trim();

      addSystemNotification(title, desc);
      
      adminNotifForm.reset();
      alert(`[ADMIN MAINFRAME] Notification published successfully! All active users will receive it.`);
      renderAdminDashboard();
    });
  }

  // Render Admin Dashboard Lists
  function renderAdminDashboard() {
    const refundListContainer = document.getElementById('admin-refund-claims-list');
    const paymentsListContainer = document.getElementById('admin-payments-log-list');

    // Render Refund Claims
    if (refundListContainer) {
      const refunds = JSON.parse(localStorage.getItem('gravity-refunds')) || [];
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

          p.innerHTML = `
            <div style="color:#fff; font-weight:bold;">User: ${ref.user} • Claim ID: ${ref.id}</div>
            <div style="color:var(--neon-cyan); font-size:0.8rem;">Service: ${ref.serviceName} ($${ref.amount.toFixed(2)} disputed)</div>
            <div style="color:var(--text-muted); font-size:0.75rem; margin-top:0.15rem;">Reason: "${ref.explanation}"</div>
            <div style="color:var(--neon-amber); font-size:0.75rem; margin-top:0.15rem;">Proof File: [${ref.fileName}] (${ref.fileSize})</div>
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
      const txs = JSON.parse(localStorage.getItem('gravity-transactions')) || [];
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

          div.innerHTML = `
            <span class="text-green">> [${t.date}]</span>
            <span style="color:#fff; font-weight:bold;">$${Math.abs(t.amount).toFixed(2)}</span>
            <span>via ${t.method}</span>
            <span style="color:var(--neon-cyan);">(${actionLabel})</span>
            <span style="color:var(--text-muted);">by ${t.user} (${t.service})</span>
          `;
          paymentsListContainer.appendChild(div);
        });
      }
    }
  }

  // Admin processes refund claim
  function processRefundClaim(claimId, action) {
    const refunds = JSON.parse(localStorage.getItem('gravity-refunds')) || [];
    const refIdx = refunds.findIndex(r => r.id === claimId);

    if (refIdx !== -1) {
      const claim = refunds[refIdx];
      const purchases = JSON.parse(localStorage.getItem('gravity-user-purchases')) || [];
      const purIdx = purchases.findIndex(p => p.id === claim.purchaseId);

      if (action === 'approve') {
        claim.status = 'approved';
        if (purIdx !== -1) {
          purchases[purIdx].status = 'refund_approved';
        }

        // Add negative refund transaction
        let txs = JSON.parse(localStorage.getItem('gravity-transactions')) || [];
        txs.unshift({
          id: "refund_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
          user: claim.user,
          email: 'system-refund@gravity.com',
          service: claim.serviceName,
          amount: -claim.amount, // Negative amount
          method: 'Razorpay Refund Routing',
          type: 'refund',
          date: new Date().toLocaleString()
        });
        localStorage.setItem('gravity-transactions', JSON.stringify(txs));

        addSystemNotification(
          "Refund Approved by Admin",
          `Dispute case for '${claim.serviceName}' approved. Refund of $${claim.amount.toFixed(2)} returned. Original booking advance fully reversed.`
        );
        alert(`[ADMIN MAINFRAME] Refund dispute case ${claimId} approved! Capital has been returned to the user.`);

      } else if (action === 'deny') {
        claim.status = 'denied';
        if (purIdx !== -1) {
          purchases[purIdx].status = 'refund_denied'; // Returns back to awaiting final payment
        }

        addSystemNotification(
          "Dispute Claim Rejected",
          `Dispute claim for '${claim.serviceName}' has been reviewed and rejected by system administrators. Awaiting final payment to complete release.`
        );
        alert(`[ADMIN MAINFRAME] Dispute claim case ${claimId} has been reviewed and denied. Milestone timeline resumed.`);
      }

      localStorage.setItem('gravity-refunds', JSON.stringify(refunds));
      localStorage.setItem('gravity-user-purchases', JSON.stringify(purchases));

      // Refresh
      renderPayments();
      renderPurchasedServices();
      renderServiceTracking();
      renderAdminDashboard();
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
    
    loginBtn.className = 'control-btn'; // Reset classes

    if (!currentSession) {
      if (userIcon) userIcon.style.display = 'block';
      if (adminIcon) adminIcon.style.display = 'none';
      loginBtn.setAttribute('data-tooltip', 'Portal Sign-In');
      loginBtn.setAttribute('aria-label', 'Open Login Portal');
    } else if (currentSession.role === 'admin') {
      if (userIcon) userIcon.style.display = 'none';
      if (adminIcon) adminIcon.style.display = 'block';
      loginBtn.classList.add('logged-in-admin');
      loginBtn.setAttribute('data-tooltip', 'Admin Terminal Active');
      loginBtn.setAttribute('aria-label', 'Open Admin Console');
    } else {
      if (userIcon) userIcon.style.display = 'block';
      if (adminIcon) adminIcon.style.display = 'none';
      loginBtn.classList.add('logged-in-user');
      loginBtn.setAttribute('data-tooltip', `User Portal (${currentSession.username})`);
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
  userSigninForm.addEventListener('submit', (e) => {
    e.preventDefault();
    userSigninError.style.display = 'none';

    const loginInput = document.getElementById('user-signin-email').value.trim();
    const passwordInput = document.getElementById('user-signin-password').value;

    if (passwordInput.length < 6) {
      showError(userSigninError, 'Password must be at least 6 characters.');
      return;
    }

    // Retrieve local registered users list
    const users = JSON.parse(localStorage.getItem('gravity-registered-users')) || [];
    const foundUser = users.find(u => u.email === loginInput || u.username === loginInput);

    if (foundUser) {
      if (foundUser.password === passwordInput) {
        loginSuccess({
          role: 'user',
          username: foundUser.username,
          email: foundUser.email
        });
      } else {
        showError(userSigninError, 'Incorrect password.');
      }
    } else {
      // For convenience and demonstration, if user isn't found, auto-create their account or login successfully!
      const defaultUsername = loginInput.split('@')[0];
      loginSuccess({
        role: 'user',
        username: defaultUsername,
        email: loginInput.includes('@') ? loginInput : `${loginInput}@gravity.com`
      });
    }
  });

  // User Sign-Up Form Handler
  const userSignupForm = document.getElementById('user-signup-form');
  const userSignupError = document.getElementById('user-signup-error');
  userSignupForm.addEventListener('submit', (e) => {
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

    const users = JSON.parse(localStorage.getItem('gravity-registered-users')) || [];
    if (users.some(u => u.email === email || u.username === username)) {
      showError(userSignupError, 'Username or email already registered.');
      return;
    }

    // Register user
    users.push({ username, email, password });
    localStorage.setItem('gravity-registered-users', JSON.stringify(users));

    loginSuccess({
      role: 'user',
      username: username,
      email: email
    });
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
      // Retry in case GIS script hasn't fully loaded
      setTimeout(initLiveGoogleSignIn, 150);
    }
  }

  // Handle Google OAuth JWT Response Token
  function handleGoogleCredentialResponse(response) {
    const payload = decodeJwtResponse(response.credential);
    
    loginSuccess({
      role: 'user',
      username: payload.name,
      email: payload.email
    });
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
  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    adminLoginError.style.display = 'none';

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const pin = document.getElementById('admin-2fa').value.trim();

    // Verification Rules
    if (!email.endsWith('@gravitystudios.com')) {
      showError(adminLoginError, 'ACCESS DENIED: Email must be a verified corporate address (@gravitystudios.com).');
      return;
    }

    if (email !== 'admin@gravitystudios.com' || password !== 'AdminSecurePassword2026!') {
      showError(adminLoginError, 'ACCESS DENIED: Invalid administrator credentials.');
      return;
    }

    if (pin !== '1010') {
      showError(adminLoginError, 'ACCESS DENIED: Invalid 2FA Security Key.');
      return;
    }

    // Success!
    loginSuccess({
      role: 'admin',
      email: email
    });
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
    localStorage.setItem('gravity-user-session', JSON.stringify(sessionData));
    currentSession = sessionData;
    updateAuthUI();
    
    // Open correct dashboard/sidebar
    if (sessionData.role === 'admin') {
      openPortal('admin-dashboard');
    } else {
      closePortal();
      openSidebar();
    }
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
}
