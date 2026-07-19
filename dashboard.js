/* ==========================================================================
   SMART TRADERS — Dashboard Logic
   Powered by Harvey Coding Studios
   ========================================================================== */

let BIZ = null;
let charts = {};

document.addEventListener('DOMContentLoaded', ()=>{
  BIZ = Auth.requireBusiness();
  if(!BIZ) return;

  seedDemoDataIfEmpty();
  document.getElementById('biz-tag').textContent = `${BIZ.name} · ${BIZ.id}`;
  document.getElementById('biz-avatar').textContent = Utils.initials(BIZ.name);

  setupNav();
  setupModals();
  setupProductForm();
  setupDebtorForm();
  setupProfileForm();

  document.getElementById('product-search').addEventListener('input', renderProducts);
  document.getElementById('debtor-search').addEventListener('input', renderDebtors);
  document.getElementById('btn-add-product').addEventListener('click', ()=> openProductModal());
  document.getElementById('btn-add-debtor').addEventListener('click', ()=> openModal('debtor-modal'));
  document.getElementById('btn-clear-notifs').addEventListener('click', markAllNotifsRead);
  document.getElementById('btn-debt-report').addEventListener('click', ()=>{
    switchView('reports');
    Toast.show('Debt report generated below.', 'success');
  });

  const sideBurger = document.getElementById('sidebar-burger');
  sideBurger.addEventListener('click', ()=> document.getElementById('sidebar').classList.toggle('open'));

  renderAll();
});

/* ---------------- Demo seed data (first login only) ---------------- */
function seedDemoDataIfEmpty(){
  const products = Store.products().filter(p=> p.businessId === BIZ.id);
  if(products.length === 0){
    const seed = [
      { name:'Ankara Fabric Bundle', category:'Fashion & Textiles', price:2400, qty:18, discount:10, availability:'in-stock', description:'6-yard vibrant Ankara print bundle.' },
      { name:'Solar Lantern', category:'Electronics', price:1950, qty:4, discount:0, availability:'in-stock', description:'Rechargeable solar lantern, 12hr battery life.' },
      { name:'Maasai Blanket', category:'Home & Living', price:2400, qty:0, discount:15, availability:'out-of-stock', description:'Handwoven wool shuka blanket.' },
      { name:'Beaded Necklace Set', category:'Fashion & Textiles', price:850, qty:32, discount:0, availability:'in-stock', description:'Set of 3 handmade beaded necklaces.' }
    ].map(p=> ({ id: Utils.uid('PRD'), businessId: BIZ.id, createdAt: Date.now(), rating:4, ...p }));
    Store.saveProducts([...Store.products(), ...seed]);
  }
  const debtors = Store.debtors().filter(d=> d.businessId === BIZ.id);
  if(debtors.length === 0){
    const past = (days)=> Date.now() - days*86400000;
    const future = (days)=> Date.now() + days*86400000;
    const seed = [
      { name:'Grace Achieng', phone:'0712 345 678', product:'Ankara Fabric Bundle', amount:2400, due: past(3), status:'unpaid' },
      { name:'Peter Otieno', phone:'0722 111 222', product:'Solar Lantern', amount:1950, due: future(5), status:'unpaid' },
      { name:'Faith Wambui', phone:'0733 555 999', product:'Beaded Necklace Set', amount:850, due: past(10), status:'unpaid' }
    ].map(d=> ({ id: Utils.uid('DBT'), businessId: BIZ.id, createdAt: Date.now(), ...d }));
    Store.saveDebtors([...Store.debtors(), ...seed]);
  }
  const orders = Store.orders().filter(o=> o.businessId === BIZ.id);
  if(orders.length === 0){
    const seed = [
      { customer:'Joyce Njoroge', items:'Ankara Fabric Bundle ×2', total:4800, status:'delivered', createdAt: Date.now()-86400000*2 },
      { customer:'David Mwangi', items:'Solar Lantern ×1', total:1950, status:'processing', createdAt: Date.now()-86400000 },
      { customer:'Amina Kassim', items:'Beaded Necklace Set ×3', total:2550, status:'pending', createdAt: Date.now()-3600000*5 }
    ].map(o=> ({ id: Utils.uid('ST'), businessId: BIZ.id, ...o }));
    Store.saveOrders([...Store.orders(), ...seed]);
  }
}

