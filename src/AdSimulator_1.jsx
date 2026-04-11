import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD1mep5O4eztVl3XsWNknr4-SuWlHB8Sio",
  authDomain: "ad-simulator-webapp.firebaseapp.com",
  projectId: "ad-simulator-webapp",
  storageBucket: "ad-simulator-webapp.firebasestorage.app",
  messagingSenderId: "329421712510",
  appId: "1:329421712510:web:7f640771ff2d5e276cfc2f",
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const DEBUG = true; // set to false to hide debug accounts in production

const ADMIN_RATE = 0.30;

const MOCK_ADS = [
  { brand: "NovaTech", tagline: "The Future of Cloud Infrastructure", cta: "Start Free Trial", color: "#1a73e8", logo: "⚡", category: "Technology" },
  { brand: "GreenLeaf Co.", tagline: "Sustainable Products for Modern Living", cta: "Shop Now", color: "#34a853", logo: "🌿", category: "Lifestyle" },
  { brand: "ArcadeMind", tagline: "Play. Earn. Dominate.", cta: "Download Free", color: "#ea4335", logo: "🎮", category: "Gaming" },
  { brand: "PulseFinance", tagline: "Your Money, Smarter Every Day", cta: "Open Account", color: "#fbbc04", logo: "💰", category: "Finance" },
];

const DEFAULT_USERS = [
  { id: "1", username: "alex_dev", credits: 12 },
  { id: "2", username: "maya_r", credits: 5 },
  { id: "3", username: "jpreston", credits: 31 },
];

const ADMIN_USER = { id: "admin", username: "admin", isAdmin: true, credits: 0 };
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

