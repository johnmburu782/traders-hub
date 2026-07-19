/* ==========================================================================
   SMART TRADERS — Shop (Buyer) Logic
   Powered by Harvey Coding Studios
   ========================================================================== */

let BUYER = null;
let CART = [];
let PAGE = 1;
const PAGE_SIZE = 6;

document.addEventListener('DOMContentLoaded', ()=>{
  const session = Store.session();
  if(session && session.role === 'buyer'){ BUYER = Store.findBuyer(session.id); }
  updateAuthUI();

  seedIfNoProductsAnywhere();
  CART = Store.get(cartKey(), []);

  populateCategories();
  renderShop();
  renderCart();
  renderMyOrders();

  document.getElementById('shop-search').addEventListener('input', ()=>{ PAGE=1; renderShop(); });
  document.getElementById('filter-category').addEventListener('change', ()=>{ PAGE=1; renderShop(); });
  document.getElementById('filter-sort').addEventListener('change', ()=>{ PAGE=1; renderShop(); });

  document.getElementById('btn-open-cart').addEventListener('click', openCart);
  document.getElementById('btn-close-cart').addEventListener('click', closeCart);
  document.getElementById('drawer-overlay').addEventListener('click', closeCart);
  document.getElementById('btn-checkout').addEventListener('click', checkout);

  document.querySelectorAll('[data-close-modal]').forEach(btn=>{
    btn.addEventListener('click', ()=> document.getElementById(btn.dataset.closeModal).classList.remove('open'));
  });
});

function cartKey(){ return BUYER ? `st_cart_${BUYER.id}` : 'st_cart_guest'; }

function updateAuthUI(){
  const tag = document.getElementById('buyer-tag');
  const loginLink = document.getElementById('btn-login-link');
  const logoutLink = document.getElementById('btn-logout-link');
  if(BUYER){
    tag.textContent = `Hi, ${BUYER.name.split(' ')[0]}`;
    tag.style.display = 'inline';
    loginLink.style.display = 'none';
    logoutLink.style.display = 'inline-flex';
  } else {
    tag.style.display = 'none';
    loginLink.style.display = 'inline-flex';
    logoutLink.style.display = 'none';
  }
}

/* If literally no products exist anywhere (fresh install, no business registered yet),
   create a demo business + catalog so the shop isn't empty. */
function seedIfNoProductsAnywhere(){
  if(Store.products().length > 0) return;
  let demoBiz = Store.findBusinessByEmail('demo@smarttraders.app');
  if(!demoBiz){
    demoBiz = { id: Utils.uid('BIZ'), name:'Harvey Demo Traders', owner:'Demo Owner', category:'Home & Living',
      email:'demo@smarttraders.app', phone:'0700 000 000', location:'Nairobi', description:'Sample storefront.',
      password:'demo123', createdAt:Date.now() };
    Store.saveBusiness(demoBiz);
  }
  const seed = [
    { name:'Ankara Fabric Bundle', category:'Fashion & Textiles', price:2400, qty:18, discount:10, availability:'in-stock', rating:5, description:'6-yard vibrant Ankara print bundle.' },
    { name:'Solar Lantern', category:'Electronics', price:1950, qty:14, discount:0, availability:'in-stock', rating:4, description:'Rechargeable solar lantern, 12hr battery life.' },
    { name:'Maasai Blanket', category:'Home & Living', price:2400, qty:9, discount:15, availability:'in-stock', rating:5, description:'Handwoven wool shuka blanket.' },
    { name:'Beaded Necklace Set', category:'Fashion & Textiles', price:850, qty:32, discount:0, availability:'in-stock', rating:4, description:'Set of 3 handmade beaded necklaces.' },
    { name:'Non-stick Sufuria Set', category:'Home & Living', price:3200, qty:6, discount:5, availability:'in-stock', rating:4, description:'3-piece non-stick cooking pot set.' },
    { name:'Bluetooth Speaker', category:'Electronics', price:2800, qty:0, discount:0, availability:'out-of-stock', rating:3, description:'Portable speaker with 8hr playtime.' }
  ].map(p=> ({ id: Utils.uid('PRD'), businessId: demoBiz.id, createdAt: Date.now(), ...p }));
  Store.saveProducts(seed);
}

function populateCategories(){
  const cats = [...new Set(Store.products().map(p=>p.category).filter(Boolean))];
  const sel = document.getElementById('filter-category');
  cats.forEach(c=>{ const opt = document.createElement('option'); opt.value=c; opt.textContent=c; sel.appendChild(opt); });
}

function businessName(id){ const b = Store.findBusiness(id); return b ? b.name : 'Smart Traders'; }

