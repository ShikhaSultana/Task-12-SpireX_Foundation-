/* ============================================================
   ShopEase — Shopping Cart Logic
   Add / remove products, manage quantities, auto totals
   ============================================================ */

"use strict";

/* ---------- Product catalogue ---------- */
const PRODUCTS = [
  {
    id: 1, name: "Aurora Wireless Headphones", category: "Audio", price: 129.99, old: 179.99,
    rating: 4.8, reviews: 214, tag: "Sale",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 2, name: "Minimalist Leather Watch", category: "Wearables", price: 189.00, old: null,
    rating: 4.7, reviews: 132, tag: "New",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 3, name: "Classic Canvas Sneakers", category: "Footwear", price: 74.50, old: 99.00,
    rating: 4.6, reviews: 318, tag: "Sale",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 4, name: "Polarized Sunglasses", category: "Accessories", price: 59.99, old: null,
    rating: 4.5, reviews: 96, tag: null,
    img: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 5, name: "Smart Fitness Band", category: "Wearables", price: 89.00, old: 119.00,
    rating: 4.4, reviews: 187, tag: "Sale",
    img: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 6, name: "Portable Bluetooth Speaker", category: "Audio", price: 64.99, old: null,
    rating: 4.7, reviews: 241, tag: "New",
    img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 7, name: "Everyday Backpack", category: "Bags", price: 79.00, old: 109.00,
    rating: 4.8, reviews: 402, tag: "Sale",
    img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 8, name: "Instant Film Camera", category: "Cameras", price: 119.00, old: null,
    rating: 4.6, reviews: 158, tag: null,
    img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 9, name: "Mechanical Keyboard", category: "Tech", price: 99.99, old: 139.99,
    rating: 4.9, reviews: 276, tag: "Sale",
    img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 10, name: "Ceramic Coffee Mug Set", category: "Home", price: 34.50, old: null,
    rating: 4.5, reviews: 88, tag: null,
    img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 11, name: "Desk Lamp — Warm Glow", category: "Home", price: 49.00, old: 69.00,
    rating: 4.6, reviews: 121, tag: "Sale",
    img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80&auto=format&fit=crop"
  },
  {
    id: 12, name: "Wireless Charging Pad", category: "Tech", price: 39.99, old: null,
    rating: 4.4, reviews: 143, tag: "New",
    img: "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=600&q=80&auto=format&fit=crop"
  }
];

/* ---------- Config ---------- */
const TAX_RATE = 0.08;
const FREE_SHIP_THRESHOLD = 100;
const SHIPPING_FEE = 9.99;
const PROMOS = { SAVE10: 0.10, WELCOME15: 0.15, SHOP20: 0.20 };

/* ---------- State ---------- */
let cart = [];            // [{ id, qty }]
let activeCategory = "All";
let searchTerm = "";
let appliedPromo = null;

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const productsEl = $("products");
const filtersEl = $("filters");
const cartItemsEl = $("cartItems");
const cartBadge = $("cartBadge");
const prodCount = $("prodCount");
const toast = $("toast");
const themeToggle = $("themeToggle");
const themeIcon = $("themeIcon");
const searchInput = $("searchInput");
const promoInput = $("promoInput");
const checkoutBtn = $("checkoutBtn");

/* ---------- Helpers ---------- */
const money = (n) => "$" + n.toFixed(2);
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function stars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

