// ── Firebase Imports (ES Modules via CDN) ────────────────────────────────────
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Firebase Config ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyAngOxc99dsVId7JS08IiVWcq4sA5NsDR4",
  authDomain:        "gemini-prompt-8e465.firebaseapp.com",
  projectId:         "gemini-prompt-8e465",
  storageBucket:     "gemini-prompt-8e465.firebasestorage.app",
  messagingSenderId: "994008586611",
  appId:             "1:994008586611:web:9f3f659a76c4e73617cd06",
  measurementId:     "G-TPP9F1VWYQ"
};

// ── Init Firebase ─────────────────────────────────────────────────────────────
const firebaseApp = initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp);
const gProvider   = new GoogleAuthProvider();

// ── Product Data ──────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id:1, name:"Linen Overcoat",    category:"Outerwear",
    price:4299, tag:"New",        bg:"#D9CEBB", emoji:"🧥" },
  { id:2, name:"Relaxed Trousers",  category:"Bottoms",
    price:2149, tag:"Bestseller", bg:"#BCC8C5", emoji:"👖" },
  { id:3, name:"Silk Slip Dress",   category:"Dresses",
    price:3599, tag:"Limited",    bg:"#CEBEC9", emoji:"👗" },
  { id:4, name:"Structured Blazer", category:"Formal",
    price:5499, tag:"New",        bg:"#B5BFC9", emoji:"🤵" },
];

// ── App State ─────────────────────────────────────────────────────────────────
let cart       = [];
let currentTab = "login";
let wishlist   = [];
let toastTimer = null;

// ── DOM Helper ────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

// ── Page Router ───────────────────────────────────────────────────────────────
window.showPage = function(page) {
  ["home","login","cart"].forEach(p =>
    $("page-" + p).classList.add("d-none")
  );
  $("page-" + page).classList.remove("d-none");
  if (page === "cart") renderCart();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ── Mobile Menu ───────────────────────────────────────────────────────────────
window.toggleMenu = function() {
  $("mobile-menu").classList.toggle("d-none");
};

// ── Navbar: update UI based on auth state ────────────────────────────────────
function setNavbarLoggedIn(displayName) {
  $("login-btn").classList.add("d-none");
  const av = $("avatar");
  av.textContent = displayName
    ? displayName[0].toUpperCase() : "U";
  av.classList.remove("d-none");
}

function setNavbarLoggedOut() {
  $("login-btn").classList.remove("d-none");
  $("avatar").classList.add("d-none");
}

// ── Firebase: Auth State Listener ────────────────────────────────────────────
// This runs automatically on every page load.
// If the user is already signed in, Firebase restores the session.
onAuthStateChanged(auth, (user) => {
  if (user) {
    const name = user.displayName || user.email.split("@")[0];
    setNavbarLoggedIn(name);
  } else {
    setNavbarLoggedOut();
  }
});

// ── Sign Out ──────────────────────────────────────────────────────────────────
window.handleSignOut = async function() {
  await signOut(auth);
  setNavbarLoggedOut();
  showToast("Signed out successfully.");
  showPage("home");
};

// ── Auth Form: tab switching ──────────────────────────────────────────────────
window.switchTab = function(tab) {
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
    $("switch-btn").onclick = () => switchTab("signup");
  } else {
    $("login-heading").textContent    = "Create account";
    $("login-subheading").textContent = "Join Velour for exclusive access.";
    $("submit-btn").textContent       = "Create Account →";
    $("switch-msg").textContent       = "Already have an account?";
    $("switch-btn").textContent       = "Sign in";
    $("switch-btn").onclick = () => switchTab("login");
  }
};

// ── Show inline error ─────────────────────────────────────────────────────────
function showAuthError(msg) {
  const el = $("login-error");
  el.textContent = msg;
  el.classList.remove("d-none");
}

// ── Map Firebase error codes to friendly messages ────────────────────────────
function friendlyError(code) {
  const map = {
    "auth/email-already-in-use":   "This email is already registered.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/wrong-password":         "Incorrect password. Try again.",
    "auth/user-not-found":         "No account found with this email.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/too-many-requests":      "Too many attempts. Please wait a moment.",
    "auth/popup-closed-by-user":   "Sign-in popup was closed.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

// ── Email / Password Auth ─────────────────────────────────────────────────────
window.handleAuth = async function() {
  const email = $("input-email").value.trim();
  const pw    = $("input-pw").value;
  const name  = $("input-name").value.trim();
  const btn   = $("submit-btn");

  $("login-error").classList.add("d-none");

  // Basic client-side checks
  if (!email.includes("@"))
    return showAuthError("Please enter a valid email address.");
  if (pw.length < 6)
    return showAuthError("Password must be at least 6 characters.");
  if (currentTab === "signup" && !name)
    return showAuthError("Please enter your full name.");

  btn.textContent = "Please wait...";
  btn.disabled    = true;

  try {
    let userCredential;

    if (currentTab === "signup") {
      // ── Create new account ──
      userCredential = await createUserWithEmailAndPassword(
        auth, email, pw
      );
      // Save display name to Firebase profile
      await updateProfile(userCredential.user, { displayName: name });
      // Save user doc to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        createdAt: new Date().toISOString()
      });
    } else {
      // ── Sign in existing account ──
      userCredential = await signInWithEmailAndPassword(auth, email, pw);
    }

    const displayName =
      userCredential.user.displayName ||
      name ||
      email.split("@")[0];

    btn.textContent = "✓ Done!";
    btn.classList.add("success");

    setNavbarLoggedIn(displayName);
    showToast("Welcome, " + displayName + "!");

    setTimeout(() => {
      showPage("home");
      btn.textContent = "Continue →";
      btn.disabled    = false;
      btn.classList.remove("success");
    }, 700);

  } catch (err) {
    showAuthError(friendlyError(err.code));
    btn.textContent = currentTab === "login" ? "Continue →" : "Create Account →";
    btn.disabled    = false;
  }
};

