// Gravity Studios - Interactive 3D Scrollable Scene (Vibrant & Dual Theme)

(function () {
  let scene, camera, renderer;
  let coreMesh, corePoints, accretionDisk;
  let particleCount = 2200;
  let particleGeometry, particleMaterial, particleSystem;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;

  // Scroll variables
  let currentScrollPercent = 0;
  let targetScrollPercent = 0;

  // Interactive "Gravity Surge" variables (great for kids!)
  let gravitySurge = 1.0;
  let targetGravitySurge = 1.0;

  // Lerp helper
  const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

  function init() {
    const container = document.getElementById('three-canvas');
    if (!container) return;

    // Detect initial theme state
    const isDark = document.body.classList.contains('dark-theme');

    // 1. Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isDark ? 0x040307 : 0xfaf9fe, 0.08);

    // 2. Camera setup
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 6;

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 4. Create Gravity Core (Central Singularity)
    // Core geometry - Wireframe Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(1.4, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Core points - Outer glowing shell
    const outerGeo = new THREE.IcosahedronGeometry(1.45, 3);
    const outerMat = new THREE.PointsMaterial({
      color: 0xff0055,
      size: 0.04,
      transparent: true,
      opacity: 0.65
    });
    corePoints = new THREE.Points(outerGeo, outerMat);
    scene.add(corePoints);

    // 5. Create Accretion Disk (Colorful Cosmic Dust)
    particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const orbitSpeeds = [];
    const orbitRadii = [];
    const orbitHeights = [];

    // Rainbow Neon Spectrum colors
    const neonColors = [
      new THREE.Color(0x00f0ff), // Cyan
      new THREE.Color(0xb026ff), // Violet
      new THREE.Color(0xff0055), // Pink/Magenta
      new THREE.Color(0xffaa00), // Gold/Amber
      new THREE.Color(0x39ff14)  // Neon Green
    ];

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 5.8;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 0.9 * (1.2 - radius / 8.2);

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = height;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Assign random color from neon spectrum
      let mixColor = new THREE.Color();
      if (Math.random() > 0.96) {
        mixColor.setHex(0xffffff); // White flare
      } else {
        const randColor = neonColors[Math.floor(Math.random() * neonColors.length)];
        mixColor.copy(randColor);
        mixColor.multiplyScalar(0.7 + Math.random() * 0.3);
      }

      colors[i * 3] = mixColor.r;
      colors[i * 3 + 1] = mixColor.g;
      colors[i * 3 + 2] = mixColor.b;

      orbitSpeeds.push((0.006 + Math.random() * 0.012) * (3.5 / radius));
      orbitRadii.push(radius);
      orbitHeights.push(height);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMaterial = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    particleSystem = new THREE.Points(particleGeometry, pMaterial);
    scene.add(particleSystem);

    accretionDisk = {
      speeds: orbitSpeeds,
      radii: orbitRadii,
      heights: orbitHeights,
      angles: Array(particleCount).fill(0).map(() => Math.random() * Math.PI * 2)
    };

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouseMove);
    
    // Playful mouse click surge
    window.addEventListener('mousedown', onMouseClick);
    window.addEventListener('touchstart', onMouseClick);

    // Initial positioning
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

  function onMouseClick() {
    // Triggers "Gravity Surge" - Accelerates particles (fun feedback for kids)
    gravitySurge = 4.5;
  }

  function updateParticles() {
    const positions = particleGeometry.attributes.position.array;
    const time = Date.now() * 0.0003;

    gravitySurge = lerp(gravitySurge, targetGravitySurge, 0.04);
    const speedMultiplier = (1.0 + currentScrollPercent * 2.2) * gravitySurge;

    for (let i = 0; i < particleCount; i++) {
      accretionDisk.angles[i] += accretionDisk.speeds[i] * speedMultiplier;

      positions[i * 3] = Math.cos(accretionDisk.angles[i]) * accretionDisk.radii[i];
      positions[i * 3 + 1] = accretionDisk.heights[i] + Math.sin(time + accretionDisk.radii[i]) * 0.15;
      positions[i * 3 + 2] = Math.sin(accretionDisk.angles[i]) * accretionDisk.radii[i];
    }

    particleGeometry.attributes.position.needsUpdate = true;
  }

  function animate() {
    requestAnimationFrame(animate);

    // Smooth scroll interpolation
    currentScrollPercent = lerp(currentScrollPercent, targetScrollPercent, 0.08);

    // Smooth mouse interpolation
    mouseX = lerp(mouseX, targetMouseX, 0.05);
    mouseY = lerp(mouseY, targetMouseY, 0.05);

    // Core rotations
    coreMesh.rotation.y += 0.0035;
    coreMesh.rotation.x += 0.001;
    corePoints.rotation.y -= 0.0018;
    corePoints.rotation.x -= 0.0005;

    // Rotate particle system slowly
    particleSystem.rotation.y = Date.now() * 0.00004;

    updateParticles();

    // SCROLL-TRIGGERED CAMERA & CORE TRANSFORMATIONS
    let targetCoreX = 0;
    let targetCoreY = 0;
    let targetCoreZ = 0;
    let targetCamZ = 6;
    let targetCamX = 0;
    let targetCamY = 0;

    if (currentScrollPercent < 0.18) {
      // --- PHASE 1: HERO ---
      targetCoreX = 0.5 + mouseX * 0.3;
      targetCoreY = mouseY * 0.3;
      targetCoreZ = 0;
      targetCamZ = 6;
      targetCamX = mouseX * 0.5;
      targetCamY = mouseY * 0.5;
      
      coreMesh.scale.set(1, 1, 1);
      corePoints.scale.set(1, 1, 1);
    } else if (currentScrollPercent < 0.38) {
      // --- PHASE 2: LEADERSHIP ---
      targetCoreX = 2.1 + mouseX * 0.25;
      targetCoreY = -0.2 + mouseY * 0.25;
      targetCoreZ = -1.5;
      targetCamZ = 6.4;
      targetCamX = mouseX * 0.3;
      targetCamY = mouseY * 0.3;

      const scale = lerp(1, 0.85, (currentScrollPercent - 0.18) / 0.2);
      coreMesh.scale.set(scale, scale, scale);
      corePoints.scale.set(scale, scale, scale);
    } else if (currentScrollPercent < 0.55) {
      // --- PHASE 3: MEDIA GALLERY ---
      targetCoreX = -2.1 + mouseX * 0.2;
      targetCoreY = 0.3 + mouseY * 0.2;
      targetCoreZ = -2.0;
      targetCamZ = 6.8;
      targetCamX = mouseX * 0.3;
      targetCamY = mouseY * 0.3;

      const scale = 0.8;
      coreMesh.scale.set(scale, scale, scale);
      corePoints.scale.set(scale, scale, scale);
    } else if (currentScrollPercent < 0.72) {
      // --- PHASE 4: REVENUE & GROWTH ---
      targetCoreX = mouseX * 0.3;
      targetCoreY = -0.5 + mouseY * 0.3;
      targetCoreZ = -2.2;
      targetCamZ = 7.2;
      targetCamX = -0.4 + mouseX * 0.3;
      targetCamY = 0.1 + mouseY * 0.3;

      const scale = 0.85;
      coreMesh.scale.set(scale, scale, scale);
      corePoints.scale.set(scale, scale, scale);
    } else if (currentScrollPercent < 0.88) {
      // --- PHASE 5: ORG CHART & TIMELINE ---
      targetCoreX = mouseX * 0.4;
      targetCoreY = -3.2 + mouseY * 0.3;
      targetCoreZ = -3.5;
      targetCamZ = 8.5;
      targetCamX = mouseX * 0.4;
      targetCamY = -0.5 + mouseY * 0.4;

      const scaleY = lerp(0.85, 0.12, (currentScrollPercent - 0.72) / 0.16);
      const scaleXZ = lerp(0.85, 2.6, (currentScrollPercent - 0.72) / 0.16);
      coreMesh.scale.set(scaleXZ, scaleY, scaleXZ);
      corePoints.scale.set(scaleXZ, scaleY, scaleXZ);
    } else {
      // --- PHASE 6: DEPARTMENTS & FOOTER ---
      targetCoreX = mouseX * 0.3;
      targetCoreY = 4.4 + mouseY * 0.4;
      targetCoreZ = -6.2;
      targetCamZ = 9.0;
      targetCamX = mouseX * 0.3;
      targetCamY = 0.8 + mouseY * 0.3;

      coreMesh.scale.set(1.4, 1.4, 1.4);
      corePoints.scale.set(1.4, 1.4, 1.4);
    }

    // Apply lerped values
    coreMesh.position.x = lerp(coreMesh.position.x, targetCoreX, 0.05);
    coreMesh.position.y = lerp(coreMesh.position.y, targetCoreY, 0.05);
    coreMesh.position.z = lerp(coreMesh.position.z, targetCoreZ, 0.05);

    corePoints.position.copy(coreMesh.position);
    particleSystem.position.copy(coreMesh.position);

    camera.position.x = lerp(camera.position.x, targetCamX, 0.05);
    camera.position.y = lerp(camera.position.y, targetCamY, 0.05);
    camera.position.z = lerp(camera.position.z, targetCamZ, 0.05);
    camera.lookAt(new THREE.Vector3(coreMesh.position.x * 0.25, coreMesh.position.y * 0.25, coreMesh.position.z * 0.25));

    renderer.render(scene, camera);
  }

  // EXPOSE GLOBAL CALLBACK FOR THEME UPDATES (Changes Fog Color)
  window.updateSceneTheme = function (isDark) {
    if (!scene || !scene.fog) return;
    if (isDark) {
      scene.fog.color.setHex(0x040307);
    } else {
      scene.fog.color.setHex(0xfaf9fe);
    }
  };

  // Bind to window load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