let toastTimer;
function showToast(msg, type) {
  toast.textContent = msg;
  toast.className = "toast " + (type || "");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ---------- Persistence ---------- */
function save() {
  try {
    localStorage.setItem("shopease-cart", JSON.stringify(cart));
    localStorage.setItem("shopease-promo", appliedPromo || "");
  } catch (e) {}
}
function load() {
  try {
    const c = JSON.parse(localStorage.getItem("shopease-cart") || "[]");
    if (Array.isArray(c)) cart = c.filter((i) => PRODUCTS.some((p) => p.id === i.id) && i.qty > 0);
    const p = localStorage.getItem("shopease-promo");
    if (p && PROMOS[p]) appliedPromo = p;
  } catch (e) { cart = []; }
}

/* ---------- Theme ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const dark = theme === "dark";
  themeToggle.setAttribute("aria-checked", String(dark));
  themeIcon.textContent = dark ? "☀️" : "🌙";
  try { localStorage.setItem("shopease-theme", theme); } catch (e) {}
}
themeToggle.addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme");
  applyTheme(cur === "dark" ? "light" : "dark");
});

/* ---------- Render products ---------- */
function renderFilters() {
  const cats = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
  filtersEl.innerHTML = cats.map(
    (c) => `<button class="filter ${c === activeCategory ? "active" : ""}" type="button" data-cat="${esc(c)}">${esc(c)}</button>`
  ).join("");
}

function visibleProducts() {
  return PRODUCTS.filter((p) => {
    const okCat = activeCategory === "All" || p.category === activeCategory;
    const okSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm);
    return okCat && okSearch;
  });
}

function renderProducts() {
  const list = visibleProducts();
  prodCount.textContent = `${list.length} item${list.length !== 1 ? "s" : ""}`;

  if (!list.length) {
    productsEl.innerHTML = `<div class="cart-empty" style="grid-column:1/-1">
      <div class="big">🔍</div><p>No products match your search.</p></div>`;
    return;
  }

  productsEl.innerHTML = list.map((p, i) => {
    const inCart = cart.find((c) => c.id === p.id);
    return `
      <article class="card" style="animation-delay:${i * 40}ms">
        <div class="thumb">
          <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" />
          ${p.tag ? `<span class="tag ${p.tag === "Sale" ? "sale" : ""}">${esc(p.tag)}</span>` : ""}
          <button class="fav" type="button" aria-label="Add to wishlist">♡</button>
        </div>
        <div class="body">
          <span class="cat">${esc(p.category)}</span>
          <h3 class="name">${esc(p.name)}</h3>
          <div class="rating">
            <span class="stars">${stars(p.rating)}</span>
            <span>${p.rating} (${p.reviews})</span>
          </div>
          <div class="foot">
            <div class="price">
              <span class="now">${money(p.price)}</span>
              ${p.old ? `<span class="was">${money(p.old)}</span>` : ""}
            </div>
            <button class="add-btn ${inCart ? "added" : ""}" type="button" data-add="${p.id}">
              ${inCart ? "✓ In cart" : "＋ Add"}
            </button>
          </div>
        </div>
      </article>`;
  }).join("");
}

/* ---------- Cart operations ---------- */
function addToCart(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  const item = cart.find((c) => c.id === id);
  if (item) {
    item.qty += 1;
    showToast(`Added another “${p.name}”`, "ok");
  } else {
    cart.push({ id, qty: 1 });
    showToast(`“${p.name}” added to cart`, "ok");
  }
  save();
  renderProducts();
  renderCart();
  bumpBadge();
}

function removeFromCart(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  cart = cart.filter((c) => c.id !== id);
  save();
  renderProducts();
  renderCart();
  if (p) showToast(`Removed “${p.name}”`, "err");
}

function changeQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  save();
  renderProducts();
  renderCart();
}

function clearCart() {
  if (!cart.length) return;
  cart = [];
  appliedPromo = null;
  promoInput.value = "";
  save();
  renderProducts();
  renderCart();
  showToast("Cart cleared", "err");
}

function bumpBadge() {
  cartBadge.classList.remove("show");
  void cartBadge.offsetWidth;
  cartBadge.classList.add("show");
}

