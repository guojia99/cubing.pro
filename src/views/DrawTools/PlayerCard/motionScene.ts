import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { H, hasCartouche, OUTLINE, paintReliefMask, SPARKS, W } from "./motionDesign";

const eyeDistance = 2350;
const toRadians = Math.PI / 180;
type Own = <T extends { dispose(): void }>(resource: T) => T;

export function createMotionScene(host: HTMLDivElement, source: HTMLCanvasElement | HTMLImageElement, onFailure: () => void) {
  const viewport = host.querySelector<HTMLDivElement>("[data-motion-viewport]")!;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  const canvas = renderer.domElement;
  const resources: { dispose(): void }[] = [];
  const own: Own = (resource) => { resources.push(resource); return resource; };
  const events = new AbortController();
  const signal = events.signal;
  let resizeObserver: ResizeObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  let frame = 0;
  let disposed = false;

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    events.abort();
    resizeObserver?.disconnect();
    intersection?.disconnect();
    resources.forEach((resource) => resource.dispose());
    renderer.dispose();
    if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
    canvas.remove();
  }

  try {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "display:block;width:100%;height:100%;pointer-events:none";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 100, 8000);
    camera.position.z = eyeDistance;
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      scene.environment = own(pmrem.fromScene(room, 0.04)).texture;
    } finally {
      room.dispose();
      pmrem.dispose();
    }
    const lamp = new THREE.DirectionalLight(0xffe5bb, 2.0);
    lamp.position.set(-0.34, 0.22, 1).normalize();
    scene.add(lamp);

    const ink = own(source instanceof HTMLCanvasElement ? new THREE.CanvasTexture(source) : new THREE.Texture(source));
    ink.colorSpace = THREE.SRGBColorSpace;
    ink.needsUpdate = true;
    const { card, foil, sparks, skirt, updateFooter } = createCard(ink, hasCartouche(source), own);
    const dust = createDust(own, renderer.getPixelRatio());
    const shadow = createShadow(own);
    scene.add(card, dust, shadow);
    const finePointer = window.matchMedia("(any-pointer: fine)");
    const offset = new THREE.Vector2();
    const velocity = new THREE.Vector2();
    const aim = new THREE.Vector2();
    const halfVector = new THREE.Vector3();
    const facet = new THREE.Vector3();
    let width = 0, height = 0, previous = 0, elapsed = 0;
    let paused = false, visible = false, dirty = true;

    function schedule() {
      if (!frame && !disposed && visible && !document.hidden && width > 0 && height > 0 && (dirty || !paused)) {
        frame = requestAnimationFrame(draw);
      }
    }

    function suspend() {
      cancelAnimationFrame(frame);
      frame = previous = 0;
    }

    function draw(now: number) {
      frame = 0;
      const delta = paused || !previous ? 0 : Math.min((now - previous) / 1000, 0.1);
      previous = now;
      elapsed += delta;
      // Exact critically damped spring: independent of screen refresh rate.
      const decay = Math.exp(-8 * delta);
      for (const axis of ["x", "y"] as const) {
        const gap = offset[axis] - aim[axis];
        const spring = velocity[axis] + 8 * gap;
        offset[axis] = aim[axis] + (gap + spring * delta) * decay;
        velocity[axis] = (velocity[axis] - 8 * spring * delta) * decay;
      }
      const yaw = 8.2 * Math.sin(0.74 * elapsed) + 2.8 * Math.sin(Math.SQRT2 * 0.31 * elapsed) + 7 * offset.x;
      const pitch = 3.4 * Math.sin(1.48 * elapsed + 0.5) + 1.1 * Math.sin(Math.sqrt(3) * 0.43 * elapsed) - 4.5 * offset.y;
      const roll = 0.8 * Math.sin(0.74 * elapsed - 0.4) + 0.3 * Math.sin(Math.SQRT2 * 0.51 * elapsed);
      const lift = 9 * Math.sin(0.86 * elapsed + 0.3) + 3 * Math.sin(Math.SQRT2 * 0.32 * elapsed);
      card.rotation.set(pitch * toRadians, yaw * toRadians, roll * toRadians, "YXZ");
      card.position.set(4 * Math.sin(0.74 * elapsed), 13 + lift, 0);
      card.updateMatrixWorld();
      for (const { sprite, normal, size } of sparks) {
        sprite.getWorldPosition(halfVector).negate().add(camera.position).normalize().add(lamp.position).normalize();
        facet.copy(normal).applyQuaternion(card.quaternion);
        const shine = Math.pow(Math.max(0, facet.dot(halfVector)), 210);
        sprite.material.opacity = 0.86 * shine;
        sprite.scale.setScalar(size * (0.53 + 0.66 * shine));
        sprite.material.rotation = roll * toRadians;
      }
      foil.opacity = Math.min(0.25, (Math.abs(yaw) + Math.abs(pitch)) * 0.013);
      skirt.opacity = 0.34 * Math.min(1, Math.hypot(yaw, pitch) / 11);
      shadow.scale.set(865 - 1.9 * lift - Math.abs(yaw) * 2, 125 + lift * 1.6, 1);
      shadow.position.x = 10 + yaw * 2.5;
      shadow.rotation.z = -roll * 0.012;
      shadow.material.opacity = 0.91 - lift * 0.009;
      dust.material.uniforms.clock.value = elapsed;
      try {
        renderer.render(scene, camera);
      } catch {
        dispose();
        onFailure();
        return;
      }
      host.dataset.motionPhase = paused ? "paused" : "running";
      host.dataset.motionPose = [pitch, yaw, roll, lift].map((value) => value.toFixed(3)).join(",");
      dirty = false;
      schedule();
    }

    function resize() {
      width = viewport.clientWidth;
      height = viewport.clientHeight;
      if (!width || !height) { suspend(); return; }
      const fraction = window.matchMedia("(max-width: 600px)").matches ? 0.82 : 0.74;
      camera.aspect = width / height;
      const worldHeight = Math.max(H, W / camera.aspect) / fraction;
      camera.fov = 2 * Math.atan(worldHeight / (2 * eyeDistance)) / toRadians;
      camera.updateProjectionMatrix();
      dust.scale.set(worldHeight * camera.aspect, worldHeight, 1);
      renderer.setSize(width, height, false);
      dirty = true;
      schedule();
    }

    viewport.appendChild(canvas);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      dispose();
      onFailure();
    }, { signal });
    host.addEventListener("pointermove", (event) => {
      if (host.dataset.dragging === "true") { aim.set(0, 0); return; }
      if (!finePointer.matches || event.pointerType === "touch") return;
      const rect = viewport.getBoundingClientRect();
      aim.set(2 * (event.clientX - rect.left) / rect.width - 1, 2 * (event.clientY - rect.top) / rect.height - 1).clampScalar(-1, 1);
    }, { signal });
    host.addEventListener("pointerleave", () => aim.set(0, 0), { signal });
    host.addEventListener("pointercancel", () => aim.set(0, 0), { signal });
    document.addEventListener("visibilitychange", () => document.hidden ? suspend() : schedule(), { signal });
    intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule(); else suspend();
    });
    intersection.observe(viewport);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(viewport);
    resize();
    return {
      refresh() { updateFooter(hasCartouche(source)); ink.needsUpdate = dirty = true; schedule(); },
      setPaused(value: boolean) {
        paused = value;
        suspend();
        if (host.dataset.motionPose) host.dataset.motionPhase = paused ? "paused" : "running";
        schedule();
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

function createCard(ink: THREE.Texture, named: boolean, own: Own) {
  const card = new THREE.Group();
  const left = OUTLINE.x - W / 2, top = H / 2 - OUTLINE.y;
  const right = left + OUTLINE.w, bottom = top - OUTLINE.h, radius = OUTLINE.r;
  const body = new THREE.Shape();
  body.moveTo(left + radius, bottom);
  body.lineTo(right - radius, bottom);
  body.absarc(right - radius, bottom + radius, radius, -Math.PI / 2, 0, false);
  body.lineTo(right, top - radius);
  body.absarc(right - radius, top - radius, radius, 0, Math.PI / 2, false);
  body.lineTo(left + radius, top);
  body.absarc(left + radius, top - radius, radius, Math.PI / 2, Math.PI, false);
  body.lineTo(left, bottom + radius);
  body.absarc(left + radius, bottom + radius, radius, Math.PI, 1.5 * Math.PI, false);
  const thickness = own(new THREE.ExtrudeGeometry(body, {
    depth: 18, bevelEnabled: true, bevelSize: 2, bevelOffset: -2, bevelThickness: 2, bevelSegments: 3, curveSegments: 12,
  }));
  const edge = new THREE.Mesh(thickness, own(new THREE.MeshStandardMaterial({ color: 0xc29d60, roughness: 0.29, metalness: 0.9 })));
  edge.position.z = -21;
  card.add(edge);
  const plane = own(new THREE.PlaneGeometry(W, H));
  function relief(material: THREE.Material, depth: number, order: number) {
    const mesh = new THREE.Mesh(plane, own(material));
    mesh.position.z = depth;
    // At zero tilt all layers project to the very same texture coordinates.
    mesh.scale.setScalar(1 - depth / eyeDistance);
    mesh.renderOrder = order;
    card.add(mesh);
  }
  relief(new THREE.MeshBasicMaterial({ map: ink, transparent: true, alphaTest: 0.01, toneMapped: false }), 0, 1);
  const subject = own(reliefTexture("subject", named));
  const frameMask = own(reliefTexture("frame", named));
  const metalMask = own(reliefTexture("metal", named));
  const skirtMask = own(new THREE.CanvasTexture(maskCanvas()));
  function paintSkirt() {
    const ctx = skirtMask.image.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.filter = "blur(4px)";
    ctx.drawImage(frameMask.image, 0, 2);
    ctx.filter = "none";
    skirtMask.needsUpdate = true;
  }
  function updateFooter(next: boolean) {
    if (named === next) return;
    named = next;
    paintReliefMask(frameMask.image.getContext("2d")!, "frame", named);
    paintReliefMask(metalMask.image.getContext("2d")!, "metal", named);
    frameMask.needsUpdate = metalMask.needsUpdate = true;
    paintSkirt();
  }
  paintSkirt();
  relief(new THREE.MeshBasicMaterial({ map: ink, alphaMap: subject, transparent: true, depthWrite: false, toneMapped: false }), 14, 2);
  const skirt = new THREE.MeshBasicMaterial({ color: 0x090712, alphaMap: skirtMask, transparent: true, depthWrite: false, toneMapped: false });
  relief(skirt, 22, 3);
  relief(new THREE.MeshBasicMaterial({ map: ink, alphaMap: frameMask, transparent: true, depthWrite: false, toneMapped: false }), 36, 4);
  const foil = new THREE.MeshStandardMaterial({
    color: 0xffe5ac, alphaMap: metalMask, bumpMap: metalMask, bumpScale: 1.4,
    roughness: 0.24, metalness: 0.94, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  relief(foil, 36.2, 5);
  const star = own(sparkTexture());
  const facets = [[-0.32, 0.1], [0.08, 0.19], [-0.11, 0.29]] as const;
  const sparks = SPARKS.map(([x, y], index) => {
    const sprite = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: star, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
    const scale = 1 - 38 / eyeDistance;
    sprite.position.set((x - W / 2) * scale, (H / 2 - y) * scale, 38);
    sprite.renderOrder = 6;
    card.add(sprite);
    const [nx, ny] = facets[index];
    return { sprite, normal: new THREE.Vector3(nx, ny, 1).normalize(), size: [46, 52, 57][index] * scale };
  });
  return { card, foil, sparks, skirt, updateFooter };
}

function maskCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = W / 2;
  canvas.height = H / 2;
  return canvas;
}

function reliefTexture(region: Parameters<typeof paintReliefMask>[1], named: boolean) {
  const canvas = maskCanvas();
  paintReliefMask(canvas.getContext("2d")!, region, named);
  return new THREE.CanvasTexture(canvas);
}

function sparkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(48, 48);
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
  halo.addColorStop(0, "#fff7dc");
  halo.addColorStop(0.2, "#ffd58f92");
  halo.addColorStop(1, "#e9b86b00");
  ctx.fillStyle = halo;
  ctx.fillRect(-28, -28, 56, 56);
  ctx.fillStyle = "#fff6db";
  ctx.beginPath();
  ctx.moveTo(0, -46);
  ctx.quadraticCurveTo(2, -3, 34, 0);
  ctx.quadraticCurveTo(2, 3, 0, 46);
  ctx.quadraticCurveTo(-2, 3, -34, 0);
  ctx.quadraticCurveTo(-2, -3, 0, -46);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createShadow(own: Own) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const glow = ctx.createRadialGradient(64, 64, 1, 64, 64, 63);
  glow.addColorStop(0, "#040309ed");
  glow.addColorStop(0.34, "#08060eb5");
  glow.addColorStop(0.60, "#44374766");
  glow.addColorStop(1, "#67546100");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);
  const texture = own(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  const shadow = new THREE.Mesh(own(new THREE.PlaneGeometry(1, 1)), own(new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false })));
  shadow.position.set(0, -H / 2 - 58, -72);
  return shadow;
}

