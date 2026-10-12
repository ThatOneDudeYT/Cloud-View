let currentIndex = 0;
let desktops = [];
let pollInterval = null;

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
const statusIndicator = document.getElementById('statusIndicator');

// Expose selectDesktop to window so HTML onclick attributes always find it
window.selectDesktop = function (index) {
  currentIndex = index;
  updateCarousel();
  gridView.classList.remove('view-active');
  singleView.classList.add('view-active');
  viewToggleBtn.textContent = 'Grid Overview';
};

// Fetch desktops from Render API
async function loadDesktops(isPolling = false) {
  try {
    const res = await fetch('/api/desktops');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    
    const data = await res.json();

    if (data.desktops && data.desktops.length > 0) {
      const newDesktops = data.desktops.map(file => `/desktops/${file}`);
      
      // Update status banner with latest sync time
      if (statusIndicator) {
        const timeStr = new Date().toLocaleTimeString();
        statusIndicator.textContent = `Synced: ${timeStr} (${data.desktops.length} display${data.desktops.length > 1 ? 's' : ''})`;
        statusIndicator.style.color = '#4ade80'; // soft green
      }

      // If the list changed or it's the initial load, rebuild the layout
      if (JSON.stringify(desktops) !== JSON.stringify(newDesktops)) {
        desktops = newDesktops;
        renderUI();
      } else if (isPolling) {
        // Just refresh the image sources with a timestamp to bust browser cache
        refreshImagesInPlace();
      }
    } else if (!isPolling) {
      // Fallback demo mockups if no desktop has been uploaded yet
      desktops = [
        "https://picsum.photos/1920/1080?random=1",
        "https://picsum.photos/1920/1080?random=2"
      ];
      if (statusIndicator) {
        statusIndicator.textContent = "Waiting for first PC upload...";
        statusIndicator.style.color = '#facc15'; // yellow
      }
      renderUI();
    }
  } catch (err) {
    if (!isPolling) {
      console.warn("Could not reach /api/desktops, using fallback images:", err);
      desktops = [
        "https://picsum.photos/1920/1080?random=1",
        "https://picsum.photos/1920/1080?random=2"
      ];
      renderUI();
    }
  }
}

// Refresh image elements without rebuilding the DOM
function refreshImagesInPlace() {
  const timestamp = Date.now();
  document.querySelectorAll('#carousel img, #stackContainer img').forEach((img, i) => {
    if (desktops[i]) {
      img.src = `${desktops[i]}?t=${timestamp}`;
    }
  });
}

function renderUI() {
  const timestamp = Date.now();

  // Render Carousel slides
  carousel.innerHTML = desktops.map((src, i) => `
    <div class="desktop-slide">
      <img src="${src}?t=${timestamp}" alt="Desktop ${i + 1}" draggable="false" />
    </div>
  `).join('');

  // Render Dots
  dotsContainer.innerHTML = desktops.map((_, i) => `
    <div class="dot ${i === currentIndex ? 'active' : ''}"></div>
  `).join('');

  // Render Grid / Stacked Overview
  stackContainer.innerHTML = desktops.map((src, i) => `
    <div class="stack-card" onclick="selectDesktop(${i})">
      <div class="stack-label">Desktop Screen #${i + 1}</div>
      <img src="${src}?t=${timestamp}" alt="Desktop ${i + 1}" />
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

// Touch Swiping logic for mobile
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

// Grid vs Single View Toggle
viewToggleBtn.addEventListener('click', () => {
  const isGrid = gridView.classList.contains('view-active');
  if (isGrid) {
    gridView.classList.remove('view-active');
    singleView.classList.add('view-active');
    viewToggleBtn.textContent = 'Grid Overview';
  } else {
    singleView.classList.remove('view-active');
    gridView.classList.add('view-active');
    viewToggleBtn.textContent = 'Fullscreen';
  }
});

// Virtual Keyboard Drawer
kbToggleBtn.addEventListener('click', () => keyboardDrawer.classList.toggle('open'));
closeKbBtn.addEventListener('click', () => keyboardDrawer.classList.remove('open'));

// Visual feedback when pressing virtual keyboard keys
document.querySelectorAll('.key').forEach(key => {
  key.addEventListener('click', () => {
    key.style.transform = 'translateY(2px)';
    setTimeout(() => {
      key.style.transform = '';
    }, 120);
  });
});

// Initial run
loadDesktops(false);

// Auto-poll Render every 10 seconds for updated monitor snapshots
pollInterval = setInterval(() => {
  loadDesktops(true);
}, 10000);
