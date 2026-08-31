/* ============================================================
   Æther Roasters — 3D scene + scroll choreography
   Three.js r128 (global THREE) + GSAP + ScrollTrigger
   ============================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('scene');

  /* ---------------------------------------------------------
     THREE.JS SCENE
  --------------------------------------------------------- */
  let renderer, scene, camera, cupGroup, beans = [], steam, clock;
  let sceneReady = false;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function initThree() {
    if (!window.THREE) return false;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x17110c, 0.035);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.4, 9);
    camera.lookAt(0, 0.6, 0);

    // ---- Lighting: warm, coffee-shop glow ----
    scene.add(new THREE.AmbientLight(0x3a2a1c, 1.1));

    const key = new THREE.DirectionalLight(0xffd9a0, 2.1);
    key.position.set(5, 8, 6);
    scene.add(key);

    const rim = new THREE.PointLight(0xff8a3c, 2.4, 30);
    rim.position.set(-6, 2, -3);
    scene.add(rim);

    const fill = new THREE.PointLight(0x6fb8ff, 0.5, 25);
    fill.position.set(4, -2, 5);
    scene.add(fill);

    buildCup();
    buildBeans();
    buildSteam();

    clock = new THREE.Clock();
    sceneReady = true;
    window.addEventListener('resize', onResize);
    animate();
    return true;
  }

  function buildCup() {
    cupGroup = new THREE.Group();

    const ceramic = new THREE.MeshStandardMaterial({
      color: 0xf4e9d8, roughness: 0.35, metalness: 0.05,
    });
    const ceramicInner = new THREE.MeshStandardMaterial({
      color: 0xe8dcc7, roughness: 0.5, metalness: 0.0, side: THREE.BackSide,
    });
    const coffeeMat = new THREE.MeshStandardMaterial({
      color: 0x2a1305, roughness: 0.15, metalness: 0.3,
    });

    // Cup body (slightly tapered)
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 0.82, 1.5, 64, 1, true),
      ceramic
    );
    body.position.y = 0.75;
    cupGroup.add(body);

    // Inner wall
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.98, 0.78, 1.5, 64, 1, true),
      ceramicInner
    );
    inner.position.y = 0.75;
    cupGroup.add(inner);

    // Bottom
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.82, 48), ceramic);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = 0.02;
    cupGroup.add(bottom);

    // Coffee surface
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.96, 64), coffeeMat);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 1.32;
    cupGroup.add(coffee);
    cupGroup.userData.coffee = coffee;

    // Rim ring
    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 16, 80), ceramic);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 1.5;
    cupGroup.add(rimRing);

    // Handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 20, 60, Math.PI * 1.35), ceramic);
    handle.position.set(1.1, 0.78, 0);
    handle.rotation.z = -Math.PI / 2.1;
    cupGroup.add(handle);

    // Saucer
    const saucer = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.5, 0.12, 64),
      new THREE.MeshStandardMaterial({ color: 0xece0cd, roughness: 0.4, metalness: 0.05 })
    );
    saucer.position.y = -0.14;
    cupGroup.add(saucer);

    cupGroup.position.y = -0.4;
    scene.add(cupGroup);
  }

  function buildBeans() {
    const beanMat = new THREE.MeshStandardMaterial({ color: 0x3a1e0c, roughness: 0.6, metalness: 0.1 });
    const grooveMat = new THREE.MeshStandardMaterial({ color: 0x1a0c04, roughness: 0.8 });

    for (let i = 0; i < 14; i++) {
      const bean = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 20), beanMat);
      body.scale.set(1, 0.62, 0.72);
      bean.add(body);
      // groove
      const groove = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.02, 8, 24, Math.PI), grooveMat);
      groove.rotation.x = Math.PI / 2;
      groove.scale.set(1, 0.72, 1);
      bean.add(groove);

      const radius = 3 + Math.random() * 2.5;
      const angle = Math.random() * Math.PI * 2;
      bean.userData = {
        radius,
        angle,
        speed: 0.15 + Math.random() * 0.3,
        yBase: (Math.random() - 0.5) * 4,
        yAmp: 0.3 + Math.random() * 0.5,
        spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.02),
      };
      bean.position.set(Math.cos(angle) * radius, bean.userData.yBase, Math.sin(angle) * radius - 1);
      bean.scale.setScalar(0.6 + Math.random() * 0.6);
      scene.add(bean);
      beans.push(bean);
    }
  }

  function buildSteam() {
    const count = 260;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.4;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
      seeds[i] = Math.random();
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.userData.seeds = seeds;

    const sprite = makeSteamSprite();
    const mat = new THREE.PointsMaterial({
      size: 0.5, map: sprite, transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending, color: 0xf4e9d8,
    });
    steam = new THREE.Points(geo, mat);
    steam.position.set(0, 0.95, -1);
    scene.add(steam);
  }

  function makeSteamSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }

  function onResize() {
    if (!sceneReady) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // smooth pointer parallax
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    if (cupGroup) {
      cupGroup.rotation.y = t * 0.25 + pointer.x * 0.4;
      cupGroup.rotation.x = pointer.y * 0.15;
      cupGroup.position.y = -0.4 + Math.sin(t * 0.8) * 0.08;
    }

    beans.forEach((b) => {
      const d = b.userData;
      d.angle += d.speed * 0.008;
      b.position.x = Math.cos(d.angle) * d.radius;
      b.position.z = Math.sin(d.angle) * d.radius - 1;
      b.position.y = d.yBase + Math.sin(t * 0.6 + d.radius) * d.yAmp;
      b.rotation.x += d.spin.x;
      b.rotation.y += d.spin.y;
      b.rotation.z += d.spin.z;
    });

    if (steam) {
      const pos = steam.geometry.attributes.position;
      const seeds = steam.geometry.userData.seeds;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + 0.006 + seeds[i] * 0.004;
        let x = pos.getX(i) + Math.sin(t * 0.8 + seeds[i] * 10) * 0.002;
        if (y > 3) { y = 0; x = (Math.random() - 0.5) * 1.4; }
        pos.setY(i, y);
        pos.setX(i, x);
      }
      pos.needsUpdate = true;
      steam.rotation.y = t * 0.1;
    }

    // subtle camera parallax
    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.04;
    camera.lookAt(0, 0.6, 0);

    renderer.render(scene, camera);
  }

  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  });

  /* ---------------------------------------------------------
     SCROLL CHOREOGRAPHY (GSAP + ScrollTrigger)
  --------------------------------------------------------- */
  function initScroll() {
    if (!window.gsap) return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    // Reveal elements
    document.querySelectorAll('.reveal').forEach((el) => {
      if (prefersReduced || !window.ScrollTrigger) { el.classList.add('in'); return; }
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => el.classList.add('in'),
      });
    });

    if (prefersReduced || !window.ScrollTrigger || !sceneReady) return;

    // Camera + cup travel through the page
    const cam = camera.position;
    gsap.timeline({
      scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: 1 },
    })
      .to(cam, { z: 6.5, y: 2.2, ease: 'none' }, 0)                       // hero -> about
      .to(cupGroup.scale, { x: 0.8, y: 0.8, z: 0.8, ease: 'none' }, 0)
      .to(cam, { z: 8, y: 1.0, ease: 'none' }, 0.33)                      // menu
      .to(cam, { z: 10, y: 1.6, ease: 'none' }, 0.66)                     // gallery/visit
      .to(cupGroup.position, { x: 2.2, ease: 'none' }, 0.5);
  }

  /* ---------------------------------------------------------
     UI: nav, counters, cards, form, burger
  --------------------------------------------------------- */
  function initUI() {
    const nav = document.querySelector('.nav');
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // burger -> jump to visit (simple mobile affordance)
    const burger = document.querySelector('.nav-burger');
    if (burger) burger.addEventListener('click', () => {
      document.getElementById('visit').scrollIntoView({ behavior: 'smooth' });
    });

    // Animated counters
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      let started = false;
      const run = () => {
        if (started) return; started = true;
        const dur = 1400, t0 = performance.now();
        const step = (now) => {
          const p = Math.min((now - t0) / dur, 1);
          el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      if (window.ScrollTrigger) ScrollTrigger.create({ trigger: el, start: 'top 90%', onEnter: run });
      else run();
    });

    // Card cursor glow
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    // Reservation form
    const form = document.getElementById('reserve');
    const note = document.getElementById('formNote');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.reset();
      if (note) { note.hidden = false; }
    });
  }

  /* ---------------------------------------------------------
     LOADER + BOOT
  --------------------------------------------------------- */
  function boot() {
    const loader = document.getElementById('loader');
    const bar = loader ? loader.querySelector('.loader-bar span') : null;

    const ok = initThree();
    initUI();

    // fake-but-smooth progress, then reveal
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(p + Math.random() * 18, 100);
      if (bar) bar.style.width = p + '%';
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(() => {
          if (loader) loader.classList.add('done');
          initScroll();
          // Kick hero reveals immediately
          document.querySelectorAll('.hero .reveal').forEach((el, i) => {
            setTimeout(() => el.classList.add('in'), 120 * i);
          });
        }, 350);
      }
    }, 140);

    if (!ok) {
      // WebGL unavailable — still show content
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      canvas.style.display = 'none';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
