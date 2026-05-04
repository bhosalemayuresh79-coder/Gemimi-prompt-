// ── Data ─────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id:1, name:"Linen Overcoat",    category:"Outerwear", price:4299, tag:"New",        bg:"#D9CEBB", emoji:"🧥" },
  { id:2, name:"Relaxed Trousers",  category:"Bottoms",   price:2149, tag:"Bestseller", bg:"#BCC8C5", emoji:"👖" },
  { id:3, name:"Silk Slip Dress",   category:"Dresses",   price:3599, tag:"Limited",    bg:"#CEBEC9", emoji:"👗" },
  { id:4, name:"Structured Blazer", category:"Formal",    price:5499, tag:"New",        bg:"#B5BFC9", emoji:"🤵" },
];

// ── State ─────────────────────────────────────────────────────────────────────
let cart       = [];
let isLoggedIn = false;
let user       = null;
let currentTab = "login";
let wishlist   = [];
let toastTimer = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => "₹" + n.toLocaleString("en-IN");

function $(id) { return document.getElementById(id); }

function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ── Page Router ───────────────────────────────────────────────────────────────
function showPage(page) {
  $("page-home").classList.add("d-none");
  $("page-login").classList.add("d-none");
  $("page-cart").classList.add("d-none");

  if (page === "home")  { $("page-home").classList.remove("d-none"); }
  if (page === "login") { $("page-login").classList.remove("d-none"); }
  if (page === "cart")  {
    $("page-cart").classList.remove("d-none");
    renderCart();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Mobile Menu ───────────────────────────────────────────────────────────────
function toggleMenu() {
  const m = $("mobile-menu");
  m.classList.toggle("d-none");
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function buildTicker() {
  const words = [
    "Free Shipping Over ₹999",
    "New AW'25 Collection",
    "Easy Returns",
    "Sustainable Fabrics"
  ];
  const repeated = Array(8).fill(words).flat();
  $("ticker").innerHTML = repeated
    .map(t => `<span>${t} &nbsp;·&nbsp;&nbsp;</span>`)
    .join("");
}

// ── Products ──────────────────────────────────────────────────────────────────
function buildProducts() {
  const grid = $("product-grid");
  grid.innerHTML = PRODUCTS.map(p => `
    <div class="col-6 col-md-3">
      <div class="product-card">
        <div class="product-img-wrap" style="background:${p.bg}">
          <span class="product-tag">${p.tag}</span>
          <button class="wish-btn" onclick="toggleWish(${p.id}, this)"
            title="Wishlist">🤍</button>
          <div class="product-img-bg">${p.emoji}</div>
          <div class="quick-add" onclick="addToCart(${p.id})">
            Quick Add
          </div>
        </div>
        <div class="product-info">
          <div>
            <div class="product-category">${p.category}</div>
            <div class="product-name">${p.name}</div>
          </div>
          <div class="product-price">${fmt(p.price)}</div>
        </div>
      </div>
    </div>
  `).join("");
}

// ── Wishlist ──────────────────────────────────────────────────────────────────
function toggleWish(id, btn) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(w => w !== id);
    btn.textContent = "🤍";
  } else {
    wishlist.push(id);
    btn.textContent = "🧡";
  }
}

// ── Cart ──────────────────────────────────────────────────────────────────────
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  cart.push(product);
  updateCartBadge();
  showToast(product.name + " added to bag");
}

function updateCartBadge() {
  const badge = $("cart-badge");
  if (cart.length > 0) {
    badge.textContent = cart.length > 9 ? "9+" : cart.length;
    badge.classList.remove("d-none");
  } else {
    badge.classList.add("d-none");
  }
}

function removeFromCart(productId) {
  const idx = cart.findLastIndex(p => p.id === productId);
  if (idx !== -1) cart.splice(idx, 1);
  updateCartBadge();
  renderCart();
}

