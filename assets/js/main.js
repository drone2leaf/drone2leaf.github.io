const header = document.querySelector('[data-header]');
const nav = document.querySelector('#site-nav');
const navToggle = document.querySelector('.nav-toggle');
const navLabel = document.querySelector('[data-nav-label]');
const year = document.querySelector('[data-year]');

if (year) year.textContent = new Date().getFullYear();

// A shared total for the published site; local previews do not send counter hits.
const viewCounter = document.querySelector('[data-view-counter]');
const counterPlaceholder = document.querySelector('[data-view-counter-placeholder]');
if (viewCounter && counterPlaceholder && window.location.hostname === 'drone2leaf.github.io') {
  viewCounter.addEventListener('load', () => {
    counterPlaceholder.hidden = true;
    viewCounter.hidden = false;
  }, { once: true });
  viewCounter.addEventListener('error', () => {
    counterPlaceholder.textContent = 'Page views: unavailable';
    viewCounter.hidden = true;
  }, { once: true });
  viewCounter.src = 'https://hits.sh/drone2leaf.github.io.svg?style=flat-square&label=page%20views&color=bcf2a1&labelColor=18362d';
}

const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

function closeNav() {
  nav?.classList.remove('is-open');
  navToggle?.setAttribute('aria-expanded', 'false');
  if (navLabel) navLabel.textContent = 'Open navigation';
}
navToggle?.addEventListener('click', () => {
  const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(willOpen));
  nav?.classList.toggle('is-open', willOpen);
  if (navLabel) navLabel.textContent = willOpen ? 'Close navigation' : 'Open navigation';
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') {
    closeNav();
    navToggle.focus();
  }
});

// Load the YouTube player when the visitor chooses to watch the film.
const videoPoster = document.querySelector('[data-play-video]');
videoPoster?.addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const player = document.createElement('iframe');
  player.src = 'https://www.youtube-nocookie.com/embed/18SfkeW88w8?rel=0&playsinline=1&autoplay=1';
  player.title = 'Drone2Leaf indoor drone flight at Western Sydney University';
  player.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
  player.setAttribute('allowfullscreen', '');
  player.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  player.tabIndex = 0;
  videoPoster.parentElement.replaceChildren(player);
  player.focus();
});
