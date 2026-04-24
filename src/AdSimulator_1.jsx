import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const GOOGLE_ADMIN_UID = "jitOoGWrprhGdO4pUp5qCM2SMFl1";

const ADMIN_RATE = 0.30;

const BLANK_STATS = () => ({ lifetimeCredits: 0, rarityCount: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 }, adCount: {} });


const PRESET_COLORS = ["#e63c3c","#1a73e8","#34a853","#fbbc04","#9c27b0","#ff6d00","#00bcd4","#e91e63","#00897b","#546e7a"];
const PRESET_LOGOS = ["⚡","🌿","🎮","💰","🚀","💎","🔥","🎯","🌊","✨","🎪","🦋","🍕","🎵","🏆","🐉","🦊","🌈","🎭","⚽"];
const CATEGORIES = ["Technology","Lifestyle","Gaming","Finance","Fashion","Food","Travel","Health","Entertainment","Sports"];
const WORKER_URL = "https://vid-manager-guy.superyoda1999.workers.dev";

const RARITIES = [
  { key: "common",    label: "Common",    chance: 90,       color: "#888888", sparkle: false, animation: null,             speed: 0   },
  { key: "uncommon",  label: "Uncommon",  chance: 7,        color: "#4ade80", sparkle: false, animation: "glow-uncommon",  speed: 3   },
  { key: "rare",      label: "Rare",      chance: 2.5,      color: "#60a5fa", sparkle: false, animation: "glow-rare",      speed: 2.5 },
  { key: "epic",      label: "Epic",      chance: 0.49,     color: "#a855f7", sparkle: true,  animation: "glow-epic",      speed: 2   },
  { key: "legendary", label: "Legendary", chance: 0.0095,   color: "#fbbc04", sparkle: true,  animation: "glow-legendary", speed: 1.5 },
  { key: "mythic",    label: "Mythic",    chance: 0.0001,   color: "#e63c3c", sparkle: true,  animation: "glow-mythic",    speed: 1   },
];
const RARITY_MAP = Object.fromEntries(RARITIES.map(r => [r.key, r]));