/* ---------------- Navigation ---------------- */
function setupNav(){
  document.querySelectorAll('.side-link[data-view]').forEach(link=>{
    link.addEventListener('click', (e)=>{ e.preventDefault(); switchView(link.dataset.view); });
  });
  document.querySelectorAll('[data-view-link]').forEach(link=>{
    link.addEventListener('click', (e)=>{ e.preventDefault(); switchView(link.dataset.viewLink); });
  });
}
function switchView(view){
  document.querySelectorAll('.view').forEach(v=> v.style.display='none');
  document.getElementById('view-'+view).style.display='block';
  document.querySelectorAll('.side-link[data-view]').forEach(l=> l.classList.toggle('active', l.dataset.view===view));
  const titles = { overview:'Overview', products:'Products', orders:'Orders', debtors:'Debtors', reports:'Reports', notifications:'Notifications', profile:'Business Profile' };
  document.getElementById('view-title').textContent = titles[view] || 'Overview';
  document.getElementById('sidebar').classList.remove('open');
  if(view==='reports') renderReportCharts();
  if(view==='notifications') renderNotifications();
  if(view==='profile') renderProfile();
}

/* ---------------- Modals ---------------- */
function setupModals(){
  document.querySelectorAll('[data-close-modal]').forEach(btn=>{
    btn.addEventListener('click', ()=> closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll('.modal-backdrop').forEach(bd=>{
    bd.addEventListener('click', (e)=>{ if(e.target === bd) closeModal(bd.id); });
  });
}
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }

/* ---------------- Render everything ---------------- */
function renderAll(){
  renderKPIs();
  renderOverviewCharts();
  renderRecentOrders();
  renderProducts();
  renderOrders();
  renderDebtors();
  updateNotifBadge();
}

function myProducts(){ return Store.products().filter(p=> p.businessId === BIZ.id); }
function myOrders(){ return Store.orders().filter(o=> o.businessId === BIZ.id); }
function myDebtors(){ return Store.debtors().filter(d=> d.businessId === BIZ.id); }

/* ---------------- KPIs ---------------- */
function renderKPIs(){
  const products = myProducts();
  const orders = myOrders();
  const debtors = myDebtors();
  const customers = new Set(orders.map(o=>o.customer)).size;
  const outstanding = debtors.filter(d=>d.status!=='paid').reduce((s,d)=>s+Number(d.amount),0);
  const revenue = orders.reduce((s,o)=>s+Number(o.total),0);

  document.getElementById('kpi-products').textContent = products.length;
  document.getElementById('kpi-orders').textContent = orders.length;
  document.getElementById('kpi-customers').textContent = customers;
  document.getElementById('kpi-debts').textContent = Utils.money(outstanding);
  document.getElementById('kpi-revenue').textContent = Utils.money(revenue);
}

/* ---------------- Charts ---------------- */
function chartColors(){
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return { grid: dark ? 'rgba(238,243,241,0.08)' : 'rgba(12,43,51,0.08)', text: dark ? '#B9C7CA' : '#47616A' };
}
function destroyChart(key){ if(charts[key]){ charts[key].destroy(); delete charts[key]; } }

function monthlySeries(orders, months=6){
  const now = new Date();
  const labels = [], totals = [];
  for(let i=months-1;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    labels.push(d.toLocaleString('en-GB',{month:'short'}));
    const total = orders.filter(o=>{
      const od = new Date(o.createdAt);
      return od.getFullYear()===d.getFullYear() && od.getMonth()===d.getMonth();
    }).reduce((s,o)=>s+Number(o.total),0);
    totals.push(total);
  }
  return { labels, totals };
}

function renderOverviewCharts(){
  const orders = myOrders();
  const products = myProducts();
  const { grid, text } = chartColors();

  destroyChart('revenue');
  const { labels, totals } = monthlySeries(orders);
  charts.revenue = new Chart(document.getElementById('chart-revenue'), {
    type:'line',
    data:{ labels, datasets:[{ label:'Revenue (KES)', data: totals, borderColor:'#2C86B0', backgroundColor:'rgba(44,134,176,0.15)', fill:true, tension:.35, pointRadius:4 }] },
    options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{color:grid},ticks:{color:text}}, y:{grid:{color:grid},ticks:{color:text}} } }
  });

  destroyChart('bestsellers');
  const names = products.slice(0,5).map(p=>p.name);
  const sold = products.slice(0,5).map(()=> Math.floor(Math.random()*20)+3);
  charts.bestsellers = new Chart(document.getElementById('chart-bestsellers'), {
    type:'bar',
    data:{ labels: names, datasets:[{ label:'Units sold', data: sold, backgroundColor:'#2FAE73', borderRadius:6 }] },
    options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{color:text}}, y:{grid:{color:grid},ticks:{color:text}} } }
  });
}