/* ---------- Totals ---------- */
function computeTotals() {
  let subtotal = 0;
  let savings = 0;
  cart.forEach((c) => {
    const p = PRODUCTS.find((x) => x.id === c.id);
    if (!p) return;
    subtotal += p.price * c.qty;
    if (p.old) savings += (p.old - p.price) * c.qty;
  });

  const promoDiscount = appliedPromo ? subtotal * PROMOS[appliedPromo] : 0;
  const discount = promoDiscount;
  const afterDiscount = subtotal - discount;
  const shipping = cart.length === 0 ? 0 : (afterDiscount >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE);
  const tax = afterDiscount * TAX_RATE;
  const total = afterDiscount + shipping + tax;

  return { subtotal, savings, discount, shipping, tax, total };
}

/* ---------- Render cart ---------- */
function renderCart() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  cartBadge.textContent = count;
  cartBadge.classList.toggle("show", count > 0);

  if (!cart.length) {
    cartItemsEl.innerHTML = `<div class="cart-empty">
      <div class="big">🛒</div>
      <p>Your cart is empty.<br>Add some products to get started!</p>
    </div>`;
  } else {
    cartItemsEl.innerHTML = cart.map((c) => {
      const p = PRODUCTS.find((x) => x.id === c.id);
      if (!p) return "";
      return `
        <div class="citem">
          <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" />
          <div class="info">
            <div class="n">${esc(p.name)}</div>
            <div class="p">${money(p.price)} each</div>
            <div class="qty">
              <button type="button" data-dec="${p.id}" aria-label="Decrease quantity">−</button>
              <span class="q">${c.qty}</span>
              <button type="button" data-inc="${p.id}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="right">
            <button class="rm" type="button" data-rm="${p.id}" aria-label="Remove item">🗑️</button>
            <span class="line">${money(p.price * c.qty)}</span>
          </div>
        </div>`;
    }).join("");
  }

  const t = computeTotals();
  $("subtotal").textContent = money(t.subtotal);
  $("discount").textContent = "−" + money(t.discount);
  $("shipping").textContent = t.shipping === 0 ? (cart.length ? "FREE" : money(0)) : money(t.shipping);
  $("tax").textContent = money(t.tax);
  $("total").textContent = money(t.total);
  checkoutBtn.disabled = cart.length === 0;
}

/* ---------- Events ---------- */
productsEl.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) { addToCart(Number(add.getAttribute("data-add"))); return; }
  const fav = e.target.closest(".fav");
  if (fav) {
    fav.classList.toggle("on");
    fav.textContent = fav.classList.contains("on") ? "♥" : "♡";
  }
});

cartItemsEl.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  const rm = e.target.closest("[data-rm]");
  if (inc) changeQty(Number(inc.getAttribute("data-inc")), 1);
  else if (dec) changeQty(Number(dec.getAttribute("data-dec")), -1);
  else if (rm) removeFromCart(Number(rm.getAttribute("data-rm")));
});

filtersEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter");
  if (!btn) return;
  activeCategory = btn.getAttribute("data-cat");
  renderFilters();
  renderProducts();
});

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  renderProducts();
});

$("clearBtn").addEventListener("click", clearCart);

$("promoBtn").addEventListener("click", () => {
  const code = promoInput.value.trim().toUpperCase();
  if (!code) { showToast("Enter a promo code", "err"); return; }
  if (PROMOS[code]) {
    appliedPromo = code;
    save();
    renderCart();
    showToast(`Promo “${code}” applied — ${Math.round(PROMOS[code] * 100)}% off!`, "ok");
  } else {
    showToast("Invalid promo code", "err");
  }
});

checkoutBtn.addEventListener("click", () => {
  const t = computeTotals();
  showToast(`Order placed! Total ${money(t.total)} 🎉`, "ok");
  cart = [];
  appliedPromo = null;
  promoInput.value = "";
  save();
  renderProducts();
  renderCart();
});

$("cartToggle").addEventListener("click", () => {
  $("cartPanel").scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------- Init ---------- */
(function init() {
  let saved = "light";
  try { saved = localStorage.getItem("shopease-theme") || "light"; } catch (e) {}
  applyTheme(saved);

  load();
  renderFilters();
  renderProducts();
  renderCart();
})();
