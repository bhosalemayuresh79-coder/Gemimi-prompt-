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

// ── Init Firebase (runs immediately, before DOM needed) ───────────────────────
let firebaseApp, auth, db, gProvider;

try {
  firebaseApp = initializeApp(firebaseConfig);
  auth        = getAuth(firebaseApp);
  db          = getFirestore(firebaseApp);
  gProvider   = new GoogleAuthProvider();
  console.log("Firebase initialized successfully.");
} catch (error) {
  console.error("Firebase init failed:", error);
  alert("App failed to start: " + error.message);
}

// ── Product Data ──────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id:1, name:"Linen Overcoat",
    category:"Outerwear", price:4299,
    tag:"New",        bg:"#D9CEBB", emoji:"🧥" },
  { id:2, name:"Relaxed Trousers",
    category:"Bottoms",   price:2149,
    tag:"Bestseller", bg:"#BCC8C5", emoji:"👖" },
  { id:3, name:"Silk Slip Dress",
    category:"Dresses",   price:3599,
    tag:"Limited",    bg:"#CEBEC9", emoji:"👗" },
  { id:4, name:"Structured Blazer",
    category:"Formal",    price:5499,
    tag:"New",        bg:"#B5BFC9", emoji:"🤵" },
];

// ── App State ─────────────────────────────────────────────────────────────────
let cart       = [];
let currentTab = "login";
let wishlist   = [];
let toastTimer = null;

