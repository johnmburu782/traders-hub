/* ==========================================================================
   SMART TRADERS — Shared Utilities
   Powered by Harvey Coding Studios
   Handles: theme toggle, toast notifications, localStorage data store,
   authentication helpers, and small UI helpers used across every page.
   ========================================================================== */

/* ---------------- Theme ---------------- */
const Theme = {
  init(){
    const saved = localStorage.getItem('st_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.querySelectorAll('.theme-toggle').forEach(btn=>{
      btn.textContent = saved === 'dark' ? '☀️' : '🌙';
      btn.addEventListener('click', Theme.toggle);
    });
  },
  toggle(){
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('st_theme', next);
    document.querySelectorAll('.theme-toggle').forEach(btn=> btn.textContent = next === 'dark' ? '☀️' : '🌙');
  }
};

/* ---------------- Toasts ---------------- */
const Toast = {
  stack(){
    let el = document.getElementById('toast-stack');
    if(!el){ el = document.createElement('div'); el.id='toast-stack'; document.body.appendChild(el); }
    return el;
  },
  show(msg, type='info', title=''){
    const stack = Toast.stack();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="dot"></span><div><strong style="display:block;font-size:13.5px;">${title || Toast.titleFor(type)}</strong><span style="color:var(--ink-soft);">${msg}</span></div>`;
    stack.appendChild(t);
    setTimeout(()=>{ t.style.transition='opacity .3s ease, transform .3s ease'; t.style.opacity='0'; t.style.transform='translateY(6px)'; setTimeout(()=>t.remove(),300); }, 3800);
  },
  titleFor(type){
    return { success:'Success', error:'Error', warning:'Heads up', info:'Notice' }[type] || 'Notice';
  }
};

/* ---------------- Data store (localStorage) ---------------- */
const Store = {
  keys:{
    businesses:'st_businesses', buyers:'st_buyers', session:'st_session',
    products:'st_products', orders:'st_orders', debtors:'st_debtors', notifications:'st_notifications'
  },
  get(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : (fallback ?? []); }catch(e){ return fallback ?? []; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); },

  businesses(){ return Store.get(Store.keys.businesses, []); },
  saveBusiness(b){ const all = Store.businesses(); all.push(b); Store.set(Store.keys.businesses, all); },
  updateBusiness(id, patch){ const all = Store.businesses().map(b=> b.id===id ? {...b,...patch} : b); Store.set(Store.keys.businesses, all); },
  findBusinessByEmail(email){ return Store.businesses().find(b=> b.email.toLowerCase() === email.toLowerCase()); },
  findBusiness(id){ return Store.businesses().find(b=> b.id === id); },

  buyers(){ return Store.get(Store.keys.buyers, []); },
  saveBuyer(b){ const all = Store.buyers(); all.push(b); Store.set(Store.keys.buyers, all); },
  findBuyerByEmail(email){ return Store.buyers().find(b=> b.email.toLowerCase() === email.toLowerCase()); },
  findBuyer(id){ return Store.buyers().find(b=> b.id === id); },

  products(){ return Store.get(Store.keys.products, []); },
  saveProducts(list){ Store.set(Store.keys.products, list); },

  orders(){ return Store.get(Store.keys.orders, []); },
  saveOrders(list){ Store.set(Store.keys.orders, list); },

  debtors(){ return Store.get(Store.keys.debtors, []); },
  saveDebtors(list){ Store.set(Store.keys.debtors, list); },

  notifications(){ return Store.get(Store.keys.notifications, []); },
  saveNotifications(list){ Store.set(Store.keys.notifications, list); },
  addNotification(n){
    const all = Store.notifications();
    all.unshift({ id: Utils.uid('NTF'), read:false, time: Date.now(), ...n });
    Store.set(Store.keys.notifications, all.slice(0,80));
  },

  session(){ return Store.get(Store.keys.session, null); },
  setSession(s){ Store.set(Store.keys.session, s); },
  clearSession(){ localStorage.removeItem(Store.keys.session); }
};

/* ---------------- Utils ---------------- */
const Utils = {
  uid(prefix='ID'){ return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random()*900+100)}`; },
  money(n){ return 'KES ' + Number(n||0).toLocaleString('en-KE',{maximumFractionDigits:0}); },
  esc(str){ const d=document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; },
  dateStr(ts){ return new Date(ts).toLocaleDateString('en-GB',{ day:'2-digit', month:'short', year:'numeric' }); },
  isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
  isPhone(v){ return /^[0-9+\-\s()]{7,15}$/.test(v); },
  qs(name){ return new URLSearchParams(location.search).get(name); },
  initials(name){ return (name||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()).join(''); }
};

/* ---------------- Auth guard ---------------- */
const Auth = {
  requireBusiness(){
    const s = Store.session();
    if(!s || s.role !== 'business'){ window.location.href = 'login.html'; return null; }
    return Store.findBusiness(s.id);
  },
  logout(){ Store.clearSession(); window.location.href = 'index.html'; }
};

/* ---------------- Mobile nav + init ---------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  Theme.init();
  const burger = document.querySelector('.nav-burger');
  const links = document.querySelector('.nav-links');
  if(burger && links){ burger.addEventListener('click', ()=> links.classList.toggle('open')); }

  document.querySelectorAll('[data-logout]').forEach(el=> el.addEventListener('click', (e)=>{ e.preventDefault(); Auth.logout(); }));

  // Reveal-on-load animation
  document.querySelectorAll('.fade-up').forEach((el,i)=>{ el.style.animationDelay = (i*0.05)+'s'; });
});