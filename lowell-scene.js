(function () {
  if (customElements.get('lowell-scene')) return;
  const THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js';
  const STOPS = [
    { label: 'Railroad Depot', c: '#6b8fb3', pin: [48, 5, 37], f: [48, 0, 36], z: 2.3 },
    { label: 'Canal & Water Wheel', c: '#c9a54e', pin: [-24, 6.5, -11], f: [-14, 4, -16], z: 2.3 },
    { label: 'Boarding House', c: '#c2715a', pin: [-15, 7.5, 19], f: [-6, 1, 19], z: 2.3 },
    { label: 'Weaving Room', c: '#5f8f96', pin: [6, 15.5, -13], f: [0, 8, -18], z: 2.4 },
    { label: 'Mill Yard Gate', c: '#7a9e86', pin: [0, 4, 2], f: [2, 0, 0], z: 2.5 },
    { label: 'The Acre', c: '#8f7fae', pin: [-50, 6, 24], f: [-48, 0, 26], z: 2.1 },
    { label: 'Cotton Storehouse', c: '#c4834f', pin: [56, 8, -18], f: [54, 0, -20], z: 2.4 },
  ];
  const BALE = [
    { p: [52, 1.3, 41], z: 2.5 }, { p: [56, 0.5, -14.6], z: 2.6 }, { p: [9, 0.6, -16.4], z: 2.7, cut: 1 },
    { p: [-2, 5.4, -15.6], z: 2.7, cut: 1 }, { p: [-8, 10.2, -14.6], z: 2.7, cut: 1 }, { p: [0, 0.5, 2.6], z: 2.6 },
  ];
  const HOME = [-2, 0, 4];
  const LABELS = [['MERRIMACK RIVER', -40, -0.5, -40], ['MERRIMACK CANAL', 44, 0.1, 5.5], ['THE ACRE', -54, 0.2, 40], ['BOSTON & LOWELL RAILROAD', 10, 0.2, 44.5], ['BOARDING HOUSES', -16, 0.2, 22.2]];
  const CSS = `
  :host{display:block;position:relative;width:100%;height:100%;overflow:hidden;background:#f2ede3;touch-action:none;user-select:none;-webkit-user-select:none}
  canvas{display:block;width:100%;height:100%;cursor:grab;outline:none}
  canvas.drag{cursor:grabbing}
  .ov{position:absolute;inset:0;pointer-events:none;overflow:hidden}
  .load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:Unbounded,sans-serif;font-weight:800;font-size:14px;letter-spacing:.08em;color:#5a5f6b}
  .pin{position:absolute;left:0;top:0;pointer-events:auto;border:0;background:none;padding:0;margin:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;font-family:'Bricolage Grotesque',sans-serif;will-change:transform}
  .lbl{display:flex;align-items:center;gap:7px;padding:4px 10px 4px 4px;border:2px solid #22262e;border-radius:3px;background:#fbf9f4;color:#22262e;font-weight:800;font-size:13px;white-space:nowrap;box-shadow:3px 3px 0 #22262e;transition:transform .15s}
  .num{width:22px;height:22px;border-radius:2px;display:flex;align-items:center;justify-content:center;font-family:Unbounded,sans-serif;font-weight:800;font-size:11px;background:var(--c);color:#22262e}
  .stick{width:2px;height:22px;background:#22262e}
  .dot{width:9px;height:9px;border-radius:50%;background:#22262e;margin-top:-2px}
  .pin:hover .lbl{transform:translateY(-3px)}
  .cur .lbl{animation:bob 1.5s ease-in-out infinite}
  .cur .num{box-shadow:0 0 0 2px #fbf9f4,0 0 0 4px var(--c)}
  .locked{cursor:not-allowed}
  .locked .lbl{background:#e9e3d6;color:#7d7a72;border-color:#a9a497;box-shadow:none;padding:3px}
  .locked .num{background:#d3cdc0;color:#6f6c65}
  .locked .txt{display:none}
  .locked .stick,.locked .dot{background:#a9a497}
  .done .lbl{background:#22262e;color:#f2ede3;box-shadow:3px 3px 0 var(--c);padding:3px}
  .done .txt{display:none}
  .done:hover .txt,.sel .txt{display:inline}
  .done:hover .lbl,.done.sel .lbl{padding:4px 10px 4px 4px}
  .sel .lbl{outline:3px solid var(--c);outline-offset:2px}
  .hide{display:none}
  .tip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#22262e;color:#f2ede3;font-weight:700;font-size:12px;padding:5px 9px;border-radius:3px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s}
  .tip.on{opacity:1}
  .shake .lbl{animation:shake .4s}
  .lab{position:absolute;left:0;top:0;font-family:Unbounded,sans-serif;font-weight:700;font-size:10px;letter-spacing:.2em;white-space:nowrap;will-change:transform}
  @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  .hz{position:absolute;left:0;top:0;pointer-events:auto;width:30px;height:30px;border-radius:50%;background:#a1543f;color:#fbf9f4;border:2px solid #22262e;font-family:Unbounded,sans-serif;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:2px 2px 0 #22262e;padding:0;will-change:transform}
  .hz.on{background:#22262e;outline:3px solid #a1543f;outline-offset:2px}
  .hz.off{display:none}`;
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  class LowellScene extends HTMLElement {
    constructor() {
      super();
      this.S = { done: [0, 0, 0, 0, 0, 0, 0], current: 0, focus: null, cut: false, time: 10, sunday: false, gate: true, looms: 2, bale: null, panelX: 0, panelY: 0 };
      const sh = this.attachShadow({ mode: 'open' });
      sh.innerHTML = `<style>${CSS}</style><canvas></canvas><div class="ov"><div class="load">LOADING LOWELL…</div></div>`;
      this.canvas = sh.querySelector('canvas'); this.ov = sh.querySelector('.ov');
    }
    connectedCallback() {
      if (this._started) return; this._started = true;
      this._onState = (e) => this.apply(e.detail);
      window.addEventListener('lowell:state', this._onState);
      if (window.__lowellState) this.S = Object.assign(this.S, window.__lowellState);
      import(THREE_URL).then((T) => this.init(T)).catch((err) => { this.ov.querySelector('.load').textContent = 'Scene failed to load'; console.error(err); });
    }
    disconnectedCallback() { window.removeEventListener('lowell:state', this._onState); cancelAnimationFrame(this._raf); clearInterval(this._iv); if (this._ro) this._ro.disconnect(); }

    init(THREE) {
      this.T = THREE;
      const R = rng(1845);
      const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer = renderer;
      const scene = new THREE.Scene(); this.scene = scene;
      this.bgDay = new THREE.Color(0xf2ede3); this.bgNight = new THREE.Color(0x2c323d); this.bg = new THREE.Color(0xf2ede3);
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1200);
      this.DIR = new THREE.Vector3(1, 1.35, 1).normalize();
      this.target = new THREE.Vector3(...HOME); this.zoom = 1; this.offX = 0; this.offY = 0;
      this.hemi = new THREE.HemisphereLight(0xffffff, 0xd9d2c4, 1.9);
      const sun = new THREE.DirectionalLight(0xfff6e8, 2.3);
      sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536);
      Object.assign(sun.shadow.camera, { left: -95, right: 95, top: 95, bottom: -95, near: 1, far: 400 });
      sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
      sun.target.position.set(0, 0, 0);
      scene.add(this.hemi, sun, sun.target); this.sun = sun;

      const lam = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
      const litU = { mill: { value: 0 }, house: { value: 0 } }; this.litU = litU;
      const winMat = (c, o) => {
        const m = lam(c, o.cut ? { transparent: true } : {});
        const key = ['w', o.fh, o.span, o.base, o.g].join('_');
        m.customProgramCacheKey = () => key;
        m.onBeforeCompile = (sh) => {
          sh.uniforms.uLit = litU[o.g];
          sh.vertexShader = 'varying vec3 vWP;\nvarying vec3 vWN;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
            vec4 wp4 = vec4(transformed, 1.0); vec3 n0 = objectNormal;
            #ifdef USE_INSTANCING
              wp4 = instanceMatrix * wp4; n0 = mat3(instanceMatrix) * n0;
            #endif
            vWP = (modelMatrix * wp4).xyz; vWN = normalize(mat3(modelMatrix) * n0);`);
          sh.fragmentShader = 'uniform float uLit;\nvarying vec3 vWP;\nvarying vec3 vWN;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
            if (abs(vWN.y) < 0.5) {
              float u = abs(vWN.x) > 0.5 ? vWP.z : vWP.x;
              float y = vWP.y - ${o.base.toFixed(2)};
              float fy = fract(y / ${o.fh.toFixed(2)}), fu = fract(u / ${o.span.toFixed(2)});
              float win = step(0.3, fu) * step(fu, 0.7) * step(0.22, fy) * step(fy, 0.8) * step(0.1, y);
              vec3 glass = mix(vec3(0.36, 0.40, 0.47), vec3(1.0, 0.84, 0.55), uLit);
              diffuseColor.rgb = mix(diffuseColor.rgb, glass, win * mix(0.72, 1.0, uLit));
              totalEmissiveRadiance += vec3(1.0, 0.76, 0.42) * win * uLit * 0.85;
            }`);
        };
        return m;
      };
      const BRICK = 0xd2ab95, SLATE = 0x9aa0a6, STONE = 0xbdb3a3, WATER = 0x8ea2b2, WHITE = 0xf5f1e9;
      const B = (x0, x1, y0, y1, z0, z1, mat, parent = scene, cast = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
      const gableGeo = (w, h, L) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false }); g.translate(0, 0, -L / 2); g.rotateY(Math.PI / 2); return g; };
      const gable = (x0, x1, z0, z1, y, h, mat, parent = scene) => { const m = new THREE.Mesh(gableGeo(z1 - z0, h, x1 - x0), mat); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };

      this._marks = []; const mark = (ph) => this._marks.push([scene.children.length, ph]); mark('base');
      // Ground, river, canal
      const ground = lam(0xd9d2c5); this.groundM = ground; this.gDirt = new THREE.Color(0xd9d2c5); this.gGreen = new THREE.Color(0xbac69a); const _g0 = ground, path = lam(0xcfc6b6), waterM = lam(WATER), stone = lam(STONE);
      B(-72, 72, -6, 0, -32, 50, ground, scene, false);
      const river = new THREE.Mesh(new THREE.BoxGeometry(144, 6, 20), [waterM, waterM, lam(0xa9bac7), waterM, waterM, waterM]);
      river.position.set(0, -3.6, -42); river.receiveShadow = true; scene.add(river);
      B(-72, 72, -0.6, 0.02, -32.4, -32, stone, scene, false);
      const flat = (x0, x1, z0, z1, mat, y = 0.02) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m); return m; };
      mark('canal');
      const wat = lam(0x93a7b6);
      flat(-72, 72, 3, 8, wat); flat(-26, -22, -32, 3, wat, 0.025);
      B(-72, -26, 0, 0.3, 2.7, 3, stone); B(-22, 72, 0, 0.3, 2.7, 3, stone); B(-72, 72, 0, 0.3, 8, 8.3, stone);
      B(-26.3, -26, 0, 0.3, -32, 2.7, stone); B(-22, -21.7, 0, 0.3, -32, 2.7, stone);
      flat(-72, 72, 9.2, 12.4, path, 0.015); flat(-30, 62, -12.4, -10.6, path, 0.015); flat(-2, 2, -10.6, 2, path, 0.015);
      B(-2.2, 2.2, 0.15, 0.4, 2.6, 8.7, lam(0xbcae96)); B(32, 37, 0.15, 0.4, 2.6, 8.7, lam(0xbcae96)); B(-40, -35, 0.15, 0.4, 2.6, 8.7, lam(0xbcae96)); B(-26.4, -21.6, 0.15, 0.4, -12.2, -10.8, lam(0xbcae96));
      mark('rail');
      // Track
      flat(-72, 72, 42.6, 45.4, lam(0xc4baa9), 0.015);
      B(-72, 72, 0.02, 0.14, 43.3, 43.45, lam(0x6b6259), scene, false); B(-72, 72, 0.02, 0.14, 44.55, 44.7, lam(0x6b6259), scene, false);

      mark('mill1');
      // Main mill (cutaway)
      const MW = { fh: 2.4, span: 2.0, base: 0 };
      this.cutMats = [];
      const cutWin = winMat(BRICK, Object.assign({ g: 'mill', cut: true }, MW)); this.cutMats.push(cutWin);
      const cutRoof = lam(SLATE, { transparent: true }); this.cutMats.push(cutRoof);
      const millWin = winMat(BRICK, Object.assign({ g: 'mill' }, MW));
      B(-18, 18, 0, 12, -24, -23.6, millWin); B(-18, -17.6, 0, 12, -24, -13, millWin);
      this.cutParts = [B(17.6, 18, 0, 12, -24, -13, cutWin), B(-18, 18, 0, 12, -13.4, -13, cutWin), gable(-18.3, 18.3, -24.3, -12.7, 12, 1.7, cutRoof)];
      this.cutParts.forEach((m) => (m.renderOrder = 2));
      // tower + belfry (back)
      B(-2.2, 2.2, 0, 15.2, -27.4, -23.8, millWin);
      B(-2.4, 2.4, 15.2, 15.5, -27.6, -23.6, lam(WHITE));
      [[-2, -27.2], [2, -27.2], [-2, -24], [2, -24]].forEach(([x, z]) => B(x - 0.2, x + 0.2, 15.5, 17.6, z - 0.2, z + 0.2, lam(WHITE)));
      const capM = lam(SLATE);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.2, 4), capM); cap.position.set(0, 18.7, -25.6); cap.rotation.y = Math.PI / 4; cap.castShadow = true; scene.add(cap);
      this.bell = new THREE.Group(); this.bell.position.set(0, 17.4, -25.6);
      const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 1.0, 14, 1, true), lam(0xa88b4a, { side: THREE.DoubleSide })); bm.position.y = -0.55; this.bell.add(bm); scene.add(this.bell);
      this.bellT = 0;
      mark('mill2');
      // Second mill, storehouse, counting house, gatehouse
      B(24, 46, 0, 9.6, -27, -16, millWin); gable(23.7, 46.3, -27.3, -15.7, 9.6, 1.5, lam(SLATE));
      const storeWin = winMat(BRICK, { g: 'mill', fh: 2.6, span: 2.6, base: 0 });
      B(50, 62, 0, 5.2, -27, -18, storeWin); gable(49.7, 62.3, -27.3, -17.7, 5.2, 1.4, lam(SLATE));
      B(53.6, 58.4, 0, 3, -18.05, -17.95, lam(0x6b5d4f));
      const chWin = winMat(0xe6dccf, { g: 'mill', fh: 2.2, span: 1.6, base: 0 });
      B(8, 15, 0, 4.4, -9, -4.5, chWin); gable(7.8, 15.2, -9.2, -4.3, 4.4, 1.4, lam(SLATE));
      B(3.2, 6, 0, 2.6, -1.2, 1.2, lam(0xe6dccf)); gable(3, 6.2, -1.4, 1.4, 2.6, 1.1, lam(SLATE));
      // yard wall with gate
      B(-30, -2.4, 0, 1.1, 1.4, 1.8, stone); B(2.4, 62, 0, 1.1, 1.4, 1.8, stone);
      B(-3, -2.2, 0, 2.6, 1.2, 2, stone); B(2.2, 3, 0, 2.6, 1.2, 2, stone);
      this.gateL = B(-2.2, 0, 0.1, 2.0, 1.55, 1.65, lam(0x6b5d4f)); this.gateR = B(0, 2.2, 0.1, 2.0, 1.55, 1.65, lam(0x6b5d4f));
      B(-30.2, -29.8, 0, 1.1, -12, 1.8, stone);

      mark('mill1');
      // Water wheel
      const wheel = new THREE.Group(); wheel.position.set(-24, 2.4, -16.2);
      const wood = lam(0x8a7360), dark = lam(0x5b4d40);
      [-1, 1].forEach((s) => { const r = new THREE.Mesh(new THREE.TorusGeometry(3, 0.14, 6, 32), wood); r.rotation.y = Math.PI / 2; r.position.x = s * 1.05; r.castShadow = true; wheel.add(r); });
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const b = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.7), wood); b.position.set(0, Math.sin(a) * 2.9, Math.cos(a) * 2.9); b.rotation.x = -a; b.castShadow = true; wheel.add(b); }
      for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.8, 0.14), dark); s.rotation.x = i / 6 * Math.PI; [-1.05, 1.05].forEach((x) => { const c = s.clone(); c.position.x = x; wheel.add(c); }); }
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 7, 8), dark); axle.rotation.z = Math.PI / 2; axle.position.x = 3.2; wheel.add(axle);
      scene.add(wheel); this.wheel = wheel;
      B(-27, -26.3, 0, 3.6, -21, -11.6, stone); B(-21.7, -21, 0, 3.6, -21, -11.6, stone);
      gable(-27.2, -20.8, -21.2, -11.4, 3.6, 1.2, lam(SLATE));

      mark('none');
      // Mill interior
      const inner = new THREE.Group(); inner.visible = false; scene.add(inner); this.inner = inner;
      const FG = [0, 1, 2, 3, 4].map(() => { const g = new THREE.Group(); inner.add(g); return g; }); this.FG = FG;
      const floorM = lam(0xd8cbb6), mach = lam(0x7d7366), machL = lam(0xa49a8c), cotton = lam(0xf6f2e9);
      for (let k = 0; k < 5; k++) B(-17.6, 17.6, k * 2.4, k * 2.4 + 0.15, -23.6, -13.4, floorM, FG[k], false);
      const shafts = [];
      for (let k = 0; k < 5; k++) {
        const g = new THREE.Group(); g.position.set(0, k * 2.4 + 2.1, -18.5);
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 34.6, 6), dark); s.rotation.z = Math.PI / 2; g.add(s);
        for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 0.62), wood); p.position.x = -16 + i * 4; g.add(p); }
        FG[k].add(g); shafts.push(g);
        for (let i = 0; i < 9; i++) B(-16.03 + i * 4, -15.97 + i * 4, k * 2.4 + 1.0, k * 2.4 + 2.1, -18.53, -18.47, dark, FG[k], false);
      }
      this.shafts = shafts;
      const vs = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 12, 6), dark); vs.position.set(-17, 6, -16.2); inner.add(vs); this.vshaft = vs;
      // F1 carding + bales
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { B(-15 + i * 4, -13.2 + i * 4, 0.15, 1.35, -21.6 + j * 4.2, -19.8 + j * 4.2, mach, FG[0]); B(-15 + i * 4, -13.2 + i * 4, 1.35, 1.55, -21.4 + j * 4.2, -20 + j * 4.2, machL, FG[0]); }
      for (let i = 0; i < 12; i++) B(6 + (i % 4) * 1.1, 6.9 + (i % 4) * 1.1, 0.15 + Math.floor(i / 8) * 0.62, 0.72 + Math.floor(i / 8) * 0.62, -22.8 + Math.floor((i % 8) / 4) * 1.0, -22 + Math.floor((i % 8) / 4) * 1.0, cotton, FG[0]);
      // F2 roving
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) B(-15 + i * 8.4, -11.6 + i * 8.4, 2.55, 3.5, -21.4 + j * 4.4, -20.4 + j * 4.4, mach, FG[1]);
      // F3 spinning
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { B(-16 + i * 17, -1 + i * 17, 4.95, 5.95, -22.6 + j * 3.2, -21.8 + j * 3.2, mach, FG[2]); B(-16 + i * 17, -1 + i * 17, 5.95, 6.1, -22.5 + j * 3.2, -21.9 + j * 3.2, cotton, FG[2]); }
      // Looms F4-F5
      this.looms = []; for (let k = 3; k < 5; k++) for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) this.looms.push({ x: -15.4 + c * 2.8, y: k * 2.4 + 0.15, z: -21.6 + r * 3.1, k, r, c });
      const NL = this.looms.length;
      this.loomIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.9, 1.0), lam(0xffffff), NL);
      this.beatIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.12, 0.14), lam(0xffffff), NL);
      this.clothIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.04, 0.8), lam(0xf6f2e9), NL);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), C = new THREE.Color();
      this.looms.forEach((l, i) => {
        M.compose(P.set(l.x, l.y + 0.45, l.z), Q, S1); this.loomIM.setMatrixAt(i, M);
        M.compose(P.set(l.x, l.y + 0.93, l.z - 0.05), Q, S1); this.clothIM.setMatrixAt(i, M);
        this.beatIM.setColorAt(i, C.set(0x5b4d40));
      });
      [this.loomIM, this.beatIM, this.clothIM].forEach((m) => { m.castShadow = true; m.receiveShadow = true; FG[3].add(m); });
      const bodyG = new THREE.CylinderGeometry(0.16, 0.23, 0.5, 8), headG = new THREE.SphereGeometry(0.13, 8, 6);
      this.workIM = new THREE.InstancedMesh(bodyG, lam(0xffffff), 120);
      this.headIM = new THREE.InstancedMesh(headG, lam(0xefd2b4), 120);
      this.workIM.castShadow = true; FG[3].add(this.workIM, this.headIM);
      const crew = (list, g) => { const b = new THREE.InstancedMesh(bodyG, lam(0xffffff), list.length), hd = new THREE.InstancedMesh(headG, lam(0xefd2b4), list.length); list.forEach(([x, y, z], i) => { M.compose(P.set(x, y + 0.25, z), Q, S1); b.setMatrixAt(i, M); M.compose(P.set(x, y + 0.63, z), Q, S1); hd.setMatrixAt(i, M); b.setColorAt(i, C.set(['#7a4a42', '#4c5a66', '#5a4e43', '#8f7fae', '#6b8fb3'][i % 5])); }); b.castShadow = true; g.add(b, hd); };
      crew([0, 1, 2, 3, 4, 5].map((i) => [-8.5 + (i % 2) * 17, 4.95, -21 + Math.floor(i / 2) * 3.2]), FG[2]);
      crew([0, 1, 2].map((i) => [-13 + i * 4, 0.15, -18.5]), FG[0]);
      crew([0, 1, 2].map((i) => [-11 + i * 8.4, 2.55, -18.6]), FG[1]);
      this.setLooms(2);

      // Close-up loom
      const LO = new THREE.Group(); LO.position.set(-15.4, 9.75, -15.4); LO.visible = false; scene.add(LO); this.LO = LO;
      const iron = lam(0x3f4247), ironL = lam(0x63666c), woodL = lam(0x9a7650), thr = lam(0xeee8da), clothW = lam(0xf7f3ea);
      const bx = (w, h, d, mat, x, y, z, par = LO) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.receiveShadow = true; par.add(m); return m; };
      const cylX = (r, len, seg = 20) => new THREE.CylinderGeometry(r, r, len, seg);
      const spinner = (geo, mat, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); const m = new THREE.Mesh(geo, mat); m.rotation.z = Math.PI / 2; g.add(m); LO.add(g); return g; };
      [-0.8, 0.8].forEach((x) => { [-0.42, 0.42].forEach((z) => bx(0.07, 1.0, 0.07, iron, x, 0.5, z)); bx(0.06, 0.06, 0.9, iron, x, 0.97, 0); bx(0.06, 0.06, 0.9, iron, x, 0.2, 0); });
      bx(1.66, 0.06, 0.06, iron, 0, 0.97, -0.42); bx(1.66, 0.07, 0.09, woodL, 0, 0.745, 0.42);
      spinner(cylX(0.12, 1.48), thr, 0, 0.56, -0.38); spinner(cylX(0.03, 1.66, 8), iron, 0, 0.56, -0.38);
      this.roll = spinner(cylX(0.1, 1.48), clothW, 0, 0.36, 0.3); spinner(cylX(0.025, 1.66, 8), iron, 0, 0.36, 0.3);
      const stripes = (w, hh, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
      const warpM = new THREE.MeshLambertMaterial({ map: stripes(512, 4, (g) => { g.fillStyle = '#efe9dc'; for (let i = 0; i < 512; i += 5) g.fillRect(i, 0, 2, 4); }), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide });
      const wireM = new THREE.MeshLambertMaterial({ map: stripes(512, 4, (g) => { g.fillStyle = '#8d9096'; for (let i = 0; i < 512; i += 6) g.fillRect(i, 0, 1, 4); }), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide });
      const warp = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.003, Math.hypot(0.44, 0.1)), warpM); warp.position.set(0, 0.69, -0.16); warp.rotation.x = -Math.atan2(0.1, 0.44); LO.add(warp);
      bx(1.46, 0.006, 0.36, clothW, 0, 0.745, 0.24);
      this.hed = [-0.2, -0.12].map((z) => { const g = new THREE.Group(); g.position.set(0, 0.72, z); bx(1.54, 0.025, 0.025, woodL, 0, 0.17, 0, g); bx(1.54, 0.025, 0.025, woodL, 0, -0.17, 0, g); bx(0.025, 0.36, 0.025, woodL, -0.76, 0, 0, g); bx(0.025, 0.36, 0.025, woodL, 0.76, 0, 0, g); g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.32), wireM)); LO.add(g); return g; });
      const lay = new THREE.Group(); lay.position.set(0, 0.15, 0.1); LO.add(lay); this.lay = lay;
      [-0.74, 0.74].forEach((x) => bx(0.04, 0.5, 0.04, woodL, x, 0.25, 0, lay));
      bx(1.72, 0.07, 0.12, woodL, 0, 0.5, 0, lay);
      const reed = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 0.16), wireM); reed.position.set(0, 0.62, -0.04); lay.add(reed);
      bx(1.46, 0.02, 0.02, woodL, 0, 0.7, -0.04, lay);
      [-0.87, 0.87].forEach((x) => bx(0.22, 0.09, 0.13, woodL, x, 0.58, 0, lay));
      const shut = new THREE.Group(); shut.position.set(-0.86, 0.565, 0.01); lay.add(shut); this.shut = shut;
      shut.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.05), lam(0xb88d58)));
      [-1, 1].forEach((s) => { const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 8), iron); tip.rotation.z = -s * Math.PI / 2; tip.position.x = s * 0.13; shut.add(tip); });
      this.pickS = [-0.97, 0.97].map((x) => { const g = new THREE.Group(); g.position.set(x, 0.15, 0.1); bx(0.035, 0.55, 0.035, woodL, 0, 0.275, 0, g); LO.add(g); return g; });
      this.pul = spinner(cylX(0.17, 0.07, 24), ironL, 0.93, 0.6, -0.1); bx(0.075, 0.3, 0.035, iron, 0, 0, 0, this.pul);
      spinner(cylX(0.03, 0.3, 8), iron, 0.85, 0.6, -0.1);
      const gearGeo = (r, n) => { const s = new THREE.Shape(); for (let i = 0; i < n * 2; i++) { const a0 = i / (n * 2) * Math.PI * 2, rr = i % 2 ? r * 0.82 : r, hw = Math.PI / (n * 2) * 0.5; const p1 = [Math.cos(a0 - hw) * rr, Math.sin(a0 - hw) * rr], p2 = [Math.cos(a0 + hw) * rr, Math.sin(a0 + hw) * rr]; if (i === 0) s.moveTo(...p1); else s.lineTo(...p1); s.lineTo(...p2); } s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false }); g.translate(0, 0, -0.0175); g.rotateY(Math.PI / 2); return g; };
      const gear = (r, n, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); g.add(new THREE.Mesh(gearGeo(r, n), ironL)); const hub = new THREE.Mesh(cylX(r * 0.25, 0.06, 10), iron); hub.rotation.z = Math.PI / 2; g.add(hub); LO.add(g); return g; };
      this.gA = gear(0.16, 18, 0.88, 0.33, 0.16); this.gB = gear(0.085, 10, 0.88, 0.495, 0.325);
      const beltTex = stripes(8, 64, (g) => { g.fillStyle = '#6b4a33'; g.fillRect(0, 0, 8, 64); g.fillStyle = '#4a3222'; for (let y = 0; y < 64; y += 16) g.fillRect(0, y, 8, 3); });
      beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping; beltTex.repeat.set(1, 6); this.beltTex = beltTex;
      const beltM = lam(0xffffff, { map: beltTex });
      spinner(cylX(0.2, 0.09, 24), ironL, 0.93, 1.95, -3.1);
      LO.updateMatrixWorld(true);
      [[0.77, 2.15], [0.43, 1.75]].forEach(([y0, y1]) => { const p0 = new THREE.Vector3(0.93, y0, -0.1), p1 = new THREE.Vector3(0.93, y1, -3.1); const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, p0.distanceTo(p1)), beltM); m.position.copy(p0).add(p1).multiplyScalar(0.5); LO.add(m); m.lookAt(LO.localToWorld(p1.clone())); });
      const W = new THREE.Group(); W.position.set(0.05, 0, 0.8); W.rotation.y = Math.PI; LO.add(W);
      const wm = (geo, c, x, y, z) => { const m = new THREE.Mesh(geo, lam(c)); m.position.set(x, y, z); W.add(m); return m; };
      wm(new THREE.CylinderGeometry(0.12, 0.3, 0.74, 18), 0x5f8f96, 0, 0.37, 0);
      wm(new THREE.BoxGeometry(0.24, 0.5, 0.012), 0xf3efe6, 0, 0.42, 0.205).rotation.x = -0.24;
      wm(new THREE.CylinderGeometry(0.1, 0.125, 0.36, 14), 0x4f7a80, 0, 0.9, 0);
      wm(new THREE.SphereGeometry(0.1, 16, 12), 0xefd2b4, 0, 1.17, 0);
      wm(new THREE.SphereGeometry(0.106, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), 0x4a3426, 0, 1.18, -0.012);
      wm(new THREE.SphereGeometry(0.05, 10, 8), 0x4a3426, 0, 1.2, -0.1);
      [-1, 1].forEach((s) => { const ar = new THREE.Group(); ar.position.set(s * 0.13, 1.03, 0); ar.rotation.x = -1.0; ar.rotation.z = s * 0.15; W.add(ar); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.38, 8), lam(0x4f7a80)); m.position.y = -0.19; ar.add(m); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), lam(0xefd2b4)); hd.position.y = -0.39; ar.add(hd); });
      this.lint = new THREE.InstancedMesh(new THREE.SphereGeometry(0.009, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), 70); LO.add(this.lint);
      this.lintP = Array.from({ length: 70 }, () => [R() * 2.4 - 1.2, 0.2 + R() * 1.8, R() * 2 - 0.8, R() * 6]);

      mark('houses');
      // Boarding houses
      const bhWin = winMat(0xe2cfc0, { g: 'house', fh: 1.6, span: 1.5, base: 0 });
      const roofs = lam(SLATE), chimM = lam(0xa98f7e);
      this.chims = [];
      [[-26, -6, 13.5, 18.5], [-2, 18, 13.5, 18.5], [-26, -6, 24, 29], [-2, 18, 24, 29], [22, 40, 13.5, 18.5]].forEach(([x0, x1, z0, z1]) => {
        B(x0, x1, 0, 4.8, z0, z1, bhWin); gable(x0 - 0.2, x1 + 0.2, z0 - 0.3, z1 + 0.3, 4.8, 1.6, roofs);
        B(x0 - 0.5, x0, 0, 6.4, z0 - 0.3, z1 + 0.3, lam(BRICK)); B(x1, x1 + 0.5, 0, 6.4, z0 - 0.3, z1 + 0.3, lam(BRICK));
        for (let x = x0 + 2.5; x < x1 - 1; x += 5) { B(x - 0.3, x + 0.3, 5.6, 7, (z0 + z1) / 2 - 0.3, (z0 + z1) / 2 + 0.3, chimM); this.chims.push([x, 7.1, (z0 + z1) / 2]); }
      });
      mark('rail');
      // Depot + train
      B(40, 56, 0, 3.2, 33.5, 38.5, winMat(0xe6dccf, { g: 'house', fh: 3.2, span: 2.2, base: 0 }));
      gable(39.4, 56.6, 33, 41.6, 3.2, 1.5, lam(SLATE));
      for (let x = 41; x <= 55; x += 3.5) B(x - 0.12, x + 0.12, 0, 3.2, 41.1, 41.35, lam(WHITE));
      const train = new THREE.Group(); train.position.set(36, 0, 44);
      const tb = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; train.add(m); return m; };
      tb(new THREE.BoxGeometry(5.2, 0.4, 1.6), lam(0x3b3f47), 0, 0.45, 0);
      const boiler = tb(new THREE.CylinderGeometry(0.62, 0.62, 3.4, 14), lam(0x4a4f58), -0.5, 1.25, 0); boiler.rotation.z = Math.PI / 2;
      tb(new THREE.CylinderGeometry(0.28, 0.42, 1.3, 10), lam(0x3b3f47), -1.8, 2.3, 0);
      tb(new THREE.BoxGeometry(1.4, 1.7, 1.5), lam(0x7a4a42), 1.8, 1.45, 0);
      for (let i = 0; i < 3; i++) { tb(new THREE.BoxGeometry(4.2, 1.6, 1.6), lam(i === 2 ? 0x9a8b74 : 0xc9a54e), 5.6 + i * 4.6, 1.3, 0); tb(new THREE.BoxGeometry(4.4, 0.15, 1.8), lam(0x5b4d40), 5.6 + i * 4.6, 2.15, 0); }
      for (let i = 0; i < 8; i++) { const w = tb(new THREE.CylinderGeometry(0.4, 0.4, 1.7, 12), lam(0x2f3238), -1.6 + i * 2.5, 0.42, 0); w.rotation.x = Math.PI / 2; }
      scene.add(train); this.train = train;
      mark('mill2');
      // Storehouse bales + river boat
      const baleM = lam(0xf3eee2);
      for (let i = 0; i < 18; i++) B(50.6 + (i % 6) * 1.0, 51.5 + (i % 6) * 1.0, Math.floor(i / 12) * 0.6, 0.55 + Math.floor(i / 12) * 0.6, -16.6 + Math.floor((i % 12) / 6) * 0.9, -15.9 + Math.floor((i % 12) / 6) * 0.9, baleM);
      const boat = new THREE.Group(); boat.position.set(54, -0.55, -36);
      const bt = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; boat.add(o); };
      bt(new THREE.BoxGeometry(10, 0.9, 3), lam(0x6b5d4f), 0, 0.2, 0);
      for (let i = 0; i < 10; i++) bt(new THREE.BoxGeometry(0.9, 0.55, 0.7), baleM, -3.6 + (i % 5) * 1.6, 0.95, -0.6 + Math.floor(i / 5) * 1.2);
      scene.add(boat); this.boat = boat;
      mark('acre');
      // The Acre
      const shM = lam(0xc4b9a7), shR = lam(0x8f877c);
      let placed = 0;
      for (let i = 0; i < 300 && placed < 34; i++) {
        const x = -68 + R() * 30, z = 13 + R() * 27;
        if (Math.hypot(x + 46, z - 31) < 6 || (x > -42 && z < 20)) continue;
        if (this._acre && this._acre.some((a) => Math.abs(a[0] - x) < 3.2 && Math.abs(a[1] - z) < 3)) continue;
        (this._acre = this._acre || []).push([x, z]); placed++;
        const w = 2 + R() * 0.8, d = 1.8 + R() * 0.6, h = 1.4 + R() * 0.5;
        B(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, shM); gable(x - w / 2 - 0.1, x + w / 2 + 0.1, z - d / 2 - 0.15, z + d / 2 + 0.15, h, 0.8, shR);
        if (R() < 0.35) this.chims.push([x + w / 4, h + 0.9, z]);
      }
      mark('church');
      const chW = winMat(0xe6dccf, { g: 'house', fh: 4, span: 1.8, base: 0.5 });
      B(-49, -43, 0, 4.6, -34 + 62, -25 + 62, chW); gable(-49.2, -42.8, 27.8, 37.2, 4.6, 2.2, lam(SLATE));
      B(-47, -45, 0, 7.5, 35.4, 37.4, lam(0xe6dccf));
      const sp = new THREE.Mesh(new THREE.ConeGeometry(1.25, 4.2, 4), lam(SLATE)); sp.position.set(-46, 9.6, 36.4); sp.rotation.y = Math.PI / 4; sp.castShadow = true; scene.add(sp);
      mark('base');
      // Trees
      const trees = [];
      for (let i = 0; i < 400 && trees.length < 46; i++) {
        const x = -70 + R() * 140, z = -10 + R() * 58;
        const ok = (z > 9 && z < 12.6 && x > -30) || (z > 19.5 && z < 23) && x < 20 || (z > 30 && z < 41 && x > -30 && x < 30) || (z > -11 && z < 1 && x > 16 && x < 22);
        if (ok && !(x > 38 && z > 32)) trees.push([x, z, 0.8 + R() * 0.4]);
      }
      const tCols = ['#a9b596', '#9aa886', '#b5bf9f'];
      const tIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff, { flatShading: true }), trees.length);
      const tkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.17, 1, 5), lam(0x8a7a68), trees.length);
      trees.forEach(([x, z, s], i) => { M.compose(P.set(x, 1.7 * s, z), Q, S1.set(s, s * 1.1, s)); tIM.setMatrixAt(i, M); tIM.setColorAt(i, C.set(tCols[i % 3])); M.compose(P.set(x, 0.5 * s, z), Q, S1.set(s, s, s)); tkIM.setMatrixAt(i, M); });
      S1.set(1, 1, 1);
      tIM.castShadow = tkIM.castShadow = true; scene.add(tIM, tkIM);
      mark('people');
      // People outdoors
      const lanes = [[[-28, -11.5], [60, -11.5]], [[-60, 10.8], [62, 10.8]], [[-24, 21.2], [18, 21.2]], [[40, 39.8], [56, 39.8]], [[-64, 20.5], [-40, 20.5]], [[0, -10], [0, 0.4]], [[-58, 30], [-50, 18]]];
      const coat = ['#3d4450', '#5a4e43', '#7d6e5f', '#4c5a66', '#7a4a42', '#c2715a', '#8f7fae', '#5f6f5c', '#6b8fb3', '#9a8b74'];
      const skin = ['#efd2b4', '#d9b08c', '#f3dcc4', '#e6c3a0'];
      this.walkers = [];
      for (let i = 0; i < 46; i++) { const l = lanes[i % lanes.length]; this.walkers.push({ a: l[0], b: l[1], s: R(), v: (0.012 + R() * 0.02) * (R() < 0.5 ? -1 : 1), off: (R() - 0.5) * 1.2, ph: R() * 6 }); }
      this.pIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.23, 0.5, 6), lam(0xffffff), this.walkers.length);
      this.phIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), lam(0xffffff), this.walkers.length);
      this.walkers.forEach((w, i) => { this.pIM.setColorAt(i, C.set(coat[i % coat.length])); this.phIM.setColorAt(i, C.set(skin[i % skin.length])); });
      this.pIM.castShadow = this.phIM.castShadow = true; scene.add(this.pIM, this.phIM);
      // Farm village, 1821
      const farmW = lam(0xf1ece2), farmR = lam(0x8e8a84), barnM = lam(0x9a6a58), barnR = lam(0x7d7770), fenceM = lam(0x9a8a74), fieldA = lam(0xaebb8c), fieldB = lam(0xc3c99b);
      const FARMS = [[8, -18, 0.23], [36, -21, 0.58], [-12, 20, 0.36], [20, 26, 0.37], [-38, 26, 0.12], [46, 34, 0.68], [-56, 16, 0.12], [56, -16, 0.57]];
      FARMS.forEach(([x, z, end], i) => {
        mark('farm:' + end);
        flat(x - 9, x + 9, z - 7, z + 7, i % 2 ? fieldA : fieldB, 0.03);
        B(x - 1.6, x + 1.6, 0, 1.9, z - 1.1, z + 1.1, farmW); gable(x - 1.7, x + 1.7, z - 1.25, z + 1.25, 1.9, 1.1, farmR);
        B(x + 0.6, x + 0.95, 1.6, 3.3, z - 0.2, z + 0.15, lam(0xb39b8a));
        B(x + 3, x + 6.2, 0, 2.3, z - 1.6, z + 1.6, barnM); gable(x + 2.9, x + 6.3, z - 1.75, z + 1.75, 2.3, 1.4, barnR);
        [[x - 9, x + 9, z - 7, z - 6.9], [x - 9, x + 9, z + 6.9, z + 7], [x - 9, x - 8.9, z - 7, z + 7], [x + 8.9, x + 9, z - 7, z + 7]].forEach(([a, b, c, d]) => B(a, b, 0, 0.45, c, d, fenceM, scene, false));
      });
      mark('farm:0.5');
      const ptrees = [];
      for (let i = 0; i < 600 && ptrees.length < 44; i++) { const x = -68 + R() * 136, z = -28 + R() * 76; if ((z > 1 && z < 10) || (z > 41 && z < 47) || (x > -27 && x < -21 && z < 3)) continue; if (FARMS.some(([fx, fz]) => Math.abs(fx - x) < 10 && Math.abs(fz - z) < 8)) continue; ptrees.push([x, z, 0.9 + R() * 0.5]); }
      const ptIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), lam(0xffffff, { flatShading: true }), ptrees.length);
      const ptkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.17, 1, 5), lam(0x8a7a68), ptrees.length);
      ptrees.forEach(([x, z, sc], i) => { M.compose(P.set(x, 1.7 * sc, z), Q, S1.set(sc, sc * 1.1, sc)); ptIM.setMatrixAt(i, M); ptIM.setColorAt(i, C.set(tCols[i % 3])); M.compose(P.set(x, 0.5 * sc, z), Q, S1.set(sc, sc, sc)); ptkIM.setMatrixAt(i, M); });
      S1.set(1, 1, 1); ptIM.castShadow = ptkIM.castShadow = true; scene.add(ptIM, ptkIM);
      mark('none');
      // Smoke
      this.emit = [{ o: () => new THREE.Vector3(this.train.position.x - 1.8, 3.1, 44), rate: 0.5, t: 0 }];
      this.chims.slice(0, 10).forEach((c, i) => this.emit.push({ p: new THREE.Vector3(...c), rate: 1.3 + (i % 3) * 0.4, t: R() }));
      this.puffs = []; const pg = new THREE.IcosahedronGeometry(1, 1);
      for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(pg, new THREE.MeshLambertMaterial({ color: 0xdedad2, transparent: true, opacity: 0, depthWrite: false })); m.visible = false; scene.add(m); this.puffs.push({ m, age: 99, life: 3 }); }
      // Bale marker
      const bale = new THREE.Group();
      this.baleBox = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.62, 0.75), lam(0xfbf8f0)); this.baleBox.position.y = 0.31; this.baleBox.castShadow = true;
      this.bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 14), lam(0xe9e1d0)); this.bolt.rotation.z = Math.PI / 2; this.bolt.position.y = 0.3; this.bolt.visible = false;
      const bring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 36), new THREE.MeshBasicMaterial({ color: 0xc4834f, transparent: true, opacity: 0.9, depthWrite: false })); bring.rotation.x = -Math.PI / 2; bring.position.y = 0.04;
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), new THREE.MeshBasicMaterial({ color: 0xc4834f })); beam.position.y = 2;
      bale.add(this.baleBox, this.bolt, bring, beam); bale.visible = false; scene.add(bale); this.baleG = bale; this.baleRing = bring;
      this.balePos = new THREE.Vector3(...BALE[0].p);

      this.grow = [];
      const PH = { canal: 0.1, acre: 0.14, mill1: 0.25, people: 0.3, houses: 0.38, church: 0.55, mill2: 0.6, rail: 0.7 };
      const mk = this._marks.concat([[scene.children.length, 'none']]);
      for (let i = 0; i < mk.length - 1; i++) {
        const [a, ph] = mk[i], b = mk[i + 1][0]; if (ph === 'base' || ph === 'none') continue;
        const farm = ph.startsWith('farm:'), st = farm ? parseFloat(ph.slice(5)) : PH[ph];
        for (let j = a; j < b; j++) { const o = scene.children[j]; this.grow.push({ o, s: st, farm, y: o.position.y, sy: o.scale.y }); }
      }
      this.g = -1;
      // Overlay
      this.ov.innerHTML = '';
      this.labs = LABELS.map(([t, x, y, z]) => { const d = document.createElement('div'); d.className = 'lab'; d.textContent = t; this.ov.appendChild(d); return { d, v: new THREE.Vector3(x, y, z) }; });
      this.pins = STOPS.map((s, i) => {
        const b = document.createElement('button'); b.className = 'pin'; b.style.setProperty('--c', s.c);
        b.innerHTML = `<span class="tip"></span><span class="lbl"><span class="num">${i + 1}</span><span class="txt">${s.label}</span></span><span class="stick"></span><span class="dot"></span>`;
        b.addEventListener('pointerdown', (e) => e.stopPropagation());
        b.addEventListener('click', () => this.pinClick(i));
        this.ov.appendChild(b); return { b, v: new THREE.Vector3(...s.pin) };
      });
      this.HZ = [[0, 0.86, 0.12], [0.93, 1.3, -1.45], [0.96, 0.42, 0.26], [-0.45, 0.8, 0.2], [-0.75, 1.55, 0.55]].map((p, i) => {
        const b = document.createElement('button'); b.className = 'hz off'; b.textContent = String(i + 1);
        b.addEventListener('pointerdown', (e) => e.stopPropagation());
        b.addEventListener('click', () => window.dispatchEvent(new CustomEvent('lowell:hazard', { detail: { index: i } })));
        this.ov.appendChild(b); return { b, v: new THREE.Vector3(p[0] - 15.4, p[1] + 9.75, p[2] - 15.4) };
      });
      this.cut = 0; this.run = 1; this.light = { d: 1, lm: 0, lh: 0 }; this.lastTime = this.S.time;
      this.bindInput();
      this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(this);
      this.resize(); this.apply(this.S, true);
      let last = performance.now(), acc = 0, el = 0;
      this._lastRaf = 0;
      const loop = (ts) => {
        if (ts !== undefined) { this._raf = requestAnimationFrame(loop); this._lastRaf = performance.now(); }
        ts = performance.now();
        if (Math.abs(this.clientWidth - this.w) > 1 || Math.abs(this.clientHeight - this.h) > 1) this.resize();
        if (!this.w || this.w <= 1 || this.h <= 1) { last = ts; return; }
        acc += ts - last; last = ts;
        if (acc < 31) return;
        const dt = Math.min(0.1, acc / 1000); acc = 0; el += dt;
        this.tick(dt, el);
      };
      this._raf = requestAnimationFrame(loop);
      this._iv = setInterval(() => { if (performance.now() - this._lastRaf > 300) loop(); }, 40);
      window.dispatchEvent(new CustomEvent('lowell:ready'));
    }

    applyGrowth(g) {
      const sm1 = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
      this.grow.forEach((e) => { const k = e.farm ? 1 - sm1((g - e.s) / 0.08) : sm1((g - e.s) / 0.12); e.o.visible = k > 0.003; const kk = Math.max(0.001, k); e.o.position.y = e.y * kk; e.o.scale.y = e.sy * kk; });
      this.groundM.color.copy(this.gGreen).lerp(this.gDirt, sm1((g - 0.1) / 0.6));
      if (this.labs) this.labs.forEach((l, i) => (l.d.style.display = i === 0 || g > 0.95 ? '' : 'none'));
    }
    setLooms(n) {
      const T = this.T, M = new T.Matrix4(), Q = new T.Quaternion(), P = new T.Vector3(), S = new T.Vector3(1, 1, 1), C = new T.Color();
      this.n = n; this.hi = new Set();
      if (this.closeIdx == null) this.closeIdx = this.looms.findIndex((l) => l.k === 4 && l.r === 2 && l.c === 0);
      this.looms.forEach((l, i) => this.loomIM.setColorAt(i, C.set(0x8a8074)));
      const ws = [];
      for (let k = 3; k < 5; k++) for (let r = 0; r < 3; r++) for (let c0 = 0; c0 < 12; c0 += n) {
        const cs = []; for (let c = c0; c < Math.min(12, c0 + n); c++) cs.push(c);
        const x = -15.4 + (cs[0] + cs[cs.length - 1]) / 2 * 2.8;
        const me = k === 4 && r === 2 && c0 === 0;
        if (me) cs.forEach((c) => { const idx = this.looms.findIndex((l) => l.k === k && l.r === r && l.c === c); this.loomIM.setColorAt(idx, C.set(0x5f8f96)); this.hi.add(idx); });
        if (me) this.meWs = ws.length;
        ws.push({ x, y: k * 2.4 + 0.15, z: -21.6 + r * 3.1 + 0.95, me });
      }
      this.workIM.count = this.headIM.count = ws.length;
      ws.forEach((w, i) => {
        M.compose(P.set(w.x, w.y + 0.25, w.z), Q, S); this.workIM.setMatrixAt(i, M);
        M.compose(P.set(w.x, w.y + 0.63, w.z), Q, S); this.headIM.setMatrixAt(i, M);
        this.workIM.setColorAt(i, C.set(w.me ? 0x5f8f96 : ['#7a4a42', '#4c5a66', '#5a4e43', '#8f7fae', '#6b8fb3'][i % 5]));
      });
      [this.loomIM, this.workIM].forEach((m) => { m.instanceColor.needsUpdate = true; m.instanceMatrix.needsUpdate = true; });
      this.headIM.instanceMatrix.needsUpdate = true;
      this.wsList = ws; this.updMe();
    }
    updMe() {
      if (!this.T || this.meWs == null || !this.wsList) return;
      const T = this.T, M = new T.Matrix4(), Q = new T.Quaternion(), P = new T.Vector3(), S = new T.Vector3().setScalar(this.S.loomClose ? 0.0001 : 1);
      const w = this.wsList[this.meWs], l = this.looms[this.closeIdx];
      M.compose(P.set(w.x, w.y + 0.25, w.z), Q, S); this.workIM.setMatrixAt(this.meWs, M);
      M.compose(P.set(w.x, w.y + 0.63, w.z), Q, S); this.headIM.setMatrixAt(this.meWs, M);
      M.compose(P.set(l.x, l.y + 0.45, l.z), Q, S); this.loomIM.setMatrixAt(this.closeIdx, M);
      M.compose(P.set(l.x, l.y + 0.93, l.z - 0.05), Q, S); this.clothIM.setMatrixAt(this.closeIdx, M);
      [this.workIM, this.headIM, this.loomIM, this.clothIM].forEach((m) => (m.instanceMatrix.needsUpdate = true));
    }
    updHz() { if (this.HZ) this.HZ.forEach((h, i) => { h.b.classList.toggle('off', !this.S.loomClose); h.b.classList.toggle('on', this.S.hz === i); }); }

    apply(s, force) {
      if (!s) return;
      const prev = this.S; this.S = Object.assign({}, this.S, s); window.__lowellState = this.S;
      if (!this.T) return;
      const S = this.S;
      if (S.looms !== this.n) this.setLooms(S.looms);
      if (S.time !== this.lastTime || S.sunday !== prev.sunday) { this.lastTime = S.time; this.bellT = 2.5; }
      this.refreshPins();
      if (!!S.loomClose !== !!prev.loomClose) this.updMe();
      this.updHz();
      const key = [S.focus, S.focus === 6 ? S.bale : '', S.closing ? 1 : 0, S.loomClose ? 1 : 0].join('|');
      if (force || key !== this._fk) { this._fk = key; this.focusCam(); }
    }
    focusCam() {
      const S = this.S, T = this.T; let p, z;
      if (S.loomClose) { p = [-15.25, 10.4, -15.1]; z = 24; }
      else if (S.focus == null) { p = HOME; z = 1; }
      else if (S.focus === 6 && S.bale != null) { p = BALE[S.bale].p; z = BALE[S.bale].z; }
      else { p = STOPS[S.focus].f; z = STOPS[S.focus].z; }
      const k = this.DIR.x / this.DIR.y;
      this.anim = { from: this.target.clone(), to: new T.Vector3(p[0] - p[1] * k, 0, p[2] - p[1] * k), z0: this.zoom, z1: z, t: 0, dur: 1.3 };
    }
    refreshPins() {
      if (!this.pins) return;
      const { done, current, focus } = this.S;
      this.pins.forEach((p, i) => {
        const d = !!done[i], locked = !d && i > current;
        p.b.classList.toggle('done', d); p.b.classList.toggle('cur', i === current && !d && focus !== i);
        p.b.classList.toggle('locked', locked); p.b.classList.toggle('sel', focus === i);
        p.b.classList.toggle('hide', (focus != null && focus !== i) || !!this.S.loomClose || !!this.S.intro);
        p.b.querySelector('.num').textContent = d ? '✓' : String(i + 1);
      });
    }
    pinClick(i) {
      const { done, current } = this.S;
      if (!done[i] && i > current) {
        const p = this.pins[i].b, tip = p.querySelector('.tip');
        tip.textContent = 'Finish stop ' + (current + 1) + ' first';
        p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake'); tip.classList.add('on');
        clearTimeout(p._t); p._t = setTimeout(() => tip.classList.remove('on'), 1600); return;
      }
      window.dispatchEvent(new CustomEvent('lowell:select', { detail: { index: i } }));
    }
    resize() {
      const r = this.getBoundingClientRect(); this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
      this.renderer.setSize(this.w, this.h, false); this.updateCam();
    }
    updateCam() {
      const a = this.w / this.h, V = Math.max(92, 172 / a), c = this.camera;
      c.left = -V * a / 2; c.right = V * a / 2; c.top = V / 2; c.bottom = -V / 2; c.zoom = this.zoom;
      if (Math.abs(this.offX) > 0.5 || Math.abs(this.offY) > 0.5) c.setViewOffset(this.w, this.h, this.offX / 2, this.offY / 2, this.w, this.h); else c.clearViewOffset();
      c.position.copy(this.target).addScaledVector(this.DIR, 400); c.lookAt(this.target);
      c.updateProjectionMatrix(); c.updateMatrixWorld();
    }
    ground(cx, cy) {
      const T = this.T, r = this.canvas.getBoundingClientRect();
      this._ray = this._ray || new T.Raycaster();
      this._ray.setFromCamera(new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.camera);
      const o = new T.Vector3(); this._ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), 0), o); return o;
    }
    bindInput() {
      const cv = this.canvas, pts = new Map(); let p0 = null, pinch = null;
      const zl = (z) => this.S.loomClose ? Math.min(40, Math.max(8, z)) : Math.min(4.5, Math.max(0.75, z));
      const clamp = () => { this.target.x = Math.min(70, Math.max(-70, this.target.x)); this.target.z = Math.min(50, Math.max(-40, this.target.z)); this.target.y = 0; };
      cv.addEventListener('pointerdown', (e) => {
        cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); this.anim = null;
        if (pts.size === 1) { p0 = this.ground(e.clientX, e.clientY); cv.classList.add('drag'); }
        if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.zoom }; p0 = null; }
      });
      cv.addEventListener('pointermove', (e) => {
        if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 1 && p0) { this.target.add(p0.clone().sub(this.ground(e.clientX, e.clientY))); clamp(); this.updateCam(); }
        else if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; this.zoom = zl(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d); this.updateCam(); }
      });
      const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (pts.size === 1) { const v = [...pts.values()][0]; p0 = this.ground(v.x, v.y); } if (!pts.size) { p0 = null; cv.classList.remove('drag'); } };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', (e) => {
        e.preventDefault(); this.anim = null;
        const b = this.ground(e.clientX, e.clientY); this.zoom = zl(this.zoom * Math.exp(-e.deltaY * 0.0016)); this.updateCam();
        this.target.add(b.sub(this.ground(e.clientX, e.clientY))); clamp(); this.updateCam();
      }, { passive: false });
    }

    tick(dt, t) {
      const T = this.T, S = this.S;
      // view offset easing
      const k = 1 - Math.exp(-dt * 6);
      this.offX += ((S.panelX || 0) - this.offX) * k; this.offY += ((S.panelY || 0) - this.offY) * k;
      if (this.anim) {
        const a = this.anim; a.t += dt / a.dur; const e = a.t >= 1 ? 1 : (a.t < 0.5 ? 4 * a.t ** 3 : 1 - (-2 * a.t + 2) ** 3 / 2);
        this.target.lerpVectors(a.from, a.to, e); this.zoom = a.z0 + (a.z1 - a.z0) * e; if (a.t >= 1) this.anim = null;
      }
      this.updateCam();
      const gt = S.growth == null ? 1 : S.growth;
      if (S.growSnap || gt < this.g || this.g < 0) this.g = gt; else if (this.g < gt) this.g = Math.min(gt, this.g + dt / 11);
      if (this.g !== this._gA) { this._gA = this.g; this.applyGrowth(this.g); window.dispatchEvent(new CustomEvent('lowell:grow', { detail: { g: this.g } })); }
      // lighting from time
      const h = S.time, day = S.sunday ? 1 : sm(4.6, 7.2, h) * (1 - sm(18.4, 20.6, h));
      const work = !S.sunday && h >= 5 && h < 19.2;
      const mealOff = !S.sunday && ((h >= 7 && h < 7.5) || (h >= 12.5 && h < 13));
      const L = this.light;
      L.d += (day - L.d) * k;
      L.lm += (((work && !mealOff) ? 1 - day : 0) - L.lm) * k;
      L.lh += (((h < 5 || (h >= 18.5 && h < 22)) && !S.sunday ? 1 - day * 0.9 : 0) - L.lh) * k;
      this.litU.mill.value = L.lm; this.litU.house.value = L.lh;
      this.bg.copy(this.bgNight).lerp(this.bgDay, L.d); this.renderer.setClearColor(this.bg, 1);
      this.sun.intensity = 0.25 + 2.1 * L.d; this.hemi.intensity = 0.55 + 1.35 * L.d;
      this.sun.color.setRGB(1, 0.86 + 0.1 * L.d, 0.7 + 0.22 * L.d);
      const ang = ((h - 6) / 12) * Math.PI;
      this.sun.position.set(Math.cos(ang) * -80 + 20, 40 + Math.max(0, Math.sin(ang)) * 70, -30 + Math.sin(ang) * 20);
      this.labs.forEach((l) => (l.d.style.color = L.d > 0.5 ? 'rgba(34,38,46,.5)' : 'rgba(242,237,227,.6)'));
      // bell
      if (this.bellT > 0) { this.bellT -= dt; this.bell.rotation.z = Math.sin(t * 7) * 0.45 * Math.min(1, this.bellT); } else this.bell.rotation.z = 0;
      // machines
      const running = S.gate && (work && !mealOff);
      this.run += ((running ? 1 : 0) - this.run) * (1 - Math.exp(-dt * 2.2));
      this.gateL.position.x = -1.1 - (work ? 0 : 0); this.gateR.position.x = 1.1;
      const sp = this.run * (1 + (S.looms - 2) * 0.25);
      this.wheel.rotation.x -= dt * 0.9 * this.run * (S.gate ? 1 : 0.6);
      this.shafts.forEach((g) => (g.rotation.x += dt * 6 * this.run));
      this.vshaft.rotation.y += dt * 6 * this.run;
      // cutaway
      const wantCut = S.cut ? 1 : 0;
      this.cut += (wantCut - this.cut) * (1 - Math.exp(-dt * 4));
      const op = 1 - 0.93 * this.cut;
      this.cutMats.forEach((m) => { m.opacity = op; m.depthWrite = op > 0.98; });
      this.inner.visible = this.cut > 0.02;
      const lv = S.level == null ? 4 : S.level; this.FG.forEach((g, i) => (g.visible = i <= lv));
      if (this.inner.visible) {
        const M = this._M || (this._M = new T.Matrix4()), Q = new T.Quaternion(), P = new T.Vector3(), S1 = new T.Vector3(1, 1, 1), S0 = new T.Vector3(1e-4, 1e-4, 1e-4);
        this.looms.forEach((l, i) => { const z = l.z + 0.12 + Math.sin(t * 9 * sp + i * 1.7) * 0.22 * this.run; M.compose(P.set(l.x, l.y + 0.98, z), Q, (S.loomClose && i === this.closeIdx) ? S0 : S1); this.beatIM.setMatrixAt(i, M); });
        this.beatIM.instanceMatrix.needsUpdate = true;
      }
      // walkers
      const M2 = this._M2 || (this._M2 = new T.Matrix4()), Q2 = new T.Quaternion(), P2 = new T.Vector3(), S2 = new T.Vector3(1, 1, 1);
      const out = L.d > 0.3 || L.lh > 0.2;
      this.walkers.forEach((w, i) => {
        w.s += w.v * dt * 4; if (w.s > 1) { w.s = 1; w.v = -Math.abs(w.v); } else if (w.s < 0) { w.s = 0; w.v = Math.abs(w.v); }
        const x = w.a[0] + (w.b[0] - w.a[0]) * w.s, z = w.a[1] + (w.b[1] - w.a[1]) * w.s;
        const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], dl = Math.hypot(dx, dz) || 1;
        const ox = -dz / dl * w.off, oz = dx / dl * w.off, y = Math.abs(Math.sin(t * 7 + w.ph)) * 0.05;
        S2.setScalar(out ? 1 : 0.0001);
        M2.compose(P2.set(x + ox, y + 0.25, z + oz), Q2, S2); this.pIM.setMatrixAt(i, M2);
        M2.compose(P2.set(x + ox, y + 0.63, z + oz), Q2, S2); this.phIM.setMatrixAt(i, M2);
      });
      this.pIM.instanceMatrix.needsUpdate = this.phIM.instanceMatrix.needsUpdate = true;
      // smoke
      this.emit.forEach((e) => {
        e.t -= dt; if (e.t > 0 || this.g < 0.97) return; e.t = e.rate;
        const p = this.puffs.find((q) => q.age >= q.life); if (!p) return;
        p.age = 0; p.life = 3.2; p.m.position.copy(e.o ? e.o() : e.p); p.m.visible = true;
      });
      this.puffs.forEach((p) => {
        if (!p.m.visible) return; p.age += dt; if (p.age >= p.life) { p.m.visible = false; return; }
        const f = p.age / p.life; p.m.position.x += 0.5 * dt; p.m.position.y += 0.9 * dt; p.m.scale.setScalar(0.25 + f * 0.9); p.m.material.opacity = 0.55 * (1 - f);
      });
      this.boat.position.y = -0.55 + Math.sin(t * 1.2) * 0.05;
      // bale
      const showBale = S.focus === 6 && S.bale != null;
      this.baleG.visible = showBale;
      if (showBale) {
        const tp = BALE[S.bale].p; this.balePos.lerp(P2.set(tp[0], tp[1], tp[2]), 1 - Math.exp(-dt * 3));
        this.baleG.position.copy(this.balePos);
        const cloth = S.bale >= 4; this.baleBox.visible = !cloth; this.bolt.visible = cloth;
        const f = (t % 1.4) / 1.4; this.baleRing.scale.setScalar(1 + f * 0.6); this.baleRing.material.opacity = 0.9 * (1 - f);
      }
      // close-up loom
      const lc = !!S.loomClose && this.inner.visible; this.LO.visible = lc;
      if (lc) {
        const mul = this.run * (1 + (S.looms - 2) * 0.25);
        this.lp = (this.lp || 0) + dt * 2.2 * mul;
        const kk = Math.floor(this.lp), f = this.lp - kk, dir = kk % 2 ? -1 : 1;
        const g = Math.min(1, Math.max(0, (f - 0.1) / 0.45)), e = g * g * (3 - 2 * g);
        this.shut.position.x = dir * (-0.86 + 1.72 * e);
        this.lay.rotation.x = 0.16 * Math.exp(-Math.pow((f - 0.8) / 0.08, 2)) - 0.05;
        const hs = kk % 2 ? 0.04 : -0.04; this.hed[0].position.y += (0.72 + hs - this.hed[0].position.y) * 0.35; this.hed[1].position.y += (0.72 - hs - this.hed[1].position.y) * 0.35;
        const kick = Math.exp(-Math.pow((f - 0.08) / 0.05, 2)); this.pickS[0].rotation.z = dir > 0 ? -0.45 * kick : 0; this.pickS[1].rotation.z = dir < 0 ? 0.45 * kick : 0;
        const sp4 = dt * mul;
        this.pul.rotation.x -= sp4 * 9; this.gA.rotation.x -= sp4 * 2; this.gB.rotation.x += sp4 * 2 * 0.16 / 0.085; this.roll.rotation.x -= sp4 * 0.05;
        this.beltTex.offset.y -= sp4 * 2.5;
        this.lintP.forEach((p, i) => { p[0] += Math.sin(t * 0.7 + p[3]) * dt * 0.05 + dt * 0.03; p[1] += Math.cos(t * 0.5 + p[3]) * dt * 0.04; if (p[0] > 1.2) p[0] = -1.2; M2.compose(P2.set(p[0], p[1], p[2]), Q2, S2.set(1, 1, 1)); this.lint.setMatrixAt(i, M2); });
        this.lint.instanceMatrix.needsUpdate = true;
      }
      // overlay
      const v = new T.Vector3();
      const proj = (src) => { v.copy(src).project(this.camera); return [(v.x + 1) / 2 * this.w, (1 - v.y) / 2 * this.h]; };
      this.pins.forEach((p) => { const [x, y] = proj(p.v); p.b.style.transform = `translate(${x}px, ${y}px) translate(-50%, calc(-100% + 4px))`; });
      if (lc && this.HZ) this.HZ.forEach((hz) => { const [x, y] = proj(hz.v); hz.b.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`; });
      this.labs.forEach((l) => { const [x, y] = proj(l.v); l.d.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`; });
      this.renderer.render(this.scene, this.camera);
    }
  }
  customElements.define('lowell-scene', LowellScene);
})();
