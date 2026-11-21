// Antigravity Studios - Interactive Photorealistic 3D Earth Globe, Realistic Stars & Moon Base
// Mascot Scene: 3D Ant Mascot + 3D Letter "I" + 3D "GRAVITY" on Lunar Surface
// Option 2: Midnight Orbital Space

(function () {
  let scene, camera, renderer, clock;
  let earthMasterGroup, earthTiltGroup;
  let earthMesh, cloudsMesh, atmosphereMesh;
  let satellites = [];
  let starField, brightStars, milkyWayPoints;

  // Realistic Moon & Official 3D Logo Mascot State
  let moonGroup, moonMesh, moonAtmosphere;
  let moonBaseGroup, rubyGemMesh, yBeaconMesh;
  let moonOrbitAngle = 0.35; // Orbital revolution angle of Moon around Earth

  // Interaction & Physics state
  let isDragging = false;
  let prevMousePos = { x: 0, y: 0 };
  let dragVelocity = { x: 0, y: 0 };
  let autoRotateSpeed = 0.04; // rad/sec

  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;

  let currentScrollPercent = 0;
  let targetScrollPercent = 0;
  let gravitySurge = 1.0;
  let targetGravitySurge = 1.0;

  const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

  // Axial tilt of Earth: 23.44 degrees = 0.4091 radians
  const EARTH_AXIAL_TILT = 23.44 * (Math.PI / 180);

  // 1. Procedural Soft Gaussian Star Texture with Bright Starlight Core
  function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.12, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.28, 'rgba(215, 235, 255, 0.65)');
    grad.addColorStop(0.55, 'rgba(100, 185, 255, 0.18)');
    grad.addColorStop(0.85, 'rgba(0, 140, 255, 0.04)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    // Subtle micro diffraction cross
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(31, 10, 2, 44);
    ctx.fillRect(10, 31, 44, 2);

    return new THREE.CanvasTexture(canvas);
  }

  // 2. Construct 3D Satellite Model
  function createSatelliteModel(colorHex) {
    const satGroup = new THREE.Group();

    // Central Avionics Bus (Gold / Metallic Shielded Box)
    const busGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.22
    });
    satGroup.add(new THREE.Mesh(busGeo, busMat));

    // Dual Extended Solar Panel Arrays
    const panelGeo = new THREE.BoxGeometry(0.28, 0.07, 0.012);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x072b61,
      emissive: 0x001d3d,
      metalness: 0.92,
      roughness: 0.15
    });

    const leftWing = new THREE.Mesh(panelGeo, panelMat);
    leftWing.position.x = -0.22;
    satGroup.add(leftWing);

    const rightWing = new THREE.Mesh(panelGeo, panelMat);
    rightWing.position.x = 0.22;
    satGroup.add(rightWing);

    // High-Gain Communication Dish
    const dishGeo = new THREE.CylinderGeometry(0.045, 0.01, 0.02, 16);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.25
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.z = 0.05;
    dish.rotation.x = Math.PI / 2;
    satGroup.add(dish);

    // Status Beacon LED
    const ledGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({ color: colorHex || 0xffd700 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.y = 0.055;
    satGroup.add(led);

    return { group: satGroup, led: led };
  }

  // 3. Rayleigh Scattering Atmosphere Halo for Earth
  function createAtmosphereShader() {
    const atmoGeo = new THREE.SphereGeometry(1.94, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float intensity = pow(0.68 - dot(vNormal, viewDir), 2.8);
          intensity = clamp(intensity, 0.0, 1.0);
          gl_FragColor = vec4(glowColor, intensity * 0.72);
        }
      `,
      uniforms: {
        glowColor: { value: new THREE.Color(0x00f0ff) }
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    return new THREE.Mesh(atmoGeo, atmoMat);
  }

  // 5. Construct 3D Official Ant I Gravity Brand Logo Monument
  function createLunarLogoInstallation() {
    const logoGroup = new THREE.Group();

    // Exact proportion of the Ant I Gravity logo (572 x 198 => 2.8888 : 1)
    const W = 1.18;
    const H = 0.408;
    const planeGeo = new THREE.PlaneGeometry(W, H);

    const textureLoader = new THREE.TextureLoader();
    const colorMap = textureLoader.load('/assets/textures/moon/logo_cropped.png');
    colorMap.colorSpace = THREE.SRGBColorSpace;
    const normalMap = textureLoader.load('/assets/textures/moon/logo_normal.png');
    const emissiveMap = textureLoader.load('/assets/textures/moon/logo_emissive.png');
    emissiveMap.colorSpace = THREE.SRGBColorSpace;

    // Front Face: 3D normal-mapped, ruby-emissive, physical lighting
    const frontMat = new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.9, 0.9),
      emissiveMap: emissiveMap,
      emissive: 0xff1744,
      emissiveIntensity: 0.55,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.85,
      roughness: 0.2,
      side: THREE.FrontSide
    });
    const frontMesh = new THREE.Mesh(planeGeo, frontMat);
    frontMesh.position.z = 0.015;
    logoGroup.add(frontMesh);

    // Back Face: Metallic ruby backplate
    const backMat = new THREE.MeshStandardMaterial({
      map: colorMap,
      emissive: 0x550014,
      emissiveIntensity: 0.35,
      transparent: true,
      alphaTest: 0.05,
      metalness: 0.88,
      roughness: 0.28,
      side: THREE.BackSide
    });
    const backMesh = new THREE.Mesh(planeGeo, backMat);
    backMesh.position.z = -0.015;
    logoGroup.add(backMesh);

    // Core Extrusion Slice (providing solid 3D depth)
    const coreMat = new THREE.MeshBasicMaterial({
      map: colorMap,
      color: 0x220207,
      transparent: true,
      alphaTest: 0.08
    });
    const coreMesh = new THREE.Mesh(planeGeo, coreMat);
    coreMesh.position.z = 0.0;
    logoGroup.add(coreMesh);

    // 3D Faceted Ruby Crystal carried by the Ant above the 'I'
    const gemGeo = new THREE.IcosahedronGeometry(0.052, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0x880018,
      emissiveIntensity: 0.85,
      metalness: 0.92,
      roughness: 0.12
    });
    rubyGemMesh = new THREE.Mesh(gemGeo, gemMat);
    // Positioned directly at the ant's raised arms holding the hexagonal gem
    rubyGemMesh.position.set(-0.258, 0.132, 0.032);
    logoGroup.add(rubyGemMesh);

    // 3D Glowing Satellite Beacon Orb above the 'Y'
    const beaconGeo = new THREE.SphereGeometry(0.017, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff003c });
    yBeaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    yBeaconMesh.position.set(0.534, 0.102, 0.026);
    logoGroup.add(yBeaconMesh);

    // Lunar Telemetry Foundation Pedestal
    const basePadGeo = new THREE.CylinderGeometry(0.58, 0.64, 0.018, 36);
    const basePadMat = new THREE.MeshStandardMaterial({
      color: 0x110206,
      emissive: 0xff1744,
      emissiveIntensity: 0.25,
      metalness: 0.9,
      roughness: 0.2
    });
    const basePad = new THREE.Mesh(basePadGeo, basePadMat);
    basePad.position.set(0, -H / 2 - 0.01, 0);
    logoGroup.add(basePad);

    // Circular Lunar Telemetry Landing Ring
    const padGeo = new THREE.RingGeometry(0.12, 0.62, 36);
    const padMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = Math.PI / 2;
    pad.position.set(0, -H / 2 - 0.012, 0);
    logoGroup.add(pad);

    return logoGroup;
  }

  // 6. Construct Photorealistic Moon System with Official Brand Logo
  function createMoonSystem() {
    const mGroup = new THREE.Group();
    // Positioned in upper right cosmic sky next to Earth
    mGroup.position.set(3.4, 1.6, -0.6);

    // Realistic Moon Sphere
    const moonGeo = new THREE.SphereGeometry(0.78, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde4,
      roughness: 0.88,
      metalness: 0.08
    });
    moonMesh = new THREE.Mesh(moonGeo, moonMat);
    mGroup.add(moonMesh);

    // Load authentic NASA lunar crater texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/assets/textures/moon/moon_1024.jpg', function (tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      moonMat.map = tex;
      moonMat.bumpMap = tex;
      moonMat.bumpScale = 0.038;
      moonMat.needsUpdate = true;
    });

    // Lunar Soft Starlight Rim Glow
    const moonHaloGeo = new THREE.SphereGeometry(0.81, 32, 32);
    const moonHaloMat = new THREE.MeshBasicMaterial({
      color: 0xff003c,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    moonAtmosphere = new THREE.Mesh(moonHaloGeo, moonHaloMat);
    mGroup.add(moonAtmosphere);

    // --- LUNAR OFFICIAL BRAND INSIGNIA: EXACT ANT I GRAVITY LOGO ---
    moonBaseGroup = createLunarLogoInstallation();
    // Anchored at top surface of the Moon
    moonBaseGroup.position.set(0, 0.77, 0.08);
    // Tilted forward slightly toward the camera
    moonBaseGroup.rotation.x = 0.24;
    moonBaseGroup.scale.set(1.15, 1.15, 1.15);
    mGroup.add(moonBaseGroup);

    return mGroup;
  }

  function init() {
    const container = document.getElementById('three-canvas');
    if (!container) return;

    clock = new THREE.Clock();

    // 1. Scene setup (Deep Space Midnight Obsidian)
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030407, 0.04);

    // 2. Camera setup
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 180);
    camera.position.z = 6.2;

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Directional Cosmic Sunlight & Space Ambient Lighting
    // Directional light from front-right illuminating Earth, Moon, and Ant I Gravity scene
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.3);
    sunLight.position.set(7.5, 4.5, 6.0);
    scene.add(sunLight);

    const spaceAmbient = new THREE.AmbientLight(0x0a1c38, 0.72);
    scene.add(spaceAmbient);

    // 5. MASTER EARTH GROUPS (Hierarchy: earthMasterGroup -> earthTiltGroup -> earthMesh)
    earthMasterGroup = new THREE.Group();
    scene.add(earthMasterGroup);

    // Astronomical Axial Tilt Group (23.44° inclined relative to ecliptic plane)
    earthTiltGroup = new THREE.Group();
    earthTiltGroup.rotation.z = -EARTH_AXIAL_TILT;
    earthTiltGroup.rotation.x = 0.08;
    earthMasterGroup.add(earthTiltGroup);

    // --- A. PHOTOREALISTIC EARTH GLOBE SPHERE ---
    const earthGeo = new THREE.SphereGeometry(1.85, 64, 64);
    const textureLoader = new THREE.TextureLoader();

    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x0d2847,
      specular: new THREE.Color(0x38bdf8),
      shininess: 28,
      emissive: new THREE.Color(0x020817),
      emissiveIntensity: 0.3
    });

    earthMesh = new THREE.Mesh(earthGeo, earthMat);
    // Orient globe so Asia (India, Central & East Asia) faces directly forward on initial load
    earthMesh.rotation.y = -3.05;
    earthTiltGroup.add(earthMesh);

    // Asynchronously stream high-resolution NASA textures
    textureLoader.load('/assets/textures/earth/earth_atmos_2048.jpg', function (tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      earthMat.map = tex;
      earthMat.color.setHex(0xffffff);
      earthMat.needsUpdate = true;
    });

    textureLoader.load('/assets/textures/earth/earth_normal_2048.jpg', function (normTex) {
      earthMat.normalMap = normTex;
      earthMat.normalScale = new THREE.Vector2(0.85, 0.85);
      earthMat.needsUpdate = true;
    });

    textureLoader.load('/assets/textures/earth/earth_specular_2048.jpg', function (specTex) {
      earthMat.specularMap = specTex;
      earthMat.needsUpdate = true;
    });

    // Custom shader hook to illuminate city night lights on the dark hemisphere
    textureLoader.load('/assets/textures/earth/earth_lights_2048.png', function (nightTex) {
      nightTex.colorSpace = THREE.SRGBColorSpace;
      earthMat.onBeforeCompile = function (shader) {
        shader.uniforms.nightTexture = { value: nightTex };
        shader.uniforms.sunDirection = { value: sunLight.position };

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `#include <common>
           uniform sampler2D nightTexture;
           uniform vec3 sunDirection;`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           vec3 norm = normalize(vNormal);
           vec3 sunDir = normalize(sunDirection);
           float sunDot = dot(norm, sunDir);

           float nightWeight = clamp(-sunDot * 3.2, 0.0, 1.0);
           vec4 nightLights = texture2D(nightTexture, vUv);
           gl_FragColor.rgb += nightLights.rgb * nightWeight * vec3(1.5, 1.25, 0.8);`
        );
      };
      earthMat.needsUpdate = true;
    });

    // --- B. HIGH-DEFINITION ATMOSPHERIC CLOUD SPHERE ---
    const cloudGeo = new THREE.SphereGeometry(1.878, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudsMesh.rotation.y = -3.05;
    earthTiltGroup.add(cloudsMesh);

    textureLoader.load('/assets/textures/earth/earth_clouds_1024.png', function (cloudTex) {
      cloudMat.map = cloudTex;
      cloudMat.opacity = 0.52;
      cloudMat.needsUpdate = true;
    });

    // --- C. ATMOSPHERIC RAYLEIGH SCATTERING ELECTRIC CYAN HALO ---
    atmosphereMesh = createAtmosphereShader();
    earthMasterGroup.add(atmosphereMesh);

    // --- D. 3D SATELLITE CONSTELLATION ---
    const satConfigs = [
      { radius: 2.65, incX: 0.55, incZ: 0.25, speed: 0.009, angle: 0.2, color: 0xffd700 },
      { radius: 2.95, incX: 1.45, incZ: -0.2, speed: 0.007, angle: 2.4, color: 0xf59e0b },
      { radius: 2.45, incX: 0.85, incZ: 0.75, speed: 0.011, angle: 4.1, color: 0xffaa00 },
      { radius: 3.35, incX: 0.2, incZ: -0.65, speed: 0.005, angle: 1.5, color: 0xfbbf24 }
    ];

    satConfigs.forEach((cfg) => {
      const sat = createSatelliteModel(cfg.color);
      earthMasterGroup.add(sat.group);

      satellites.push({
        group: sat.group,
        led: sat.led,
        radius: cfg.radius,
        incX: cfg.incX,
        incZ: cfg.incZ,
        speed: cfg.speed,
        angle: cfg.angle
      });
    });

    // --- E. REALISTIC MOON SYSTEM WITH 3D ANT I GRAVITY MASCOT ---
    moonGroup = createMoonSystem();
    scene.add(moonGroup);

    // --- F. MULTI-LAYERED ASTRONOMICAL REALISTIC STARFIELD ---
    const sharedStarTex = createStarTexture();

    // 1. Deep Celestial Starfield (2,600 stars)
    const starCount = 2600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const spectralColors = [
      new THREE.Color(0x9bb0ff),
      new THREE.Color(0xb5c7ff),
      new THREE.Color(0xffffff),
      new THREE.Color(0xf6f8ff),
      new THREE.Color(0xfff3db),
      new THREE.Color(0xffe2ab),
      new THREE.Color(0xffaa66),
      new THREE.Color(0xff7744)
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 35 + Math.random() * 85;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const color = spectralColors[Math.floor(Math.random() * spectralColors.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.42,
      map: sharedStarTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 2. Bright Alpha Navigational Stars (80 stars)
    const brightCount = 80;
    const brightGeo = new THREE.BufferGeometry();
    const brightPositions = new Float32Array(brightCount * 3);
    const brightColors = new Float32Array(brightCount * 3);

    for (let i = 0; i < brightCount; i++) {
      const radius = 28 + Math.random() * 55;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      brightPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      brightPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      brightPositions[i * 3 + 2] = radius * Math.cos(phi);

      const color = spectralColors[i % 5];
      brightColors[i * 3] = color.r * 1.25;
      brightColors[i * 3 + 1] = color.g * 1.25;
      brightColors[i * 3 + 2] = color.b * 1.25;
    }

    brightGeo.setAttribute('position', new THREE.BufferAttribute(brightPositions, 3));
    brightGeo.setAttribute('color', new THREE.BufferAttribute(brightColors, 3));

    const brightMat = new THREE.PointsMaterial({
      size: 0.85,
      map: sharedStarTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    brightStars = new THREE.Points(brightGeo, brightMat);
    scene.add(brightStars);

    // 3. Milky Way Galactic Plane Ribbon (650 particles)
    const mwCount = 650;
    const mwGeo = new THREE.BufferGeometry();
    const mwPositions = new Float32Array(mwCount * 3);
    const mwColors = new Float32Array(mwCount * 3);

    const mwPalette = [
      new THREE.Color(0x00f0ff),
      new THREE.Color(0x0077ff),
      new THREE.Color(0xdbeafe),
      new THREE.Color(0x38bdf8)
    ];

    for (let i = 0; i < mwCount; i++) {
      const dist = 32 + Math.random() * 60;
      const angle = (i / mwCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const spread = (Math.random() - 0.5) * 7.5;

      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = Math.sin(angle + 0.5) * 14 + spread;

      mwPositions[i * 3] = x;
      mwPositions[i * 3 + 1] = y;
      mwPositions[i * 3 + 2] = z;

      const color = mwPalette[Math.floor(Math.random() * mwPalette.length)];
      mwColors[i * 3] = color.r;
      mwColors[i * 3 + 1] = color.g;
      mwColors[i * 3 + 2] = color.b;
    }

    mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPositions, 3));
    mwGeo.setAttribute('color', new THREE.BufferAttribute(mwColors, 3));

    const mwMat = new THREE.PointsMaterial({
      size: 0.55,
      map: sharedStarTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    milkyWayPoints = new THREE.Points(mwGeo, mwMat);
    scene.add(milkyWayPoints);

    // Event listeners
    window.addEventListener('resize', onWindowResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Interactive Drag-to-Rotate Globe Controls with Inertia
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    onScroll();
    animate();
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onScroll() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    targetScrollPercent = maxScroll > 0 ? scrollY / maxScroll : 0;
  }

  function onMouseMove(event) {
    targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function onPointerDown(e) {
    if (e.target.closest('button, a, input, select, textarea, .portal-modal-backdrop, .nav-links, .construction-modal-overlay, .portal-modal-container')) {
      return;
    }
    isDragging = true;
    prevMousePos = { x: e.clientX, y: e.clientY };
    dragVelocity = { x: 0, y: 0 };
    gravitySurge = 2.0;
    document.body.classList.add('is-dragging-globe');
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const deltaX = e.clientX - prevMousePos.x;
    const deltaY = e.clientY - prevMousePos.y;

    // Direct, highly responsive 1:1 manual rotation of Earth by cursor
    const rotSensX = 0.0075;
    const rotSensY = 0.0035;

    if (earthMesh) {
      earthMesh.rotation.y += deltaX * rotSensX;
    }
    if (cloudsMesh) {
      cloudsMesh.rotation.y += deltaX * rotSensX;
    }
    if (earthTiltGroup) {
      earthTiltGroup.rotation.x = Math.max(-0.6, Math.min(0.6, earthTiltGroup.rotation.x + deltaY * rotSensY));
    }

    dragVelocity.x = deltaX * rotSensX;
    dragVelocity.y = deltaY * rotSensY;

    prevMousePos = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp() {
    if (isDragging) {
      isDragging = false;
      document.body.classList.remove('is-dragging-globe');
    }
  }

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      if (e.target.closest('button, a, input, select, textarea, .portal-modal-backdrop, .nav-links, .construction-modal-overlay, .portal-modal-container')) {
        return;
      }
      isDragging = true;
      prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragVelocity = { x: 0, y: 0 };
    }
  }

  function onTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - prevMousePos.x;
    const deltaY = e.touches[0].clientY - prevMousePos.y;

    const rotSensX = 0.0075;
    const rotSensY = 0.0035;

    if (earthMesh) {
      earthMesh.rotation.y += deltaX * rotSensX;
    }
    if (cloudsMesh) {
      cloudsMesh.rotation.y += deltaX * rotSensX;
    }
    if (earthTiltGroup) {
      earthTiltGroup.rotation.x = Math.max(-0.6, Math.min(0.6, earthTiltGroup.rotation.x + deltaY * rotSensY));
    }

    dragVelocity.x = deltaX * rotSensX;
    dragVelocity.y = deltaY * rotSensY;

    prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function updateSatellites(delta) {
    gravitySurge = lerp(gravitySurge, targetGravitySurge, 0.04);
    const speedMult = (1.0 + currentScrollPercent * 1.8) * gravitySurge;

    satellites.forEach((sat, idx) => {
      sat.angle += sat.speed * speedMult * (delta * 60);

      const unrotatedX = Math.cos(sat.angle) * sat.radius;
      const unrotatedZ = Math.sin(sat.angle) * sat.radius;
      const pos = new THREE.Vector3(unrotatedX, 0, unrotatedZ);

      pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), sat.incX);
      pos.applyAxisAngle(new THREE.Vector3(0, 0, 1), sat.incZ);

      sat.group.position.copy(pos);
      sat.group.lookAt(0, 0, 0);

      if (sat.led) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 + idx * 2);
        sat.led.scale.setScalar(0.8 + pulse * 0.6);
      }
    });
  }

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);
    const time = Date.now() * 0.001;

    currentScrollPercent = lerp(currentScrollPercent, targetScrollPercent, 0.08);
    mouseX = lerp(mouseX, targetMouseX, 0.05);
    mouseY = lerp(mouseY, targetMouseY, 0.05);

    // Damped momentum inertia when cursor drag is released
    if (!isDragging) {
      dragVelocity.x *= 0.94;
      dragVelocity.y *= 0.94;

      if (Math.abs(dragVelocity.x) > 0.0001) {
        if (earthMesh) earthMesh.rotation.y += dragVelocity.x;
        if (cloudsMesh) cloudsMesh.rotation.y += dragVelocity.x;
      } else {
        // Natural gentle eastward planetary rotation resumes
        if (earthMesh) earthMesh.rotation.y += autoRotateSpeed * delta;
        if (cloudsMesh) cloudsMesh.rotation.y += (autoRotateSpeed * 1.45) * delta;
      }

      if (Math.abs(dragVelocity.y) > 0.0001 && earthTiltGroup) {
        earthTiltGroup.rotation.x = Math.max(-0.6, Math.min(0.6, earthTiltGroup.rotation.x + dragVelocity.y));
      }
    }

    // --- MOON ORBITING (REVOLVING) AROUND EARTH ---
    moonOrbitAngle += delta * 0.11; // Smooth physical lunar orbit speed around Earth

    const orbitRadiusX = 3.65;
    const orbitRadiusZ = 2.95;
    const moonRelX = Math.cos(moonOrbitAngle) * orbitRadiusX;
    const moonRelZ = Math.sin(moonOrbitAngle) * orbitRadiusZ;
    const moonRelY = 0.9 + Math.sin(moonOrbitAngle) * 0.65;

    if (moonGroup && earthMasterGroup) {
      moonGroup.position.x = earthMasterGroup.position.x + moonRelX;
      moonGroup.position.y = earthMasterGroup.position.y + moonRelY;
      moonGroup.position.z = earthMasterGroup.position.z + moonRelZ;
    }

    // Moon planetary rotation
    if (moonMesh) {
      moonMesh.rotation.y += delta * 0.015;
    }

    // --- ANIMATE OFFICIAL 3D LOGO ON THE MOON ---
    if (moonBaseGroup) {
      // Ensure the official Ant I Gravity logo continuously faces the camera as Moon orbits Earth
      moonBaseGroup.lookAt(camera.position);
      moonBaseGroup.rotation.x += 0.14; // Slight upward aesthetic tilt
      // Low-gravity breathing/floating bob
      moonBaseGroup.position.y = 0.77 + Math.sin(time * 2.2) * 0.012;
    }
    if (rubyGemMesh) {
      // 3D Faceted Ruby Gemstone rotating & catching space light above the 'I'
      rubyGemMesh.rotation.y += 0.018;
      rubyGemMesh.rotation.x += 0.012;
    }
    if (yBeaconMesh) {
      // Pulsing micro-beacon atop the 'Y'
      const pulse = 0.88 + 0.24 * Math.sin(time * 3.6);
      yBeaconMesh.scale.setScalar(pulse);
    }

    // Gentle celestial starfield drift
    if (starField) {
      starField.rotation.y = Date.now() * 0.000012;
    }
    if (brightStars) {
      brightStars.rotation.y = Date.now() * 0.000018;
    }
    if (milkyWayPoints) {
      milkyWayPoints.rotation.y = Date.now() * 0.000008;
    }

    // Update orbiting satellite constellation
    updateSatellites(delta);

    // SCROLL-TRIGGERED CAMERA & EARTH TRANSFORMATIONS
    let targetEarthX = 0;
    let targetEarthY = 0;
    let targetEarthZ = 0;
    let targetCamZ = 6.2;
    let targetCamX = 0;
    let targetCamY = 0;

    if (currentScrollPercent < 0.18) {
      // --- PHASE 1: HERO ---
      targetEarthX = 0.95 + mouseX * 0.35;
      targetEarthY = 0.1 + mouseY * 0.35;
      targetEarthZ = 0;
      targetCamZ = 6.2;
      targetCamX = mouseX * 0.4;
      targetCamY = mouseY * 0.4;
      earthMasterGroup.scale.set(1.06, 1.06, 1.06);
    } else if (currentScrollPercent < 0.38) {
      // --- PHASE 2: SERVICES ---
      targetEarthX = 2.2 + mouseX * 0.25;
      targetEarthY = -0.2 + mouseY * 0.25;
      targetEarthZ = -1.2;
      targetCamZ = 6.4;
      targetCamX = mouseX * 0.3;
      targetCamY = mouseY * 0.3;
      earthMasterGroup.scale.set(0.9, 0.9, 0.9);
    } else if (currentScrollPercent < 0.55) {
      // --- PHASE 3: OUR WORK ---
      targetEarthX = -2.2 + mouseX * 0.25;
      targetEarthY = 0.3 + mouseY * 0.25;
      targetEarthZ = -1.8;
      targetCamZ = 6.8;
      targetCamX = mouseX * 0.3;
      targetCamY = mouseY * 0.3;
      earthMasterGroup.scale.set(0.85, 0.85, 0.85);
    } else if (currentScrollPercent < 0.72) {
      // --- PHASE 4: DIGITAL PRODUCTS ---
      targetEarthX = mouseX * 0.3;
      targetEarthY = -0.5 + mouseY * 0.3;
      targetEarthZ = -2.2;
      targetCamZ = 7.2;
      targetCamX = -0.4 + mouseX * 0.3;
      targetCamY = 0.1 + mouseY * 0.3;
      earthMasterGroup.scale.set(0.85, 0.85, 0.85);
    } else if (currentScrollPercent < 0.88) {
      // --- PHASE 5: LEADERSHIP & TIMELINE ---
      targetEarthX = mouseX * 0.4;
      targetEarthY = -2.5 + mouseY * 0.3;
      targetEarthZ = -3.5;
      targetCamZ = 8.2;
      targetCamX = mouseX * 0.3;
      targetCamY = -0.4 + mouseY * 0.3;
      earthMasterGroup.scale.set(1.1, 1.1, 1.1);
    } else {
      // --- PHASE 6: DEPARTMENTS & FOOTER ---
      targetEarthX = mouseX * 0.3;
      targetEarthY = 3.8 + mouseY * 0.4;
      targetEarthZ = -5.5;
      targetCamZ = 8.8;
      targetCamX = mouseX * 0.3;
      targetCamY = 0.6 + mouseY * 0.3;
      earthMasterGroup.scale.set(1.3, 1.3, 1.3);
    }

    // Smooth lerped movements for Earth
    if (earthMasterGroup) {
      earthMasterGroup.position.x = lerp(earthMasterGroup.position.x, targetEarthX, 0.05);
      earthMasterGroup.position.y = lerp(earthMasterGroup.position.y, targetEarthY, 0.05);
      earthMasterGroup.position.z = lerp(earthMasterGroup.position.z, targetEarthZ, 0.05);
    }

    camera.position.x = lerp(camera.position.x, targetCamX, 0.04);
    camera.position.y = lerp(camera.position.y, targetCamY, 0.04);
    camera.position.z = lerp(camera.position.z, targetCamZ, 0.04);

    renderer.render(scene, camera);
  }

  // GLOBAL CALLBACK FOR THEME UPDATES
  window.updateSceneTheme = function (isDark) {
    if (!scene || !scene.fog) return;
    if (isDark) {
      scene.fog.color.setHex(0x030407);
    } else {
      scene.fog.color.setHex(0x070a12);
    }
  };

  // Bind to DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
