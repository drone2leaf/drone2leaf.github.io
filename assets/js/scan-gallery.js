// Reveal the supplied masks over their matching drone photograph.
(() => {
  const gallery = document.querySelector('[data-scan-gallery]');
  if (!gallery) return;

  const viewport = gallery.querySelector('[data-gallery-viewport]');
  const images = [...gallery.querySelectorAll('[data-gallery-image]')];
  const scanLine = gallery.querySelector('[data-gallery-scan-line]');
  const stageLabel = gallery.querySelector('[data-gallery-stage-label]');
  const count = gallery.querySelector('[data-gallery-count]');
  const status = gallery.querySelector('[data-gallery-status]');
  const playback = gallery.querySelector('[data-gallery-playback]');
  const previous = gallery.querySelector('[data-gallery-previous]');
  const next = gallery.querySelector('[data-gallery-next]');
  const stageGroup = gallery.querySelector('[data-gallery-stages]');
  const stageButtons = [...gallery.querySelectorAll('[data-gallery-stage]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stageNames = ['Original drone image', 'Mask preview', 'Black & white mask'];
  const examples = ['DJI_20260416114316_0027_D', 'DJI_20260521145932_0042_D'].map((id) => {
    const base = `assets/images/${id}/${id}`;
    return [`${base}_web.webp`, `${base}_mask_preview_web.webp`, `${base}_binary_mask_web.png`];
  });
  const HOLD_TIME = [1200, 1600];
  const SCAN_TIME = 3200;
  let example = 0;
  let stage = 0;
  let phase = 'hold';
  let elapsed = 0;
  let paused = false;
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let error = '';
  const failedStages = new Set();
  const decodedSources = new Map();
  const decodingSources = new Map();

  function imageReady(index) {
    const image = images[index];
    return image.complete && image.naturalWidth > 0 && decodedSources.get(index) === image.src;
  }

  function ready() {
    return images.every((image, index) => imageReady(index));
  }

  async function decodeImage(index) {
    const image = images[index];
    const source = image.src;
    if (decodingSources.get(index) === source) return;
    decodingSources.set(index, source);
    try {
      await image.decode();
      // A previous example may finish decoding after the visitor changes images.
      if (image.src !== source) return;
      decodedSources.set(index, source);
      failedStages.delete(index);
      render();
      syncPlayback();
    } catch {
      // Network and image errors are reported by the image's error listener.
    } finally {
      if (decodingSources.get(index) === source) decodingSources.delete(index);
    }
  }

  function loadImages() {
    // Fully clipped layers are skipped by native lazy loading, so request them
    // explicitly when this example enters view or the visitor selects a stage.
    images.forEach((image) => { image.loading = 'eager'; });
  }

  function canAnimate() {
    return visible && !document.hidden && !paused && !motion.matches &&
      phase !== 'complete' && !error && ready();
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function render() {
    images.forEach((image, index) => {
      if (index === 0) return;
      let amount = index <= stage ? 1 : 0;
      if (phase === 'scan' && index === stage + 1) amount = Math.min(1, elapsed / SCAN_TIME);
      image.style.clipPath = `inset(0 0 ${(1 - amount) * 100}% 0)`;
    });
    const scanning = phase === 'scan' && !motion.matches && !error;
    scanLine.hidden = !scanning;
    if (scanning) scanLine.style.top = `${Math.min(1, elapsed / SCAN_TIME) * 100}%`;
  }

  function updateControls() {
    const loading = !imageReady(stage) && !error;
    gallery.dataset.example = String(example);
    gallery.dataset.stage = String(stage);
    gallery.dataset.phase = phase;
    viewport.setAttribute('aria-busy', String(loading));
    viewport.setAttribute('aria-label', `${stageNames[stage]} for drone image ${example + 1} of ${examples.length}`);
    count.textContent = `Image ${example + 1} of ${examples.length}`;
    const scanning = phase === 'scan';
    stageLabel.textContent = scanning ? `Scanning · ${stageNames[stage + 1]}` : stageNames[stage];
    const detail = error || (loading ? 'Loading previews…' : stageLabel.textContent);
    const message = `Image ${example + 1} of ${examples.length} · ${detail}`;
    if (status.textContent !== message) status.textContent = message;
    stageButtons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === stage));
      button.disabled = failedStages.has(index);
    });
    playback.hidden = motion.matches;
    playback.textContent = error || phase === 'complete' ? 'Replay scan' : paused ? 'Resume scan' : 'Pause scan';
  }

  function syncPlayback() {
    updateControls();
    if (canAnimate() && !frame) {
      lastTime = 0;
      frame = requestAnimationFrame(animate);
    } else if (!canAnimate()) {
      stop();
    }
  }

  function animate(time) {
    frame = 0;
    if (!canAnimate()) return;
    elapsed += lastTime ? Math.min(time - lastTime, 64) : 0;
    lastTime = time;
    if (phase === 'hold' && elapsed >= HOLD_TIME[stage]) {
      phase = 'scan';
      elapsed = 0;
      updateControls();
    } else if (phase === 'scan' && elapsed >= SCAN_TIME) {
      stage += 1;
      elapsed = 0;
      phase = stage === stageNames.length - 1 ? 'complete' : 'hold';
      updateControls();
    }
    render();
    if (canAnimate()) frame = requestAnimationFrame(animate);
    else lastTime = 0;
  }

  function showExample(index) {
    stop();
    example = (index + examples.length) % examples.length;
    stage = 0;
    phase = 'hold';
    elapsed = 0;
    paused = false;
    error = '';
    failedStages.clear();
    images.forEach((image, imageStage) => {
      // Explicitly load a selected example even if the user has scrolled below it.
      image.loading = 'eager';
      image.src = examples[example][imageStage];
    });
    render();
    syncPlayback();
  }

  function showStage(index) {
    if (failedStages.has(index)) return;
    stop();
    loadImages();
    stage = index;
    phase = stage === stageNames.length - 1 ? 'complete' : 'hold';
    elapsed = 0;
    paused = true;
    error = '';
    render();
    syncPlayback();
  }

  images.forEach((image, index) => {
    image.addEventListener('load', () => decodeImage(index));
    image.addEventListener('error', () => {
      failedStages.add(index);
      error = `${stageNames[index]} could not be loaded. Try the other image or replay the scan.`;
      paused = true;
      phase = stage === stageNames.length - 1 ? 'complete' : 'hold';
      elapsed = 0;
      render();
      syncPlayback();
    });
  });

  previous.hidden = next.hidden = stageGroup.hidden = false;
  previous.addEventListener('click', () => showExample(example - 1));
  next.addEventListener('click', () => showExample(example + 1));
  stageButtons.forEach((button, index) => button.addEventListener('click', () => showStage(index)));
  playback.addEventListener('click', () => {
    if (phase === 'complete' || error) showExample(example);
    else {
      paused = !paused;
      syncPlayback();
    }
  });
  gallery.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showExample(example + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', () => {
    if (motion.matches && phase === 'scan') {
      phase = 'hold';
      elapsed = 0;
      render();
    }
    syncPlayback();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) loadImages();
      syncPlayback();
    }, { threshold: .15 });
    observer.observe(viewport);
  } else {
    visible = true;
    loadImages();
  }

  render();
  images.forEach((image, index) => {
    if (image.complete && image.naturalWidth > 0) decodeImage(index);
  });
  syncPlayback();
})();
