// Inspired by the plant/drone particle scene at https://spsaswat.github.io/.
// Geometry is illustrative; no leaf predictions or model results are displayed.
(() => {
  const card = document.querySelector('[data-glasshouse]');
  const visual = card?.querySelector('.particle-visual');
  const canvas = visual?.querySelector('canvas');
  const context = canvas?.getContext('2d');
  if (!context) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = card.querySelector('[data-scene-toggle]');
  const toggleLabel = card.querySelector('[data-toggle-label]');
  const toggleIcon = card.querySelector('[data-toggle-icon]');
  const buttons = [...card.querySelectorAll('[data-scene-stage]')];
  const WIDTH = 960;
  const HEIGHT = 500;
  const STAGE_TIME = 6500;
  const CYCLE_TIME = STAGE_TIME * 3;
  const TAU = Math.PI * 2;
  const COLOURS = {
    leaf: '#95bd78',
    stem: '#83a875',
    detectedLeaf: '#21633f',
    detectionBox: '#3b78bc',
    disease: '#bc651e'
  };
  const pointer = { x: 0, y: 0, active: false };
  const particles = [];
  const leaves = [];
  const drone = [];
  let frame = 0;
  let visible = false;
  let paused = false;
  let elapsed = 0;
  let lastTime = 0;
  let stage = -1;
  let scale = 1;
  let pixelRatio = 1;

  function addPoint(list, x, y, kind, leaf = null, rotor = null) {
    const index = list.length;
    list.push({
      x, y, homeX: x, homeY: y, vx: 0, vy: 0, kind, leaf, rotor,
      phase: index * 2.399,
      radius: kind === 'house' ? 1.1 : 1.35 + (index % 3) * 0.18
    });
  }

  function sampleLine(list, x1, y1, x2, y2, kind, spacing = 6) {
    const count = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / spacing));
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      addPoint(list, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, kind);
    }
  }

  // Transparent glasshouse frame, with the near and far gables joined in perspective.
  const near = [[95, 444], [95, 208], [220, 105], [345, 208], [345, 444]];
  const far = near.map(([x, y]) => [x + 455, y - 85]);
  [near, far].forEach((gable) => {
    for (let i = 0; i < gable.length - 1; i++) {
      sampleLine(particles, ...gable[i], ...gable[i + 1], 'house');
    }
    sampleLine(particles, ...gable[0], ...gable[4], 'house');
  });
  near.forEach((point, i) => sampleLine(particles, ...point, ...far[i], 'house'));
  for (let i = 1; i <= 4; i++) {
    const x = 455 * i / 5;
    const y = -85 * i / 5;
    sampleLine(particles, 95 + x, 208 + y, 220 + x, 105 + y, 'house', 7);
    sampleLine(particles, 220 + x, 105 + y, 345 + x, 208 + y, 'house', 7);
    sampleLine(particles, 345 + x, 208 + y, 345 + x, 444 + y, 'house', 8);
  }
  sampleLine(particles, 95, 208, 345, 208, 'house', 8);
  // Two growing benches.
  [[135, 410, 735, 310], [245, 455, 845, 355]].forEach((line) => {
    sampleLine(particles, ...line, 'bench', 7);
    sampleLine(particles, line[0] + 10, line[1] + 10, line[2] + 10, line[3] + 10, 'bench', 7);
  });

  function leafPoint(leaf, x, y) {
    return {
      x: leaf.x + x * Math.cos(leaf.angle) - y * Math.sin(leaf.angle),
      y: leaf.y + x * Math.sin(leaf.angle) + y * Math.cos(leaf.angle)
    };
  }

  function makeLeaf(x, y, angle, index) {
    const leaf = { x, y, angle, rx: 24, ry: 10, index, diseased: [4, 13, 21, 28, 35].includes(index) };
    leaves.push(leaf);
    // Two quadratic curves form the pointed outline of each leaf.
    for (const direction of [-1, 1]) {
      for (let i = 0; i <= 15; i++) {
        const t = i / 15;
        const point = leafPoint(leaf, (2 * t - 1) * leaf.rx, direction * 4 * t * (1 - t) * leaf.ry);
        addPoint(particles, point.x, point.y, 'leaf', leaf);
      }
    }
    for (let i = 0; i <= 6; i++) {
      const point = leafPoint(leaf, (i / 6 * 2 - 1) * leaf.rx * .85, 0);
      addPoint(particles, point.x, point.y, 'leaf', leaf);
    }
  }

  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      const x = 178 + row * 112 + i * 97;
      const y = 392 + row * 42 - i * 16;
      sampleLine(particles, x, y, x, y - 110, 'stem', 5);
      [[-20, -51, .45], [20, -67, -.45], [-20, -85, .45], [20, -103, -.45]].forEach(([dx, dy, angle]) => {
        sampleLine(particles, x, y + dy + 6, x + dx, y + dy, 'stem', 5);
        makeLeaf(x + dx, y + dy, angle, leaves.length);
      });
    }
  }

  // Drone points stay in local coordinates; the moving centre carries the whole group.
  [[-38, -15, 1], [38, -15, -1], [-38, 15, -1], [38, 15, 1]].forEach(([x, y, direction]) => {
    sampleLine(drone, 0, 0, x, y, 'drone', 4);
    for (let i = 0; i < 18; i++) {
      const angle = i / 18 * TAU;
      addPoint(drone, x + Math.cos(angle) * 16, y + Math.sin(angle) * 5, 'drone', null, { x, y, angle, direction });
    }
  });
  [[0, -10, 12, 0], [12, 0, 0, 10], [0, 10, -12, 0], [-12, 0, 0, -10]].forEach((line) => sampleLine(drone, ...line, 'drone', 4));
  sampleLine(drone, 0, 10, 0, 17, 'drone', 3);
  for (let i = 0; i < 10; i++) {
    const angle = i / 10 * TAU;
    addPoint(drone, Math.cos(angle) * 4, 20 + Math.sin(angle) * 3, 'drone');
  }

  function stageProgress() {
    return (elapsed % STAGE_TIME) / STAGE_TIME;
  }

  function syncStage() {
    const next = Math.floor(elapsed / STAGE_TIME) % 3;
    if (next !== stage) {
      stage = next;
      card.dataset.stage = String(stage);
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === stage)));
    }
    buttons.forEach((button, i) => button.style.setProperty('--progress', i === stage ? stageProgress() : 0));
  }

  function dronePosition() {
    const angle = elapsed / CYCLE_TIME * TAU;
    const x = 455 - 210 * Math.cos(angle);
    return { x, y: 174 - (x - 245) * .16 + Math.sin(elapsed * .002) * 4 };
  }

  function attract(particle, x, y, delta) {
    const factor = Math.min(delta / 16.67, 2);
    particle.vx += (x - particle.x) * .024 * factor;
    particle.vy += (y - particle.y) * .024 * factor;
    if (pointer.active) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < 48) {
        const force = (1 - distance / 48) * .65 * factor;
        particle.vx += dx / distance * force;
        particle.vy += dy / distance * force;
      }
    }
    const damping = Math.pow(.84, factor);
    particle.vx *= damping;
    particle.vy *= damping;
    particle.x += particle.vx * factor;
    particle.y += particle.vy * factor;
  }

  function update(delta) {
    for (const particle of particles) {
      const sway = particle.kind === 'leaf' || particle.kind === 'stem' ? .65 : .12;
      attract(particle,
        particle.homeX + Math.cos(elapsed * .0007 + particle.phase) * sway,
        particle.homeY + Math.sin(elapsed * .0008 + particle.phase) * sway, delta);
    }
    const center = dronePosition();
    for (const particle of drone) {
      let x = particle.homeX;
      let y = particle.homeY;
      if (particle.rotor) {
        const rotor = particle.rotor;
        const angle = rotor.angle + elapsed * .007 * rotor.direction;
        x = rotor.x + Math.cos(angle) * 16;
        y = rotor.y + Math.sin(angle) * 5;
      }
      attract(particle, center.x + x, center.y + y, delta);
    }
  }

  function leafDetected(leaf) {
    return stage === 2 || (stage === 1 && leaf.index / leaves.length < Math.min(1, stageProgress() * 1.45));
  }

  function diseasedDetected(leaf) {
    return stage === 2 && leaf.diseased && stageProgress() > leaf.index / leaves.length * .65;
  }

  function dot(x, y, radius) {
    context.beginPath();
    context.arc(x, y, radius, 0, TAU);
    context.fill();
  }

  function drawBrackets(leaf, diseased) {
    const left = leaf.x - 29;
    const top = leaf.y - 19;
    const right = leaf.x + 29;
    const bottom = leaf.y + 19;
    const color = diseased ? COLOURS.disease : COLOURS.detectionBox;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.globalAlpha = diseased ? .95 : .85;
    context.lineWidth = 1.1;
    context.beginPath();
    [[left, top, 1, 1], [right, top, -1, 1], [left, bottom, 1, -1], [right, bottom, -1, -1]].forEach(([x, y, dx, dy]) => {
      context.moveTo(x, y + dy * 6);
      context.lineTo(x, y);
      context.lineTo(x + dx * 7, y);
    });
    context.stroke();
    context.font = '7px ui-monospace, Consolas, monospace';
    context.fillText(String(leaf.index + 1).padStart(2, '0'), right - 10, top - 4);
    if (diseased) {
      // Amber spots make the disease stage distinct even without the box colour.
      for (let i = 0; i < 4; i++) {
        const spot = leafPoint(leaf, -11 + i * 7, Math.sin(i * 2) * 3.5);
        dot(spot.x, spot.y, 2.2);
      }
    }
  }

  function draw() {
    context.setTransform(pixelRatio * scale, 0, 0, pixelRatio * scale, 0, 0);
    context.clearRect(0, 0, WIDTH, HEIGHT);
    // Soft glass panes keep the house transparent.
    context.fillStyle = '#86bca5';
    context.globalAlpha = .035;
    context.beginPath();
    context.moveTo(95, 208);
    context.lineTo(550, 123);
    context.lineTo(800, 123);
    context.lineTo(800, 359);
    context.lineTo(345, 444);
    context.lineTo(95, 444);
    context.closePath();
    context.fill();

    if (stage === 0) {
      const center = dronePosition();
      const reach = 150;
      const gradient = context.createLinearGradient(center.x, center.y + 20, center.x, center.y + reach);
      gradient.addColorStop(0, '#599c861a');
      gradient.addColorStop(1, '#599c8600');
      context.globalAlpha = 1;
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(center.x, center.y + 21);
      context.lineTo(center.x - 70, center.y + reach);
      context.lineTo(center.x + 70, center.y + reach);
      context.closePath();
      context.fill();
      context.strokeStyle = '#599c8640';
      context.lineWidth = .8;
      context.setLineDash([3, 7]);
      context.stroke();
      context.setLineDash([]);
    }

    for (const particle of particles) {
      let alpha = .72;
      let color = COLOURS.stem;
      if (particle.kind === 'leaf') { color = COLOURS.leaf; alpha = .88; }
      if (particle.kind === 'house') { color = '#698d88'; alpha = .45; }
      if (particle.kind === 'bench') { color = '#769278'; alpha = .35; }
      if (particle.leaf && leafDetected(particle.leaf)) { color = COLOURS.detectedLeaf; alpha = .95; }
      if (particle.leaf && diseasedDetected(particle.leaf)) { color = COLOURS.disease; alpha = .95; }
      context.fillStyle = color;
      context.globalAlpha = alpha;
      dot(particle.x, particle.y, particle.radius);
    }
    for (const leaf of leaves) {
      if (leafDetected(leaf)) drawBrackets(leaf, diseasedDetected(leaf));
    }
    context.fillStyle = '#316d6c';
    context.globalAlpha = .92;
    for (const particle of drone) dot(particle.x, particle.y, 1.8);
    context.globalAlpha = 1;
  }

  function snap() {
    pointer.active = false;
    const center = dronePosition();
    particles.forEach((particle) => {
      particle.x = particle.homeX;
      particle.y = particle.homeY;
      particle.vx = particle.vy = 0;
    });
    drone.forEach((particle) => {
      particle.x = center.x + particle.homeX;
      particle.y = center.y + particle.homeY;
      particle.vx = particle.vy = 0;
    });
    draw();
  }

  function running() {
    return visible && !document.hidden && !paused && !motion.matches;
  }

  function animate(time) {
    frame = 0;
    if (!running()) return;
    const delta = lastTime ? Math.min(time - lastTime, 50) : 16.67;
    lastTime = time;
    elapsed = (elapsed + delta) % CYCLE_TIME;
    syncStage();
    update(delta);
    draw();
    frame = requestAnimationFrame(animate);
  }

  function syncPlayback() {
    toggle.hidden = motion.matches;
    toggleLabel.textContent = paused ? 'Play' : 'Pause';
    toggleIcon.textContent = paused ? '▷' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    if (running() && !frame) {
      lastTime = 0;
      frame = requestAnimationFrame(animate);
    } else if (!running() && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    syncPlayback();
  });
  buttons.forEach((button, i) => {
    button.addEventListener('click', () => {
      // A manual choice pauses on a complete stage so it can be inspected.
      elapsed = i * STAGE_TIME + STAGE_TIME * .92;
      paused = true;
      syncStage();
      syncPlayback();
      snap();
    });
  });
  visual.addEventListener('pointermove', (event) => {
    if (paused || motion.matches || event.pointerType === 'touch') return;
    const rect = visual.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / scale;
    pointer.y = (event.clientY - rect.top) / scale;
    pointer.active = true;
  }, { passive: true });
  visual.addEventListener('pointerleave', () => { pointer.active = false; });
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', () => {
    syncPlayback();
    if (motion.matches) {
      elapsed = (Math.max(0, stage) + .92) * STAGE_TIME;
      syncStage();
      snap();
    }
  });

  function resize() {
    const rect = visual.getBoundingClientRect();
    if (!rect.width) return;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    scale = rect.width / WIDTH;
    canvas.width = Math.round(rect.width * pixelRatio);
    canvas.height = Math.round(rect.height * pixelRatio);
    draw();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) pointer.active = false;
      syncPlayback();
    }, { threshold: .1 });
    observer.observe(visual);
  } else {
    visible = true;
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(visual);
  else window.addEventListener('resize', resize, { passive: true });

  resize();
  syncStage();
  snap();
  syncPlayback();
})();