function createDust(own: Own, pixelRatio: number) {
  const positions = [], seeds = [];
  for (let index = 0; index < 42; index++) {
    const hash = (multiple: number) => THREE.MathUtils.euclideanModulo(Math.sin((index + 1) * multiple) * 43758.5453, 1);
    positions.push((hash(12.9898) - 0.5) * 1.22, (hash(78.233) - 0.5) * 1.22, -100 - 570 * hash(39.425));
    seeds.push(hash(19.11));
  }
  const geometry = own(new THREE.BufferGeometry());
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.Float32BufferAttribute(seeds, 1));
  const dust = new THREE.Points(geometry, own(new THREE.ShaderMaterial({
    uniforms: { clock: { value: 0 }, dpr: { value: pixelRatio } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float seed; uniform float clock, dpr; varying float light;
      void main() {
        float phase = 6.28318 * seed;
        vec3 pos = position;
        pos.xy += .014 * vec2(sin(phase + clock * (.08 + .07 * seed)), cos(phase + clock * .13));
        vec4 view = modelViewMatrix * vec4(pos, 1.);
        gl_Position = projectionMatrix * view;
        gl_PointSize = dpr * (2.2 + 3.6 * seed) * (${eyeDistance}. / -view.z);
        light = (.24 + .4 * seed) * (.78 + .22 * sin(clock * .53 + phase));
      }`,
    fragmentShader: `varying float light;
      void main() {
        float radius = length(gl_PointCoord - .5) * 2.;
        float alpha = pow(max(0., 1. - radius), 2.4) * light;
        gl_FragColor = vec4(1., .70, .38, alpha);
        #include <colorspace_fragment>
      }`,
  })));
  dust.frustumCulled = false;
  return dust;
}
