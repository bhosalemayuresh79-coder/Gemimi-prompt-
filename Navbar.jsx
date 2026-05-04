import { useState } from "react";

const CartSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

export default function Navbar({ setPage, isLoggedIn, user, cartCount }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      background:"rgba(250,248,245,0.94)", backdropFilter:"blur(14px)",
      borderBottom:"1px solid #e7e3dc", height:62,
      display:"flex", alignItems:"center",
      fontFamily:"'DM Sans', sans-serif"
    }}>
      <div style={{
        maxWidth:1280, margin:"0 auto", padding:"0 20px",
        width:"100%", display:"flex", alignItems:"center",
        justifyContent:"space-between", position:"relative"
      }}>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{ background:"none", border:"none", cursor:"pointer",
            display:"flex", flexDirection:"column", gap:5, padding:4 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              display:"block", width:22, height:1.5, background:"#1c1917"
            }}/>
          ))}
        </button>

        {/* Brand */}
        <button
          onClick={() => setPage("home")}
          style={{
            position:"absolute", left:"50%", transform:"translateX(-50%)",
            background:"none", border:"none", cursor:"pointer",
            fontFamily:"'Cormorant Garamond', serif",
            fontSize:22, letterSpacing:"0.3em",
            fontWeight:300, color:"#1c1917"
          }}>
          VELOUR
        </button>

        {/* Right side */}
        <div style={{ display:"flex", alignItems:"center", gap:18 }}>

          {/* Cart icon */}
          <button
            onClick={() => setPage("cart")}
            style={{ background:"none", border:"none", cursor:"pointer",
              position:"relative", color:"#1c1917", display:"flex" }}>
            <CartSVG />
            {cartCount > 0 && (
              <span style={{
                position:"absolute", top:-6, right:-6,
                background:"#b45309", color:"#fff",
                fontSize:9, fontWeight:700, width:16, height:16,
                borderRadius:"50%", display:"flex",
                alignItems:"center", justifyContent:"center"
              }}>
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>

          {/* Auth button or Avatar */}
          {isLoggedIn ? (
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background:"#1c1917", color:"#fff",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:14, cursor:"pointer"
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          ) : (
            <button
              onClick={() => setPage("login")}
              style={{
                background:"#1c1917", color:"#fff", border:"none",
                cursor:"pointer", fontSize:11, letterSpacing:"0.22em",
                textTransform:"uppercase", fontWeight:500,
                padding:"8px 18px", borderRadius:5
              }}>
              Login
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position:"absolute", top:62, left:0, right:0,
          background:"#FAF8F5", borderBottom:"1px solid #e7e3dc",
          padding:"16px 24px", display:"flex",
          flexDirection:"column", gap:14,
          animation:"fadeIn 0.2s ease"
        }}>
          {["Women","Men","New In","Sale"].map(l => (
            <a key={l} href="#" style={{
              fontSize:11, letterSpacing:"0.2em",
              textTransform:"uppercase", color:"#78716c",
              textDecoration:"none"
            }}>{l}</a>
          ))}
        </div>
      )}
    </nav>
  );
}