/* ---------------- Shop grid ---------------- */
function renderShop(){
  const term = document.getElementById('shop-search').value.toLowerCase();
  const cat = document.getElementById('filter-category').value;
  const sort = document.getElementById('filter-sort').value;

  let products = Store.products().filter(p=>
    p.name.toLowerCase().includes(term) &&
    (!cat || p.category === cat)
  );

  if(sort==='price-asc') products.sort((a,b)=> effPrice(a)-effPrice(b));
  else if(sort==='price-desc') products.sort((a,b)=> effPrice(b)-effPrice(a));
  else if(sort==='rating') products.sort((a,b)=> (b.rating||0)-(a.rating||0));
  else products.sort((a,b)=> b.createdAt-a.createdAt);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  PAGE = Math.min(PAGE, totalPages);
  const pageItems = products.slice((PAGE-1)*PAGE_SIZE, PAGE*PAGE_SIZE);

  const grid = document.getElementById('shop-grid');
  document.getElementById('shop-empty').style.display = products.length ? 'none' : 'block';

  grid.innerHTML = pageItems.map(p=>{
    const price = effPrice(p);
    const outOfStock = p.availability !== 'in-stock' || p.qty <= 0;
    return `
    <div class="card product-card fade-up">
      <div class="product-media">🛍️${p.discount ? `<span class="product-discount">-${p.discount}%</span>` : ''}</div>
      <div class="product-body">
        <strong>${Utils.esc(p.name)}</strong>
        <span class="tag">${Utils.esc(businessName(p.businessId))}</span>
        <div class="rating">${'★'.repeat(p.rating||0)}${'☆'.repeat(5-(p.rating||0))}</div>
        <div class="product-price">${Utils.money(price)}${p.discount ? `<span class="old">${Utils.money(p.price)}</span>`:''}</div>
        <button class="btn ${outOfStock ? 'btn-ghost':'btn-primary'} btn-block" ${outOfStock?'disabled':''} data-add="${p.id}">
          ${outOfStock ? 'Out of stock' : 'Add to Cart'}
        </button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=> addToCart(b.dataset.add)));

  const pag = document.getElementById('shop-pagination');
  pag.innerHTML = Array.from({length: totalPages}, (_,i)=>
    `<button class="page-btn ${i+1===PAGE?'active':''}" data-page="${i+1}">${i+1}</button>`).join('');
  pag.querySelectorAll('[data-page]').forEach(b=> b.addEventListener('click', ()=>{ PAGE=Number(b.dataset.page); renderShop(); window.scrollTo({top:document.getElementById('shop-grid').offsetTop-100, behavior:'smooth'}); }));
}
function effPrice(p){ return p.discount ? Math.round(p.price*(1-p.discount/100)) : p.price; }

/* ---------------- Cart ---------------- */
function addToCart(productId){
  const product = Store.products().find(p=>p.id===productId);
  if(!product) return;
  const existing = CART.find(c=>c.productId===productId);
  if(existing) existing.qty += 1;
  else CART.push({ productId, qty:1 });
  Store.set(cartKey(), CART);
  renderCart();
  Toast.show(`${product.name} added to cart.`, 'success');
  openCart();
}
function changeQty(productId, delta){
  const item = CART.find(c=>c.productId===productId);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) CART = CART.filter(c=>c.productId!==productId);
  Store.set(cartKey(), CART);
  renderCart();
}
function removeFromCart(productId){
  CART = CART.filter(c=>c.productId!==productId);
  Store.set(cartKey(), CART);
  renderCart();
  Toast.show('Removed from cart.', 'warning');
}
function renderCart(){
  const wrap = document.getElementById('cart-items');
  const products = Store.products();
  let subtotal = 0;

  if(CART.length === 0){
    wrap.innerHTML = `<div class="empty-state"><div class="glyph">🛒</div><p>Your cart is empty.</p></div>`;
  } else {
    wrap.innerHTML = CART.map(item=>{
      const p = products.find(x=>x.id===item.productId);
      if(!p) return '';
      const price = effPrice(p);
      subtotal += price * item.qty;
      return `
      <div class="cart-item">
        <div class="cart-item-thumb">📦</div>
        <div style="flex:1;">
          <strong style="font-size:14px;">${Utils.esc(p.name)}</strong>
          <p style="margin:2px 0 8px;font-size:13px;" class="mono">${Utils.money(price)}</p>
          <div class="flex" style="justify-content:space-between;">
            <div class="qty-stepper">
              <button data-dec="${p.id}">−</button><span>${item.qty}</span><button data-inc="${p.id}">+</button>
            </div>
            <button class="icon-btn" data-remove="${p.id}">🗑️</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  const delivery = CART.length ? 200 : 0;
  document.getElementById('cart-subtotal').textContent = Utils.money(subtotal);
  document.getElementById('cart-delivery').textContent = Utils.money(delivery);
  document.getElementById('cart-total').textContent = Utils.money(subtotal + delivery);

  const count = CART.reduce((s,c)=>s+c.qty,0);
  const badge = document.getElementById('cart-count');
  badge.style.display = count ? 'inline-flex' : 'none';
  badge.textContent = count;

  wrap.querySelectorAll('[data-inc]').forEach(b=> b.addEventListener('click', ()=> changeQty(b.dataset.inc, 1)));
  wrap.querySelectorAll('[data-dec]').forEach(b=> b.addEventListener('click', ()=> changeQty(b.dataset.dec, -1)));
  wrap.querySelectorAll('[data-remove]').forEach(b=> b.addEventListener('click', ()=> removeFromCart(b.dataset.remove)));
}
function openCart(){ document.getElementById('cart-drawer').classList.add('open'); document.getElementById('drawer-overlay').classList.add('open'); }
function closeCart(){ document.getElementById('cart-drawer').classList.remove('open'); document.getElementById('drawer-overlay').classList.remove('open'); }

/* ---------------- Checkout ---------------- */
function checkout(){
  if(CART.length === 0){ Toast.show('Your cart is empty.', 'warning'); return; }
  if(!BUYER){ Toast.show('Please login to checkout.', 'warning'); setTimeout(()=> window.location.href='login.html', 1200); return; }

  const products = Store.products();
  let subtotal = 0;
  const lines = CART.map(item=>{
    const p = products.find(x=>x.id===item.productId);
    const price = effPrice(p);
    subtotal += price * item.qty;
    return { name:p.name, qty:item.qty, price, businessId:p.businessId };
  });
  const delivery = 200;
  const total = subtotal + delivery;
  const orderId = Utils.uid('ST');
  const itemsSummary = lines.map(l=> `${l.name} ×${l.qty}`).join(', ');

  // Group by business so each trader sees the order on their dashboard
  const byBusiness = {};
  lines.forEach(l=>{ (byBusiness[l.businessId] ||= []).push(l); });

  const allOrders = Store.orders();
  Object.entries(byBusiness).forEach(([businessId, items])=>{
    const bizSubtotal = items.reduce((s,l)=>s+l.price*l.qty,0);
    allOrders.push({
      id: orderId, businessId, buyerId: BUYER.id, customer: BUYER.name,
      items: items.map(i=>`${i.name} ×${i.qty}`).join(', '),
      total: bizSubtotal + delivery, status:'pending', createdAt: Date.now()
    });
    Store.addNotification({ type:'order', title:'New order received', message:`${BUYER.name} placed an order (${Utils.money(bizSubtotal+delivery)}).`, businessId });
  });
  Store.saveOrders(allOrders);

  // Reduce stock
  Store.saveProducts(products.map(p=>{
    const line = lines.find(l=>l.name===p.name && l.businessId===p.businessId);
    return line ? { ...p, qty: Math.max(0, p.qty - line.qty) } : p;
  }));

  CART = [];
  Store.set(cartKey(), CART);
  renderCart();
  renderShop();
  closeCart();
  renderMyOrders();

  document.getElementById('receipt-content').innerHTML = `
    <div class="flex" style="justify-content:space-between;margin-bottom:10px;">
      <strong class="mono">ORDER RECEIPT</strong><span class="stamp stamp-green" style="transform:rotate(6deg);">Confirmed</span>
    </div>
    ${lines.map(l=>`<div class="receipt-row"><span>${Utils.esc(l.name)} ×${l.qty}</span><strong>${Utils.money(l.price*l.qty)}</strong></div>`).join('')}
    <div class="receipt-row"><span>Delivery Fee</span><strong>${Utils.money(delivery)}</strong></div>
    <div class="receipt-total"><span>Total</span><span>${Utils.money(total)}</span></div>
    <p class="mono" style="font-size:12px;margin-top:14px;">Order #${orderId} · ${Utils.dateStr(Date.now())}</p>`;
  document.getElementById('receipt-modal').classList.add('open');
  Toast.show('Order placed successfully!', 'success');
}

/* ---------------- Order history ---------------- */
function renderMyOrders(){
  const tbody = document.querySelector('#my-orders-table tbody');
  if(!BUYER){
    document.getElementById('my-orders-empty').style.display = 'block';
    tbody.innerHTML = '';
    return;
  }
  const orders = Store.orders().filter(o=>o.buyerId===BUYER.id).sort((a,b)=>b.createdAt-a.createdAt);
  document.getElementById('my-orders-empty').style.display = orders.length ? 'none' : 'block';
  const statusMap = { pending:'badge-gold', processing:'badge-blue', delivered:'badge-green', cancelled:'badge-red' };
  tbody.innerHTML = orders.map(o=>`
    <tr>
      <td class="mono">${o.id}</td>
      <td>${Utils.esc(o.items)}</td>
      <td class="mono">${Utils.money(o.total)}</td>
      <td><span class="badge ${statusMap[o.status]||'badge-blue'}">${Utils.esc(o.status)}</span></td>
      <td class="text-faint">${Utils.dateStr(o.createdAt)}</td>
    </tr>`).join('');
}