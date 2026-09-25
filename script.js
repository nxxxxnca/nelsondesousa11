/* ============================================================LIGHTBOXDEFINITIVEEDITIONDIOSESTOYTANEMOCIONADOO
   LIGHTBOX — collage de deporte.html
   Progressive enhancement: si este archivo falla, las fotos
   siguen visibles como imágenes normales.
   ============================================================ */
(() => {
  'use strict';

  const collages = Array.from(document.querySelectorAll('.collage'));
  if (!collages.length) return;

  /* ---------- 1. Recolectar fotos por collage ---------- */
  const galleries = collages.map((collage) => {
    const yearEl = collage.closest('.year-block')?.querySelector('.year-tag');
    const year = yearEl ? yearEl.textContent.trim() : '';
    return Array.from(collage.querySelectorAll('.collage-photo img')).map((img, i) => ({
      src: img.currentSrc || img.src,
      alt: img.alt || '',
      year,
      index: i + 1,
      el: img,
    }));
  });

  /* ---------- 2. Marcar imágenes como interactivas ---------- */
  galleries.forEach((photos, listIdx) => {
    photos.forEach((photo, photoIdx) => {
      photo.el.setAttribute('tabindex', '0');
      photo.el.setAttribute('role', 'button');
      photo.el.setAttribute('aria-label', `Open photo ${photoIdx + 1} of ${photos.length}`);

      photo.el.addEventListener('click', () => open(listIdx, photoIdx, photo.el));
      photo.el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(listIdx, photoIdx, photo.el);
        }
      });
    });
  });

  /* ---------- 3. Construir el DOM del lightbox ---------- */
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Photo viewer');
  lb.hidden = true;
  lb.innerHTML = `
    <button class="lb-close" type="button" aria-label="Close photo viewer">&times;</button>
    <button class="lb-prev" type="button" aria-label="Previous photo">&larr;</button>
    <button class="lb-next" type="button" aria-label="Next photo">&rarr;</button>
    <div class="lb-counter" aria-hidden="true"></div>
    <figure class="lb-figure">
      <img class="lb-img" alt="" decoding="async">
      <figcaption class="lb-caption"></figcaption>
    </figure>
  `;
  document.body.appendChild(lb);

  const lbImg     = lb.querySelector('.lb-img');
  const lbCaption = lb.querySelector('.lb-caption');
  const lbCounter = lb.querySelector('.lb-counter');
  const lbClose   = lb.querySelector('.lb-close');
  const lbPrev    = lb.querySelector('.lb-prev');
  const lbNext    = lb.querySelector('.lb-next');

  /* ---------- 4. Estado ---------- */
  let currentList = null;
  let currentIdx  = 0;
  let lastFocused = null;
  let isOpen      = false;

  /* ---------- 5. Helpers ---------- */
  const reduceMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mod = (n, m) => ((n % m) + m) % m;

  /* ---------- 6. Abrir ---------- */
  function open(listIdx, photoIdx, sourceEl) {
    if (isOpen) return;
    currentList = galleries[listIdx];
    currentIdx  = photoIdx;
    lastFocused = sourceEl;

    render(null);

    // Origen de la animación: centro de la miniatura pulsada
    if (!reduceMotion() && sourceEl) {
      const r  = sourceEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      lb.style.setProperty('--lb-origin-x', `${((r.left + r.width  / 2) / vw) * 100}%`);
      lb.style.setProperty('--lb-origin-y', `${((r.top  + r.height / 2) / vh) * 100}%`);
    } else {
      lb.style.removeProperty('--lb-origin-x');
      lb.style.removeProperty('--lb-origin-y');
    }

    lb.hidden = false;
    void lb.offsetWidth;         // reflow para que corra la transición
    lb.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    isOpen = true;

    lbClose.focus({ preventScroll: true });
  }

  /* ---------- 7. Cerrar ---------- */
  function close() {
    if (!isOpen) return;
    lb.classList.remove('is-open');
    isOpen = false;
    document.documentElement.style.overflow = '';

    const finish = () => {
      lb.hidden = true;
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus({ preventScroll: true });
      }
    };

    if (reduceMotion()) {
      finish();
      return;
    }

    let done = false;
    const onEnd = (e) => {
      if (done) return;
      if (e && (e.target !== lb || e.propertyName !== 'opacity')) return;
      done = true;
      lb.removeEventListener('transitionend', onEnd);
      finish();
    };
    lb.addEventListener('transitionend', onEnd);
    setTimeout(onEnd, 450); // fallback
  }

  /* ---------- 8. Navegar ---------- */
  function go(delta) {
    if (!currentList || currentList.length < 2) return;
    currentIdx = mod(currentIdx + delta, currentList.length);
    render(delta);
  }

  /* ---------- 9. Render ---------- */
  function render(direction) {
    const photo = currentList[currentIdx];
    lbImg.src = photo.src;
    lbImg.alt = photo.alt;
    lbCounter.textContent = `${photo.index} / ${currentList.length}`;
    lbCaption.textContent = photo.year
      ? `${photo.year} · Photo ${photo.index} of ${currentList.length}`
      : `Photo ${photo.index} of ${currentList.length}`;

    const single = currentList.length < 2;
    lbPrev.hidden = single;
    lbNext.hidden = single;

    if (direction && !reduceMotion()) {
      lbImg.style.animation = 'none';
      void lbImg.offsetWidth;
      const name = direction > 0 ? 'lb-in-from-right' : 'lb-in-from-left';
      lbImg.style.animation = `${name} 0.32s cubic-bezier(0.2, 0.9, 0.3, 1)`;
    }

    preloadNeighbors();
  }

  function preloadNeighbors() {
    if (!currentList || currentList.length < 2) return;
    const len = currentList.length;
    [currentIdx - 1, currentIdx + 1].forEach((i) => {
      const img = new Image();
      img.src = currentList[mod(i, len)].src;
    });
  }

  /* ---------- 10. Eventos de controles ---------- */
  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => go(-1));
  lbNext.addEventListener('click', () => go(1));

  // Click en el fondo (no en controles ni figura) → cerrar
  lb.addEventListener('click', (e) => {
    if (e.target === lb) close();
  });

  /* ---------- 11. Teclado ---------- */
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    switch (e.key) {
      case 'Escape':     e.preventDefault(); close(); break;
      case 'ArrowLeft':  e.preventDefault(); go(-1);  break;
      case 'ArrowRight': e.preventDefault(); go(1);   break;
      case 'Tab':        trapFocus(e);                break;
    }
  });

  function trapFocus(e) {
    const focusables = [lbClose, lbPrev, lbNext].filter((el) => !el.hidden);
    if (!focusables.length) return;
    const first  = focusables[0];
    const last   = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault(); first.focus();
    }
  }

  /* ---------- 12. Swipe ---------- */
  let touchStartX = 0, touchStartY = 0, touchStartT = 0;

  lb.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartT = Date.now();
  }, { passive: true });

  lb.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartT;
    if (dt < 600 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      go(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

})();