// ── DOM Helper ────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── Safe error display ────────────────────────────────────────────────────────
// Uses both alert (always works) and inline error (if element exists)
function showAuthError(msg, err) {
  // Always log to console for debugging
  if (err) console.error("Auth Error:", err);

  // Show alert so crash is always visible even if DOM has issues
  // Comment this line out once your app is stable
  alert("Error: " + msg);

  // Also try to update the inline error element
  try {
    const el = $("login-error");
    if (el) {
      el.textContent = msg;
      el.classList.remove("d-none");
    }
  } catch (domErr) {
    console.error("Could not show inline error:", domErr);
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  try {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  } catch (err) {
    console.error("Toast error:", err);
  }
}

// ── Page Router ───────────────────────────────────────────────────────────────
window.showPage = function(page) {
  try {
    ["home","login","cart"].forEach(p => {
      const el = $("page-" + p);
      if (el) el.classList.add("d-none");
    });
    const target = $("page-" + page);
    if (target) target.classList.remove("d-none");
    if (page === "cart") renderCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error("showPage error:", err);
    alert("Page navigation error: " + err.message);
  }
};

// ── Mobile Menu ───────────────────────────────────────────────────────────────
window.toggleMenu = function() {
  try {
    const m = $("mobile-menu");
    if (m) m.classList.toggle("d-none");
  } catch (err) {
    console.error("toggleMenu error:", err);
  }
};

// ── Navbar helpers ────────────────────────────────────────────────────────────
function setNavbarLoggedIn(displayName) {
  try {
    const loginBtn = $("login-btn");
    const av       = $("avatar");
    if (loginBtn) loginBtn.classList.add("d-none");
    if (av) {
      av.textContent = displayName
        ? displayName[0].toUpperCase() : "U";
      av.classList.remove("d-none");
    }
  } catch (err) {
    console.error("setNavbarLoggedIn error:", err);
  }
}

function setNavbarLoggedOut() {
  try {
    const loginBtn = $("login-btn");
    const av       = $("avatar");
    if (loginBtn) loginBtn.classList.remove("d-none");
    if (av) av.classList.add("d-none");
  } catch (err) {
    console.error("setNavbarLoggedOut error:", err);
  }
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
// FIX: was missing try/catch — any Firebase error here crashed the app
window.handleSignOut = async function() {
  try {
    await signOut(auth);
    setNavbarLoggedOut();
    showToast("Signed out successfully.");
    showPage("home");
  } catch (err) {
    console.error("Sign out error:", err);
    alert("Sign out failed: " + err.message);
  }
};

// ── Auth tab switching ────────────────────────────────────────────────────────
window.switchTab = function(tab) {
  try {
    currentTab = tab;

    const tabSignin = $("tab-signin");
    const tabSignup = $("tab-signup");
    const fieldName = $("field-name");
    const forgotLnk = $("forgot-link");
    const loginErr  = $("login-error");

    if (tabSignin) tabSignin.classList.toggle("active", tab === "login");
    if (tabSignup) tabSignup.classList.toggle("active", tab === "signup");
    if (fieldName) fieldName.classList.toggle("d-none", tab === "login");
    if (forgotLnk) forgotLnk.classList.toggle("d-none", tab === "signup");
    if (loginErr)  loginErr.classList.add("d-none");

    if (tab === "login") {
      if ($("login-heading"))
        $("login-heading").textContent    = "Welcome back";
      if ($("login-subheading"))
        $("login-subheading").textContent = "Sign in to your Velour account.";
      if ($("submit-btn"))
        $("submit-btn").textContent       = "Continue →";
      if ($("switch-msg"))
        $("switch-msg").textContent       = "New to Velour?";
      if ($("switch-btn")) {
        $("switch-btn").textContent = "Create an account";
        $("switch-btn").onclick = () => window.switchTab("signup");
      }
    } else {
      if ($("login-heading"))
        $("login-heading").textContent    = "Create account";
      if ($("login-subheading"))
        $("login-subheading").textContent = "Join Velour for exclusive access.";
      if ($("submit-btn"))
        $("submit-btn").textContent       = "Create Account →";
      if ($("switch-msg"))
        $("switch-msg").textContent       = "Already have an account?";
      if ($("switch-btn")) {
        $("switch-btn").textContent = "Sign in";
        $("switch-btn").onclick = () => window.switchTab("login");
      }
    }
  } catch (err) {
    console.error("switchTab error:", err);
    alert("Tab switch error: " + err.message);
  }
};

// ── Firebase error code → readable message ────────────────────────────────────
function friendlyError(code) {
  const map = {
    "auth/email-already-in-use":   "This email is already registered.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/wrong-password":         "Incorrect password. Try again.",
    "auth/invalid-credential":     "Incorrect email or password.",
    "auth/user-not-found":         "No account found with this email.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/too-many-requests":      "Too many attempts. Please wait.",
    "auth/popup-closed-by-user":   "Sign-in popup was closed.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/operation-not-allowed":  "This sign-in method is not enabled.",
  };
  return map[code] || "Something went wrong. Please try again. (Code: " + code + ")";
}

// ── Email / Password Auth ─────────────────────────────────────────────────────
window.handleAuth = async function() {
  try {
    const emailEl = $("input-email");
    const pwEl    = $("input-pw");
    const nameEl  = $("input-name");
    const btn     = $("submit-btn");

    if (!emailEl || !pwEl || !btn) {
      alert("Form elements not found. Please refresh the page.");
      return;
    }

    const email = emailEl.value.trim();
    const pw    = pwEl.value;
    const name  = nameEl ? nameEl.value.trim() : "";

    // Hide any previous error
    const errEl = $("login-error");
    if (errEl) errEl.classList.add("d-none");

    // Client-side validation
    if (!email.includes("@")) {
      showAuthError("Please enter a valid email address.", null);
      return;
    }
    if (pw.length < 6) {
      showAuthError("Password must be at least 6 characters.", null);
      return;
    }
    if (currentTab === "signup" && !name) {
      showAuthError("Please enter your full name.", null);
      return;
    }

    // Show loading state
    btn.textContent = "Please wait...";
    btn.disabled    = true;

    let userCredential;

    if (currentTab === "signup") {

      // ── SIGN UP ──────────────────────────────────────────────────────────
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth, email, pw
        );
        console.log("Account created:", userCredential.user.uid);
      } catch (err) {
        console.error("createUserWithEmailAndPassword failed:", err);
        alert("Sign up failed: " + err.message);
        showAuthError(friendlyError(err.code), err);
        btn.textContent = "Create Account →";
        btn.disabled    = false;
        return;
      }

      // Update display name
      try {
        await updateProfile(userCredential.user, { displayName: name });
      } catch (err) {
        // Non-fatal — log but continue
        console.error("updateProfile failed:", err);
      }

      // Save to Firestore
      try {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          createdAt: new Date().toISOString()
        });
        console.log("User saved to Firestore.");
      } catch (err) {
        // Non-fatal — log but continue
        console.error("Firestore setDoc failed:", err);
      }

    } else {

      // ── SIGN IN ──────────────────────────────────────────────────────────
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, pw);
        console.log("Signed in:", userCredential.user.uid);
      } catch (err) {
        console.error("signInWithEmailAndPassword failed:", err);
        alert("Login failed: " + err.message);
        showAuthError(friendlyError(err.code), err);
        btn.textContent = "Continue →";
        btn.disabled    = false;
        return;
      }
    }

    // ── Success ───────────────────────────────────────────────────────────
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
      btn.textContent = currentTab === "login" ? "Continue →" : "Create Account →";
      btn.disabled    = false;
      btn.classList.remove("success");
    }, 700);

  } catch (err) {
    // Outer safety net — catches any unexpected crash
    console.error("handleAuth unexpected error:", err);
    alert("Login failed: " + err.message);
    const btn = $("submit-btn");
    if (btn) {
      btn.textContent = currentTab === "login" ? "Continue →" : "Create Account →";
      btn.disabled    = false;
    }
  }
};