const BLANK_AD = { brand: "", tagline: "", cta: "", category: "Technology", color: "#e63c3c", logo: "⚡", videoUrl: "", rarity: "common" };

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #f0ede8; font-family: 'Syne', sans-serif; min-height: 100vh; }
  .app { min-height: 100vh; background: #0a0a0a; position: relative; overflow: hidden; }
  .noise { position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 0; }

  /* ── AUTH ── */
  .auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; z-index: 1; }
  .auth-card { background: #111; border: 1px solid #222; border-radius: 2px; padding: 3rem 3.5rem; width: 100%; max-width: 420px; position: relative; }
  .auth-card::before { content: ''; position: absolute; top: -1px; left: -1px; right: -1px; height: 3px; background: #e63c3c; border-radius: 2px 2px 0 0; }
  .auth-logo { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.2em; color: #e63c3c; text-transform: uppercase; margin-bottom: 2.5rem; }
  .auth-title { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 0.5rem; }
  .auth-sub { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #555; margin-bottom: 2.5rem; }
  .btn-google { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; background: #fff; color: #111; border: none; border-radius: 2px; padding: 0.85rem 1rem; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: background 0.15s; margin-bottom: 1.5rem; }
  .btn-google:hover { background: #f0f0f0; }
  .btn-google svg { flex-shrink: 0; }
  .user-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
  .user-btn { display: flex; align-items: center; gap: 1rem; background: #181818; border: 1px solid #242424; border-radius: 2px; padding: 0.9rem 1rem; cursor: pointer; transition: all 0.15s; text-align: left; width: 100%; color: #f0ede8; font-family: 'Syne', sans-serif; }
  .user-btn:hover { border-color: #e63c3c; background: #1a1212; }
  .user-btn.admin-btn:hover { border-color: #fbbc04; background: #1a1800; }
  .user-avatar { width: 36px; height: 36px; background: #222; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; color: #e63c3c; flex-shrink: 0; }
  .user-avatar.admin-av { color: #fbbc04; background: #1a1800; border: 1px solid #fbbc0444; }
  .user-name { font-weight: 700; font-size: 0.95rem; letter-spacing: -0.01em; }
  .user-credits-badge { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #555; letter-spacing: 0.05em; }
  .admin-badge { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; color: #fbbc04; letter-spacing: 0.1em; border: 1px solid #fbbc0444; padding: 0.2rem 0.5rem; border-radius: 2px; }
  .auth-divider { border: none; border-top: 1px solid #1e1e1e; margin: 2rem 0 1.5rem; }
  .new-user-form { display: flex; gap: 0.5rem; }
  .input { flex: 1; background: #181818; border: 1px solid #242424; border-radius: 2px; padding: 0.75rem 1rem; color: #f0ede8; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; outline: none; transition: border-color 0.15s; }
  .input::placeholder { color: #383838; }
  .input:focus { border-color: #e63c3c; }
  .btn-sm { background: #e63c3c; color: #fff; border: none; border-radius: 2px; padding: 0.75rem 1.2rem; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.05em; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .btn-sm:hover { background: #cc2e2e; }

  /* ── LAYOUT ── */
  .main { min-height: 100vh; display: flex; flex-direction: column; position: relative; z-index: 1; }
  .header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 2.5rem; border-bottom: 1px solid #1a1a1a; flex-shrink: 0; }
  .header-logo { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.2em; color: #e63c3c; text-transform: uppercase; }
  .header-right { display: flex; align-items: center; gap: 1.5rem; }
  .credits-display { display: flex; align-items: center; gap: 0.5rem; background: #111; border: 1px solid #1e1e1e; border-radius: 2px; padding: 0.5rem 1rem; }
  .credits-label { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: #444; text-transform: uppercase; letter-spacing: 0.1em; }
  .credits-value { font-family: 'JetBrains Mono', monospace; font-size: 1rem; font-weight: 600; color: #f0ede8; transition: all 0.3s; }
  .credits-value.bump { color: #4ade80; transform: scale(1.3); }
  .profile-chip { display: flex; align-items: center; gap: 0.6rem; cursor: default; padding: 0.4rem 0.8rem; border-radius: 2px; }
  .profile-avatar { width: 30px; height: 30px; background: #1e1010; border: 1px solid #e63c3c33; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; color: #e63c3c; }
  .profile-avatar.admin { background: #1a1800; border-color: #fbbc0444; color: #fbbc04; }
  .profile-name { font-weight: 700; font-size: 0.85rem; }
  .logout-btn { background: none; border: 1px solid #222; border-radius: 2px; color: #444; padding: 0.4rem 0.75rem; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.1em; cursor: pointer; transition: all 0.15s; }
  .logout-btn:hover { border-color: #e63c3c; color: #e63c3c; }

  /* ── TABS ── */
  .tabs { display: flex; border-bottom: 1px solid #1a1a1a; padding: 0 2.5rem; flex-shrink: 0; }
  .tab-btn { background: none; border: none; border-bottom: 2px solid transparent; color: #444; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; letter-spacing: 0.15em; text-transform: uppercase; padding: 0.85rem 1.5rem; cursor: pointer; transition: all 0.15s; margin-bottom: -1px; }
  .tab-btn:hover { color: #888; }
  .tab-btn.active { color: #e63c3c; border-bottom-color: #e63c3c; }
  .tab-btn.admin-tab.active { color: #fbbc04; border-bottom-color: #fbbc04; }
  .tab-count { font-size: 0.6rem; opacity: 0.7; margin-left: 0.4rem; }

  /* ── HERO / EARN ── */
  .hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3rem; padding: 3rem; }
  .hero-label { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.3em; color: #333; text-transform: uppercase; text-align: center; }
  .run-btn-wrapper { position: relative; display: flex; align-items: center; justify-content: center; }
  .run-btn-ring { position: absolute; width: 240px; height: 240px; border-radius: 50%; border: 1px solid #e63c3c22; animation: ringPulse 2.5s ease-in-out infinite; }
  .run-btn-ring-2 { width: 280px; height: 280px; animation-delay: 0.5s; border-color: #e63c3c11; }
  @keyframes ringPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.5; } }
  .run-btn { width: 200px; height: 200px; border-radius: 50%; background: #e63c3c; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2rem; position: relative; transition: transform 0.1s, box-shadow 0.2s; box-shadow: 0 0 60px #e63c3c33, 0 0 120px #e63c3c11; }
  .run-btn::after { content: ''; position: absolute; inset: 6px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15); pointer-events: none; }
  .run-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 0 80px #e63c3c55, 0 0 160px #e63c3c22; }
  .run-btn:active:not(:disabled) { transform: scale(0.97); }
  .run-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .run-btn-text { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.12em; color: #fff; text-shadow: 0 1px 8px rgba(0,0,0,0.3); }
  .run-btn-sub { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; color: rgba(255,255,255,0.5); letter-spacing: 0.15em; text-transform: uppercase; }
  .status-bar { display: flex; align-items: center; gap: 0.75rem; font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #333; letter-spacing: 0.05em; min-height: 1.5rem; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #333; flex-shrink: 0; }
  .status-dot.active { background: #4ade80; box-shadow: 0 0 8px #4ade80aa; animation: blink 1s ease-in-out infinite; }
  .status-dot.done { background: #e63c3c; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

  /* ── HISTORY ── */
  .history { padding: 0 2.5rem 2.5rem; max-width: 560px; margin: 0 auto; width: 100%; }
  .history-title { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.2em; color: #333; text-transform: uppercase; margin-bottom: 1rem; }
  .history-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .history-item { display: flex; align-items: center; gap: 1rem; padding: 0.6rem 0.8rem; background: #0d0d0d; border: 1px solid #161616; border-radius: 2px; animation: slideIn 0.3s ease; }
  .history-item.h-admin { border-color: #fbbc0422; }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  .history-brand { font-size: 0.8rem; font-weight: 700; flex: 1; }
  .h-admin-tag { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; color: #fbbc04; border: 1px solid #fbbc0444; padding: 0.1rem 0.4rem; border-radius: 2px; }
  .history-time { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: #333; }
  .history-credit { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #4ade80; font-weight: 600; }

  /* ── COLLECTION ── */
  .collection-view { flex: 1; padding: 2rem 2.5rem; overflow-y: auto; }
  .section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1.5rem; }
  .section-title { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.2em; color: #333; text-transform: uppercase; }
  .section-sub { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; color: #2a2a2a; }
  .collection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 1rem; }
  .coll-card { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 2px; overflow: hidden; transition: border-color 0.15s, transform 0.15s; }
  .coll-card:hover { border-color: #2a2a2a; transform: translateY(-2px); }
  .coll-banner { height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2rem; position: relative; overflow: hidden; }
  .coll-banner-bg { position: absolute; inset: 0; }
  .coll-icon { font-size: 1.5rem; position: relative; z-index: 1; }
  .coll-brand { font-size: 0.9rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; position: relative; z-index: 1; }
  .coll-body { padding: 0.75rem; }
  .coll-tagline { font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: #444; margin-bottom: 0.5rem; line-height: 1.4; }
  .coll-cat { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; color: #2d2d2d; letter-spacing: 0.1em; text-transform: uppercase; }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 5rem 2rem; text-align: center; }
  .empty-icon { font-size: 2.5rem; opacity: 0.15; }
  .empty-text { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #2d2d2d; letter-spacing: 0.08em; line-height: 1.8; }

  /* ── ADMIN PANEL ── */
  .admin-content { flex: 1; padding: 2rem 2.5rem; overflow-y: auto; }
  .admin-ads-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
  .admin-ad-card { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 2px; overflow: hidden; transition: border-color 0.15s; }
  .admin-ad-card:hover { border-color: #fbbc0422; }
  .adm-banner { height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; position: relative; overflow: hidden; }
  .adm-banner-bg { position: absolute; inset: 0; }
  .adm-icon { font-size: 2rem; position: relative; z-index: 1; }
  .adm-brand { font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; position: relative; z-index: 1; }
  .adm-tagline { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; color: rgba(255,255,255,0.5); position: relative; z-index: 1; padding: 0 0.75rem; text-align: center; }
  .adm-footer { padding: 0.75rem; display: flex; align-items: center; justify-content: space-between; }
  .adm-cat { font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: #444; letter-spacing: 0.08em; text-transform: uppercase; }
  .delete-btn { background: none; border: 1px solid #1e1e1e; border-radius: 2px; color: #383838; font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; padding: 0.25rem 0.5rem; cursor: pointer; transition: all 0.15s; }
  .delete-btn:hover { border-color: #e63c3c; color: #e63c3c; }
  .admin-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 5rem 2rem; text-align: center; }
  .admin-empty-text { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #2d2d2d; letter-spacing: 0.1em; line-height: 1.8; }
  .go-create-btn { background: #fbbc04; color: #0a0a0a; border: none; border-radius: 2px; padding: 0.6rem 1.4rem; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: background 0.15s; }
  .go-create-btn:hover { background: #f0aa00; }

  /* ── CREATE FORM ── */
  .form-wrap { max-width: 640px; }
  .form-title { font-size: 1.3rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.25rem; }
  .form-sub { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #444; margin-bottom: 2rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-group { margin-bottom: 1.25rem; }
  .form-label { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; letter-spacing: 0.12em; color: #555; text-transform: uppercase; display: block; margin-bottom: 0.5rem; }
  .form-input { width: 100%; background: #181818; border: 1px solid #242424; border-radius: 2px; padding: 0.75rem 1rem; color: #f0ede8; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; outline: none; transition: border-color 0.15s; }
  .form-input::placeholder { color: #303030; }
  .form-input:focus { border-color: #fbbc04; }
  .form-select { width: 100%; background: #181818; border: 1px solid #242424; border-radius: 2px; padding: 0.75rem 1rem; color: #f0ede8; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; outline: none; cursor: pointer; transition: border-color 0.15s; }
  .form-select:focus { border-color: #fbbc04; }
  .color-swatches { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .color-swatch { width: 30px; height: 30px; border-radius: 2px; cursor: pointer; border: 2px solid transparent; transition: all 0.12s; flex-shrink: 0; }
  .color-swatch.sel { border-color: #fff; transform: scale(1.2); }
  .logo-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 0.35rem; }
  .logo-btn { background: #181818; border: 1px solid #1e1e1e; border-radius: 2px; padding: 0.3rem; font-size: 1rem; cursor: pointer; transition: all 0.1s; text-align: center; }
  .logo-btn:hover { border-color: #333; }
  .logo-btn.sel { border-color: #fbbc04; background: #1a1800; }
  .form-error { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #e63c3c; margin-bottom: 1rem; }
  .form-actions { display: flex; gap: 0.75rem; margin-top: 2rem; }
  .btn-create { background: #fbbc04; color: #0a0a0a; border: none; border-radius: 2px; padding: 0.85rem 2rem; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.05em; cursor: pointer; transition: background 0.15s; }
  .btn-create:hover { background: #f0aa00; }
  .btn-cancel { background: none; border: 1px solid #222; color: #555; border-radius: 2px; padding: 0.85rem 1.5rem; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.15s; }
  .btn-cancel:hover { border-color: #444; color: #888; }

  /* ── AD PREVIEW (in form) ── */
  .preview-wrap { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 2px; overflow: hidden; margin-bottom: 2rem; }
  .preview-label { font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: #2d2d2d; letter-spacing: 0.15em; text-transform: uppercase; padding: 0.6rem 1rem; border-bottom: 1px solid #1a1a1a; }
  .preview-banner { height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; position: relative; overflow: hidden; }
  .preview-banner-bg { position: absolute; inset: 0; }
  .preview-icon { font-size: 2rem; position: relative; z-index: 1; }
  .preview-brand { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.02em; color: #fff; position: relative; z-index: 1; }
  .preview-tagline { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: rgba(255,255,255,0.45); position: relative; z-index: 1; }
  .preview-footer { padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; }
  .preview-cta { font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.9rem; border-radius: 2px; color: #fff; }

  /* ── AD VIDEO ── */
  .ad-video { width: 100%; height: auto; display: block; max-height: 65vh; object-fit: contain; background: #000; }
  .video-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; color: #4ade80; border: 1px solid #4ade8044; padding: 0.15rem 0.4rem; border-radius: 2px; letter-spacing: 0.08em; }
  .preview-video { width: 100%; max-height: 140px; object-fit: cover; background: #000; display: block; }

  /* ── AD MODAL ── */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.2s ease; padding: 1rem; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .ad-card { background: #111; border: 1px solid #222; border-radius: 2px; width: 100%; max-width: 460px; overflow: hidden; animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; transition: max-width 0.2s ease; }
  .ad-card.is-admin { border-color: #fbbc0444; }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  .ad-tag { position: absolute; top: 0.75rem; right: 0.75rem; font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; letter-spacing: 0.1em; color: #555; border: 1px solid #2a2a2a; padding: 0.2rem 0.5rem; border-radius: 2px; }
  .ad-tag.admin { color: #fbbc04; border-color: #fbbc0444; }
  .ad-banner { height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; position: relative; overflow: hidden; }
  .ad-banner-icon { font-size: 3rem; position: relative; z-index: 1; }
  .ad-banner-brand { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; position: relative; z-index: 1; color: #fff; }
  .ad-banner-tagline { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: rgba(255,255,255,0.6); position: relative; z-index: 1; text-align: center; padding: 0 1rem; }
  .ad-banner-bg { position: absolute; inset: 0; }
  .ad-body { padding: 1.5rem; }
  .ad-category { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; letter-spacing: 0.15em; color: #444; text-transform: uppercase; margin-bottom: 0.75rem; }
  .ad-cta-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
  .ad-cta { display: inline-block; padding: 0.6rem 1.2rem; border-radius: 2px; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.05em; color: #fff; }
  .new-collect-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; color: #fbbc04; border: 1px solid #fbbc0444; padding: 0.2rem 0.5rem; border-radius: 2px; animation: glow 1s ease-in-out infinite; }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 4px #fbbc0444; } 50% { box-shadow: 0 0 12px #fbbc0488; } }
  .ad-progress-wrapper {}
  .ad-progress-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .ad-progress-text { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: #444; letter-spacing: 0.08em; }
  .ad-progress-countdown { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; color: #555; }
  .ad-progress-track { height: 3px; background: #1e1e1e; border-radius: 2px; overflow: hidden; }
  .ad-progress-fill { height: 100%; border-radius: 2px; transition: width 0.1s linear; }

  /* ── COMPLETE ── */
  .complete-modal { background: #111; border: 1px solid #222; border-radius: 2px; padding: 3rem; text-align: center; max-width: 340px; width: 100%; animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .complete-icon { font-size: 3rem; margin-bottom: 1rem; }
  .complete-title { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.5rem; }
  .complete-sub { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #444; margin-bottom: 1rem; line-height: 1.6; }
  .complete-collect-note { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: #fbbc04; margin-bottom: 1.5rem; border: 1px solid #fbbc0422; border-radius: 2px; padding: 0.5rem 0.75rem; }
  .complete-credit { font-family: 'JetBrains Mono', monospace; font-size: 2.5rem; font-weight: 600; color: #4ade80; margin-bottom: 1.5rem; }
  .btn-primary { background: #e63c3c; color: #fff; border: none; border-radius: 2px; padding: 0.85rem 2rem; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.08em; cursor: pointer; transition: background 0.15s; width: 100%; }
  .btn-primary:hover { background: #cc2e2e; }

  /* ── SIDEBAR ── */
  .page-with-sidebar { display: flex; min-height: 100vh; }
  .ad-sidebar { width: 180px; flex-shrink: 0; background: #0a0a0a; display: flex; flex-direction: column; align-items: center; padding: 5rem 0.75rem 1rem; gap: 1rem; position: sticky; top: 0; height: 100vh; overflow: hidden; }
  .ad-sidebar-label { font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; color: #2a2a2a; letter-spacing: 0.15em; text-transform: uppercase; }
  .main { flex: 1; min-width: 0; min-height: 100vh; display: flex; flex-direction: column; }
  @media (max-width: 900px) { .ad-sidebar { display: none; } }

  /* ── RARITY ── */
  @keyframes glow-uncommon  { 0%,100% { box-shadow: 0 0 4px #4ade8033, 0 0 8px #4ade8022;  border-color: #4ade8044; } 50% { box-shadow: 0 0 8px #4ade8055,  0 0 16px #4ade8033;  border-color: #4ade8077; } }
  @keyframes glow-rare      { 0%,100% { box-shadow: 0 0 4px #60a5fa33, 0 0 8px #60a5fa22;  border-color: #60a5fa44; } 50% { box-shadow: 0 0 8px #60a5fa55,  0 0 16px #60a5fa33;  border-color: #60a5fa77; } }
  @keyframes glow-epic      { 0%,100% { box-shadow: 0 0 8px #a855f766, 0 0 16px #a855f744, 0 0 32px #a855f722;  border-color: #a855f799; } 50% { box-shadow: 0 0 14px #a855f799, 0 0 28px #a855f755, 0 0 50px #a855f733;  border-color: #a855f7cc; } }
  @keyframes glow-legendary { 0%,100% { box-shadow: 0 0 12px #fbbc0477, 0 0 24px #fbbc0444, 0 0 48px #fbbc0422;  border-color: #fbbc0499; } 50% { box-shadow: 0 0 20px #fbbc04aa, 0 0 40px #fbbc0466, 0 0 70px #fbbc0433;  border-color: #fbbc04cc; } }
  @keyframes glow-mythic    { 0%,100% { box-shadow: 0 0 16px #e63c3c88, 0 0 32px #e63c3c55, 0 0 64px #e63c3c33, 0 0 96px #e63c3c11; border-color: #e63c3caa; } 50% { box-shadow: 0 0 28px #e63c3ccc, 0 0 56px #e63c3c88, 0 0 100px #e63c3c44, 0 0 140px #e63c3c22; border-color: #e63c3cee; } }
  @keyframes sparkle-float  { 0%,100% { opacity: 0; transform: scale(0) rotate(0deg); } 30% { opacity: 1; transform: scale(1) rotate(135deg); } 70% { opacity: 0.7; transform: scale(0.7) rotate(270deg); } }
  .rarity-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.15rem 0.5rem; border-radius: 2px; display: inline-block; }
  .rarity-selector { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.25rem; }
  .rarity-btn { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; letter-spacing: 0.08em; padding: 0.35rem 0.75rem; border-radius: 2px; cursor: pointer; border: 1px solid #242424; background: #181818; color: #555; transition: all 0.15s; }
  .rarity-btn.sel { color: #f0ede8; }
  .sparkle-wrap { position: absolute; inset: 0; pointer-events: none; overflow: visible; z-index: 10; }

  /* ── LOADING ── */
  .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #333; letter-spacing: 0.2em; position: relative; z-index: 1; }
`;

function RaritySparkles({ color }) {
  const pts = [
    { top: "-10px", left: "12%",  delay: "0s",    size: "0.55rem" },
    { top: "-10px", right: "18%", delay: "0.5s",  size: "0.45rem" },
    { bottom: "-10px", left: "22%",  delay: "0.9s", size: "0.5rem"  },
    { bottom: "-10px", right: "12%", delay: "0.3s", size: "0.45rem" },
    { top: "35%", left: "-12px",  delay: "0.7s",  size: "0.4rem"  },
    { top: "60%", right: "-12px", delay: "1.1s",  size: "0.5rem"  },
  ];
  return (
    <div className="sparkle-wrap">
      {pts.map((p, i) => (
        <div key={i} style={{ position: "absolute", ...p, color, fontSize: p.size, animation: `sparkle-float 2s ease-in-out infinite`, animationDelay: p.delay }}>✦</div>
      ))}
    </div>
  );
}

function getRarityStyle(rarity) {
  const r = RARITY_MAP[rarity] || RARITY_MAP.common;
  if (!r.animation) return {};
  return { animation: `${r.animation} ${r.speed}s ease-in-out infinite` };
}

const ADSENSE_CLIENT = "ca-pub-3769557613296773";
const ADSENSE_SLOT   = "8872751959";

function AdSenseUnit() {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
    }
  }, []);
  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={ADSENSE_SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

export default function AdSimulator() {
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading, null = signed out
  const [adminAds, setAdminAds] = useState([]);
  const [userLibrary, setUserLibrary] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [adState, setAdState] = useState("idle");
  const [currentAd, setCurrentAd] = useState(null);
  const [isAdminAd, setIsAdminAd] = useState(false);
  const [isNewCollect, setIsNewCollect] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [history, setHistory] = useState([]);
  const [creditBump, setCreditBump] = useState(false);
  const [view, setView] = useState("earn");
  const [adminView, setAdminView] = useState("ads");
  const [newAd, setNewAd] = useState(BLANK_AD);
  const [formError, setFormError] = useState("");
  const [cleanupState, setCleanupState] = useState("idle"); // "idle" | "running" | "done"
  const [cleanupResult, setCleanupResult] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [videoUploadState, setVideoUploadState] = useState("idle"); // "idle" | "uploading" | "error"
  const [adVideoSize, setAdVideoSize] = useState(null); // { w, h } natural video dimensions

  const currentAdRef = useRef(null);
  const isAdminAdRef = useRef(false);
  const currentUserRef = useRef(null);
  const userLibraryRef = useRef([]);
  const intervalRef = useRef(null);
  const adDurationRef = useRef(5000);
  const adStartRef = useRef(null);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { userLibraryRef.current = userLibrary; }, [userLibrary]);

  // ── Load AdSense script ──
  useEffect(() => {
    if (document.querySelector('script[src*="adsbygoogle"]')) return;
    const s = document.createElement("script");
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    s.async = true;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }, []);

  // ── Firebase auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser ?? null);
      if (fbUser) {
        // Map Firebase user to app user shape, restoring saved credits
        const savedCredits = parseInt(localStorage.getItem(`sim_credits_${fbUser.uid}`) || "0", 10);
        setCurrentUser({
          id: fbUser.uid,
          username: fbUser.displayName || fbUser.email?.split("@")[0] || "user",
          photoURL: fbUser.photoURL || null,
          credits: savedCredits,
          isGoogle: true,
        });
      } else if (currentUser?.isGoogle) {
        // Only clear if we were signed in via Google (not debug account)
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load shared data on mount ──
  useEffect(() => {
    async function load() {
      const r1 = localStorage.getItem("sim_adminAds");
      if (r1) setAdminAds(JSON.parse(r1));
      const r2 = localStorage.getItem("sim_users");
      if (r2) setUsers(JSON.parse(r2));
      setStorageReady(true);
    }
    load();
  }, []);

  // ── Persist admin ads ──
  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem("sim_adminAds", JSON.stringify(adminAds)); } catch {}
  }, [adminAds, storageReady]);

  // ── Persist users ──
  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem("sim_users", JSON.stringify(users)); } catch {}
  }, [users, storageReady]);

  // ── Load user library on login ──
  useEffect(() => {
    if (!currentUser || currentUser.isAdmin) { setUserLibrary([]); return; }
    const r = localStorage.getItem(`sim_lib_${currentUser.id}`);
    setUserLibrary(r ? JSON.parse(r) : []);
  }, [currentUser?.id]);

  // ── Persist user library ──
  useEffect(() => {
    if (!currentUser || currentUser.isAdmin || !storageReady) return;
    try { localStorage.setItem(`sim_lib_${currentUser.id}`, JSON.stringify(userLibrary)); } catch {}
  }, [userLibrary, currentUser, storageReady]);

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
          setAdState("complete");
          awardCredit();
        }
      }, 50);
    }
    return () => clearInterval(intervalRef.current);
  }, [adState]);

  const runAd = () => {
    let ad, adminFlag = false;
    if (adminAds.length > 0) {
      const roll = Math.random() * 100;
      let cumulative = 0;
      let rolledRarity = "common";
      for (const r of RARITIES) {
        cumulative += r.chance;
        if (roll < cumulative) { rolledRarity = r.key; break; }
      }
      const pool = adminAds.filter(a => (a.rarity || "common") === rolledRarity);
      if (pool.length > 0) {
        ad = pool[Math.floor(Math.random() * pool.length)];
        adminFlag = true;
      } else {
        ad = MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)];
      }
    } else {
      ad = MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)];
    }
    adDurationRef.current = 5000;
    adStartRef.current = ad.videoUrl ? null : Date.now();
    currentAdRef.current = ad;
    isAdminAdRef.current = adminFlag;
    setCurrentAd(ad);
    setIsAdminAd(adminFlag);
    setIsNewCollect(false);
    setProgress(0);
    setCountdown(ad.videoUrl ? null : 5);
    setAdVideoSize(null);
    setAdState("running");
  };

  const awardCredit = () => {
    const ad = currentAdRef.current;
    const isAdmin = isAdminAdRef.current;
    const user = currentUserRef.current;
    const lib = userLibraryRef.current;

    if (!user.isGoogle) setUsers(prev => prev.map(u => u.id === user.id ? { ...u, credits: u.credits + 1 } : u));
    const newCredits = user.credits + 1;
    setCurrentUser(prev => ({ ...prev, credits: newCredits }));
    if (user.isGoogle) try { localStorage.setItem(`sim_credits_${user.id}`, String(newCredits)); } catch {}
    setCreditBump(true);
    setTimeout(() => setCreditBump(false), 800);

    setHistory(prev => [{
      id: Date.now(),
      brand: ad?.brand,
      isAdmin,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }, ...prev.slice(0, 4)]);

    if (isAdmin && ad && !lib.some(item => item.id === ad.id)) {
      setUserLibrary(prev => [...prev, ad]);
      setIsNewCollect(true);
    }
  };

  const dismissComplete = () => {
    setAdState("idle");
    setCurrentAd(null);
    setIsNewCollect(false);
  };

  const createUser = () => {
    const name = newUsername.trim();
    if (!name || name.toLowerCase() === "admin") return;
    const user = {
      id: Date.now().toString(),
      username: name.toLowerCase().replace(/\s+/g, "_"),
      credits: 0,
    };
    setUsers(p => [...p, user]);
    setCurrentUser(user);
    setNewUsername("");
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

  const createAdminAd = () => {
    const { brand, tagline, cta } = newAd;
    if (!brand.trim() || !tagline.trim() || !cta.trim()) {
      setFormError("// brand, tagline, and CTA are required");
      return;
    }
    setFormError("");
    const ad = {
      ...newAd,
      id: Date.now().toString(),
      brand: brand.trim(),
      tagline: tagline.trim(),
      cta: cta.trim(),
      createdAt: new Date().toISOString(),
    };
    setAdminAds(prev => [...prev, ad]);
    setNewAd(BLANK_AD);
    setVideoUploadState("idle");
    setAdminView("ads");
  };

  const cleanupOrphanedVideos = async () => {
    setCleanupState("running");
    setCleanupResult(null);
    const keepUrls = adminAds.map(a => a.videoUrl).filter(Boolean);
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
    if (ad?.videoUrl?.includes(".r2.dev/")) {
      try {
        await fetch(`${WORKER_URL}/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: ad.videoUrl }),
        });
      } catch {}
    }
    setAdminAds(prev => prev.filter(a => a.id !== id));
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

        {/* ── AUTH ── */}
        {!currentUser ? (
          <div className="auth-screen">
            <div className="auth-card">
              <div className="auth-logo">◉ Ad Simulator</div>
              <h1 className="auth-title">Sign In to<br />Your Profile</h1>
              <p className="auth-sub">// continue with google</p>

              {firebaseUser === undefined ? (
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: "#444", marginBottom: "1.5rem" }}>loading…</p>
              ) : (
                <button className="btn-google" onClick={signInWithGoogle}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
                  Continue with Google
                </button>
              )}

              {DEBUG && (
                <>
                  <hr className="auth-divider" />
                  <p className="auth-sub" style={{ marginBottom: "1rem" }}>// debug accounts</p>
                  <div className="user-list">
                    <button className="user-btn admin-btn" onClick={() => setCurrentUser(ADMIN_USER)}>
                      <div className="user-avatar admin-av">AD</div>
                      <div><div className="user-name">@admin</div></div>
                      <div className="admin-badge">ADMIN</div>
                    </button>
                    {users.map(u => (
                      <button key={u.id} className="user-btn" onClick={() => setCurrentUser(u)}>
                        <div className="user-avatar">{u.username.slice(0, 2).toUpperCase()}</div>
                        <div><div className="user-name">@{u.username}</div></div>
                        <div className="user-credits-badge">{u.credits} CR</div>
                      </button>
                    ))}
                  </div>
                  <hr className="auth-divider" />
                  <div className="new-user-form">
                    <input
                      className="input"
                      placeholder="new username"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && createUser()}
                    />
                    <button className="btn-sm" onClick={createUser}>CREATE</button>
                  </div>
                </>
              )}
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
                  <div className="profile-avatar admin">AD</div>
                  <span className="profile-name">@admin</span>
                </div>
                <button className="logout-btn" onClick={signOut}>SIGN OUT</button>
              </div>
            </header>

            <div className="tabs">
              <button
                className={`tab-btn admin-tab ${adminView === "ads" ? "active" : ""}`}
                onClick={() => { cleanupPendingVideo(newAd.videoUrl); setAdminView("ads"); }}
              >
                Ad Library<span className="tab-count">({adminAds.length})</span>
              </button>
              <button
                className={`tab-btn admin-tab ${adminView === "create" ? "active" : ""}`}
                onClick={() => { cleanupPendingVideo(newAd.videoUrl); setAdminView("create"); setFormError(""); setNewAd(BLANK_AD); }}
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
                        <div key={ad.id} className="admin-ad-card" style={{ position: "relative", overflow: "visible", ...getRarityStyle(ad.rarity || "common") }}>
                          {rar.sparkle && <RaritySparkles color={rar.color} />}
                          <div style={{ borderRadius: "2px", overflow: "hidden", position: "relative", zIndex: 1 }}>
                            <div className="adm-banner" style={{ background: ad.color + "18" }}>
                              <BannerBg color={ad.color} opacity={0.22} />
                              <div className="adm-icon">{ad.logo}</div>
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
                                <button className="delete-btn" onClick={() => deleteAdminAd(ad.id)}>DELETE</button>
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
                  <div className="form-title">Create Admin Ad</div>
                  <div className="form-sub">// this ad will enter the pool and serve at {Math.round(ADMIN_RATE * 100)}% rate</div>

                  {/* Live Preview */}
                  <div className="preview-wrap">
                    <div className="preview-label">// live preview</div>
                    {newAd.videoUrl ? (
                      <video
                        className="preview-video"
                        src={newAd.videoUrl}
                        controls
                        muted
                        key={newAd.videoUrl}
                      />
                    ) : (
                      <div className="preview-banner" style={{ background: newAd.color + "18" }}>
                        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${newAd.color}, transparent 70%)`, opacity: 0.22 }} />
                        <div className="preview-icon">{newAd.logo}</div>
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
                    <div className="logo-grid">
                      {PRESET_LOGOS.map(l => (
                        <button
                          key={l}
                          className={`logo-btn ${newAd.logo === l ? "sel" : ""}`}
                          onClick={() => setNewAd(p => ({ ...p, logo: l }))}
                        >{l}</button>
                      ))}
                    </div>
                  </div>

                  {formError && <div className="form-error">{formError}</div>}

                  <div className="form-actions">
                    <button className="btn-create" onClick={createAdminAd} disabled={videoUploadState === "uploading"} style={{ opacity: videoUploadState === "uploading" ? 0.5 : 1, cursor: videoUploadState === "uploading" ? "not-allowed" : "pointer" }}>PUBLISH AD</button>
                    <button className="btn-cancel" onClick={() => { cleanupPendingVideo(newAd.videoUrl); setAdminView("ads"); setFormError(""); setVideoUploadState("idle"); }}>CANCEL</button>
                  </div>

                  <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #1a1a1a" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <button
                        className="btn-cancel"
                        onClick={() => { setCleanupResult(null); cleanupOrphanedVideos(); }}
                        disabled={cleanupState === "running"}
                        style={{ opacity: cleanupState === "running" ? 0.5 : 1, cursor: cleanupState === "running" ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                      >
                        {cleanupState === "running" ? "SCANNING…" : "🗑 PURGE ORPHANED VIDEOS"}
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
          <div className="page-with-sidebar">
          <aside className="ad-sidebar">
            <span className="ad-sidebar-label">sponsored</span>
            <AdSenseUnit />
          </aside>
          <div className="main">
            <header className="header">
              <div className="header-logo">◉ Ad Simulator</div>
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
                <button className="logout-btn" onClick={signOut}>SIGN OUT</button>
              </div>
            </header>

            <div className="tabs">
              <button className={`tab-btn ${view === "earn" ? "active" : ""}`} onClick={() => setView("earn")}>
                Earn Credits
              </button>
              <button className={`tab-btn ${view === "collection" ? "active" : ""}`} onClick={() => setView("collection")}>
                Collection<span className="tab-count">({userLibrary.length})</span>
              </button>
            </div>

            {view === "earn" ? (
              <>
                <div className="hero">
                  <div className="hero-label">// press to serve an ad impression</div>

                  <div className="run-btn-wrapper">
                    <div className="run-btn-ring" />
                    <div className="run-btn-ring run-btn-ring-2" />
                    <button className="run-btn" onClick={runAd} disabled={adState !== "idle"}>
                      <span className="run-btn-text">RUN AD</span>
                      <span className="run-btn-sub">earn 1 credit</span>
                    </button>
                  </div>

                  <div className="status-bar">
                    <div className={`status-dot ${adState === "running" ? "active" : adState === "idle" ? "" : "done"}`} />
                    {adState === "idle" && "ready — waiting for ad request"}
                    {adState === "running" && "serving ad impression…"}
                    {adState === "complete" && "impression complete"}
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
            ) : (
              /* Collection View */
              <div className="collection-view">
                <div className="section-header">
                  <span className="section-title">// your ad collection</span>
                  <span className="section-sub">admin ads encountered while watching</span>
                </div>

                {userLibrary.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <div className="empty-text">
                      // no ads collected yet<br />
                      // run ads to discover<br />
                      // admin-made ads in the pool
                    </div>
                  </div>
                ) : (
                  <div className="collection-grid">
                    {userLibrary.map(ad => {
                      const rar = RARITY_MAP[ad.rarity || "common"];
                      return (
                      <div key={ad.id} className="coll-card" style={{ position: "relative", overflow: "visible", ...getRarityStyle(ad.rarity || "common") }}>
                        {rar.sparkle && <RaritySparkles color={rar.color} />}
                        <div style={{ borderRadius: "2px", overflow: "hidden", position: "relative", zIndex: 1 }}>
                          <div className="coll-banner" style={{ background: ad.color + "18" }}>
                            <div className="coll-banner-bg" style={{ background: `radial-gradient(circle at 50% 50%, ${ad.color}, transparent 70%)`, opacity: 0.22, position: "absolute", inset: 0 }} />
                            <div className="coll-icon">{ad.logo}</div>
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
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        )}

        {/* ── AD MODAL (running) ── */}
        {adState === "running" && currentAd && (
          <div className="modal-backdrop">
            {(() => {
              const rar = isAdminAd ? (RARITY_MAP[currentAd.rarity || "common"]) : null;
              return (
            <div className={`ad-card ${isAdminAd ? "is-admin" : ""}`} style={{ ...(rar ? getRarityStyle(rar.key) : {}), ...(adVideoSize ? { maxWidth: Math.round(Math.min(Math.max(window.innerHeight * 0.65 * (adVideoSize.w / adVideoSize.h), 300), window.innerWidth * 0.92, 640)) } : {}) }}>
              {rar?.sparkle && <RaritySparkles color={rar.color} />}
              <div className={`ad-tag ${isAdminAd ? "admin" : ""}`} style={rar && rar.key !== "common" ? { color: rar.color, borderColor: rar.color + "44" } : {}}>
                {isAdminAd ? rar.label.toUpperCase() + " AD" : "ADVERTISEMENT"}
              </div>
              {currentAd.videoUrl ? (
                <video
                  className="ad-video"
                  src={currentAd.videoUrl}
                  autoPlay
                  playsInline
                  key={currentAd.videoUrl}
                  onLoadedMetadata={e => {
                    adDurationRef.current = e.target.duration * 1000;
                    adStartRef.current = Date.now();
                    setCountdown(Math.ceil(e.target.duration));
                    setAdVideoSize({ w: e.target.videoWidth, h: e.target.videoHeight });
                  }}
                />
              ) : (
                <div className="ad-banner" style={{ background: currentAd.color + "18" }}>
                  <div className="ad-banner-bg" style={{ background: `radial-gradient(circle at 50% 50%, ${currentAd.color}, transparent 70%)`, opacity: 0.25, position: "absolute", inset: 0 }} />
                  <div className="ad-banner-icon">{currentAd.logo}</div>
                  <div className="ad-banner-brand">{currentAd.brand}</div>
                  <div className="ad-banner-tagline">{currentAd.tagline}</div>
                </div>
              )}
              <div className="ad-body">
                <div className="ad-category">{currentAd.category}</div>
                <div className="ad-cta-row">
                  <div className="ad-cta" style={{ background: currentAd.color }}>{currentAd.cta}</div>
                  {isAdminAd && !userLibrary.some(i => i.id === currentAd.id) && (
                    <span className="new-collect-badge">✦ NEW</span>
                  )}
                </div>
                <div className="ad-progress-wrapper">
                  <div className="ad-progress-label">
                    <span className="ad-progress-text">AD PLAYING</span>
                    <span className="ad-progress-countdown">{countdown !== null ? `${countdown}s remaining` : "loading…"}</span>
                  </div>
                  <div className="ad-progress-track">
                    <div className="ad-progress-fill" style={{ width: `${progress}%`, background: currentAd.color }} />
                  </div>
                </div>
              </div>
            </div>
              );
            })()}
          </div>
        )}

        {/* ── COMPLETE MODAL ── */}
        {adState === "complete" && (
          <div className="modal-backdrop">
            <div className="complete-modal">
              <div className="complete-icon">✦</div>
              <h2 className="complete-title">Credit Earned</h2>
              {isAdminAd && (() => { const rar = RARITY_MAP[currentAd?.rarity || "common"]; return <span className="rarity-badge" style={{ color: rar.color, background: rar.color + "18", border: `1px solid ${rar.color}33`, marginBottom: "0.75rem" }}>{rar.label}</span>; })()}
              <p className="complete-sub">
                Ad impression from {currentAd?.brand}<br />
                was served successfully.
              </p>
              {isNewCollect && (
                <div className="complete-collect-note">
                  ✦ New ad added to your collection!
                </div>
              )}
              <div className="complete-credit">+1 CR</div>
              <button className="btn-primary" onClick={dismissComplete}>RUN ANOTHER AD</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