function renderReportCharts(){
  const orders = myOrders();
  const debtors = myDebtors();
  const { grid, text } = chartColors();

  destroyChart('sales');
  const statusCounts = ['pending','processing','delivered'].map(s=> orders.filter(o=>o.status===s).length);
  charts.sales = new Chart(document.getElementById('chart-sales'), {
    type:'doughnut',
    data:{ labels:['Pending','Processing','Delivered'], datasets:[{ data: statusCounts, backgroundColor:['#C6912E','#2C86B0','#2FAE73'] }] },
    options:{ plugins:{legend:{position:'bottom', labels:{color:text}}} }
  });

  destroyChart('debt');
  const paid = debtors.filter(d=>d.status==='paid').reduce((s,d)=>s+Number(d.amount),0);
  const unpaid = debtors.filter(d=>d.status!=='paid').reduce((s,d)=>s+Number(d.amount),0);
  charts.debt = new Chart(document.getElementById('chart-debt'), {
    type:'pie',
    data:{ labels:['Paid','Outstanding'], datasets:[{ data:[paid, unpaid], backgroundColor:['#2FAE73','#B3402F'] }] },
    options:{ plugins:{legend:{position:'bottom', labels:{color:text}}} }
  });

  destroyChart('customers');
  const custByMonth = monthlySeries(orders);
  charts.customers = new Chart(document.getElementById('chart-customers'), {
    type:'bar',
    data:{ labels: custByMonth.labels, datasets:[{ label:'Orders', data: custByMonth.labels.map((_,i)=> Math.max(0, Math.round(custByMonth.totals[i]/900))), backgroundColor:'#2C86B0', borderRadius:6 }] },
    options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{color:text}}, y:{grid:{color:grid},ticks:{color:text}} } }
  });

  destroyChart('monthlyRevenue');
  const rev = monthlySeries(orders, 12);
  charts.monthlyRevenue = new Chart(document.getElementById('chart-monthly-revenue'), {
    type:'line',
    data:{ labels: rev.labels, datasets:[{ label:'Revenue', data: rev.totals, borderColor:'#C6912E', backgroundColor:'rgba(198,145,46,0.15)', fill:true, tension:.35 }] },
    options:{ plugins:{legend:{display:false}}, scales:{ x:{grid:{color:grid},ticks:{color:text}}, y:{grid:{color:grid},ticks:{color:text}} } }
  });
}