// ── Google Sign-In ────────────────────────────────────────────────────────────
window.handleGoogleSignIn = async function() {
  try {
    const result = await signInWithPopup(auth, gProvider);
    const user   = result.user;
    const name   = user.displayName || user.email.split("@")[0];

    // Save to Firestore on first Google login
    const ref  = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        name, email: user.email,
        createdAt: new Date().toISOString()
      });
    }

    setNavbarLoggedIn(name);
    showToast("Welcome, " + name + "!");
    showPage("home");

  } catch (err) {
    showAuthError(friendlyError(err.code));
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
window.handleForgotPassword = async function(e) {
  e.preventDefault();
  const email = $("input-email").value.trim();
  if (!email.includes("@"))
    return showAuthError("Enter your email above first.");
  try {
    await sendPasswordResetEmail(auth, email);
    showToast("Reset email sent! Check your inbox.");
  } catch (err) {
    showAuthError(friendlyError(err.code));
  }
};

// ── Toggle password visibility ────────────────────────────────────────────────
window.togglePw = function() {
  const inp = $("input-pw");
  inp.type = inp.type === "password" ? "text" : "password";
};

// ── Products ──────────────────────────────────────────────────────────────────
function buildProducts() {
  $("product-grid").innerHTML = PRODUCTS.map(p => `
    <div class="col-6 col-md-3">
      <div class="product-card">
        <div class="product-img-wrap" style="background:${p.bg}">
          <span class="product-tag">${p.tag}</span>
          <button class="wish-btn"
            onclick="toggleWish(${p.id}, this)">🤍</button>
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
          <div class="product-price">₹${p.price.toLocaleString("en-IN")}</div>
        </div>
      </div>
    </div>
  `).join("");
}

// ── Wishlist ──────────────────────────────────────────────────────────────────
window.toggleWish = function(id, btn) {
  if (wishlist.includes(id)) {
    wishlist     = wishlist.filter(w => w !== id);
    btn.textContent = "🤍";
  } else {
    wishlist.push(id);
    btn.textContent = "🧡";
  }
};

// ── Cart ──────────────────────────────────────────────────────────────────────
window.addToCart = function(productId) {
  const p = PRODUCTS.find(p => p.id === productId);
  cart.push(p);
  updateCartBadge();
  showToast(p.name + " added to bag");
};

function updateCartBadge() {
  const badge = $("cart-badge");
  if (cart.length > 0) {
    badge.textContent = cart.length > 9 ? "9+" : cart.length;
    badge.classList.remove("d-none");
  } else {
    badge.classList.add("d-none");
  }
}

window.removeFromCart = function(productId) {
  const idx = cart.findLastIndex(p => p.id === productId);
  if (idx !== -1) cart.splice(idx, 1);
  updateCartBadge();
  renderCart();
};

function renderCart() {
  const label   = $("cart-count-label");
  const empty   = $("cart-empty");
  const content = $("cart-content");

  label.textContent = cart.length > 0
    ? `(${cart.length} item${cart.length > 1 ? "s" : ""})` : "";

  if (cart.length === 0) {
    empty.classList.remove("d-none");
    content.classList.add("d-none");
    return;
  }
  empty.classList.add("d-none");
  content.classList.remove("d-none");

  const grouped = {};
  cart.forEach(p => {
    grouped[p.id] = grouped[p.id]
      ? { ...grouped[p.id], qty: grouped[p.id].qty + 1 }
      : { ...p, qty: 1 };
  });

  const items = Object.values(grouped);
  const sub   = cart.reduce((s, p) => s + p.price, 0);
  const tax   = Math.round(sub * 0.05);

  $("cart-items").innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="item-thumb"
        style="background:${item.bg}">${item.emoji}</div>
      <div class="item-body">
        <div class="item-cat">${item.category}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-qty">Qty: ${item.qty}</div>
      </div>
      <div class="item-right">
        <div class="item-price">
          ₹${(item.price * item.qty).toLocaleString("en-IN")}
        </div>
        <button class="remove-btn"
          onclick="removeFromCart(${item.id})">🗑</button>
      </div>
    </div>
  `).join("");

  $("s-subtotal").textContent = "₹" + sub.toLocaleString("en-IN");
  $("s-tax").textContent      = "₹" + tax.toLocaleString("en-IN");
  $("s-total").textContent    = "₹" + (sub + tax).toLocaleString("en-IN");

  $("checkout-btn").textContent = auth.currentUser
    ? "Proceed to Checkout"
    : "Login to Checkout";
}

window.handleCheckout = function() {
  if (!auth.currentUser) showPage("login");
  else showToast("Checkout coming soon!");
};

// ── Ticker ────────────────────────────────────────────────────────────────────
function buildTicker() {
  const words = [
    "Free Shipping Over ₹999",
    "New AW'25 Collection",
    "Easy Returns",
    "Sustainable Fabrics"
  ];
  $("ticker").innerHTML = Array(8)
    .fill(words).flat()
    .map(t => `<span>${t} &nbsp;·&nbsp;&nbsp;</span>`)
    .join("");
}

// ── Kick off ──────────────────────────────────────────────────────────────────
buildTicker();
buildProducts();