// ── Google Sign-In ────────────────────────────────────────────────────────────
window.handleGoogleSignIn = async function() {
  try {
    const result = await signInWithPopup(auth, gProvider);
    const user   = result.user;
    const name   = user.displayName || user.email.split("@")[0];
    console.log("Google sign-in success:", user.uid);

    // Save to Firestore on first login
    try {
      const ref  = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          name,
          email:     user.email,
          createdAt: new Date().toISOString()
        });
      }
    } catch (fsErr) {
      // Non-fatal — Firestore save failed, auth still worked
      console.error("Firestore save after Google login failed:", fsErr);
    }

    setNavbarLoggedIn(name);
    showToast("Welcome, " + name + "!");
    showPage("home");

  } catch (err) {
    console.error("Google sign-in error:", err);
    alert("Google login failed: " + err.message);
    showAuthError(friendlyError(err.code), err);
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
window.handleForgotPassword = async function(e) {
  try {
    e.preventDefault();
    const emailEl = $("input-email");
    const email   = emailEl ? emailEl.value.trim() : "";

    if (!email.includes("@")) {
      showAuthError("Enter your email above first.", null);
      return;
    }

    await sendPasswordResetEmail(auth, email);
    showToast("Reset email sent! Check your inbox.");
    console.log("Password reset email sent to:", email);

  } catch (err) {
    console.error("Forgot password error:", err);
    alert("Reset failed: " + err.message);
    showAuthError(friendlyError(err.code), err);
  }
};

// ── Toggle password visibility ────────────────────────────────────────────────
window.togglePw = function() {
  try {
    const inp = $("input-pw");
    if (inp) inp.type = inp.type === "password" ? "text" : "password";
  } catch (err) {
    console.error("togglePw error:", err);
  }
};

// ── Products ──────────────────────────────────────────────────────────────────
function buildProducts() {
  try {
    const grid = $("product-grid");
    if (!grid) {
      console.error("product-grid element not found in DOM.");
      return;
    }
    grid.innerHTML = PRODUCTS.map(p => `
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
            <div class="product-price">
              ₹${p.price.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>
    `).join("");
    console.log("Products rendered.");
  } catch (err) {
    console.error("buildProducts error:", err);
    alert("Failed to load products: " + err.message);
  }
}

// ── Wishlist ──────────────────────────────────────────────────────────────────
window.toggleWish = function(id, btn) {
  try {
    if (wishlist.includes(id)) {
      wishlist        = wishlist.filter(w => w !== id);
      btn.textContent = "🤍";
    } else {
      wishlist.push(id);
      btn.textContent = "🧡";
    }
  } catch (err) {
    console.error("toggleWish error:", err);
  }
};

// ── Cart ──────────────────────────────────────────────────────────────────────
window.addToCart = function(productId) {
  try {
    const p = PRODUCTS.find(p => p.id === productId);
    if (!p) return;
    cart.push(p);
    updateCartBadge();
    showToast(p.name + " added to bag");
  } catch (err) {
    console.error("addToCart error:", err);
  }
};

function updateCartBadge() {
  try {
    const badge = $("cart-badge");
    if (!badge) return;
    if (cart.length > 0) {
      badge.textContent = cart.length > 9 ? "9+" : cart.length;
      badge.classList.remove("d-none");
    } else {
      badge.classList.add("d-none");
    }
  } catch (err) {
    console.error("updateCartBadge error:", err);
  }
}

// FIX: replaced findLastIndex (not supported on older Android)
// with a manual reverse search
window.removeFromCart = function(productId) {
  try {
    let idx = -1;
    for (let i = cart.length - 1; i >= 0; i--) {
      if (cart[i].id === productId) { idx = i; break; }
    }
    if (idx !== -1) cart.splice(idx, 1);
    updateCartBadge();
    renderCart();
  } catch (err) {
    console.error("removeFromCart error:", err);
    alert("Remove from cart failed: " + err.message);
  }
};

function renderCart() {
  try {
    const label   = $("cart-count-label");
    const empty   = $("cart-empty");
    const content = $("cart-content");

    if (!empty || !content) {
      console.error("Cart DOM elements not found.");
      return;
    }

    if (label) {
      label.textContent = cart.length > 0
        ? `(${cart.length} item${cart.length > 1 ? "s" : ""})` : "";
    }

    if (cart.length === 0) {
      empty.classList.remove("d-none");
      content.classList.add("d-none");
      return;
    }

    empty.classList.add("d-none");
    content.classList.remove("d-none");

    // Group items by id
    const grouped = {};
    cart.forEach(p => {
      grouped[p.id] = grouped[p.id]
        ? { ...grouped[p.id], qty: grouped[p.id].qty + 1 }
        : { ...p, qty: 1 };
    });

    const items = Object.values(grouped);
    const sub   = cart.reduce((s, p) => s + p.price, 0);
    const tax   = Math.round(sub * 0.05);

    const cartItemsEl = $("cart-items");
    if (cartItemsEl) {
      cartItemsEl.innerHTML = items.map(item => `
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
    }

    const sub_el = $("s-subtotal");
    const tax_el = $("s-tax");
    const tot_el = $("s-total");
    const chk_el = $("checkout-btn");

    if (sub_el) sub_el.textContent = "₹" + sub.toLocaleString("en-IN");
    if (tax_el) tax_el.textContent = "₹" + tax.toLocaleString("en-IN");
    if (tot_el) tot_el.textContent = "₹" + (sub + tax).toLocaleString("en-IN");
    if (chk_el) chk_el.textContent = auth.currentUser
      ? "Proceed to Checkout" : "Login to Checkout";

  } catch (err) {
    console.error("renderCart error:", err);
    alert("Cart render failed: " + err.message);
  }
}

window.handleCheckout = function() {
  if (!auth.currentUser) showPage("login");
  else showToast("Checkout coming soon!");
};

// ── Ticker ────────────────────────────────────────────────────────────────────
function buildTicker() {
  try {
    const ticker = $("ticker");
    if (!ticker) {
      console.error("Ticker element not found.");
      return;
    }
    const words = [
      "Free Shipping Over ₹999",
      "New AW'25 Collection",
      "Easy Returns",
      "Sustainable Fabrics"
    ];
    ticker.innerHTML = Array(8)
      .fill(words).flat()
      .map(t => `<span>${t} &nbsp;·&nbsp;&nbsp;</span>`)
      .join("");
  } catch (err) {
    console.error("buildTicker error:", err);
  }
}

// ── Auth state listener (set up inside DOMContentLoaded) ──────────────────────
function setupAuthListener() {
  onAuthStateChanged(auth, (user) => {
    try {
      if (user) {
        const name = user.displayName || user.email.split("@")[0];
        console.log("Auth state: logged in as", name);
        setNavbarLoggedIn(name);
      } else {
        console.log("Auth state: logged out");
        setNavbarLoggedOut();
      }
    } catch (err) {
      console.error("onAuthStateChanged handler error:", err);
    }
  });
}

// ── FIX: Wrap all DOM operations in DOMContentLoaded ─────────────────────────
// This guarantees every element exists before we touch it.
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM ready. Starting app...");
  try {
    buildTicker();
    buildProducts();
    setupAuthListener();
    console.log("App started successfully.");
  } catch (err) {
    console.error("App startup error:", err);
    alert("App failed to start: " + err.message);
  }
});
