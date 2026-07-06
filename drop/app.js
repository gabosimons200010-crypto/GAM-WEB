/* ═══════════════════════════════════════════════════════════
   SIN NOMBRE™ — MIDNIGHT DROP
   scroll-scrub hero / hover-to-play spins / demo cart
   ═══════════════════════════════════════════════════════════ */

const CATALOG = {
  hw01: { name: "HEAVYWEIGHT HOODIE", brand: "VANTA STUDIO", price: 180 },
  cg02: { name: "CARGO PANT", brand: "GRAVEL WORKS", price: 210 },
  ch03: { name: "CHROME PUFFER", brand: "ONYX SUPPLY", price: 340 },
};

/* ── header scroll state ── */
const head = document.getElementById("siteHead");
addEventListener("scroll", () => {
  head.classList.toggle("scrolled", scrollY > 40);
}, { passive: true });

/* ── countdown — drop lands at midnight, ~6 days out ── */
const dropDate = (() => {
  const d = new Date();
  d.setHours(24, 0, 0, 0);          // upcoming midnight
  d.setDate(d.getDate() + 5);       // +5 more days
  return d;
})();
const cd = {
  d: document.getElementById("cdD"), h: document.getElementById("cdH"),
  m: document.getElementById("cdM"), s: document.getElementById("cdS"),
};
function tick() {
  let ms = Math.max(0, dropDate - Date.now());
  const day = Math.floor(ms / 864e5); ms -= day * 864e5;
  const hr = Math.floor(ms / 36e5);  ms -= hr * 36e5;
  const mn = Math.floor(ms / 6e4);   ms -= mn * 6e4;
  const sc = Math.floor(ms / 1e3);
  cd.d.textContent = String(day).padStart(2, "0");
  cd.h.textContent = String(hr).padStart(2, "0");
  cd.m.textContent = String(mn).padStart(2, "0");
  cd.s.textContent = String(sc).padStart(2, "0");
}
tick();
setInterval(tick, 1000);

/* ── missing-media detection (asset not generated yet → poster fallback) ── */
function watchVideo(video, onFail, onReady) {
  let settled = false;
  const fail = () => { if (!settled) { settled = true; onFail(); } };
  const ok = () => { if (!settled) { settled = true; onReady && onReady(); } };
  video.addEventListener("loadedmetadata", ok, { once: true });
  video.addEventListener("error", fail, { once: true });
  video.querySelectorAll("source").forEach((s) =>
    s.addEventListener("error", fail, { once: true })
  );
  // backstop: nothing loaded after 5s and no bytes → treat as missing
  setTimeout(() => {
    if (!settled && video.readyState === 0 && video.networkState !== 2) fail();
  }, 5000);
}

/* ── hero: scroll-scrubbed walk ── */
const hero = document.querySelector(".hero");
const heroSticky = document.querySelector(".hero-sticky");
const heroVideo = document.getElementById("heroVideo");
let heroReady = false;
let scrubTarget = 0;
let scrubCurrent = 0;

watchVideo(
  heroVideo,
  () => hero.classList.add("media-fallback"),
  () => { heroReady = true; heroVideo.pause(); }
);

function heroProgress() {
  const max = hero.offsetHeight - innerHeight;
  return Math.min(1, Math.max(0, scrollY / max));
}
function scrubLoop() {
  const p = heroProgress();
  heroSticky.style.setProperty("--hero-prog", p.toFixed(4));
  if (heroReady && heroVideo.duration) {
    scrubTarget = p * (heroVideo.duration - 0.06);
    scrubCurrent += (scrubTarget - scrubCurrent) * 0.14;
    if (Math.abs(heroVideo.currentTime - scrubCurrent) > 0.02) {
      heroVideo.currentTime = scrubCurrent;
    }
  }
  requestAnimationFrame(scrubLoop);
}
requestAnimationFrame(scrubLoop);