/* ---------------- Recent + all orders ---------------- */
function statusBadge(status){
  const map = { pending:'badge-gold', processing:'badge-blue', delivered:'badge-green', cancelled:'badge-red' };
  return `<span class="badge ${map[status]||'badge-blue'}">${Utils.esc(status)}</span>`;
}
function renderRecentOrders(){
  const tbody = document.querySelector('#recent-orders-table tbody');
  const orders = [...myOrders()].sort((a,b)=>b.createdAt-a.createdAt).slice(0,5);
  tbody.innerHTML = orders.map(o=>`
    <tr>
      <td class="mono">${o.id}</td>
      <td>${Utils.esc(o.customer)}</td>
      <td>${Utils.esc(o.items)}</td>
      <td class="mono">${Utils.money(o.total)}</td>
      <td>${statusBadge(o.status)}</td>
    </tr>`).join('') || `<tr><td colspan="5" class="text-faint">No orders yet.</td></tr>`;
}
function renderOrders(){
  const tbody = document.querySelector('#orders-table tbody');
  const orders = [...myOrders()].sort((a,b)=>b.createdAt-a.createdAt);
  document.getElementById('orders-empty').style.display = orders.length ? 'none' : 'block';
  tbody.innerHTML = orders.map(o=>`
    <tr>
      <td class="mono">${o.id}</td>
      <td>${Utils.esc(o.customer)}</td>
      <td>${Utils.esc(o.items)}</td>
      <td class="mono">${Utils.money(o.total)}</td>
      <td>${statusBadge(o.status)}</td>
      <td class="text-faint">${Utils.dateStr(o.createdAt)}</td>
    </tr>`).join('');
}

