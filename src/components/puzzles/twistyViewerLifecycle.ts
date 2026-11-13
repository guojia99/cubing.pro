import type { TwistyPlayer, TwistyPlayerConfig } from "cubing/twisty";
import { PerspectiveCamera, Spherical, WebGLRenderer } from "three";

type Vantage = Awaited<ReturnType<TwistyPlayer["experimentalCurrentVantages"]>> extends Iterable<infer T> ? T : never;
type Scene = NonNullable<Vantage["scene"]>;

// The registered constructor must not close over an individual viewer's resources.
function managedPlayerClass(Player: typeof TwistyPlayer) {
  const tag = "cubing-pro-managed-twisty-player";
  const registered = customElements.get(tag) as typeof TwistyPlayer | undefined;
  if (registered) return registered;
  const initialize = Object.getOwnPropertySymbols(Player.prototype).find((symbol) => symbol.description === "intersectedCallback");
  if (!initialize) throw new Error("Unsupported cubing player lifecycle.");
  const initializePlayer = (Player.prototype as unknown as Record<symbol, (this: TwistyPlayer) => void>)[initialize];
  class ManagedPlayer extends Player {
    connectedCallback() { initializePlayer.call(this); }
  }
  customElements.define(tag, ManagedPlayer);
  return ManagedPlayer;
}

// cubing 0.63.3 does not retain/disconnect its vantage ResizeObserver. Keep its
// scene/model/controls, but never connect a native vantage or allocate its GPU.
// These instance-only hooks must be reviewed when upgrading cubing.
export function createManagedTwistyViewer(Player: typeof TwistyPlayer, config: TwistyPlayerConfig) {
  const ManagedPlayer = managedPlayerClass(Player);
  let stopped = false;
  let frame = 0;
  let scene: Scene | undefined;
  let beforeRender = () => {};
  let width = 0;
  let height = 0;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:100%;height:100%;min-width:0;min-height:0;touch-action:none;cursor:grab";
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  // Match cubing's color pipeline, including PG3D's sRGB byte attributes.
  renderer.outputColorSpace = "srgb-linear";
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const camera = new PerspectiveCamera(20, 1, 0.1, 20);
  const abort = new AbortController();
  const observer = new ResizeObserver(() => resize());
  const render = async () => {
    if (stopped || !scene || !width || !height) return;
    const object = await scene.scene();
    if (stopped) return;
    beforeRender();
    renderer.render(object, camera);
  };
  const scheduleRender = () => {
    if (stopped || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      void render();
    });
  };
  function resize() {
    if (stopped || !scene) return;
    width = scene.contentWrapper.clientWidth;
    height = scene.contentWrapper.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    const excess = Math.max(0, height - width);
    camera.setViewOffset(width, height - excess, 0, -Math.floor(excess / 2), width, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    scheduleRender();
  }
  // Bypass the library's shared IntersectionObserver too: it cannot unobserve
  // a player removed before its first intersection. Initialization is idempotent.
  const player = new ManagedPlayer(config);
  // The native connectedCallback only installs CSS and an IntersectionObserver.
  // Our subclass supplies the same three-row layout without that observer.
  player.contentWrapper.style.cssText = "display:grid;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;contain:size;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) 24px 32px";
  const layout = new CSSStyleSheet();
  layout.replaceSync(".wrapper > *, .visualization-wrapper > *{width:100%;height:100%;min-width:0;min-height:0;overflow:hidden} .wrapper > twisty-scrubber{background:rgba(196,196,196,.5)}");
  player.shadow.adoptedStyleSheets = [...player.shadow.adoptedStyleSheets, layout];
  const addElement = player.addElement.bind(player);
  let visualizationSlot = true;
  player.addElement = (element) => {
    // The first div is the visualization slot, populated asynchronously by
    // TwistyPlayer. Intercept before connecting the scene and its children.
    if (visualizationSlot && element instanceof HTMLDivElement) {
      visualizationSlot = false;
      element.style.cssText = "width:100%;height:100%;min-width:0;min-height:0;overflow:hidden";
      const appendChild = element.appendChild.bind(element);
      element.appendChild = <T extends Node>(child: T): T => {
        if (stopped) return child;
        if (child instanceof HTMLElement && child.localName === "twisty-3d-scene-wrapper") {
          const next = child as unknown as Scene;
          if (scene) throw new Error("Unexpected cubing scene replacement.");
          scene = next;
          next.style.cssText = "display:block;width:100%;height:100%;min-width:0;min-height:0";
          next.addVantage = (vantage) => { vantage.disconnect(); };
          next.scheduleRender = scheduleRender;
          const onPuzzle = next.onPuzzle.bind(next);
          next.onPuzzle = async (inputs) => { if (!stopped) await onPuzzle(inputs); };
          const setWrapper = next.setCurrentTwisty3DPuzzleWrapper.bind(next);
          next.setCurrentTwisty3DPuzzleWrapper = async (object, wrapper) => {
            if (stopped) wrapper.disconnect();
            await setWrapper(object, wrapper);
            if (stopped) wrapper.disconnect();
            else scheduleRender();
          };
          next.contentWrapper.style.cssText = "width:100%;height:100%;min-width:0;min-height:0;overflow:hidden";
          next.contentWrapper.appendChild(canvas);
          observer.observe(next.contentWrapper);
        }
        return appendChild(child);
      };
    } else if (element instanceof HTMLDivElement) element.style.display = "none";
    return addElement(element);
  };
  player.experimentalCurrentCanvases = async () => stopped ? [] : [canvas];
  const orbit = player.experimentalModel.twistySceneModel.orbitCoordinates;
  const onOrbit = (coordinates: { latitude: number; longitude: number; distance: number }) => {
    if (stopped) return;
    const spherical = new Spherical(coordinates.distance, (90 - coordinates.latitude) * Math.PI / 180, coordinates.longitude * Math.PI / 180);
    spherical.makeSafe();
    camera.position.setFromSpherical(spherical);
    camera.lookAt(0, 0, 0);
    scheduleRender();
  };
  orbit.addFreshListener(onOrbit);
  let drag: { id: number; x: number; y: number } | undefined;
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  }, { signal: abort.signal });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId || !width || !height) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    player.experimentalModel.twistySceneModel.orbitCoordinatesRequest.set((async () => {
      const previous = await orbit.get();
      return { latitude: previous.latitude + dy / Math.min(width, height) * 180, longitude: previous.longitude - dx / Math.min(width, height) * 240 };
    })());
  }, { signal: abort.signal });
  const endDrag = () => { drag = undefined; };
  canvas.addEventListener("pointerup", endDrag, { signal: abort.signal });
  canvas.addEventListener("pointercancel", endDrag, { signal: abort.signal });
  canvas.addEventListener("lostpointercapture", endDrag, { signal: abort.signal });
  return {
    player,
    canvas,
    setBeforeRender(callback: () => void) { beforeRender = callback; },
    async render() { resize(); await render(); },
    dispose() {
      if (stopped) return;
      stopped = true;
      player.pause();
      cancelAnimationFrame(frame);
      observer.disconnect();
      abort.abort();
      if (drag && canvas.hasPointerCapture(drag.id)) canvas.releasePointerCapture(drag.id);
      drag = undefined;
      orbit.removeFreshListener(onOrbit);
      scene?.disconnect();
      if (scene) void scene.experimentalTwisty3DPuzzleWrapper().then((wrapper) => wrapper.disconnect());
      beforeRender = () => {};
      player.remove();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
