const setsNav = document.getElementById('setsNav');
const coverflow = document.getElementById('coverflow');
const mainImage = document.getElementById('mainImage');

let currentIndex = 0;
let isAnimating = false;
let currentSet = null;
let images = [];

async function api(path) {
  const res = await fetch(path);
  if(!res.ok) throw new Error('API error '+res.status);
  return res.json();
}

function clearChildren(el) {
  while(el.firstChild) el.removeChild(el.firstChild);
}

function wrapIndex(idx, len) {
  if (len === 0) return 0;
  while (idx < 0) idx += len;
  return idx % len;
}

function formatTitle(filename) {
  const withoutExt = filename.split('.')[0];
  const lastUnderscoreIndex = withoutExt.lastIndexOf('_');
  
  if(lastUnderscoreIndex === -1) {
    return withoutExt.split('_').map(word => 
      word.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    ).join(' ');
  }
  
  const mainPart = withoutExt.substring(0, lastUnderscoreIndex);
  const subPart = withoutExt.substring(lastUnderscoreIndex + 1);
  
  return {
    main: mainPart.split('_').map(word => 
      word.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    ).join(' '),
    sub: subPart.split('_').map(word => 
      word.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    ).join(' ')
  };
}

function updateCoverflow() {
  const thumbs = Array.from(coverflow.children);
  const len = thumbs.length;
  
  thumbs.forEach((thumb, i) => {
    thumb.classList.remove('center', 'prev-1', 'prev-2', 'next-1', 'next-2', 'far');
    
    let relativePos = i - currentIndex;
    if (relativePos < -Math.floor(len/2)) relativePos += len;
    if (relativePos > Math.floor(len/2)) relativePos -= len;
    
    if (relativePos === 0) {
      thumb.classList.add('center');
    } else if (relativePos === -1) {
      thumb.classList.add('prev-1');
    } else if (relativePos === -2) {
      thumb.classList.add('prev-2');
    } else if (relativePos === 1) {
      thumb.classList.add('next-1');
    } else if (relativePos === 2) {
      thumb.classList.add('next-2');
    } else {
      thumb.classList.add('far');
    }
  });
}

function renderCoverflow() {
  if(images.length === 0) return;
  
  clearChildren(coverflow);
  
  images.forEach((image, idx) => {
    const t = document.createElement('div');
    t.className = 'thumb';
    
    const img = document.createElement('img');
    img.src = image.swatch;
    img.alt = image.name;
    t.appendChild(img);
    
    t.addEventListener('click', () => {
      if(idx !== currentIndex && !isAnimating) {
        showImage(idx);
      }
    });
    
    coverflow.appendChild(t);
  });
  
  updateCoverflow();
}

function showImage(index) {
  const len = images.length;
  if(len === 0 || isAnimating) return;
  
  currentIndex = wrapIndex(index, len);
  const image = images[currentIndex];
  const fallbackIndicator = document.getElementById('fallbackIndicator');
  const activeTitle = document.getElementById('activeTitle');
  
  // Update title
  const title = formatTitle(image.name);
  if(typeof title === 'string') {
    activeTitle.innerHTML = `<div class="main-title">${title}</div>`;
  } else {
    activeTitle.innerHTML = `
      <div class="main-title">${title.main}</div>
      <div class="sub-title">${title.sub}</div>
    `;
  }
  
  // Reset fallback indicator
  fallbackIndicator.classList.remove('visible');
  
  if(image.room === image.swatch) {
    fallbackIndicator.classList.add('visible');
    mainImage.src = image.swatch;
  } else {
    mainImage.src = image.room;
    mainImage.onerror = () => { 
      mainImage.src = image.swatch;
      fallbackIndicator.classList.add('visible');
    };
  }
  
  updateCoverflow();
}

async function loadSet(name, btnEl) {
  const prev = document.querySelector('.setLink.active');
  if(prev) prev.classList.remove('active');
  if(btnEl) btnEl.classList.add('active');
  
  currentSet = name;
  images = await api(`/api/sets/${encodeURIComponent(name)}/images`);
  
  if(images.length === 0) { 
    mainImage.src = '';
    coverflow.innerHTML = '(no images)';
    return;
  }
  
  currentIndex = 0;
  renderCoverflow();
  showImage(0);
}

function renderSets(sets) {
  clearChildren(setsNav);
  sets.forEach(s => {
    const btn = document.createElement('button');
    btn.textContent = s;
    btn.className = 'setLink';
    btn.addEventListener('click', () => loadSet(s, btn));
    setsNav.appendChild(btn);
  });
}

// Keyboard navigation
document.addEventListener('keydown', e => {
  if(e.key === 'ArrowLeft') showImage(currentIndex - 1);
  if(e.key === 'ArrowRight') showImage(currentIndex + 1);
});

// Initialize
async function init() {
  try {
    const sets = await api('/api/sets');
    if(sets.length === 0) {
      setsNav.textContent = 'No image sets found in Images/Styles';
      return;
    }
    renderSets(sets);
    const firstBtn = setsNav.querySelector('button');
    if(firstBtn) firstBtn.click();
  } catch(err) {
    console.error(err);
    setsNav.textContent = 'Failed to load image sets';
  }
}

init();