const BLANK_AD = { brand: "", tagline: "", cta: "", ctaUrl: "", category: "Technology", color: "#e63c3c", logo: "⚡", logoUrl: "", videoUrl: "", rarity: "common" };

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0e0e14; color: #eeeaf6; font-family: 'Syne', sans-serif; min-height: 100vh; }
  .app { min-height: 100vh; background: #0e0e14; position: relative; overflow: hidden; }
  .noise { position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events: none; z-index: 0; }

  /* ── AUTH ── */
  .auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; z-index: 1; }
  .auth-card { background: #16161e; border: 1px solid #2a2a38; border-radius: 20px; padding: 2.5rem; width: 100%; max-width: 400px; position: relative; box-shadow: 0 24px 64px rgba(0,0,0,0.4); }
  .auth-card::before { content: ''; position: absolute; top: -1px; left: 2rem; right: 2rem; height: 3px; background: linear-gradient(90deg, #e63c3c, #ff7043); border-radius: 0 0 4px 4px; }
  .auth-logo { font-family: 'Nunito', sans-serif; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.08em; color: #e63c3c; text-transform: uppercase; margin-bottom: 1.5rem; }
  .auth-title { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 0.4rem; }
  .auth-sub { font-family: 'Nunito', sans-serif; font-size: 0.85rem; color: #7e7e96; margin-bottom: 1.75rem; }

  /* ── LANDING ── */
  .landing { min-height: 100vh; display: flex; flex-direction: column; position: relative; z-index: 1; }
  .landing-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 2rem; border-bottom: 1px solid #1a1a22; }
  .landing-logo { font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 800; letter-spacing: 0.05em; color: #e63c3c; }
  .landing-body { flex: 1; max-width: 780px; margin: 0 auto; padding: 4rem 2rem 5rem; width: 100%; text-align: center; }
  .landing-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #e63c3c; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 1rem; }
  .landing-hero-title { font-size: clamp(2.4rem, 6vw, 3.8rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 1.25rem; }
  .landing-hero-title span { color: #e63c3c; }
  .landing-hero-sub { font-family: 'Nunito', sans-serif; font-size: 1.05rem; color: #7e7e96; max-width: 520px; line-height: 1.7; margin-bottom: 2.5rem; margin-left: auto; margin-right: auto; }
  .landing-signin-btn { display: inline-flex; align-items: center; gap: 0.75rem; background: #fff; color: #111; border: none; border-radius: 12px; padding: 0.9rem 1.5rem; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: background 0.15s, transform 0.1s; }
  .landing-signin-btn:hover { background: #f0f0f0; transform: translateY(-1px); }
  .landing-signin-btn:disabled { opacity: 0.5; cursor: default; transform: none; }
  .landing-divider { border: none; border-top: 1px solid #1a1a22; margin: 3.5rem 0; }
  .landing-section-label { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: #5a5a72; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 1.5rem; text-align: left; }
  .landing-features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 3rem; }
  .landing-feature { background: #13131a; border: 1px solid #1e1e2c; border-radius: 14px; padding: 1.25rem 1.5rem; text-align: left; }
  .landing-feature-icon { font-size: 1.4rem; margin-bottom: 0.75rem; }
  .landing-feature h3 { font-family: 'Nunito', sans-serif; font-size: 0.95rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; }
  .landing-feature p { font-family: 'Nunito', sans-serif; font-size: 0.82rem; color: #7e7e96; line-height: 1.6; }
  .landing-rarity-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.6rem; margin-bottom: 3rem; }
  .landing-rarity-card { background: #13131a; border: 1px solid #1e1e2c; border-radius: 10px; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; }
  .landing-rarity-name { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.88rem; }
  .landing-rarity-chance { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #5a5a72; }
  .landing-cta { background: #13131a; border: 1px solid #1e1e2c; border-radius: 16px; padding: 2.5rem; text-align: center; }
  .landing-cta h2 { font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; }
  .landing-cta p { font-family: 'Nunito', sans-serif; color: #7e7e96; font-size: 0.9rem; margin-bottom: 1.75rem; }
  @media (max-width: 600px) { .landing-body { padding: 2.5rem 1.25rem 4rem; } .landing-header { padding: 1rem 1.25rem; } .landing-features { grid-template-columns: 1fr; } }
  .btn-google { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; background: #fff; color: #111; border: none; border-radius: 12px; padding: 0.9rem 1rem; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: background 0.15s, transform 0.1s; margin-bottom: 1.5rem; }
  .btn-google:hover { background: #f0f0f0; transform: translateY(-1px); }
  .btn-google:active { transform: translateY(0); }
  .btn-google svg { flex-shrink: 0; }
  .user-avatar { width: 36px; height: 36px; background: #252530; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; color: #e63c3c; flex-shrink: 0; }
  .user-avatar.admin-av { color: #fbbc04; background: #1e1a10; border: 1px solid #fbbc0433; }
  .user-name { font-weight: 700; font-size: 0.95rem; }
  .user-credits-badge { margin-left: auto; font-family: 'Nunito', sans-serif; font-size: 0.75rem; color: #7e7e96; font-weight: 600; }
  .admin-badge { margin-left: auto; font-family: 'Nunito', sans-serif; font-size: 0.7rem; font-weight: 700; color: #fbbc04; letter-spacing: 0.05em; background: #fbbc0418; border: 1px solid #fbbc0433; padding: 0.2rem 0.6rem; border-radius: 999px; }
  .input { flex: 1; background: #1e1e28; border: 1px solid #2a2a38; border-radius: 10px; padding: 0.75rem 1rem; color: #eeeaf6; font-family: 'Nunito', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.15s; }
  .input::placeholder { color: #5a5a72; }
  .input:focus { border-color: #e63c3c88; }
  .btn-sm { background: #e63c3c; color: #fff; border: none; border-radius: 10px; padding: 0.75rem 1.2rem; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: background 0.15s, transform 0.1s; white-space: nowrap; }
  .btn-sm:hover { background: #cc2e2e; transform: translateY(-1px); }

  /* ── LAYOUT ── */
  .main { min-height: 100vh; display: flex; flex-direction: column; position: relative; z-index: 1; }
  .header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; border-bottom: 1px solid #1e1e28; flex-shrink: 0; }
  .header-logo { font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 800; letter-spacing: 0.05em; color: #e63c3c; }
  .header-right { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
  .credits-display { display: flex; align-items: center; gap: 0.5rem; background: #16161e; border: 1px solid #2a2a38; border-radius: 999px; padding: 0.4rem 1rem; }
  .credits-label { font-family: 'Nunito', sans-serif; font-size: 0.7rem; font-weight: 700; color: #7e7e96; text-transform: uppercase; letter-spacing: 0.05em; }
  .credits-value { font-family: 'JetBrains Mono', monospace; font-size: 1rem; font-weight: 600; color: #eeeaf6; transition: all 0.3s; }
  .credits-value.bump { color: #4ade80; transform: scale(1.3); }
  .profile-chip { display: flex; align-items: center; gap: 0.5rem; cursor: default; }
  .profile-avatar { width: 30px; height: 30px; background: #251820; border: 1px solid #e63c3c33; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.72rem; color: #e63c3c; }
  .profile-avatar.admin { background: #1e1a10; border-color: #fbbc0433; color: #fbbc04; }
  .profile-name { font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.88rem; }
  .logout-btn { background: none; border: 1px solid #2a2a38; border-radius: 999px; color: #7e7e96; padding: 0.35rem 0.9rem; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.75rem; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .logout-btn:hover { border-color: #e63c3c66; color: #e63c3c; }
  .mute-btn { background: none; border: 1px solid #2a2a38; border-radius: 999px; color: #7e7e96; padding: 0.35rem 0.75rem; font-size: 1rem; cursor: pointer; transition: all 0.15s; line-height: 1; }
  .mute-btn:hover { border-color: #ffffff33; color: #ccc; }
  .mute-btn.unmuted { border-color: #4ade8044; color: #4ade80; }

  /* ── TABS ── */
  .tabs { display: flex; border-bottom: 1px solid #1e1e28; padding: 0 2rem; flex-shrink: 0; }
  .tab-btn { background: none; border: none; border-bottom: 2px solid transparent; color: #7e7e96; font-family: 'Nunito', sans-serif; font-size: 0.85rem; font-weight: 700; padding: 0.85rem 1.25rem; cursor: pointer; transition: all 0.15s; margin-bottom: -1px; }
  .tab-btn:hover { color: #8888aa; }
  .tab-btn.active { color: #e63c3c; border-bottom-color: #e63c3c; }
  .tab-btn.admin-tab.active { color: #fbbc04; border-bottom-color: #fbbc04; }
  .tab-count { font-size: 0.72rem; opacity: 0.6; margin-left: 0.3rem; }

  /* ── HERO / EARN ── */
  .hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2.5rem; padding: 3rem; }
  .hero-label { font-family: 'Nunito', sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.15em; color: #5a5a72; text-transform: uppercase; text-align: center; }
  .run-btn-wrapper { position: relative; display: flex; align-items: center; justify-content: center; }
  .run-btn-ring { position: absolute; width: 240px; height: 240px; border-radius: 50%; border: 1px solid #e63c3c22; animation: ringPulse 2.5s ease-in-out infinite; }
  .run-btn-ring-2 { width: 280px; height: 280px; animation-delay: 0.5s; border-color: #e63c3c11; }
  @keyframes ringPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.5; } }
  .run-btn { width: 200px; height: 200px; border-radius: 50%; background: linear-gradient(135deg, #e63c3c, #c0392b); border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3rem; position: relative; transition: transform 0.1s, box-shadow 0.2s; box-shadow: 0 0 60px #e63c3c33, 0 0 120px #e63c3c11; }
  .run-btn::after { content: ''; position: absolute; inset: 6px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.18); pointer-events: none; }
  .run-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 0 80px #e63c3c55, 0 0 160px #e63c3c22; }
  .run-btn:active:not(:disabled) { transform: scale(0.97); }
  .run-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .run-btn-text { font-family: 'Nunito', sans-serif; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.08em; color: #fff; text-shadow: 0 1px 8px rgba(0,0,0,0.3); }
  .run-btn-sub { font-family: 'Nunito', sans-serif; font-size: 0.65rem; font-weight: 600; color: rgba(255,255,255,0.55); letter-spacing: 0.08em; text-transform: uppercase; }
  .status-bar { display: flex; align-items: center; gap: 0.75rem; font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 600; color: #5a5a72; min-height: 1.5rem; }
  .how-it-works { width: 100%; max-width: 520px; margin: 0 auto; border-top: 1px solid #1a1a22; padding-top: 2rem; display: flex; flex-direction: column; gap: 1.25rem; }
  .hiw-disclaimer { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; color: #4a4a5e; text-align: center; line-height: 1.6; }
  .hiw-disclaimer a { color: #5a5a72; text-decoration: underline; }
  .hiw-disclaimer a:hover { color: #7e7e96; }
  .hiw-title { font-family: 'Nunito', sans-serif; font-size: 0.7rem; font-weight: 700; color: #5a5a72; text-transform: uppercase; letter-spacing: 0.12em; text-align: center; }
  .hiw-steps { display: flex; flex-direction: column; gap: 0.75rem; }
  .hiw-step { display: flex; align-items: flex-start; gap: 0.85rem; }
  .hiw-step-num { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; font-weight: 700; color: #e63c3c; background: #e63c3c12; border: 1px solid #e63c3c22; border-radius: 999px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .hiw-step-text { font-size: 0.82rem; color: #7e7e96; line-height: 1.5; }
  .hiw-step-text strong { color: #888; font-weight: 700; }
  .hiw-rarity-row { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: center; }
  .hiw-rarity-pip { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid; }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #383848; flex-shrink: 0; }
  .status-dot.active { background: #4ade80; box-shadow: 0 0 8px #4ade80aa; animation: blink 1s ease-in-out infinite; }
  .status-dot.done { background: #e63c3c; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

  /* ── HISTORY ── */
  .history { padding: 0 2rem 2rem; max-width: 560px; margin: 0 auto; width: 100%; }
  .history-title { font-family: 'Nunito', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; color: #5a5a72; text-transform: uppercase; margin-bottom: 0.75rem; }
  .history-list { display: flex; flex-direction: column; gap: 0.4rem; }
  .history-item { display: flex; align-items: center; gap: 1rem; padding: 0.65rem 1rem; background: #13131a; border: 1px solid #1e1e28; border-radius: 10px; animation: slideIn 0.3s ease; }
  .history-item.h-admin { border-color: #fbbc0422; }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  .history-brand { font-family: 'Nunito', sans-serif; font-size: 0.85rem; font-weight: 700; flex: 1; }
  .h-admin-tag { font-family: 'Nunito', sans-serif; font-size: 0.65rem; font-weight: 700; color: #fbbc04; background: #fbbc0415; border: 1px solid #fbbc0433; padding: 0.1rem 0.5rem; border-radius: 999px; }
  .history-time { font-family: 'Nunito', sans-serif; font-size: 0.72rem; font-weight: 600; color: #5a5a72; }
  .history-credit { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #4ade80; font-weight: 600; }

  /* ── COLLECTION ── */
  .collection-view { flex: 1; padding: 2rem; overflow-y: auto; }
  .section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1.5rem; }
  .section-title { font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; color: #5a5a72; text-transform: uppercase; }
  .section-sub { font-family: 'Nunito', sans-serif; font-size: 0.75rem; font-weight: 600; color: #4a4a5e; }
  .collection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1.25rem; }
  .coll-card { background: #13131a; border: 1px solid #1e1e2c; border-radius: 14px; overflow: hidden; transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s; }
  .coll-card:hover { border-color: #2a2a3c; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
  .coll-banner { height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3rem; position: relative; overflow: hidden; }
  .coll-banner-bg { position: absolute; inset: 0; }
  .coll-icon { font-size: 2rem; position: relative; z-index: 1; }
  .coll-brand { font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; position: relative; z-index: 1; }
  .coll-body { padding: 1rem 1rem 0.85rem; }
  .coll-tagline { font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 600; color: #7e7e96; margin-bottom: 0.65rem; line-height: 1.4; }
  .coll-cat { font-family: 'Nunito', sans-serif; font-size: 0.7rem; font-weight: 700; color: #2a2a3c; letter-spacing: 0.06em; text-transform: uppercase; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 5rem 2rem; text-align: center; }
  .empty-icon { font-size: 3rem; opacity: 0.12; }
  .empty-text { font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 600; color: #4a4a5e; line-height: 1.8; }

  /* ── ADMIN PANEL ── */
  .admin-content { flex: 1; padding: 2rem; overflow-y: auto; }
  .admin-ads-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1.25rem; }
  .admin-ad-card { background: #13131a; border: 1px solid #1e1e2c; border-radius: 14px; overflow: hidden; transition: border-color 0.15s, transform 0.15s; }
  .admin-ad-card:hover { border-color: #fbbc0433; transform: translateY(-2px); }
  .adm-banner { height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; position: relative; overflow: hidden; }
  .adm-banner-bg { position: absolute; inset: 0; }
  .adm-icon { font-size: 2rem; position: relative; z-index: 1; }
  .adm-brand { font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; position: relative; z-index: 1; }
  .adm-tagline { font-family: 'Nunito', sans-serif; font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.55); position: relative; z-index: 1; padding: 0 0.75rem; text-align: center; }
  .adm-footer { padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
  .adm-cat { font-family: 'Nunito', sans-serif; font-size: 0.7rem; font-weight: 700; color: #7e7e96; letter-spacing: 0.04em; text-transform: uppercase; }
  .delete-btn { background: none; border: 1px solid #22222e; border-radius: 999px; color: #5a5a72; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.7rem; padding: 0.2rem 0.65rem; cursor: pointer; transition: all 0.15s; }
  .delete-btn:hover { border-color: #e63c3c66; color: #e63c3c; }
  .admin-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 5rem 2rem; text-align: center; }
  .admin-empty-text { font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 600; color: #4a4a5e; line-height: 1.8; }
  .go-create-btn { background: #fbbc04; color: #0e0e14; border: none; border-radius: 10px; padding: 0.65rem 1.5rem; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.88rem; cursor: pointer; transition: background 0.15s, transform 0.1s; }
  .go-create-btn:hover { background: #f0aa00; transform: translateY(-1px); }

  /* ── CREATE FORM ── */
  .form-wrap { max-width: 640px; }
  .form-title { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.25rem; }
  .form-sub { font-family: 'Nunito', sans-serif; font-size: 0.85rem; font-weight: 600; color: #7e7e96; margin-bottom: 1.75rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-group { margin-bottom: 1.25rem; }
  .form-label { font-family: 'Nunito', sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; color: #7e7e96; text-transform: uppercase; display: block; margin-bottom: 0.5rem; }
  .form-input { width: 100%; background: #1a1a22; border: 1px solid #2a2a38; border-radius: 10px; padding: 0.75rem 1rem; color: #eeeaf6; font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 600; outline: none; transition: border-color 0.15s; }
  .form-input::placeholder { color: #303040; }
  .form-input:focus { border-color: #fbbc0466; }
  .form-select { width: 100%; background: #1a1a22; border: 1px solid #2a2a38; border-radius: 10px; padding: 0.75rem 1rem; color: #eeeaf6; font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 600; outline: none; cursor: pointer; transition: border-color 0.15s; }
  .form-select:focus { border-color: #fbbc0466; }
  .color-swatches { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .color-swatch { width: 30px; height: 30px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.12s; flex-shrink: 0; }
  .color-swatch.sel { border-color: #fff; transform: scale(1.2); }
  .logo-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 0.35rem; }
  .logo-btn { background: #1a1a22; border: 1px solid #22222e; border-radius: 8px; padding: 0.3rem; font-size: 1rem; cursor: pointer; transition: all 0.1s; text-align: center; }
  .logo-btn:hover { border-color: #5a5a72; }
  .logo-btn.sel { border-color: #fbbc04; background: #1e1a10; }
  .logo-upload-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
  .logo-upload-btn { background: #1a1a22; border: 1px solid #22222e; border-radius: 8px; padding: 0.4rem 0.85rem; font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 700; color: #7e7e96; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .logo-upload-btn:hover { border-color: #5a5a72; color: #eee; }
  .logo-upload-preview { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; border: 1px solid #fbbc04; }
  .logo-upload-clear { background: none; border: none; color: #5a5a72; font-size: 0.85rem; cursor: pointer; padding: 0 0.25rem; }
  .logo-upload-clear:hover { color: #e63c3c; }
  .logo-prev-section { margin-top: 0.75rem; }
  .logo-prev-label { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; color: #5a5a72; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.5rem; }
  .logo-prev-grid { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .logo-prev-thumb { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; cursor: pointer; border: 2px solid transparent; transition: all 0.12s; }
  .logo-prev-thumb:hover { border-color: #5a5a72; }
  .logo-prev-thumb.sel { border-color: #fbbc04; }
  .form-error { font-family: 'Nunito', sans-serif; font-size: 0.8rem; font-weight: 600; color: #e63c3c; margin-bottom: 1rem; }
  .form-actions { display: flex; gap: 0.75rem; margin-top: 2rem; flex-wrap: wrap; }
  .btn-create { background: #fbbc04; color: #0e0e14; border: none; border-radius: 10px; padding: 0.85rem 2rem; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: background 0.15s, transform 0.1s; }
  .btn-create:hover { background: #f0aa00; transform: translateY(-1px); }
  .btn-cancel { background: none; border: 1px solid #2a2a38; color: #7e7e96; border-radius: 10px; padding: 0.85rem 1.5rem; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; }
  .btn-cancel:hover { border-color: #5a5a72; color: #8888aa; }

  /* ── AD PREVIEW (in form) ── */
  .preview-wrap { background: #13131a; border: 1px solid #1e1e2c; border-radius: 14px; overflow: hidden; margin-bottom: 1.75rem; }
  .preview-label { font-family: 'Nunito', sans-serif; font-size: 0.7rem; font-weight: 700; color: #4a4a5e; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.6rem 1rem; border-bottom: 1px solid #1e1e2c; }
  .preview-banner { height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; position: relative; overflow: hidden; }
  .preview-banner-bg { position: absolute; inset: 0; }
  .preview-icon { font-size: 2rem; position: relative; z-index: 1; }
  .preview-brand { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; position: relative; z-index: 1; }
  .preview-tagline { font-family: 'Nunito', sans-serif; font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.45); position: relative; z-index: 1; }
  .preview-footer { padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; }
  .preview-cta { font-size: 0.78rem; font-weight: 800; padding: 0.35rem 0.9rem; border-radius: 8px; color: #fff; }

  /* ── RARITY ROLL WHEEL ── */
  .roll-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.97); backdrop-filter: blur(6px); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.75rem; animation: fadeIn 0.2s ease; }
  .roll-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase; color: #4a4a5e; }
  .wheel-scene { position: relative; width: 300px; height: 300px; }
  .wheel-light { position: absolute; width: 10px; height: 10px; border-radius: 50%; transform: translate(-50%, -50%); animation: chaseLights 0.6s linear infinite; }
  @keyframes chaseLights { 0%, 100% { background: #fff; box-shadow: 0 0 8px #fff, 0 0 16px #fff; } 50% { background: #444; box-shadow: none; } }
  .wheel-pointer-wrap { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); z-index: 20; }
  .wheel-ptr { width: 0; height: 0; border-left: 13px solid transparent; border-right: 13px solid transparent; border-top: 26px solid #fff; filter: drop-shadow(0 0 10px rgba(255,255,255,0.9)); }
  .wheel-frame { position: absolute; inset: 0; border-radius: 50%; border: 5px solid #333; overflow: hidden; box-shadow: 0 0 80px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.6); }
  .wheel-disc { width: 100%; height: 100%; border-radius: 50%; transform-origin: center center; transition: transform 4s cubic-bezier(0.17, 0.67, 0.08, 1); background: conic-gradient(#888888 0deg 59deg, #1a1a22 59deg 61deg, #4ade80 61deg 119deg, #1a1a22 119deg 121deg, #60a5fa 121deg 179deg, #1a1a22 179deg 181deg, #a855f7 181deg 239deg, #1a1a22 239deg 241deg, #fbbc04 241deg 299deg, #1a1a22 299deg 301deg, #e63c3c 301deg 360deg); }
  .wheel-vignette { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle, rgba(0,0,0,0.4) 0%, transparent 65%); pointer-events: none; z-index: 2; }
  .wheel-hub { position: absolute; inset: 37%; border-radius: 50%; background: #0e0e16; border: 3px solid #333; z-index: 5; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; box-shadow: 0 0 24px rgba(0,0,0,0.9); }
  .roll-status { text-align: center; min-height: 5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; }
  .roll-spinning-text { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #4a4a5e; letter-spacing: 0.3em; animation: rollPulse 0.6s ease-in-out infinite; }
  @keyframes rollPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
  .roll-landed-name { font-family: 'Nunito', sans-serif; font-size: 2.8rem; font-weight: 900; letter-spacing: -0.02em; animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .roll-landed-sub { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; color: #4a4a5e; letter-spacing: 0.2em; margin-top: 0.25rem; }
  .roll-legend { display: flex; gap: 0.35rem; flex-wrap: wrap; justify-content: center; max-width: 320px; }
  .roll-legend-pip { font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid; opacity: 0.7; }

  /* ── AD VIDEO ── */
  .ad-video { width: 100%; height: auto; min-height: 180px; display: block; max-height: 65vh; object-fit: contain; background: #000; }
  .video-badge { font-family: 'Nunito', sans-serif; font-size: 0.65rem; font-weight: 700; color: #4ade80; background: #4ade8015; border: 1px solid #4ade8033; padding: 0.15rem 0.5rem; border-radius: 999px; }
  .preview-video { width: 100%; height: auto; min-height: 120px; max-height: 340px; object-fit: contain; background: #000; display: block; }

  /* ── AD MODAL ── */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.2s ease; padding: 1rem; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .ad-card { background: #16161e; border: 1px solid #2a2a38; border-radius: 16px; width: 100%; max-width: 460px; overflow: hidden; animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; transition: max-width 0.2s ease; box-shadow: 0 24px 64px rgba(0,0,0,0.5); }
  .ad-card.is-admin { border-color: #fbbc0444; }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  .ad-tag { position: absolute; top: 0.75rem; right: 0.75rem; font-family: 'Nunito', sans-serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.06em; color: #7e7e96; background: #13131a; border: 1px solid #2a2a38; padding: 0.2rem 0.6rem; border-radius: 999px; }
  .ad-tag.admin { color: #fbbc04; border-color: #fbbc0444; background: #1e1a10; }
  .ad-banner { height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; position: relative; overflow: hidden; }
  .ad-banner-icon { font-size: 3rem; position: relative; z-index: 1; }
  .ad-banner-brand { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; position: relative; z-index: 1; color: #fff; }
  .ad-banner-tagline { font-family: 'Nunito', sans-serif; font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.65); position: relative; z-index: 1; text-align: center; padding: 0 1rem; }
  .ad-banner-bg { position: absolute; inset: 0; }
  .ad-body { padding: 1.25rem 1.5rem 1.5rem; }
  .ad-category { font-family: 'Nunito', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; color: #7e7e96; text-transform: uppercase; margin-bottom: 0.75rem; }
  .ad-cta-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
  .ad-cta { display: inline-block; padding: 0.55rem 1.2rem; border-radius: 8px; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.85rem; color: #fff; text-decoration: none; cursor: default; }
  .ad-cta.clickable { cursor: pointer; }
  .ad-cta.clickable:hover { opacity: 0.85; }
  .new-collect-badge { font-family: 'Nunito', sans-serif; font-size: 0.7rem; font-weight: 700; color: #fbbc04; background: #fbbc0415; border: 1px solid #fbbc0433; padding: 0.2rem 0.6rem; border-radius: 999px; animation: glow 1s ease-in-out infinite; }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 4px #fbbc0444; } 50% { box-shadow: 0 0 12px #fbbc0488; } }
  .ad-progress-wrapper {}
  .ad-progress-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .ad-progress-text { font-family: 'Nunito', sans-serif; font-size: 0.72rem; font-weight: 700; color: #7e7e96; letter-spacing: 0.04em; }
  .ad-progress-countdown { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #7e7e96; }
  .ad-progress-track { height: 4px; background: #1e1e2c; border-radius: 999px; overflow: hidden; }
  .ad-progress-fill { height: 100%; border-radius: 999px; transition: width 0.1s linear; }
  .preview-close-btn { width: 100%; margin-top: 1.25rem; background: #1e1e2c; border: 1px solid #2a2a38; border-radius: 10px; color: #8888aa; font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 0.85rem; padding: 0.7rem; cursor: pointer; transition: all 0.15s; }
  .preview-close-btn:hover { background: #2a2a3c; color: #eeeaf6; }

  /* ── COMPLETE ── */
  .complete-modal { background: #16161e; border: 1px solid #2a2a38; border-radius: 20px; padding: 2.5rem; text-align: center; max-width: 340px; width: 100%; animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 24px 64px rgba(0,0,0,0.5); }
  .complete-icon { font-size: 3rem; margin-bottom: 0.75rem; }
  .complete-title { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.4rem; }
  .complete-sub { font-family: 'Nunito', sans-serif; font-size: 0.85rem; font-weight: 600; color: #7e7e96; margin-bottom: 1rem; line-height: 1.6; }
  .complete-collect-note { font-family: 'Nunito', sans-serif; font-size: 0.8rem; font-weight: 700; color: #fbbc04; margin-bottom: 1.5rem; background: #fbbc0410; border: 1px solid #fbbc0422; border-radius: 10px; padding: 0.6rem 0.75rem; }
  .complete-credit { font-family: 'JetBrains Mono', monospace; font-size: 2.5rem; font-weight: 600; color: #4ade80; margin-bottom: 1.5rem; }
  .btn-primary { background: linear-gradient(135deg, #e63c3c, #c0392b); color: #fff; border: none; border-radius: 12px; padding: 0.9rem 2rem; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.9rem; letter-spacing: 0.04em; cursor: pointer; transition: opacity 0.15s, transform 0.1s; width: 100%; }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

  /* ── RARITY ── */
  @keyframes glow-uncommon  { 0%,100% { box-shadow: 0 0 4px #4ade8033, 0 0 8px #4ade8022;  border-color: #4ade8044; } 50% { box-shadow: 0 0 8px #4ade8055,  0 0 16px #4ade8033;  border-color: #4ade8077; } }
  @keyframes glow-rare      { 0%,100% { box-shadow: 0 0 4px #60a5fa33, 0 0 8px #60a5fa22;  border-color: #60a5fa44; } 50% { box-shadow: 0 0 8px #60a5fa55,  0 0 16px #60a5fa33;  border-color: #60a5fa77; } }
  @keyframes glow-epic      { 0%,100% { box-shadow: 0 0 6px #a855f744, 0 0 12px #a855f722;  border-color: #a855f766; } 50% { box-shadow: 0 0 10px #a855f766, 0 0 20px #a855f733;  border-color: #a855f799; } }
  @keyframes glow-legendary { 0%,100% { box-shadow: 0 0 8px #fbbc0455, 0 0 16px #fbbc0422;  border-color: #fbbc0477; } 50% { box-shadow: 0 0 14px #fbbc0477, 0 0 28px #fbbc0433;  border-color: #fbbc04aa; } }
  @keyframes glow-mythic    { 0%,100% { box-shadow: 0 0 10px #e63c3c55, 0 0 20px #e63c3c33, 0 0 40px #e63c3c11; border-color: #e63c3c88; } 50% { box-shadow: 0 0 16px #e63c3c77, 0 0 32px #e63c3c44, 0 0 60px #e63c3c22; border-color: #e63c3cbb; } }
  @keyframes sparkle-float  { 0%,100% { opacity: 0; transform: scale(0) rotate(0deg); } 30% { opacity: 1; transform: scale(1) rotate(135deg); } 70% { opacity: 0.7; transform: scale(0.7) rotate(270deg); } }
  @keyframes sparkle-float-large { 0%,100% { opacity: 0; transform: scale(0) rotate(0deg); } 25% { opacity: 1; transform: scale(1.3) rotate(120deg); } 65% { opacity: 0.9; transform: scale(1) rotate(260deg); } }
  @keyframes new-collect-in { 0% { opacity: 0; transform: scale(0.7) translateY(30px); } 60% { opacity: 1; transform: scale(1.05) translateY(-6px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes new-collect-shimmer { 0%,100% { background-position: 200% center; } 50% { background-position: 0% center; } }
  .new-collect-card { position: relative; background: #16161e; border-radius: 24px; padding: 2.5rem 2rem 2rem; text-align: center; max-width: 360px; width: 100%; box-shadow: 0 32px 80px rgba(0,0,0,0.6); animation: new-collect-in 0.5s cubic-bezier(0.34,1.56,0.64,1); overflow: visible; }
  .new-collect-burst { font-size: 4rem; margin-bottom: 0.5rem; animation: new-collect-in 0.5s cubic-bezier(0.34,1.56,0.64,1); display: block; }
  .new-collect-eyebrow { font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #8888aa; margin-bottom: 0.75rem; }
  .new-collect-rarity { font-family: 'Nunito', sans-serif; font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.25rem; background: linear-gradient(135deg, var(--rar-color), #fff 60%, var(--rar-color)); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: new-collect-shimmer 2s linear infinite; }
  .new-collect-brand { font-family: 'Nunito', sans-serif; font-size: 1rem; font-weight: 700; color: #8888aa; margin-bottom: 2rem; }
  .new-collect-dismiss { width: 100%; background: linear-gradient(135deg, var(--rar-color-dim), var(--rar-color)); color: #fff; border: none; border-radius: 12px; padding: 0.9rem; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: opacity 0.15s, transform 0.1s; }
  .new-collect-dismiss:hover { opacity: 0.9; transform: translateY(-1px); }
  .rarity-badge { font-family: 'Nunito', sans-serif; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 999px; display: inline-block; }
  .rarity-selector { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.25rem; }
  .rarity-btn { font-family: 'Nunito', sans-serif; font-size: 0.72rem; font-weight: 700; padding: 0.3rem 0.8rem; border-radius: 999px; cursor: pointer; border: 1px solid #2a2a38; background: #1a1a22; color: #7e7e96; transition: all 0.15s; }
  .rarity-btn.sel { color: #eeeaf6; }
  .sparkle-wrap { position: absolute; inset: 0; pointer-events: none; overflow: visible; z-index: 10; }

  /* ── QUANTITY BADGE ── */
  .qty-badge { position: absolute; top: 8px; left: 8px; z-index: 20; background: rgba(14,14,20,0.85); border: 1px solid #2a2a38; border-radius: 999px; font-family: 'Nunito', sans-serif; font-size: 0.7rem; font-weight: 800; color: #eeeaf6; padding: 0.15rem 0.55rem; backdrop-filter: blur(4px); }

  /* ── MY ACCOUNT ── */
  .account-view { flex: 1; padding: 2rem; overflow-y: auto; }
  .account-section { margin-bottom: 2rem; }
  .account-section-title { font-family: 'Nunito', sans-serif; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.12em; color: #7e7e96; text-transform: uppercase; margin-bottom: 1rem; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
  .stat-card { background: #13131a; border: 1px solid #1e1e2c; border-radius: 14px; padding: 1.1rem 1rem; text-align: center; }
  .stat-card-value { font-family: 'JetBrains Mono', monospace; font-size: 1.6rem; font-weight: 700; color: #eeeaf6; line-height: 1; margin-bottom: 0.35rem; }
  .stat-card-label { font-family: 'Nunito', sans-serif; font-size: 0.72rem; font-weight: 700; color: #7e7e96; }
  .rarity-stat-row { display: flex; flex-direction: column; gap: 0.5rem; }
  .rarity-stat-item { display: flex; align-items: center; gap: 0.75rem; background: #13131a; border: 1px solid #1e1e2c; border-radius: 10px; padding: 0.6rem 1rem; }
  .rarity-stat-label { font-family: 'Nunito', sans-serif; font-size: 0.82rem; font-weight: 700; flex: 1; }
  .rarity-stat-count { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 600; color: #eeeaf6; }
  .rarity-stat-bar-wrap { flex: 2; height: 6px; background: #1e1e2c; border-radius: 999px; overflow: hidden; }
  .rarity-stat-bar { height: 100%; border-radius: 999px; transition: width 0.4s ease; }

  /* ── LEADERBOARD ── */
  .leaderboard-view { flex: 1; padding: 2rem; overflow-y: auto; }
  .lb-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .lb-tab { background: #13131a; border: 1px solid #1e1e2c; border-radius: 999px; font-family: 'Nunito', sans-serif; font-size: 0.78rem; font-weight: 700; color: #7e7e96; padding: 0.35rem 1rem; cursor: pointer; transition: all 0.15s; }
  .lb-tab.active { background: #e63c3c18; border-color: #e63c3c44; color: #e63c3c; }
  .lb-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .lb-row { display: flex; align-items: center; gap: 1rem; background: #13131a; border: 1px solid #1e1e2c; border-radius: 12px; padding: 0.75rem 1rem; transition: border-color 0.15s; }
  .lb-row.is-me { border-color: #e63c3c44; background: #e63c3c08; }
  .lb-rank { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 700; color: #7e7e96; width: 1.75rem; text-align: center; flex-shrink: 0; }
  .lb-rank.gold { color: #fbbc04; }
  .lb-rank.silver { color: #aaaacc; }
  .lb-rank.bronze { color: #cd7f32; }
  .lb-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #252530; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; color: #e63c3c; }
  .lb-name { font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lb-value { font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; font-weight: 700; color: #eeeaf6; flex-shrink: 0; }
  .lb-you { font-family: 'Nunito', sans-serif; font-size: 0.65rem; font-weight: 800; color: #e63c3c; background: #e63c3c18; border: 1px solid #e63c3c33; border-radius: 999px; padding: 0.1rem 0.45rem; flex-shrink: 0; }
  .lb-empty { font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 600; color: #5a5a72; text-align: center; padding: 3rem 1rem; }

  /* ── LOADING ── */
  .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Nunito', sans-serif; font-size: 0.85rem; font-weight: 700; color: #5a5a72; letter-spacing: 0.1em; position: relative; z-index: 1; }
`;

function RaritySparkles({ color, large = false }) {
  const small = [
    { top: "-10px",    left: "12%",   delay: "0s",    size: "0.55rem" },
    { top: "-10px",    right: "18%",  delay: "0.5s",  size: "0.45rem" },
    { bottom: "-10px", left: "22%",   delay: "0.9s",  size: "0.5rem"  },
    { bottom: "-10px", right: "12%",  delay: "0.3s",  size: "0.45rem" },
    { top: "35%",      left: "-12px", delay: "0.7s",  size: "0.4rem"  },
    { top: "60%",      right: "-12px",delay: "1.1s",  size: "0.5rem"  },
  ];
  const big = [
    { top: "-18px",    left: "8%",    delay: "0s",    size: "1.1rem"  },
    { top: "-14px",    left: "35%",   delay: "0.35s", size: "0.85rem" },
    { top: "-18px",    right: "10%",  delay: "0.7s",  size: "1rem"    },
    { bottom: "-18px", left: "15%",   delay: "0.55s", size: "0.9rem"  },
    { bottom: "-14px", left: "50%",   delay: "0.15s", size: "0.8rem"  },
    { bottom: "-18px", right: "8%",   delay: "0.9s",  size: "1rem"    },
    { top: "20%",      left: "-18px", delay: "0.45s", size: "0.85rem" },
    { top: "55%",      left: "-16px", delay: "1.1s",  size: "0.75rem" },
    { top: "20%",      right: "-18px",delay: "0.25s", size: "0.9rem"  },
    { top: "60%",      right: "-16px",delay: "0.8s",  size: "0.8rem"  },
  ];
  const pts = large ? big : small;
  const anim = large ? "sparkle-float-large 1.4s ease-in-out infinite" : "sparkle-float 2s ease-in-out infinite";
  return (
    <div className="sparkle-wrap">
      {pts.map((p, i) => (
        <div key={i} style={{ position: "absolute", ...p, color, fontSize: p.size, animation: anim, animationDelay: p.delay }}>✦</div>
      ))}
    </div>
  );
}

function getRarityStyle(rarity) {
  const r = RARITY_MAP[rarity] || RARITY_MAP.common;
  if (!r.animation) return {};
  return { animation: `${r.animation} ${r.speed}s ease-in-out infinite` };
}

const LB_CATEGORIES = [
  { key: "lifetimeCredits", label: "Lifetime Credits" },
  { key: "total",           label: "Total Collected"  },
  { key: "unique",          label: "Unique Ads"       },
  { key: "legendary",       label: "Legendary Finds"  },
  { key: "mythic",          label: "Mythic Finds"     },
];

function LeaderboardView({ entries, currentUserId }) {
  const [cat, setCat] = useState(LB_CATEGORIES[0].key);
  const sorted = [...entries].sort((a, b) => b[cat] - a[cat]).slice(0, 10);
  const rankColor = i => i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
  const rankLabel = i => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;

  // find current user's rank even if outside top 10
  const myRank = [...entries].sort((a, b) => b[cat] - a[cat]).findIndex(e => e.uid === currentUserId);

  return (
    <div className="leaderboard-view">
      <div className="lb-tabs">
        {LB_CATEGORIES.map(c => (
          <button key={c.key} className={`lb-tab ${cat === c.key ? "active" : ""}`} onClick={() => setCat(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="lb-empty">No data yet — start earning credits!</div>
      ) : (
        <div className="lb-list">
          {sorted.map((e, i) => {
            const isMe = e.uid === currentUserId;
            return (
              <div key={e.uid} className={`lb-row ${isMe ? "is-me" : ""}`}>
                <span className={`lb-rank ${rankColor(i)}`}>{rankLabel(i)}</span>
                {e.photoURL
                  ? <img src={e.photoURL} className="lb-avatar" alt="" referrerPolicy="no-referrer" />
                  : <div className="lb-avatar">{(e.name || "?").slice(0, 2).toUpperCase()}</div>
                }
                <span className="lb-name">{e.name}</span>
                {isMe && <span className="lb-you">YOU</span>}
                <span className="lb-value">{e[cat]}</span>
              </div>
            );
          })}

          {/* show user's position if outside top 10 */}
          {myRank >= 10 && (() => {
            const me = entries.find(e => e.uid === currentUserId);
            if (!me) return null;
            return (
              <>
                <div style={{ textAlign: "center", color: "#383848", fontSize: "0.75rem", padding: "0.25rem" }}>· · ·</div>
                <div className="lb-row is-me">
                  <span className="lb-rank">#{myRank + 1}</span>
                  {me.photoURL
                    ? <img src={me.photoURL} className="lb-avatar" alt="" referrerPolicy="no-referrer" />
                    : <div className="lb-avatar">{(me.name || "?").slice(0, 2).toUpperCase()}</div>
                  }
                  <span className="lb-name">{me.name}</span>
                  <span className="lb-you">YOU</span>
                  <span className="lb-value">{me[cat]}</span>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function AdSimulator() {
  const [currentUser, setCurrentUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading, null = signed out
  const [adminAds, setAdminAds] = useState([]);
  const [userLibrary, setUserLibrary] = useState([]);
  const [adState, setAdState] = useState("idle");
  const [isMuted, setIsMuted] = useState(true);
  const [rollTargetRarity, setRollTargetRarity] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [rollLanded, setRollLanded] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [isAdminAd, setIsAdminAd] = useState(false);
  const [showNewCollectOverlay, setShowNewCollectOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [history, setHistory] = useState([]);
  const [creditBump, setCreditBump] = useState(false);
  const [view, setView] = useState("earn");
  const [adminView, setAdminView] = useState("ads");
  const [editingAdId, setEditingAdId] = useState(null);
  const [editingOriginalVideoUrl, setEditingOriginalVideoUrl] = useState(null);
  const [editingOriginalLogoUrl, setEditingOriginalLogoUrl] = useState(null);
  const [newAd, setNewAd] = useState(BLANK_AD);
  const [formError, setFormError] = useState("");
  const [cleanupState, setCleanupState] = useState("idle"); // "idle" | "running" | "done"
  const [cleanupResult, setCleanupResult] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [videoUploadState, setVideoUploadState] = useState("idle"); // "idle" | "uploading" | "error"
  const [logoUploadState, setLogoUploadState] = useState("idle"); // "idle" | "uploading" | "error"
  const [adVideoSize, setAdVideoSize] = useState(null); // { w, h } natural video dimensions
  const [isPreview, setIsPreview] = useState(false);
  const [userStats, setUserStats] = useState(BLANK_STATS());
  const [allUserStats, setAllUserStats] = useState({}); // uid -> stats, for leaderboard

  const currentAdRef = useRef(null);
  const isAdminAdRef = useRef(false);
  const previewModeRef = useRef(false);
  const currentUserRef = useRef(null);
  const userLibraryRef = useRef([]);
  const intervalRef = useRef(null);
  const adDurationRef = useRef(5000);
  const adStartRef = useRef(null);
  const adVideoRef = useRef(null);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { userLibraryRef.current = userLibrary; }, [userLibrary]);

  // ── Firebase auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser ?? null);
      if (fbUser) {
        // Map Firebase user to app user shape, restoring saved credits
        const savedCredits = parseInt(localStorage.getItem(`sim_credits_${fbUser.uid}`) || "0", 10);
        const isGoogleAdmin = fbUser.uid === GOOGLE_ADMIN_UID;
        setCurrentUser({
          id: fbUser.uid,
          username: fbUser.displayName || fbUser.email?.split("@")[0] || "user",
          photoURL: fbUser.photoURL || null,
          credits: savedCredits,
          isGoogle: true,
          isGoogleAdmin,
          isAdmin: isGoogleAdmin, // start in admin view if admin account
        });
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mark storage ready ──
  useEffect(() => {
    setStorageReady(true);
  }, []);

  // ── Real-time admin ads listener (Firestore) ──
  const [adminAdsLoaded, setAdminAdsLoaded] = useState(false);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "adminAds"), snap => {
      setAdminAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAdminAdsLoaded(true);
    }, err => {
      console.error("adminAds read failed:", err.message);
    });
    return () => unsub();
  }, []);

  // ── Load user library + stats on login ──
  useEffect(() => {
    if (!currentUser || currentUser.isAdmin) { setUserLibrary([]); setUserStats(BLANK_STATS()); return; }
    const lib = localStorage.getItem(`sim_lib_${currentUser.id}`);
    setUserLibrary(lib ? JSON.parse(lib) : []);
    const st = localStorage.getItem(`sim_stats_${currentUser.id}`);
    setUserStats(st ? { ...BLANK_STATS(), ...JSON.parse(st) } : BLANK_STATS());
  }, [currentUser?.id, currentUser?.isAdmin]);

  // ── Persist user library ──
  useEffect(() => {
    if (!currentUser || currentUser.isAdmin || !storageReady) return;
    try { localStorage.setItem(`sim_lib_${currentUser.id}`, JSON.stringify(userLibrary)); } catch {}
  }, [userLibrary, currentUser, storageReady]);

  // ── Persist user stats + publish to Firestore leaderboard ──
  useEffect(() => {
    if (!currentUser || currentUser.isAdmin || !storageReady) return;
    try { localStorage.setItem(`sim_stats_${currentUser.id}`, JSON.stringify(userStats)); } catch {}
    setDoc(doc(db, "leaderboard", currentUser.id), {
      name: currentUser.username,
      photoURL: currentUser.photoURL || null,
      ...userStats,
    }).catch(() => {});
  }, [userStats, currentUser, storageReady]);

  // ── Real-time leaderboard listener (Firestore) ──
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "leaderboard"), snap => {
      const idx = {};
      snap.docs.forEach(d => { idx[d.id] = d.data(); });
      setAllUserStats(idx);
    });
    return () => unsub();
  }, []);

  // ── Rarity roll animation timing + tick sounds ──
  useEffect(() => {
    if (adState !== "rolling" || !rollTargetRarity) return;
    const rarityIndex = RARITIES.findIndex(r => r.key === rollTargetRarity.key);
    const segmentCenter = rarityIndex * 60 + 30;
    const landOffset = Math.random() * 30 - 15;
    const targetRotation = 5 * 360 + (360 - segmentCenter + landOffset);
    const SPIN_DURATION = 4000;
    const SPIN_DELAY = 80;

    // Solve cubic-bezier(0.17, 0.67, 0.08, 1) to map rotation progress → real time.
    // This is the same easing curve on .wheel-disc so ticks line up with the visual.
    const bY = t => 3*(1-t)*(1-t)*t*0.67 + 3*(1-t)*t*t*1 + t*t*t;
    const bX = t => 3*(1-t)*(1-t)*t*0.17 + 3*(1-t)*t*t*0.08 + t*t*t;
    const solveT = p => {
      let lo = 0, hi = 1;
      for (let i = 0; i < 26; i++) { const m = (lo+hi)/2; bY(m) < p ? lo = m : hi = m; }
      return (lo+hi)/2;
    };

    // Web Audio tick — noise burst through a bandpass filter
    let audioCtx;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    const playTick = (volume, pitch) => {
      if (!audioCtx) return;
      try {
        const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.04), audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++)
          d[i] = (Math.random()*2-1) * Math.exp(-i / (audioCtx.sampleRate * 0.004));
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = pitch;
        filter.Q.value = 3;
        const gain = audioCtx.createGain();
        gain.gain.value = volume;
        src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        src.start();
      } catch {}
    };

    // Schedule one tick per 60° zone crossing
    const timers = [];
    const numTicks = Math.floor(targetRotation / 60);
    for (let i = 1; i <= numTicks; i++) {
      const progress = Math.min((i * 60) / targetRotation, 0.9999);
      const t = solveT(progress);
      const tickTime = bX(t) * SPIN_DURATION + SPIN_DELAY;
      const speed = 1 - progress;           // 1 = fast, 0 = slow
      const pitch = 250 + speed * 900;      // high pitch fast, low pitch slow
      const volume = 0.12 + 0.45 * (1 - speed); // quiet fast, loud slow
      timers.push(setTimeout(() => playTick(volume, pitch), tickTime));
    }

    timers.push(setTimeout(() => setWheelRotation(targetRotation), SPIN_DELAY));
    timers.push(setTimeout(() => setRollLanded(true), 4300));
    timers.push(setTimeout(() => {
      const ad = currentAdRef.current;
      setCurrentAd(ad);
      setIsAdminAd(true);
      setCountdown(ad.videoUrl ? null : 5);
      adDurationRef.current = 5000;
      adStartRef.current = ad.videoUrl ? null : Date.now();
      setAdVideoSize(null);
      setIsPreview(false);
      setProgress(0);
      setAdState("running");
      setRollLanded(false);
      setWheelRotation(0);
    }, 5600));

    return () => {
      timers.forEach(clearTimeout);
      try { audioCtx?.close(); } catch {}
    };
  }, [adState, rollTargetRarity]);

  // ── Ad timer ──
  useEffect(() => {
    if (adState === "running") {
      intervalRef.current = setInterval(() => {
        if (!adStartRef.current) return; // waiting for video metadata
        const elapsed = Date.now() - adStartRef.current;
        const duration = adDurationRef.current;
        const p = Math.min((elapsed / duration) * 100, 100);
        setProgress(p);
        setCountdown(Math.max(0, Math.ceil((duration - elapsed) / 1000)));
        if (elapsed >= duration) {
          clearInterval(intervalRef.current);
          if (previewModeRef.current) {
            setAdState("idle");
            previewModeRef.current = false;
          } else {
            setAdState("complete");
            awardCredit();
          }
        }
      }, 50);
    }
    return () => clearInterval(intervalRef.current);
  }, [adState]);

  useEffect(() => {
    if (adVideoRef.current) adVideoRef.current.muted = isMuted;
  }, [isMuted]);

  const runAd = () => {
    if (adminAds.length === 0) return;
    let adminFlag = true;
    const roll = Math.random() * 100;
    let cumulative = 0;
    let rolledRarity = "common";
    for (const r of RARITIES) {
      cumulative += r.chance;
      if (roll < cumulative) { rolledRarity = r.key; break; }
    }
    const pool = adminAds.filter(a => (a.rarity || "common") === rolledRarity);
    const ad = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : adminAds[Math.floor(Math.random() * adminAds.length)];
    currentAdRef.current = ad;
    isAdminAdRef.current = adminFlag;
    setRollTargetRarity(RARITY_MAP[rolledRarity]);
    setWheelRotation(0);
    setRollLanded(false);
    setShowNewCollectOverlay(false);
    setAdState("rolling");
  };

  const awardCredit = () => {
    const ad = currentAdRef.current;
    const isAdmin = isAdminAdRef.current;
    const user = currentUserRef.current;
    const lib = userLibraryRef.current;

    const newCredits = user.credits + 1;
    setCurrentUser(prev => ({ ...prev, credits: newCredits }));
    try { localStorage.setItem(`sim_credits_${user.id}`, String(newCredits)); } catch {}
    setCreditBump(true);
    setTimeout(() => setCreditBump(false), 800);

    setHistory(prev => [{
      id: Date.now(),
      brand: ad?.brand,
      isAdmin,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }, ...prev.slice(0, 4)]);

    // update stats
    setUserStats(prev => {
      const rarity = (isAdmin && ad?.rarity) ? ad.rarity : null;
      return {
        lifetimeCredits: prev.lifetimeCredits + 1,
        rarityCount: rarity
          ? { ...prev.rarityCount, [rarity]: (prev.rarityCount[rarity] || 0) + 1 }
          : prev.rarityCount,
        adCount: (isAdmin && ad)
          ? { ...prev.adCount, [ad.id]: (prev.adCount[ad.id] || 0) + 1 }
          : prev.adCount,
      };
    });

    if (isAdmin && ad) {
      const isNew = !lib.some(item => item.id === ad.id);
      setUserLibrary(prev => [...prev, { id: ad.id }]); // store ID only; display resolves live from adminAds
      if (isNew) setShowNewCollectOverlay(true);
    }
  };

  const dismissComplete = () => {
    setAdState("idle");
    setCurrentAd(null);
    setShowNewCollectOverlay(false);
    setIsPreview(false);
  };


  const signOut = async () => {
    if (currentUser?.isGoogle) await firebaseSignOut(auth);
    setCurrentUser(null);
    setAdState("idle");
    setHistory([]);
    setUserLibrary([]);
    setView("earn");
    setAdminView("ads");
    clearInterval(intervalRef.current);
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged handles setting currentUser
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") console.error(err);
    }
  };

  const previewAd = (ad, adminFlag = false) => {
    previewModeRef.current = true;
    adDurationRef.current = ad.videoUrl ? 999999 : 5000;
    adStartRef.current = ad.videoUrl ? null : Date.now();
    currentAdRef.current = ad;
    isAdminAdRef.current = adminFlag;
    setCurrentAd(ad);
    setIsAdminAd(adminFlag);
    setIsPreview(true);
    setShowNewCollectOverlay(false);
    setProgress(0);
    setCountdown(ad.videoUrl ? null : null);
    setAdVideoSize(null);
    setAdState("running");
  };

  const closePreview = () => {
    previewModeRef.current = false;
    setIsPreview(false);
    setAdState("idle");
    clearInterval(intervalRef.current);
  };

  const createAdminAd = async () => {
    const { brand, tagline, cta } = newAd;
    if (!brand.trim() || !tagline.trim() || !cta.trim()) {
      setFormError("// brand, tagline, and CTA are required");
      return;
    }
    setFormError("");
    const id = Date.now().toString();
    const ad = {
      ...newAd,
      brand: brand.trim(),
      tagline: tagline.trim(),
      cta: cta.trim(),
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, "adminAds", id), ad);
    } catch (err) {
      setFormError(`// failed to save: ${err.message}`);
      return;
    }
    setNewAd(BLANK_AD);
    setVideoUploadState("idle");
    setAdminView("ads");
  };

  const saveAdminAdEdit = async () => {
    const { brand, tagline, cta } = newAd;
    if (!brand.trim() || !tagline.trim() || !cta.trim()) {
      setFormError("// brand, tagline, and CTA are required");
      return;
    }
    setFormError("");
    const existing = adminAds.find(a => a.id === editingAdId);
    try {
      await setDoc(doc(db, "adminAds", editingAdId), {
        ...existing,
        ...newAd,
        brand: brand.trim(),
        tagline: tagline.trim(),
        cta: cta.trim(),
      });
    } catch (err) {
      setFormError(`// failed to save: ${err.message}`);
      return;
    }
    setEditingAdId(null);
    setNewAd(BLANK_AD);
    setVideoUploadState("idle");
    setAdminView("ads");
  };

  const startEditAd = (ad) => {
    setEditingAdId(ad.id);
    setNewAd({ brand: ad.brand, tagline: ad.tagline, cta: ad.cta, ctaUrl: ad.ctaUrl || "", category: ad.category, color: ad.color, logo: ad.logo, logoUrl: ad.logoUrl || "", videoUrl: ad.videoUrl || "", rarity: ad.rarity || "common" });
    setEditingOriginalVideoUrl(ad.videoUrl || "");
    setEditingOriginalLogoUrl(ad.logoUrl || "");
    setFormError("");
    setVideoUploadState("idle");
    setLogoUploadState("idle");
    setAdminView("create");
  };

  const cleanupOrphanedVideos = async () => {
    setCleanupState("running");
    setCleanupResult(null);
    const keepUrls = adminAds.flatMap(a => [a.videoUrl, a.logoUrl]).filter(Boolean);
    try {
      const res = await fetch(`${WORKER_URL}/cleanup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cleanup failed");
      setCleanupResult(data.deleted);
    } catch (err) {
      setCleanupResult(`error: ${err.message}`);
    }
    setCleanupState("done");
  };

  const cleanupPendingVideo = async (videoUrl) => {
    if (videoUrl?.includes(".r2.dev/")) {
      try {
        await fetch(`${WORKER_URL}/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: videoUrl }),
        });
      } catch {}
    }
  };

  const deleteAdminAd = async (id) => {
    const ad = adminAds.find(a => a.id === id);
    for (const url of [ad?.videoUrl, ad?.logoUrl]) {
      if (url?.includes(".r2.dev/")) {
        try {
          await fetch(`${WORKER_URL}/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
        } catch {}
      }
    }
    await deleteDoc(doc(db, "adminAds", id));
    // onSnapshot updates adminAds state automatically
  };

  const uploadVideoToR2 = async (file) => {
    const MAX_BYTES = 200 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      const sizeMB = Math.round(file.size / 1024 / 1024);
      setVideoUploadState("error");
      setFormError(`// video is ${sizeMB} MB — max is 200 MB. Try a shorter clip or re-export at a lower bitrate (e.g. using HandBrake)`);
      return;
    }
    setVideoUploadState("uploading");
    setFormError("");
    setNewAd(p => ({ ...p, videoUrl: "" }));
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${WORKER_URL}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setNewAd(p => ({ ...p, videoUrl: data.url }));
      setVideoUploadState("idle");
    } catch (err) {
      setVideoUploadState("error");
      setFormError(`// upload failed: ${err.message}`);
    }
  };

  const uploadLogoToR2 = async (file) => {
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setLogoUploadState("error");
      setFormError("// logo image must be under 5 MB");
      return;
    }
    setLogoUploadState("uploading");
    setFormError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${WORKER_URL}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      // cleanup previous custom logo if switching
      if (newAd.logoUrl?.includes(".r2.dev/")) cleanupPendingVideo(newAd.logoUrl);
      setNewAd(p => ({ ...p, logoUrl: data.url }));
      setLogoUploadState("idle");
    } catch (err) {
      setLogoUploadState("error");
      setFormError(`// logo upload failed: ${err.message}`);
    }
  };

  if (!storageReady) {
    return (
      <>
        <style>{styles}</style>
        <div className="app">
          <div className="noise" />
          <div className="loading-screen">// INITIALIZING…</div>
        </div>
      </>
    );
  }

  // ── Render: Ad Banner helper ──
  const BannerBg = ({ color, opacity = 0.18 }) => (
    <div className="adm-banner-bg" style={{
      background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)`,
      opacity,
      position: "absolute", inset: 0,
    }} />
  );

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="noise" />

        {/* ── LANDING / AUTH ── */}
        {!currentUser ? (
          <div className="landing">
            <header className="landing-header">
              <div className="landing-logo">◉ Ad Simulator</div>
              <a href="/about.html" style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", fontWeight: 700, color: "#7e7e96", border: "1px solid #2a2a38", borderRadius: 999, padding: "0.35rem 1rem", textDecoration: "none" }}>About →</a>
            </header>

            <div className="landing-body">
              <div className="landing-eyebrow">// credits are worthless · this is not a disclaimer · it is a boast</div>
              <h1 className="landing-hero-title">Watch Ads.<br />Get <span>Nothing.</span><br />Do It Again.</h1>
              <p className="landing-hero-sub">
                Ad Simulator is a platform where you watch advertisements and receive credits. The credits cannot be spent, redeemed, or exchanged for anything. They are a number. The number goes up. Somehow, this is enough.
              </p>
              <button
                className="landing-signin-btn"
                onClick={signInWithGoogle}
                disabled={firebaseUser === undefined}
              >
                <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
                {firebaseUser === undefined ? "Loading…" : "Sign In with Google"}
              </button>

              <hr className="landing-divider" />

              <div className="landing-section-label">// how it works</div>
              <div className="landing-features">
                <div className="landing-feature">
                  <div className="landing-feature-icon">▶</div>
                  <h3>Press the Button</h3>
                  <p>There is one button. It says RUN AD. You press it. A wheel spins dramatically. An ad plays. This is the product.</p>
                </div>
                <div className="landing-feature">
                  <div className="landing-feature-icon">✦</div>
                  <h3>Receive a Number</h3>
                  <p>You earn one credit per ad watched. Credits are tracked, displayed, and leaderboarded. They cannot be spent on anything. This is stated upfront because it doesn't matter.</p>
                </div>
                <div className="landing-feature">
                  <div className="landing-feature-icon">◈</div>
                  <h3>Build Your Collection</h3>
                  <p>Every ad is saved to your personal library. You are, in effect, curating a catalogue of advertisements you watched for free. Multiple users have described this as satisfying.</p>
                </div>
                <div className="landing-feature">
                  <div className="landing-feature-icon">★</div>
                  <h3>Chase Rarity</h3>
                  <p>Six tiers. Common to Mythic. The Mythic drop rate is 0.0001%. You already know you're going to try for it. The internet prepared you for exactly this moment.</p>
                </div>
              </div>

              <div className="landing-section-label">// rarity tiers</div>
              <div className="landing-rarity-grid">
                {RARITIES.map(r => (
                  <div className="landing-rarity-card" key={r.key}>
                    <span className="landing-rarity-name" style={{ color: r.color }}>{r.label}</span>
                    <span className="landing-rarity-chance">{r.chance}%</span>
                  </div>
                ))}
              </div>

              <div className="landing-cta">
                <h2>Come Earn Some Credits.</h2>
                <p>They're free. They're worthless. There's a Mythic tier. You won't be able to help yourself.</p>
                <button
                  className="landing-signin-btn"
                  onClick={signInWithGoogle}
                  disabled={firebaseUser === undefined}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
                  {firebaseUser === undefined ? "Loading…" : "Get Started — It's Free"}
                </button>
              </div>
            </div>
          </div>

        ) : currentUser.isAdmin ? (
          /* ── ADMIN PANEL ── */
          <div className="main">
            <header className="header">
              <div className="header-logo" style={{ color: "#fbbc04" }}>◉ Admin Panel</div>
              <div className="header-right">
                <div className="credits-display">
                  <span className="credits-label">POOL</span>
                  <span className="credits-value">{adminAds.length} ADS</span>
                </div>
                <div className="profile-chip">
                  {currentUser.photoURL
                    ? <img src={currentUser.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                    : <div className="profile-avatar admin">AD</div>
                  }
                  <span className="profile-name">{currentUser.isGoogleAdmin ? currentUser.username : "@admin"}</span>
                </div>
                <button className={`mute-btn${isMuted ? "" : " unmuted"}`} onClick={() => setIsMuted(p => !p)} title={isMuted ? "Unmute" : "Mute"}>
                  {isMuted ? "🔇" : "🔊"}
                </button>
                {currentUser.isGoogleAdmin && (
                  <button className="logout-btn" onClick={() => setCurrentUser(p => ({ ...p, isAdmin: false }))} style={{ borderColor: "#4ade8044", color: "#4ade80" }}>
                    USER VIEW
                  </button>
                )}
                <button className="logout-btn" onClick={signOut}>SIGN OUT</button>
              </div>
            </header>

            <div className="tabs">
              <button
                className={`tab-btn admin-tab ${adminView === "ads" ? "active" : ""}`}
                onClick={() => { if (newAd.videoUrl !== editingOriginalVideoUrl) cleanupPendingVideo(newAd.videoUrl); setEditingOriginalVideoUrl(null); setAdminView("ads"); }}
              >
                Ad Library<span className="tab-count">({adminAds.length})</span>
              </button>
              <button
                className={`tab-btn admin-tab ${adminView === "create" ? "active" : ""}`}
                onClick={() => { if (newAd.videoUrl !== editingOriginalVideoUrl) cleanupPendingVideo(newAd.videoUrl); setEditingOriginalVideoUrl(null); setAdminView("create"); setFormError(""); setNewAd(BLANK_AD); setEditingAdId(null); }}
              >
                + Create Ad
              </button>
            </div>

            <div className="admin-content">
              {adminView === "ads" ? (
                adminAds.length === 0 ? (
                  <div className="admin-empty">
                    <div className="empty-icon">📭</div>
                    <div className="admin-empty-text">
                      // no admin ads yet<br />
                      // create one to start serving it<br />
                      // at a {Math.round(ADMIN_RATE * 100)}% rate to users
                    </div>
                    <button className="go-create-btn" onClick={() => setAdminView("create")}>
                      CREATE FIRST AD
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="section-header" style={{ marginBottom: "1.5rem" }}>
                      <span className="section-title">// all admin ads</span>
                      <span className="section-sub">served at {Math.round(ADMIN_RATE * 100)}% rate</span>
                    </div>
                    <div className="admin-ads-grid">
                      {adminAds.map(ad => {
                        const rar = RARITY_MAP[ad.rarity || "common"];
                        return (
                        <div key={ad.id} className="admin-ad-card" style={{ position: "relative", overflow: "visible", cursor: "pointer", ...getRarityStyle(ad.rarity || "common") }} onClick={() => previewAd(ad, true)}>
                          {rar.sparkle && <RaritySparkles color={rar.color} />}
                          <div style={{ borderRadius: "2px", overflow: "hidden", position: "relative", zIndex: 1 }}>
                            <div className="adm-banner" style={{ background: ad.color + "18" }}>
                              <BannerBg color={ad.color} opacity={0.22} />
                              {ad.logoUrl
                                ? <img src={ad.logoUrl} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", position: "relative", zIndex: 1 }} alt="" />
                                : <div className="adm-icon">{ad.logo}</div>
                              }
                              <div className="adm-brand">{ad.brand}</div>
                              <div className="adm-tagline">{ad.tagline}</div>
                            </div>
                            <div className="adm-footer">
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span className="rarity-badge" style={{ color: rar.color, background: rar.color + "18", border: `1px solid ${rar.color}33` }}>{rar.label}</span>
                                <span className="adm-cat">{ad.category}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {ad.videoUrl && <span className="video-badge">▶ VIDEO</span>}
                                <button className="delete-btn" style={{ borderColor: "#2a3a2a", color: "#4ade8066" }} onClick={e => { e.stopPropagation(); startEditAd(ad); }}>EDIT</button>
                                <button className="delete-btn" onClick={e => { e.stopPropagation(); deleteAdminAd(ad.id); }}>DELETE</button>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </>
                )
              ) : (
                /* Create Ad Form */
                <div className="form-wrap">
                  <div className="form-title">{editingAdId ? "Edit Ad" : "Create Admin Ad"}</div>
                  <div className="form-sub">{editingAdId ? "// changes will apply to the existing ad immediately" : `// this ad will enter the pool and serve at ${Math.round(ADMIN_RATE * 100)}% rate`}</div>

                  {/* Live Preview */}
                  <div className="preview-wrap">
                    <div className="preview-label">// live preview</div>
                    {newAd.videoUrl ? (
                      <video
                        className="preview-video"
                        src={newAd.videoUrl}
                        controls
                        muted={isMuted}
                        key={newAd.videoUrl}
                      />
                    ) : (
                      <div className="preview-banner" style={{ background: newAd.color + "18" }}>
                        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${newAd.color}, transparent 70%)`, opacity: 0.22 }} />
                        {newAd.logoUrl
                          ? <img src={newAd.logoUrl} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", position: "relative", zIndex: 1 }} alt="" />
                          : <div className="preview-icon">{newAd.logo}</div>
                        }
                        <div className="preview-brand">{newAd.brand || "Brand Name"}</div>
                        <div className="preview-tagline">{newAd.tagline || "Your tagline here"}</div>
                      </div>
                    )}
                    <div className="preview-footer">
                      <span className="adm-cat">{newAd.category}</span>
                      <span className="preview-cta" style={{ background: newAd.color }}>{newAd.cta || "CTA"}</span>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Brand Name</label>
                      <input className="form-input" placeholder="e.g. HyperBrand" value={newAd.brand} onChange={e => setNewAd(p => ({ ...p, brand: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CTA Text</label>
                      <input className="form-input" placeholder="e.g. Get Started" value={newAd.cta} onChange={e => setNewAd(p => ({ ...p, cta: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CTA Link URL <span style={{ color: "#5a5a72", fontWeight: 400 }}>(optional)</span></label>
                      <input className="form-input" placeholder="https://example.com" value={newAd.ctaUrl} onChange={e => setNewAd(p => ({ ...p, ctaUrl: e.target.value }))} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tagline</label>
                    <input className="form-input" placeholder="e.g. The future is already here." value={newAd.tagline} onChange={e => setNewAd(p => ({ ...p, tagline: e.target.value }))} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Video <span style={{ color: "#333", fontWeight: 400 }}>(optional — mp4/webm)</span></label>
                    <input
                      className="form-input"
                      placeholder="Paste URL — e.g. https://example.com/ad.mp4"
                      value={newAd.videoUrl}
                      onChange={e => { setVideoUploadState("idle"); setNewAd(p => ({ ...p, videoUrl: e.target.value })); }}
                      style={{ marginBottom: "0.5rem" }}
                      disabled={videoUploadState === "uploading"}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <label style={{ cursor: videoUploadState === "uploading" ? "not-allowed" : "pointer", background: "#181818", border: "1px solid #242424", borderRadius: "2px", padding: "0.5rem 1rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: videoUploadState === "uploading" ? "#444" : "#888", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                        {videoUploadState === "uploading" ? "UPLOADING…" : "↑ UPLOAD FILE"}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/*"
                          style={{ display: "none" }}
                          disabled={videoUploadState === "uploading"}
                          onChange={e => {
                            const file = e.target.files[0];
                            if (!file) return;
                            uploadVideoToR2(file);
                          }}
                        />
                      </label>
                      {videoUploadState === "idle" && newAd.videoUrl && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: "#4ade80" }}>✓ ready</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={newAd.category} onChange={e => setNewAd(p => ({ ...p, category: e.target.value }))}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rarity</label>
                    <div className="rarity-selector">
                      {RARITIES.map(r => (
                        <button
                          key={r.key}
                          className={`rarity-btn ${newAd.rarity === r.key ? "sel" : ""}`}
                          style={newAd.rarity === r.key ? { borderColor: r.color, color: r.color, background: r.color + "18" } : {}}
                          onClick={() => setNewAd(p => ({ ...p, rarity: r.key }))}
                        >
                          {r.label}
                          <span style={{ marginLeft: "0.35rem", fontFamily: "monospace", fontSize: "0.55rem", color: newAd.rarity === r.key ? r.color + "aa" : "#333" }}>
                            {r.chance}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <div className="color-swatches">
                      {PRESET_COLORS.map(c => (
                        <div
                          key={c}
                          className={`color-swatch ${newAd.color === c ? "sel" : ""}`}
                          style={{ background: c }}
                          onClick={() => setNewAd(p => ({ ...p, color: c }))}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Logo</label>
                    <div className="logo-upload-row">
                      <label className="logo-upload-btn">
                        {logoUploadState === "uploading" ? "Uploading…" : "↑ Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={e => { if (e.target.files[0]) uploadLogoToR2(e.target.files[0]); e.target.value = ""; }}
                        />
                      </label>
                      {newAd.logoUrl && (
                        <>
                          <img src={newAd.logoUrl} className="logo-upload-preview" alt="logo preview" />
                          <button
                            className="logo-upload-clear"
                            onClick={() => { if (newAd.logoUrl?.includes(".r2.dev/")) cleanupPendingVideo(newAd.logoUrl); setNewAd(p => ({ ...p, logoUrl: "" })); }}
                          >✕</button>
                        </>
                      )}
                    </div>
                    {!newAd.logoUrl && (
                      <>
                        <div className="logo-grid">
                          {PRESET_LOGOS.map(l => (
                            <button
                              key={l}
                              className={`logo-btn ${newAd.logo === l ? "sel" : ""}`}
                              onClick={() => setNewAd(p => ({ ...p, logo: l }))}
                            >{l}</button>
                          ))}
                        </div>
                        {(() => {
                          const prevLogos = [...new Set(adminAds.map(a => a.logoUrl).filter(Boolean))];
                          if (prevLogos.length === 0) return null;
                          return (
                            <div className="logo-prev-section">
                              <div className="logo-prev-label">// previously uploaded</div>
                              <div className="logo-prev-grid">
                                {prevLogos.map(url => (
                                  <img
                                    key={url}
                                    src={url}
                                    className="logo-prev-thumb"
                                    alt=""
                                    onClick={() => setNewAd(p => ({ ...p, logoUrl: url }))}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {formError && <div className="form-error">{formError}</div>}

                  <div className="form-actions">
                    <button className="btn-create" onClick={editingAdId ? saveAdminAdEdit : createAdminAd} disabled={videoUploadState === "uploading"} style={{ opacity: videoUploadState === "uploading" ? 0.5 : 1, cursor: videoUploadState === "uploading" ? "not-allowed" : "pointer" }}>{editingAdId ? "SAVE CHANGES" : "PUBLISH AD"}</button>
                    <button className="btn-cancel" onClick={() => { if (newAd.videoUrl !== editingOriginalVideoUrl) cleanupPendingVideo(newAd.videoUrl); if (newAd.logoUrl !== editingOriginalLogoUrl) cleanupPendingVideo(newAd.logoUrl); setEditingAdId(null); setEditingOriginalVideoUrl(null); setEditingOriginalLogoUrl(null); setAdminView("ads"); setFormError(""); setVideoUploadState("idle"); setLogoUploadState("idle"); setNewAd(BLANK_AD); }}>CANCEL</button>
                  </div>

                  <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #1a1a1a" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <button
                        className="btn-cancel"
                        onClick={() => { setCleanupResult(null); cleanupOrphanedVideos(); }}
                        disabled={cleanupState === "running" || !adminAdsLoaded}
                        style={{ opacity: (cleanupState === "running" || !adminAdsLoaded) ? 0.5 : 1, cursor: (cleanupState === "running" || !adminAdsLoaded) ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                      >
                        {cleanupState === "running" ? "SCANNING…" : "🗑 PURGE ORPHANED FILES"}
                      </button>
                      {cleanupResult !== null && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: typeof cleanupResult === "number" ? (cleanupResult > 0 ? "#4ade80" : "#555") : "#e63c3c" }}>
                          {typeof cleanupResult === "number"
                            ? cleanupResult > 0 ? `// ${cleanupResult} orphaned file${cleanupResult !== 1 ? "s" : ""} removed` : "// no orphaned files found"
                            : `// ${cleanupResult}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        ) : (
          /* ── USER MAIN ── */
          <div className="main">
            <header className="header">
              <a href="/about.html" className="header-logo" style={{ textDecoration: "none" }}>◉ Ad Simulator</a>
              <div className="header-right">
                <div className="credits-display">
                  <span className="credits-label">Credits</span>
                  <span className={`credits-value ${creditBump ? "bump" : ""}`}>{currentUser.credits}</span>
                </div>
                <div className="profile-chip">
                  {currentUser.photoURL
                    ? <img src={currentUser.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                    : <div className="profile-avatar">{currentUser.username.slice(0, 2).toUpperCase()}</div>
                  }
                  <span className="profile-name">{currentUser.isGoogle ? currentUser.username : `@${currentUser.username}`}</span>
                </div>
                <button className={`mute-btn${isMuted ? "" : " unmuted"}`} onClick={() => setIsMuted(p => !p)} title={isMuted ? "Unmute" : "Mute"}>
                  {isMuted ? "🔇" : "🔊"}
                </button>
                {currentUser.isGoogleAdmin && (
                  <button className="logout-btn" onClick={() => setCurrentUser(p => ({ ...p, isAdmin: true }))} style={{ borderColor: "#fbbc0444", color: "#fbbc04" }}>
                    ADMIN VIEW
                  </button>
                )}
                <button className="logout-btn" onClick={signOut}>SIGN OUT</button>
              </div>
            </header>

            <div className="tabs">
              <button className={`tab-btn ${view === "earn" ? "active" : ""}`} onClick={() => setView("earn")}>Earn Credits</button>
              <button className={`tab-btn ${view === "collection" ? "active" : ""}`} onClick={() => setView("collection")}>
                Collection<span className="tab-count">({[...new Set(userLibrary.map(a => a.id))].length})</span>
              </button>
              <button className={`tab-btn ${view === "account" ? "active" : ""}`} onClick={() => setView("account")}>My Account</button>
              <button className={`tab-btn ${view === "leaderboard" ? "active" : ""}`} onClick={() => setView("leaderboard")}>Leaderboard</button>
            </div>

            {view === "earn" ? (
              <>
                <div className="hero">
                  <div className="hero-label">// press to serve an ad impression</div>

                  <div className="run-btn-wrapper">
                    <div className="run-btn-ring" />
                    <div className="run-btn-ring run-btn-ring-2" />
                    <button className="run-btn" onClick={runAd} disabled={adState !== "idle" || adminAds.length === 0} style={{ opacity: adState !== "idle" ? 0.6 : 1 }}>
                      <span className="run-btn-text">RUN AD</span>
                      <span className="run-btn-sub">{adminAds.length === 0 ? "no ads available" : "earn 1 credit"}</span>
                    </button>
                  </div>

                  <div className="status-bar">
                    <div className={`status-dot ${adState === "running" ? "active" : adState === "idle" ? "" : "done"}`} />
                    {adState === "idle" && "ready — waiting for ad request"}
                    {adState === "running" && "serving ad impression…"}
                    {adState === "complete" && "impression complete"}
                  </div>

                  <div className="how-it-works">
                    <div className="hiw-title">How It Works</div>
                    <div className="hiw-steps">
                      <div className="hiw-step">
                        <div className="hiw-step-num">1</div>
                        <div className="hiw-step-text">Press <strong>RUN AD</strong>. An advertisement plays. You watch it to completion. This is, in its entirety, the core gameplay loop.</div>
                      </div>
                      <div className="hiw-step">
                        <div className="hiw-step-num">2</div>
                        <div className="hiw-step-text">Earn <strong>1 credit</strong> per ad watched. Credits accumulate across sessions and are permanently saved to your account. Credits cannot be spent, redeemed, or exchanged for anything of value. They are a number. The number goes up. This is sufficient.</div>
                      </div>
                      <div className="hiw-step">
                        <div className="hiw-step-num">3</div>
                        <div className="hiw-step-text">Each ad is assigned a <strong>rarity tier</strong>, rolled fresh on every impression. Common ads appear 90% of the time. Mythic ads appear 0.0001% of the time. When you land a rare ad, the screen celebrates. You have won nothing. It will feel like you have won something.</div>
                      </div>
                      <div className="hiw-step">
                        <div className="hiw-step-num">4</div>
                        <div className="hiw-step-text">Every ad you collect is saved to your <strong>Collection</strong> tab. First discoveries trigger a special overlay. Duplicate copies stack with a ×2, ×3 badge. You are, functionally, collecting advertisements. This was someone's idea and they were very pleased with it.</div>
                      </div>
                      <div className="hiw-step">
                        <div className="hiw-step-num">5</div>
                        <div className="hiw-step-text">The <strong>Leaderboard</strong> ranks all users globally by lifetime credits, total ads collected, unique ads found, and rarest tier reached. There is no prize for first place. There is only first place. Several people are competing for it right now.</div>
                      </div>
                    </div>
                    <div className="hiw-rarity-row">
                      {RARITIES.map(r => (
                        <span key={r.key} className="hiw-rarity-pip" style={{ color: r.color, borderColor: r.color + "44", background: r.color + "10" }}>
                          {r.label} {r.chance}%
                        </span>
                      ))}
                    </div>
                    <div className="hiw-disclaimer" style={{ marginTop: "0.5rem" }}>
                      // rarity odds are live — pulled directly from the same table the game uses.<br/>
                      // yes, mythic is really 0.0001%. yes, people are still trying for it.
                    </div>
                  </div>
                </div>

                {history.length > 0 && (
                  <div className="history">
                    <div className="history-title">// recent impressions</div>
                    <div className="history-list">
                      {history.map(h => (
                        <div key={h.id} className={`history-item ${h.isAdmin ? "h-admin" : ""}`}>
                          <span className="history-brand">{h.brand}</span>
                          {h.isAdmin && <span className="h-admin-tag">ADMIN</span>}
                          <span className="history-time">{h.time}</span>
                          <span className="history-credit">+1 CR</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : view === "collection" ? (
              /* Collection View */
              <div className="collection-view">
                <div className="section-header">
                  <span className="section-title">// your ad collection</span>
                  <span className="section-sub">{userLibrary.length} total · {[...new Set(userLibrary.map(a => a.id))].length} unique</span>
                </div>
                {userLibrary.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <div className="empty-text">No ads collected yet.<br />Run ads to discover admin ads in the pool.</div>
                  </div>
                ) : (
                  <div className="collection-grid">
                    {(() => {
                      const seen = {};
                      userLibrary.forEach(item => { seen[item.id] = (seen[item.id] || 0) + 1; });
                      const unique = userLibrary.filter((item, i, arr) => arr.findIndex(a => a.id === item.id) === i);
                      return unique.map(item => {
                        const ad = adminAds.find(a => a.id === item.id) || item;
                        if (!ad.brand) return null; // deleted ad with no stored snapshot
                        const rar = RARITY_MAP[ad.rarity || "common"];
                        const qty = seen[item.id] || 1;
                        return (
                          <div key={item.id} className="coll-card" style={{ position: "relative", overflow: "visible", cursor: "pointer", ...getRarityStyle(ad.rarity || "common") }} onClick={() => previewAd(ad, true)}>
                            {rar.sparkle && <RaritySparkles color={rar.color} />}
                            {qty > 1 && <div className="qty-badge">×{qty}</div>}
                            <div style={{ borderRadius: "2px", overflow: "hidden", position: "relative", zIndex: 1 }}>
                              <div className="coll-banner" style={{ background: ad.color + "18" }}>
                                <div className="coll-banner-bg" style={{ background: `radial-gradient(circle at 50% 50%, ${ad.color}, transparent 70%)`, opacity: 0.22, position: "absolute", inset: 0 }} />
                                {ad.logoUrl
                                  ? <img src={ad.logoUrl} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", position: "relative", zIndex: 1 }} alt="" />
                                  : <div className="coll-icon">{ad.logo}</div>
                                }
                                <div className="coll-brand">{ad.brand}</div>
                              </div>
                              <div className="coll-body">
                                <div className="coll-tagline">{ad.tagline}</div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <span className="coll-cat">{ad.category}</span>
                                  <span className="rarity-badge" style={{ color: rar.color, background: rar.color + "18", border: `1px solid ${rar.color}33` }}>{rar.label}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

            ) : view === "account" ? (
              /* My Account */
              <div className="account-view">
                <div className="account-section">
                  <div className="account-section-title">Overview</div>
                  <div className="stat-grid">
                    <div className="stat-card">
                      <div className="stat-card-value">{userStats.lifetimeCredits}</div>
                      <div className="stat-card-label">Lifetime Credits</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-value">{userLibrary.length}</div>
                      <div className="stat-card-label">Total Collected</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-value">{[...new Set(userLibrary.map(a => a.id))].length}</div>
                      <div className="stat-card-label">Unique Ads</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-value">{currentUser.credits}</div>
                      <div className="stat-card-label">Current Credits</div>
                    </div>
                  </div>
                </div>

                <div className="account-section">
                  <div className="account-section-title">Rarity Breakdown</div>
                  <div className="rarity-stat-row">
                    {RARITIES.map(r => {
                      const count = userStats.rarityCount[r.key] || 0;
                      const max = Math.max(...RARITIES.map(x => userStats.rarityCount[x.key] || 0), 1);
                      return (
                        <div key={r.key} className="rarity-stat-item" style={{ borderColor: count > 0 ? r.color + "33" : "#1e1e2c" }}>
                          <span className="rarity-stat-label" style={{ color: count > 0 ? r.color : "#55556a" }}>{r.label}</span>
                          <div className="rarity-stat-bar-wrap">
                            <div className="rarity-stat-bar" style={{ width: `${(count / max) * 100}%`, background: r.color }} />
                          </div>
                          <span className="rarity-stat-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {Object.keys(userStats.adCount).length > 0 && (
                  <div className="account-section">
                    <div className="account-section-title">Most Collected Ads</div>
                    <div className="rarity-stat-row">
                      {Object.entries(userStats.adCount)
                        .sort(([,a],[,b]) => b - a)
                        .slice(0, 5)
                        .map(([adId, count]) => {
                          const ad = adminAds.find(a => a.id === adId) || userLibrary.find(a => a.id === adId);
                          if (!ad) return null;
                          const rar = RARITY_MAP[ad.rarity || "common"];
                          return (
                            <div key={adId} className="rarity-stat-item">
                              {ad.logoUrl
                                ? <img src={ad.logoUrl} style={{ width: 24, height: 24, borderRadius: 4, objectFit: "cover" }} alt="" />
                                : <span style={{ fontSize: "1.2rem" }}>{ad.logo}</span>
                              }
                              <span className="rarity-stat-label">{ad.brand}</span>
                              <span className="rarity-badge" style={{ color: rar.color, background: rar.color + "18", border: `1px solid ${rar.color}33` }}>{rar.label}</span>
                              <span className="rarity-stat-count">×{count}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

            ) : view === "leaderboard" ? (
              <LeaderboardView
                entries={Object.entries(allUserStats).map(([uid, s]) => ({
                  uid, name: s.name || "?", photoURL: s.photoURL || null,
                  lifetimeCredits: s.lifetimeCredits || 0,
                  total: Object.values(s.adCount || {}).reduce((a, b) => a + b, 0),
                  unique: Object.keys(s.adCount || {}).length,
                  mythic: s.rarityCount?.mythic || 0,
                  legendary: s.rarityCount?.legendary || 0,
                }))}
                currentUserId={currentUser.id}
              />
            ) : null}
          </div>
        )}

        {/* ── RARITY ROLL WHEEL ── */}
        {adState === "rolling" && rollTargetRarity && (
          <div className="roll-backdrop" style={{ background: rollLanded ? `rgba(0,0,0,0.97)` : "rgba(0,0,0,0.97)" }}>
            <div className="roll-eyebrow">// rolling for rarity</div>
            <div className="wheel-scene">
              {/* Chase lights */}
              {Array.from({ length: 16 }, (_, i) => {
                const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
                const r = 166;
                return (
                  <div key={i} className="wheel-light" style={{
                    left: 150 + r * Math.cos(angle),
                    top:  150 + r * Math.sin(angle),
                    animationDelay: `${(i % 4) * 0.15}s`,
                    background: rollLanded ? rollTargetRarity.color : undefined,
                    boxShadow: rollLanded ? `0 0 8px ${rollTargetRarity.color}, 0 0 16px ${rollTargetRarity.color}` : undefined,
                  }} />
                );
              })}
              {/* Pointer */}
              <div className="wheel-pointer-wrap"><div className="wheel-ptr" /></div>
              {/* Wheel */}
              <div className="wheel-frame">
                <div className="wheel-disc" style={{ transform: `rotate(${wheelRotation}deg)` }} />
                <div className="wheel-vignette" />
                <div className="wheel-hub" style={{ borderColor: rollLanded ? rollTargetRarity.color + "88" : "#333", boxShadow: rollLanded ? `0 0 24px ${rollTargetRarity.color}55` : "0 0 24px rgba(0,0,0,0.9)" }}>
                  {rollLanded ? <span style={{ fontSize: "1.4rem" }}>{["⬡","◈","✦","❋","★","✸"][RARITIES.findIndex(r => r.key === rollTargetRarity.key)]}</span> : "?"}
                </div>
              </div>
            </div>
            {/* Status */}
            <div className="roll-status">
              {rollLanded ? (
                <>
                  <RaritySparkles color={rollTargetRarity.color} large />
                  <div className="roll-landed-name" style={{ color: rollTargetRarity.color, textShadow: `0 0 40px ${rollTargetRarity.color}88` }}>
                    {rollTargetRarity.label}
                  </div>
                  <div className="roll-landed-sub">// rarity confirmed — loading ad</div>
                </>
              ) : (
                <div className="roll-spinning-text">S P I N N I N G . . .</div>
              )}
            </div>
            {/* Legend */}
            <div className="roll-legend">
              {RARITIES.map(r => (
                <span key={r.key} className="roll-legend-pip" style={{ color: r.color, borderColor: r.color + "55", background: r.color + "12", opacity: rollLanded ? (r.key === rollTargetRarity.key ? 1 : 0.3) : 0.7 }}>
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── AD MODAL (running) ── */}
        {adState === "running" && currentAd && (
          <div className="modal-backdrop">
            {(() => {
              const rar = isAdminAd ? (RARITY_MAP[currentAd.rarity || "common"]) : null;
              return (
            <div className={`ad-card ${isAdminAd ? "is-admin" : ""}`} style={{ ...(rar ? getRarityStyle(rar.key) : {}), ...(adVideoSize?.w && adVideoSize?.h ? { maxWidth: Math.round(Math.min(Math.max(window.innerHeight * 0.65 * (adVideoSize.w / adVideoSize.h), 300), window.innerWidth * 0.92, 640)) } : {}) }}>
              {rar?.sparkle && <RaritySparkles color={rar.color} large />}
              <div className={`ad-tag ${isAdminAd ? "admin" : ""}`} style={rar && rar.key !== "common" ? { color: rar.color, borderColor: rar.color + "44" } : {}}>
                {isAdminAd ? rar.label.toUpperCase() + " AD" : "ADVERTISEMENT"}
              </div>
              {currentAd.videoUrl ? (
                <video
                  ref={adVideoRef}
                  className="ad-video"
                  src={currentAd.videoUrl}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  key={currentAd.videoUrl}
                  onLoadedMetadata={e => {
                    adDurationRef.current = e.target.duration * 1000;
                    adStartRef.current = Date.now();
                    setCountdown(Math.ceil(e.target.duration));
                    setAdVideoSize({ w: e.target.videoWidth, h: e.target.videoHeight });
                  }}
                  onError={() => {
                    // If video fails to load, fall back to a 5-second timer so the ad doesn't hang
                    if (!adStartRef.current) {
                      adDurationRef.current = 5000;
                      adStartRef.current = Date.now();
                      setCountdown(5);
                    }
                  }}
                />
              ) : (
                <div className="ad-banner" style={{ background: currentAd.color + "18" }}>
                  <div className="ad-banner-bg" style={{ background: `radial-gradient(circle at 50% 50%, ${currentAd.color}, transparent 70%)`, opacity: 0.25, position: "absolute", inset: 0 }} />
                  {currentAd.logoUrl
                    ? <img src={currentAd.logoUrl} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", position: "relative", zIndex: 1 }} alt="" />
                    : <div className="ad-banner-icon">{currentAd.logo}</div>
                  }
                  <div className="ad-banner-brand">{currentAd.brand}</div>
                  <div className="ad-banner-tagline">{currentAd.tagline}</div>
                </div>
              )}
              <div className="ad-body">
                <div className="ad-category">{currentAd.category}</div>
                <div className="ad-cta-row">
                  {currentAd.ctaUrl
                    ? <a href={currentAd.ctaUrl} target="_blank" rel="noopener noreferrer" className="ad-cta clickable" style={{ background: currentAd.color }}>{currentAd.cta}</a>
                    : <span className="ad-cta" style={{ background: currentAd.color }}>{currentAd.cta}</span>
                  }
                  {currentAd.videoUrl && (
                    <button className={`mute-btn${isMuted ? "" : " unmuted"}`} onClick={() => setIsMuted(p => !p)} title={isMuted ? "Unmute" : "Mute"}>
                      {isMuted ? "🔇" : "🔊"}
                    </button>
                  )}
                  {isAdminAd && !userLibrary.some(i => i.id === currentAd.id) && (
                    <span className="new-collect-badge">✦ NEW</span>
                  )}
                </div>
                {isPreview ? (
                  <button className="preview-close-btn" onClick={closePreview}>✕ Close Preview</button>
                ) : (
                  <div className="ad-progress-wrapper">
                    <div className="ad-progress-label">
                      <span className="ad-progress-text">AD PLAYING</span>
                      <span className="ad-progress-countdown">{countdown !== null ? `${countdown}s remaining` : "loading…"}</span>
                    </div>
                    <div className="ad-progress-track">
                      <div className="ad-progress-fill" style={{ width: `${progress}%`, background: currentAd.color }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
              );
            })()}
          </div>
        )}

        {/* ── NEW COLLECT OVERLAY ── */}
        {/* ── COMPLETE MODAL ── */}
        {adState === "complete" && (
          <div className="modal-backdrop">
            {showNewCollectOverlay && currentAd ? (() => {
              const rar = RARITY_MAP[currentAd.rarity || "common"];
              const emojis = { common: "🎉", uncommon: "🌟", rare: "💎", epic: "✨", legendary: "🏆", mythic: "🔥" };
              return (
                <div className="new-collect-card" style={{ border: `2px solid ${rar.color}66`, boxShadow: `0 0 60px ${rar.color}33, 0 32px 80px rgba(0,0,0,0.6)` }}>
                  <RaritySparkles color={rar.color} large />
                  <span className="new-collect-burst">{emojis[rar.key]}</span>
                  <div className="new-collect-eyebrow">New to your collection!</div>
                  <div className="new-collect-rarity" style={{ "--rar-color": rar.color }}>{rar.label}</div>
                  <div className="new-collect-brand">{currentAd.brand}</div>
                  <div className="complete-credit" style={{ marginTop: "1rem", marginBottom: "1.25rem" }}>+1 CR</div>
                  <button
                    className="new-collect-dismiss"
                    style={{ "--rar-color": rar.color, "--rar-color-dim": rar.color + "99" }}
                    onClick={dismissComplete}
                  >
                    Awesome! ✦
                  </button>
                </div>
              );
            })() : (
              <div className="complete-modal">
                <div className="complete-icon">✦</div>
                <h2 className="complete-title">Credit Earned</h2>
                {isAdminAd && (() => { const rar = RARITY_MAP[currentAd?.rarity || "common"]; return <span className="rarity-badge" style={{ color: rar.color, background: rar.color + "18", border: `1px solid ${rar.color}33`, marginBottom: "0.75rem" }}>{rar.label}</span>; })()}
                <p className="complete-sub">
                  Ad impression from {currentAd?.brand}<br />
                  was served successfully.
                </p>
                <div className="complete-credit">+1 CR</div>
                <button className="btn-primary" onClick={dismissComplete}>RUN ANOTHER AD</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