/* ---------------- Products ---------------- */
function renderProducts(){
  const term = (document.getElementById('product-search').value || '').toLowerCase();
  const products = myProducts().filter(p=> p.name.toLowerCase().includes(term) || (p.category||'').toLowerCase().includes(term));
  const grid = document.getElementById('product-grid');
  document.getElementById('product-empty').style.display = products.length ? 'none' : 'block';

  grid.innerHTML = products.map(p=>{
    const discounted = p.discount ? Math.round(p.price * (1 - p.discount/100)) : p.price;
    const lowStock = p.qty > 0 && p.qty <= 5;
    return `
    <div class="card product-card">
      <div class="product-media">📦${p.discount ? `<span class="product-discount">-${p.discount}%</span>` : ''}</div>
      <div class="product-body">
        <div class="flex" style="justify-content:space-between;">
          <strong>${Utils.esc(p.name)}</strong>
          <span class="badge ${p.availability==='in-stock' ? 'badge-green':'badge-red'}">${p.availability==='in-stock' ? 'In stock':'Out of stock'}</span>
        </div>
        <span class="tag">${Utils.esc(p.category||'General')}</span>
        <div class="product-price">${Utils.money(discounted)}${p.discount ? `<span class="old">${Utils.money(p.price)}</span>`:''}</div>
        <p style="margin:0;font-size:13px;">Qty: ${p.qty} ${lowStock ? '<span class="badge badge-gold">Low stock</span>':''}</p>
        <div class="flex gap-8" style="margin-top:8px;">
          <button class="btn btn-ghost btn-sm" data-edit="${p.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-delete="${p.id}">Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-edit]').forEach(b=> b.addEventListener('click', ()=> openProductModal(b.dataset.edit)));
  grid.querySelectorAll('[data-delete]').forEach(b=> b.addEventListener('click', ()=> deleteProduct(b.dataset.delete)));
}

function openProductModal(id){
  const form = document.getElementById('product-form');
  form.reset();
  document.getElementById('pf-id').value = '';
  document.getElementById('product-modal-title').textContent = id ? 'Edit Product' : 'Add Product';
  if(id){
    const p = Store.products().find(x=>x.id===id);
    if(p){
      document.getElementById('pf-id').value = p.id;
      document.getElementById('pf-name').value = p.name;
      document.getElementById('pf-category').value = p.category || '';
      document.getElementById('pf-price').value = p.price;
      document.getElementById('pf-qty').value = p.qty;
      document.getElementById('pf-discount').value = p.discount || 0;
      document.getElementById('pf-desc').value = p.description || '';
      document.getElementById('pf-availability').value = p.availability;
    }
  }
  openModal('product-modal');
}

function setupProductForm(){
  document.getElementById('product-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const id = document.getElementById('pf-id').value;
    const name = document.getElementById('pf-name').value.trim();
    const price = Number(document.getElementById('pf-price').value);
    const qty = Number(document.getElementById('pf-qty').value);
    if(!name || price < 0 || qty < 0){ Toast.show('Please fill in valid product details.', 'error'); return; }

    const data = {
      name, category: document.getElementById('pf-category').value.trim(),
      price, qty, discount: Number(document.getElementById('pf-discount').value)||0,
      description: document.getElementById('pf-desc').value.trim(),
      availability: document.getElementById('pf-availability').value
    };

    let all = Store.products();
    if(id){
      all = all.map(p=> p.id===id ? { ...p, ...data } : p);
      Toast.show(`${name} updated.`, 'success');
    } else {
      const product = { id: Utils.uid('PRD'), businessId: BIZ.id, createdAt: Date.now(), rating:0, ...data };
      all.push(product);
      Store.addNotification({ type:'product', title:'Product added', message:`${name} was added to your catalog.`, businessId: BIZ.id });
      Toast.show(`${name} added to your catalog.`, 'success');
    }
    Store.saveProducts(all);
    if(qty > 0 && qty <= 5){
      Store.addNotification({ type:'stock', title:'Low stock alert', message:`${name} has only ${qty} left in stock.`, businessId: BIZ.id });
    }
    closeModal('product-modal');
    renderProducts(); renderKPIs(); updateNotifBadge();
  });
}

function deleteProduct(id){
  if(!confirm('Delete this product?')) return;
  Store.saveProducts(Store.products().filter(p=>p.id!==id));
  renderProducts(); renderKPIs();
  Toast.show('Product deleted.', 'warning');
}

/* ---------------- Debtors ---------------- */
function renderDebtors(){
  const term = (document.getElementById('debtor-search').value || '').toLowerCase();
  const debtors = myDebtors().filter(d=> d.name.toLowerCase().includes(term) || d.phone.includes(term));
  const tbody = document.querySelector('#debtors-table tbody');
  document.getElementById('debtors-empty').style.display = debtors.length ? 'none' : 'block';

  tbody.innerHTML = debtors.map(d=>{
    const overdue = d.status !== 'paid' && d.due < Date.now();
    return `
    <tr class="${overdue ? 'overdue':''}">
      <td>${Utils.esc(d.name)}</td>
      <td class="mono">${Utils.esc(d.phone)}</td>
      <td>${Utils.esc(d.product)}</td>
      <td class="mono">${Utils.money(d.amount)}</td>
      <td>${Utils.dateStr(d.due)} ${overdue ? '<span class="badge badge-red">Overdue</span>':''}</td>
      <td>${d.status==='paid' ? '<span class="badge badge-green">Paid</span>' : '<span class="badge badge-gold">Unpaid</span>'}</td>
      <td>${d.status!=='paid' ? `<button class="btn btn-accent btn-sm" data-pay="${d.id}">Mark Paid</button>` : ''}</td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-pay]').forEach(b=> b.addEventListener('click', ()=> markDebtorPaid(b.dataset.pay)));
}

function markDebtorPaid(id){
  const all = Store.debtors().map(d=> d.id===id ? {...d, status:'paid'} : d);
  Store.saveDebtors(all);
  const d = all.find(x=>x.id===id);
  Store.addNotification({ type:'payment', title:'Payment received', message:`${d.name} cleared ${Utils.money(d.amount)}.`, businessId: BIZ.id });
  renderDebtors(); renderKPIs(); updateNotifBadge();
  Toast.show('Marked as paid.', 'success');
}

function setupDebtorForm(){
  document.getElementById('debtor-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('df-name').value.trim();
    const phone = document.getElementById('df-phone').value.trim();
    const product = document.getElementById('df-product').value.trim();
    const amount = Number(document.getElementById('df-amount').value);
    const due = new Date(document.getElementById('df-due').value).getTime();
    if(!name || !phone || !product || !amount || !due){ Toast.show('Please fill in all debtor fields.', 'error'); return; }

    const debtor = { id: Utils.uid('DBT'), businessId: BIZ.id, createdAt: Date.now(), name, phone, product, amount, due, status:'unpaid' };
    Store.saveDebtors([...Store.debtors(), debtor]);
    Store.addNotification({ type:'debt', title:'Debt due reminder set', message:`${name} owes ${Utils.money(amount)}, due ${Utils.dateStr(due)}.`, businessId: BIZ.id });
    document.getElementById('debtor-form').reset();
    closeModal('debtor-modal');
    renderDebtors(); renderKPIs(); updateNotifBadge();
    Toast.show('Debtor added.', 'success');
  });
}

