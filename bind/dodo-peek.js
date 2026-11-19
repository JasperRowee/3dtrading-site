/* Shared placement for the dashboard guide and Binance tutorial. */
(() => {
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));
  const box = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
  const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const controls = 'button, a[href], input, textarea, select, [role="button"], [data-t]';

  function contentBounds(target) {
    if (target.matches('input, textarea') || target.querySelector('input, textarea')) {
      const r = target.getBoundingClientRect();
      return [box(r.left, r.top, r.width * .76, r.height)];
    }
    const occupied = Array.from(target.querySelectorAll('svg,img')).map(el => el.getBoundingClientRect());
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      occupied.push(...range.getClientRects());
    }
    return occupied;
  }

  window.placeDodoPeek = (target, overlay, panel, options = {}) => {
    const r = target.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const top = Math.max(p.top, options.top || 0) + 4;
    const bottom = Math.min(p.bottom, options.bottom || innerHeight) - 4;
    const left = Math.max(p.left, 0) + 4;
    const right = Math.min(p.right, innerWidth) - 4;
    const bounds = box(left, top, right - left, bottom - top);
    const fits = b => b.left >= left && b.right <= right && b.top >= top && b.bottom <= bottom;
    if (!r.width || !r.height || !overlap(r, bounds)) return null;
    const head = overlay.firstElementChild;
    const bubble = overlay.children[1];
    const dim = Math.min(42, Math.max(24, r.height));
    const own = contentBounds(target);
    const nearby = Array.from(panel.querySelectorAll(controls))
      .filter(el => el !== target && !el.contains(target) && !target.contains(el))
      .map(el => el.getBoundingClientRect())
      .filter(o => o.width && o.height && Math.abs(o.top - r.top) < 240)
      .concat(options.occupied || []);
    const obstruction = b => nearby.reduce((sum, o) => sum + overlap(b, o), 0);
    const center = r.top + r.height / 2;
    const sizes = [...new Set([dim, Math.min(30, dim), 24])];
    const inside = sizes.flatMap(size => {
      if (r.width < size * 1.8 || r.height < size) return [];
      const x0 = Math.max(left, r.left + 3), x1 = Math.min(right, r.right - 3) - size;
      const y = Math.min(bottom, r.bottom) - size;
      return [x1, x0, (x0 + x1) / 2].map(x => box(x, y, size, size))
        .filter(b => x0 <= x1 && b.top >= r.top && fits(b) && !own.some(o => overlap(b, o)));
    });
    let anchor = inside[0];
    const inset = !!anchor;
    if (!anchor) {
      const side = sizes.flatMap(size => {
        const y = clamp(center - size / 2, top, bottom - size);
        return [box(r.right + 1, y, size, size), box(r.left - size - 1, y, size, size)].filter(fits);
      });
      anchor = side.sort((a, b) => obstruction(a) - obstruction(b))[0];
    }

    let speech;
    if (bubble) {
      bubble.style.maxWidth = Math.min(260, bounds.width) + 'px';
      bubble.style.maxHeight = Math.max(0, bounds.height) + 'px';
      const w = bubble.offsetWidth, h = bubble.offsetHeight;
      const a = anchor || r;
      const cx = clamp(a.left, left, right - w);
      const cy = clamp(center - h / 2, top, bottom - h);
      const choices = [
        box(r.right + 5, cy, w, h), box(r.left - w - 5, cy, w, h),
        box(cx, Math.min(r.top, a.top) - h - 5, w, h),
        box(cx, Math.max(r.bottom, a.bottom) + 5, w, h),
        box(left, top, w, h), box(right - w, top, w, h),
        box(left, bottom - h, w, h), box(right - w, bottom - h, w, h)
      ].filter(fits);
      const cost = b => obstruction(b) + 6 * overlap(b, r) + 5 * (anchor ? overlap(b, anchor) : 0)
        + Math.abs(b.top + h / 2 - center) * .1;
      speech = choices.sort((a, b) => cost(a) - cost(b))[0];
    }
    const parts = [anchor, speech].filter(Boolean);
    if (!parts.length) return null;
    const x = Math.min(...parts.map(b => b.left)), y = Math.min(...parts.map(b => b.top));
    const w = Math.max(...parts.map(b => b.right)) - x, h = Math.max(...parts.map(b => b.bottom)) - y;
    const position = (el, b) => {
      if (!el) return;
      el.style.visibility = b ? '' : 'hidden';
      if (b) { el.style.left = (b.left - x) + 'px'; el.style.top = (b.top - y) + 'px'; }
    };
    position(head, anchor);
    position(bubble, speech);
    if (anchor) {
      head.style.width = head.style.height = anchor.width + 'px';
      head.style.borderRadius = inset ? getComputedStyle(target).borderRadius : '0';
    }
    overlay.style.width = w + 'px';
    overlay.style.height = h + 'px';
    overlay.style.transform = `translate(${x}px,${y}px)`;
    overlay.classList.toggle('peek-inside', inset);
    const lookLeft = !!anchor && r.left + r.width / 2 < anchor.left + anchor.width / 2;
    overlay.classList.toggle('lk-l', lookLeft);
    overlay.classList.toggle('lk-r', !lookLeft);
    return parts;
  };
})();
