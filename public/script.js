let currentIndex = 0;
let desktops = [];

// DOM Elements
const carousel = document.getElementById('carousel');
const dotsContainer = document.getElementById('dotsContainer');
const stackContainer = document.getElementById('stackContainer');
const singleView = document.getElementById('singleView');
const gridView = document.getElementById('gridView');
const viewToggleBtn = document.getElementById('viewToggleBtn');
const kbToggleBtn = document.getElementById('kbToggleBtn');
const closeKbBtn = document.getElementById('closeKbBtn');
const keyboardDrawer = document.getElementById('keyboardDrawer');

// Fetch uploaded desktops or fallback to placeholders
async function loadDesktops() {
  try {
    const res = await fetch('/api/desktops');
    const data = await res.json();
    if (data.desktops && data.desktops.length > 0) {
      desktops = data.desktops.map(f => `/desktops/${f}`);
    } else {
      // Fallback demo mockups matching your magenta/purple screenshot
      desktops = [
        "https://picsum.photos/1920/1080?random=1",
        "https://picsum.photos/1920/1080?random=2",
        "https://picsum.photos/1920/1080?random=3"
      ];
    }
  } catch (err) {
    desktops = [
      "https://picsum.photos/1920/1080?random=1",
      "https://picsum.photos/1920/1080?random=2"
    ];
  }
  renderUI();
}

function renderUI() {
  // Render Carousel slides
  carousel.innerHTML = desktops.map((src, i) => `
    <div class="desktop-slide">
      <img src="${src}?t=${Date.now()}" alt="Desktop ${i + 1}" draggable="false" />
    </div>
  `).join('');

  // Render Dots
  dotsContainer.innerHTML = desktops.map((_, i) => `
    <div class="dot ${i === currentIndex ? 'active' : ''}"></div>
  `).join('');

  // Render Grid/Stacked View
  stackContainer.innerHTML = desktops.map((src, i) => `
    <div class="stack-card" onclick="selectDesktop(${i})">
      <div class="stack-label">Desktop Screen #${i + 1}</div>
      <img src="${src}?t=${Date.now()}" alt="Desktop ${i + 1}" />
    </div>
  `).join('');

  updateCarousel();
}

function updateCarousel() {
  carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });
}

function selectDesktop(index) {
  currentIndex = index;
  updateCarousel();
  gridView.classList.remove('view-active');
  singleView.classList.add('view-active');
  viewToggleBtn.textContent = '📱 Grid Overview';
}

// Touch Swiping logic
let touchStartX = 0;
let touchEndX = 0;

carousel.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

carousel.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > 50) {
    if (diff > 0 && currentIndex < desktops.length - 1) {
      currentIndex++; // Swipe Left -> Next
    } else if (diff < 0 && currentIndex > 0) {
      currentIndex--; // Swipe Right -> Prev
    }
    updateCarousel();
  }
}

// Toggle View button
viewToggleBtn.addEventListener('click', () => {
  const isGrid = gridView.classList.contains('view-active');
  if (isGrid) {
    gridView.classList.remove('view-active');
    singleView.classList.add('view-active');
    viewToggleBtn.textContent = '📱 Grid Overview';
  } else {
    singleView.classList.remove('view-active');
    gridView.classList.add('view-active');
    viewToggleBtn.textContent = '🖥️ Fullscreen';
  }
});

// Virtual Keyboard Toggles
kbToggleBtn.addEventListener('click', () => keyboardDrawer.classList.toggle('open'));
closeKbBtn.addEventListener('click', () => keyboardDrawer.classList.remove('open'));

loadDesktops();