/* ---------------- Notifications ---------------- */
function myNotifications(){ return Store.notifications().filter(n=> n.businessId === BIZ.id); }
function updateNotifBadge(){
  const unread = myNotifications().filter(n=>!n.read).length;
  const badge = document.getElementById('notif-count');
  badge.style.display = unread ? 'inline-flex' : 'none';
  badge.textContent = unread;
}
const notifIcon = { order:'🧾', product:'📦', payment:'💰', debt:'📒', stock:'⚠️', system:'✨' };
function renderNotifications(){
  const list = document.getElementById('notif-list');
  const notifs = myNotifications();
  document.getElementById('notif-empty').style.display = notifs.length ? 'none' : 'block';
  list.innerHTML = notifs.map(n=>`
    <div class="flex gap-12" style="padding:12px 0;border-bottom:1px solid var(--border);${n.read?'opacity:.6;':''}">
      <div class="feature-icon" style="margin:0;">${notifIcon[n.type]||'🔔'}</div>
      <div style="flex:1;">
        <strong>${Utils.esc(n.title)}</strong>
        <p style="margin:2px 0 0;font-size:13.5px;">${Utils.esc(n.message)}</p>
        <span class="text-faint mono" style="font-size:11.5px;">${Utils.dateStr(n.time)}</span>
      </div>
    </div>`).join('');
}
function markAllNotifsRead(){
  const all = Store.notifications().map(n=> n.businessId===BIZ.id ? {...n, read:true} : n);
  Store.saveNotifications(all);
  renderNotifications(); updateNotifBadge();
  Toast.show('All notifications marked as read.', 'success');
}

/* ---------------- Profile ---------------- */
function renderProfile(){
  document.getElementById('profile-stamp').textContent = BIZ.id;
  document.getElementById('p-name').value = BIZ.name;
  document.getElementById('p-owner').value = BIZ.owner;
  document.getElementById('p-category').value = BIZ.category;
  document.getElementById('p-email').value = BIZ.email;
  document.getElementById('p-phone').value = BIZ.phone;
  document.getElementById('p-location').value = BIZ.location;
  document.getElementById('p-desc').value = BIZ.description;
}
function setupProfileForm(){
  document.getElementById('profile-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const patch = {
      name: document.getElementById('p-name').value.trim(),
      owner: document.getElementById('p-owner').value.trim(),
      category: document.getElementById('p-category').value.trim(),
      email: document.getElementById('p-email').value.trim(),
      phone: document.getElementById('p-phone').value.trim(),
      location: document.getElementById('p-location').value.trim(),
      description: document.getElementById('p-desc').value.trim()
    };
    Store.updateBusiness(BIZ.id, patch);
    BIZ = Store.findBusiness(BIZ.id);
    document.getElementById('biz-tag').textContent = `${BIZ.name} · ${BIZ.id}`;
    document.getElementById('biz-avatar').textContent = Utils.initials(BIZ.name);
    Toast.show('Profile updated.', 'success');
  });
}