function renderCart() {
  const label   = $("cart-count-label");
  const empty   = $("cart-empty");
  const content = $("cart-content");

  label.textContent = cart.length > 0
    ? `(${cart.length} item${cart.length > 1 ? "s" : ""})`
    : "";

  if (cart.length === 0) {
    empty.classList.remove("d-none");
    content.classList.add("d-none");
    return;
  }

  empty.classList.add("d-none");
  content.classList.remove("d-none");

  // Group by id
  const grouped = {};
  cart.forEach(p => {
    if (grouped[p.id]) grouped[p.id].qty++;
    else grouped[p.id] = { ...p, qty: 1 };
  });

  const items   = Object.values(grouped);
  const sub     = cart.reduce((s, p) => s + p.price, 0);
  const tax     = Math.round(sub * 0.05);
  const total   = sub + tax;

  $("cart-items").innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="item-thumb" style="background:${item.bg}">${item.emoji}</div>
      <div class="item-body">
        <div class="item-cat">${item.category}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-qty">Qty: ${item.qty}</div>
      </div>
      <div class="item-right">
        <div class="item-price">${fmt(item.price * item.qty)}</div>
        <button class="remove-btn" onclick="removeFromCart(${item.id})">🗑</button>
      </div>
    </div>
  `).join("");

  $("s-subtotal").textContent = fmt(sub);
  $("s-tax").textContent      = fmt(tax);
  $("s-total").textContent    = fmt(total);

  $("checkout-btn").textContent = isLoggedIn
    ? "Proceed to Checkout"
    : "Login to Checkout";
}

function handleCheckout() {
  if (!isLoggedIn) showPage("login");
  else showToast("Checkout coming soon!");
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;

  $("tab-signin").classList.toggle("active", tab === "login");
  $("tab-signup").classList.toggle("active", tab === "signup");
  $("field-name").classList.toggle("d-none", tab === "login");
  $("forgot-link").classList.toggle("d-none", tab === "signup");
  $("login-error").classList.add("d-none");

  if (tab === "login") {
    $("login-heading").textContent    = "Welcome back";
    $("login-subheading").textContent = "Sign in to your Velour account.";
    $("submit-btn").textContent       = "Continue →";
    $("switch-msg").textContent       = "New to Velour?";
    $("switch-btn").textContent       = "Create an account";
    $("switch-btn").setAttribute("onclick", "switchTab('signup')");
  } else {
    $("login-heading").textContent    = "Create account";
    $("login-subheading").textContent = "Join Velour for exclusive access.";
    $("submit-btn").textContent       = "Create Account →";
    $("switch-msg").textContent       = "Already have an account?";
    $("switch-btn").textContent       = "Sign in";
    $("switch-btn").setAttribute("onclick", "switchTab('login')");
  }
}

function togglePw() {
  const inp = $("input-pw");
  inp.type = inp.type === "password" ? "text" : "password";
}

function handleAuth() {
  const email = $("input-email").value.trim();
  const pw    = $("input-pw").value;
  const name  = $("input-name").value.trim();
  const err   = $("login-error");

  err.classList.add("d-none");

  if (!email.includes("@")) {
    err.textContent = "Please enter a valid email address.";
    err.classList.remove("d-none"); return;
  }
  if (pw.length < 6) {
    err.textContent = "Password must be at least 6 characters.";
    err.classList.remove("d-none"); return;
  }
  if (currentTab === "signup" && !name) {
    err.textContent = "Please enter your full name.";
    err.classList.remove("d-none"); return;
  }

  // Simulate async auth (replace with Firebase later)
  const btn = $("submit-btn");
  btn.textContent = "Please wait...";
  btn.disabled = true;

  setTimeout(() => {
    const displayName = name || email.split("@")[0];
    isLoggedIn = true;
    user = { name: displayName, email };
    btn.textContent = "✓ Done!";
    btn.classList.add("success");

    // Update navbar
    $("login-btn").classList.add("d-none");
    const av = $("avatar");
    av.textContent = displayName[0].toUpperCase();
    av.classList.remove("d-none");

    setTimeout(() => {
      showToast("Welcome, " + displayName + "!");
      showPage("home");
      // Reset button for future use
      btn.textContent = "Continue →";
      btn.disabled = false;
      btn.classList.remove("success");
    }, 600);
  }, 1200);
}

// ── Init ──────────────────────────────────────────────────────────────────────
buildTicker();
buildProducts();
