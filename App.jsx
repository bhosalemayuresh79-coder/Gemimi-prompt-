import { useState } from "react";
import Navbar from "./Navbar";
import Home   from "./Home";
import Login  from "./Login";
import Cart   from "./Cart";

export default function App() {
  const [page,       setPage]     = useState("home");
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [user,       setUser]     = useState(null);
  const [cart,       setCart]     = useState([]);
  const [toast,      setToast]    = useState({ msg:"", visible:false });

  const showToast = (msg) => {
    setToast({ msg, visible:true });
    setTimeout(() => setToast(t => ({ ...t, visible:false })), 2100);
  };

  const addToCart = (product) => {
    setCart(prev => [...prev, product]);
    showToast(`${product.name} added to bag`);
  };

  const handleLogin = (userData) => {
    setLoggedIn(true);
    setUser(userData);
    showToast(`Welcome, ${userData.name}!`);
    setPage("home");
  };

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes tickerScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dotPulse { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
      `}</style>

      <Navbar
        setPage={setPage}
        isLoggedIn={isLoggedIn}
        user={user}
        cartCount={cart.length}
      />

      {page === "home"  && <Home  addToCart={addToCart} setPage={setPage} />}
      {page === "login" && <Login onLogin={handleLogin} setPage={setPage} />}
      {page === "cart"  && <Cart  cart={cart} setCart={setCart} setPage={setPage} isLoggedIn={isLoggedIn} />}

      {/* Toast */}
      <div style={{
        position:"fixed", bottom:24, left:"50%",
        transform:`translate(-50%, ${toast.visible ? 0 : 10}px)`,
        zIndex:9999, background:"#1c1917", color:"#fff",
        fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase",
        padding:"11px 22px", borderRadius:6,
        opacity:toast.visible ? 1 : 0,
        transition:"all 0.25s", pointerEvents:"none",
        boxShadow:"0 4px 20px rgba(0,0,0,0.22)", whiteSpace:"nowrap"
      }}>
        {toast.msg}
      </div>

    </div>
  );
}