/* ── product cards: hover-to-play 360 spins ── */
document.querySelectorAll(".card").forEach((card) => {
  const wrap = card.querySelector("[data-video-wrap]");
  const video = wrap.querySelector("video");

  watchVideo(video, () => wrap.classList.add("media-fallback"));

  const play = () => {
    if (wrap.classList.contains("media-fallback")) return;
    video.play().then(() => card.classList.add("playing")).catch(() => {});
  };
  const stop = () => {
    video.pause();
    card.classList.remove("playing");
  };
  card.addEventListener("mouseenter", play);
  card.addEventListener("mouseleave", stop);
  // touch: tap the media to toggle the spin
  wrap.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    video.paused ? play() : stop();
  });

  /* sizes + sold-out notify */
  const notify = card.querySelector(".notify");
  card.querySelectorAll(".size").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.hasAttribute("data-soldout")) {
        notify.hidden = false;
        notify.querySelector("input").focus();
        return;
      }
      card.querySelectorAll(".size").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      card.dataset.size = btn.textContent.trim();
    });
  });

  /* add to cart */
  const addBtn = card.querySelector("[data-add]");
  addBtn.addEventListener("click", () => {
    if (!card.dataset.size) {
      addBtn.classList.remove("needs-size");
      void addBtn.offsetWidth;
      addBtn.classList.add("needs-size");
      const prev = addBtn.textContent;
      addBtn.textContent = "PICK A SIZE FIRST";
      setTimeout(() => (addBtn.textContent = prev), 1200);
      return;
    }
    addToCart(card.dataset.product, card.dataset.size);
    addBtn.classList.add("flash");
    const prev = addBtn.textContent;
    addBtn.textContent = "ADDED ✓";
    setTimeout(() => {
      addBtn.classList.remove("flash");
      addBtn.textContent = prev;
    }, 1000);
  });
});

/* ── notify-me forms (sold-out sizes + footer) ── */
document.querySelectorAll(".notify").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.classList.add("done");
    const label = form.querySelector("label");
    if (label) label.textContent = "YOU'RE ON THE LIST ✓";
    else form.insertAdjacentHTML("afterbegin", "<label>YOU'RE ON THE LIST ✓</label>");
    form.querySelector("input").disabled = true;
    form.querySelector("button").disabled = true;
  });
});

/* ── cart state + drawer ── */
const cart = [];
const drawer = document.getElementById("cartDrawer");
const veil = document.getElementById("drawerVeil");
const itemsEl = document.getElementById("drawerItems");
const emptyEl = document.getElementById("drawerEmpty");
const totalEl = document.getElementById("drawerTotal");
const demoEl = document.getElementById("drawerDemo");
const fab = document.getElementById("cartFab");

function addToCart(productId, size) {
  cart.push({ ...CATALOG[productId], size });
  renderCart();
  fab.classList.remove("bump");
  void fab.offsetWidth;
  fab.classList.add("bump");
}
function removeFromCart(i) {
  cart.splice(i, 1);
  renderCart();
}
function renderCart() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = cart.length));
  itemsEl.innerHTML = cart
    .map(
      (it, i) => `<li>
        <span class="li-name">${it.name}<br><small>${it.brand}</small></span>
        <span class="li-size">${it.size} / $${it.price}</span>
        <button class="li-remove" data-i="${i}" aria-label="Remove">✕</button>
      </li>`
    )
    .join("");
  emptyEl.hidden = cart.length > 0;
  totalEl.textContent = "$" + cart.reduce((s, it) => s + it.price, 0);
}
itemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".li-remove");
  if (btn) removeFromCart(+btn.dataset.i);
});

function openDrawer() {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  veil.hidden = false;
  demoEl.hidden = true;
}
function closeDrawer() {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  veil.hidden = true;
}
document.getElementById("headCartBtn").addEventListener("click", openDrawer);
fab.addEventListener("click", openDrawer);
document.getElementById("drawerClose").addEventListener("click", closeDrawer);
veil.addEventListener("click", closeDrawer);
addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

document.getElementById("checkoutBtn").addEventListener("click", () => {
  if (!cart.length) return;
  demoEl.hidden = false;
  cart.length = 0;
  renderCart();
});

/* ── fabric macro: autoplay in view ── */
const fabricWrap = document.querySelector(".fabric-media");
const fabricVideo = document.getElementById("fabricVideo");
watchVideo(fabricVideo, () => fabricWrap.classList.add("media-fallback"));
new IntersectionObserver(
  ([entry]) => {
    if (fabricWrap.classList.contains("media-fallback")) return;
    entry.isIntersecting ? fabricVideo.play().catch(() => {}) : fabricVideo.pause();
  },
  { threshold: 0.35 }
).observe(fabricWrap);

/* ── scroll reveals ── */
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

renderCart();
