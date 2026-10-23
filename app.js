/* =========================================================
   Warung Pojok Mamah David — front-end only
   Pesanan dikirim ke email penjual via Web3Forms
   ========================================================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rp = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { toast('Penyimpanan penuh.', 'err'); return false; } };

/* =========================================================
   KONFIGURASI EMAIL — GANTI DI SINI
   ========================================================= */
const WEB3FORMS_KEY = '738e6f6e-0fc3-4def-8520-fddf4d24e0f0';

/* =========================================================
   MENU
   ========================================================= */
const TOP = ['Kerupuk', 'Bakso', 'Sosis', 'Ceker', 'Makaroni', 'Telur', 'Mie', 'Sayuran', 'Cikur', 'Tulang', 'Basreng', 'Dumpling'];

const MENU = [
  {
    id: 'm1',
    name: 'Ayam Kocak Super Pedas',
    price: 10000,
    cat: 'Ayam',
    type: 'normal',
    desc: 'Ayam goreng saus kocak super pedas.',
    available: true,
    img: 'img/ayam-kocak.jpg',
    toppings: [],
    flavors: ['Normal', 'Pedas', 'Super pedas'],
    addon: { name: 'Nasi', price: 5000 }
  },
  {
    id: 'm2',
    name: 'Seblak',
    price: 1000,
    cat: 'Seblak',
    type: 'seblak',
    desc: 'Pilih topping sesukamu, mulai Rp1.000 per topping.',
    available: false,
    upcoming: true,
    img: 'img/seblak.jpg',
    toppings: TOP,
    flavors: []
  },
    {
    id: 'm2b',
    name: 'Baso Kuah',
    price: 6000,
    cat: 'Menu Serba 6000',
    type: 'normal',
    desc: 'Baso sapi kuah gurih, hangat dan mantap.',
    available: false,
    upcoming: true,
    img: 'img/baso-kuah.jpg',
    toppings: [],
    flavors: []
  },
  ...[
    { name: 'Spaghetti Chicken', img: 'img/spaghetti-chicken.jpg' },
    { name: 'Pasta Macaroni',    img: 'img/pasta-macaroni.jpg' },
    { name: 'Kentang Frozen',    img: 'img/kentang-frozen.jpg' },
    { name: 'Steak Chicken',     img: 'img/steak-chicken.jpg' },
    { name: 'Chicken Katsu',     img: 'img/chicken-katsu.jpg' },
    { name: 'Chicken Cheese',    img: 'img/chicken-cheese.jpg' },
    { name: 'Kebab',             img: 'img/kebab.jpg' },
    { name: 'Baso Bakar',        img: 'img/baso-bakar.jpg' },
    { name: 'Topoki',            img: 'img/topoki.jpg' }
  ].map((item, i) => ({
    id: 'm' + (i + 3),
    name: item.name,
    price: 6000,
    cat: 'Menu Serba 6000',
    type: 'normal',
    desc: 'Menu serba Rp6.000.',
    available: true,
    img: item.img,
    toppings: [],
    flavors: []
  }))
];

/* =========================================================
   SETTINGS TOKO
   ========================================================= */
const SETTINGS = {
  storeName: 'Warung Pojok Mamah David',
  phone: '0821-1447-9342',
  address: 'Cipagalo Kulon, RT 02, RW 03',
  heroVideo: ''
};

let menu = MENU;
let settings = SETTINGS;
let cart = load('wp_cart', []);
let activeCat = 'Semua';

/* ---------- util ---------- */
function toast(msg, type = '') {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show ' + type;
  clearTimeout(toast.t); toast.t = setTimeout(() => t.className = 'toast', 3500);
}
const openM = id => $('#' + id).classList.add('open');
const closeM = el => el.classList.remove('open');
const hue = m => 6 + [...(m.name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 44;
const picHTML = m => m.img ? `<img src="${m.img}" alt="${esc(m.name)}" loading="lazy">` : `<div class="ph" style="--h:${hue(m)}">${esc((m.name || '?')[0].toUpperCase())}</div>`;
const needsOpts = m => m.type === 'seblak' || m.flavors.length > 0 || !!m.addon;
const optText = c => [c.flavor ? 'Rasa: ' + c.flavor : '', c.toppings.length ? 'Topping: ' + c.toppings.join(', ') : '', c.addon ? '+ Nasi' : ''].filter(Boolean).join(' • ');

/* animasi keranjang */
function fly(from, m) {
  if (!from || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const f = from.getBoundingClientRect();
  const sx = f.left + f.width / 2, sy = f.top + f.height / 2;
  const tx = innerWidth / 2, ty = innerHeight - 42;
  const cx = sx + (tx - sx) * .85, cy = sy + (ty - sy) * .25;
  const el = document.createElement('div'); el.className = 'fly';
  el.innerHTML = `<div class="fly-pic">${m.img ? `<img src="${m.img}" alt="">` : esc((m.name || '?')[0].toUpperCase())}</div><span class="fly-plus">+1</span>`;
  document.body.appendChild(el);
  const cols = ['#ffc933', '#ff8a3d', '#d62718', '#fff'];
  const dot = (x, y, size, keys, ms, col) => {
    const d = document.createElement('i'); d.className = 'fx';
    d.style.cssText = `width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;background:${col}`;
    document.body.appendChild(d);
    d.animate(keys(x, y), { duration: ms, easing: 'ease-out', fill: 'forwards' }).onfinish = () => d.remove();
  };
  const hit = () => {
    $('#cartBar').animate([{ transform: 'translateX(-50%) scale(1)' }, { transform: 'translateX(-50%) scale(1.06,.9)', offset: .3 }, { transform: 'translateX(-50%) scale(.98,1.06)', offset: .6 }, { transform: 'translateX(-50%) scale(1)' }], { duration: 450, easing: 'ease-out' });
    const r = document.createElement('i'); r.className = 'fx'; r.style.cssText = 'width:30px;height:30px;margin:-15px 0 0 -15px;border:3px solid #ffc933;border-radius:50%';
    document.body.appendChild(r);
    r.animate([{ transform: `translate(${tx}px,${ty}px) scale(.6)`, opacity: 1 }, { transform: `translate(${tx}px,${ty}px) scale(4.5)`, opacity: 0 }], { duration: 550, easing: 'ease-out' }).onfinish = () => r.remove();
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2, d = 46 + Math.random() * 26;
      dot(tx, ty, 7, (x, y) => [{ transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1 }, { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d}px) scale(0)`, opacity: 0 }], 600, cols[i % 4]);
    }
    const b = $('#cartBadge'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  };
  const D = 760, t0 = performance.now(); let last = 0;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const step = now => {
    const t = Math.min(1, (now - t0) / D), e = ease(t), u = 1 - e;
    const x = u * u * sx + 2 * u * e * cx + e * e * tx, y = u * u * sy + 2 * u * e * cy + e * e * ty;
    el.style.transform = `translate3d(${x}px,${y}px,0) scale(${1 - .62 * e}) rotate(${-10 + 24 * e}deg)`;
    el.style.opacity = t > .9 ? (1 - t) * 10 : 1;
    if (now - last > 30 && t < .95) { last = now; dot(x, y, 8 + Math.random() * 8, (px, py) => [{ transform: `translate(${px}px,${py}px) scale(1)`, opacity: .85 }, { transform: `translate(${px}px,${py}px) scale(0)`, opacity: 0 }], 480, cols[Math.floor(Math.random() * 3)]); }
    if (t < 1) requestAnimationFrame(step); else { el.remove(); hit(); }
  };
  requestAnimationFrame(step);
}

/* ticker */
let tickKey = '';
function buildTicker() {
  const items = menu.filter(m => m.available).map(m => `<span>${esc(m.name)} ${m.type === 'seblak' ? 'mulai ' : ''}${rp(m.price)}</span>`).join('');
  const key = items + innerWidth; if (key === tickKey) return; tickKey = key;
  const el = $('#tickerIn'), make = n => `<div class="ticker-group">${items.repeat(n)}</div>`;
  el.innerHTML = make(1);
  const w = el.firstElementChild.getBoundingClientRect().width || 1, n = Math.ceil(innerWidth * 1.2 / w);
  el.innerHTML = make(n) + make(n);
  el.style.setProperty('--tick-dur', Math.max(14, el.firstElementChild.getBoundingClientRect().width / 70) + 's');
}

/* ---------- keranjang ---------- */
const itemPrice = c => { const m = menu.find(x => x.id === c.id); if (!m) return 0; const base = m.type === 'seblak' ? m.price * Math.max(1, c.toppings.length) : m.price; return base + (c.addon && m.addon ? m.addon.price : 0); };
const cartCount = () => cart.reduce((a, c) => a + c.qty, 0);
const cartTotal = () => cart.reduce((a, c) => a + itemPrice(c) * c.qty, 0);
function saveCart() { save('wp_cart', cart); renderCartUI(); }
function addToCart(id, toppings = [], flavor = '', src = null, addon = false) {
  const key = id + '|' + flavor + '|' + [...toppings].sort().join(',') + (addon ? '|nasi' : '');
  const ex = cart.find(c => c.key === key);
  if (ex) ex.qty++; else cart.push({ key, id, qty: 1, toppings, flavor, addon });
  fly(src, menu.find(m => m.id === id)); saveCart(); toast('Masuk keranjang');
}
function renderCartUI() {
  cart = cart.filter(c => menu.find(m => m.id === c.id && m.available));
  const n = cartCount();
  $('#cartBadge').textContent = n;
  $('#cartBar').hidden = n === 0;
  $('#cartBarText').textContent = `${n} item • ${rp(cartTotal())}`;
  $('#cartTotal').textContent = rp(cartTotal());
  $('#btnCheckout').disabled = n === 0;
  $('#cartList').innerHTML = n === 0
    ? '<div class="empty"><div class="big-emoji">🛒</div><p>Keranjang masih kosong.<br>Yuk pilih menu favoritmu!</p></div>'
    : cart.map(c => {
      const m = menu.find(x => x.id === c.id);
      return `<div class="cart-item">
        <div class="ico">${picHTML(m)}</div>
        <div>
          <b>${esc(m.name)}</b>
          ${optText(c) ? `<small>${esc(optText(c))}</small>` : ''}
          <small>${rp(itemPrice(c))} / porsi</small>
        </div>
        <div style="text-align:right">
          <div class="qty">
            <button data-act="dec" data-key="${esc(c.key)}" aria-label="Kurangi">−</button>
            <span>${c.qty}</span>
            <button data-act="inc" data-key="${esc(c.key)}" aria-label="Tambah">+</button>
          </div>
          <small style="margin-top:4px;display:block"><b>${rp(itemPrice(c) * c.qty)}</b></small>
        </div>
      </div>`;
    }).join('');
  renderMenu();
}

/* ---------- halaman pembeli ---------- */
function renderMenu() {
  const name = settings.storeName; document.title = name;
  $('#brandName').textContent = name.replace(/^Warung Pojok\s*/i, '') || name;
  const hero = $('#hero'), v = hero.querySelector('video');
  if (settings.heroVideo && (!v || v.getAttribute('src') !== settings.heroVideo)) {
    v?.remove(); hero.insertAdjacentHTML('afterbegin', `<video class="hero-video" src="${esc(settings.heroVideo)}" autoplay muted loop playsinline></video>`);
  } else if (!settings.heroVideo && v) v.remove();
  buildTicker();

  const cats = ['Semua', ...new Set(menu.map(m => m.cat))];
  $('#chips').innerHTML = cats.map(c => `<button class="chip ${c === activeCat ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  const list = menu.filter(m => activeCat === 'Semua' || m.cat === activeCat);
  $('#menuGrid').innerHTML = list.map(m => {
    const inCart = cart.filter(c => c.id === m.id).reduce((a, c) => a + c.qty, 0);
    const price = m.type === 'seblak' ? `${rp(m.price)} <small>/ topping</small>` : rp(m.price);
    const chips = [m.type === 'seblak' ? `${m.toppings.length} topping` : '', m.flavors.length ? `${m.flavors.length} pilihan rasa` : '', m.addon ? `Tambah nasi +${rp(m.addon.price)}` : ''].filter(Boolean);
    const label = m.upcoming ? 'Upcoming' : 'Habis';
    return `<article class="food ${m.available ? '' : m.upcoming ? 'upcoming' : 'soldout'}">
      ${!m.available ? `<span class="tag">${label}</span>` : ''}
      <div class="pic">${picHTML(m)}</div>
      <div class="body">
        <h4>${esc(m.name)}</h4>
        <p class="desc">${esc(m.desc)}</p>
        ${chips.length ? `<div class="opts">${chips.map(c => `<i>${c}</i>`).join('')}</div>` : ''}
        <div class="add">
          <span class="price">${price}</span>
          ${m.available ? `<button class="btn primary sm" data-add="${m.id}">${needsOpts(m) ? 'Pilih' : '+ Tambah'}${inCart ? ` (${inCart})` : ''}</button>` : m.upcoming ? '<button class="btn outline sm" disabled>Segera hadir</button>' : ''}
        </div>
      </div>
    </article>`;
  }).join('') || '<p class="empty">Belum ada menu.</p>';
  $('#fAddr').textContent = settings.address;
  const ph = $('#fPhone'); ph.textContent = settings.phone; ph.href = 'tel:' + settings.phone.replace(/[^\d+]/g, '');
}

/* ---------- pilihan rasa & topping ---------- */
let topSel = [], flavSel = '', addonSel = false, topItem = null, topSrc = null;
function openOpts(id, src) {
  topItem = menu.find(m => m.id === id); topSel = []; flavSel = ''; addonSel = false; topSrc = src;
  const m = topItem, seb = m.type === 'seblak';
  $('#topTitle').textContent = m.name;
  $('#topInfo').textContent = seb ? `${rp(m.price)} per topping.` : rp(m.price);
  $('#flavWrap').hidden = !m.flavors.length; $('#topWrap').hidden = !seb;
  $('#flavGrid').innerHTML = m.flavors.map(f => `<label class="top"><input type="radio" name="flav" value="${esc(f)}">${esc(f)}</label>`).join('');
  $('#topGrid').innerHTML = m.toppings.map(t => `<label class="top"><input type="checkbox" value="${esc(t)}">${esc(t)}</label>`).join('');
  $('#addonWrap').hidden = !m.addon;
  $('#addonGrid').innerHTML = m.addon ? `<label class="top"><input type="radio" name="addon" value="0" checked>Tanpa ${esc(m.addon.name.toLowerCase())}</label><label class="top"><input type="radio" name="addon" value="1">Tambah ${esc(m.addon.name.toLowerCase())} +${rp(m.addon.price)}</label>` : '';
  updOpts(); openM('m-topping');
}
function updOpts() {
  $$('#m-topping .top').forEach(l => l.classList.toggle('on', l.querySelector('input').checked));
  topSel = $$('#topGrid input:checked').map(i => i.value);
  flavSel = ($('#flavGrid input:checked') || {}).value || '';
  addonSel = ($('#addonGrid input:checked') || {}).value === '1';
  const m = topItem, seb = m.type === 'seblak', ad = addonSel && m.addon ? m.addon.price : 0;
  $('#topSum').textContent = seb ? `${topSel.length} topping • ${rp(topSel.length * m.price + ad)}` : rp(m.price + ad);
  $('#topAdd').disabled = (seb && !topSel.length) || (m.flavors.length > 0 && !flavSel);
}

/* ---------- checkout & kirim email ---------- */
function openCheckout() {
  if (!cart.length) return;
  closeM($('#m-cart'));
  const f = $('#checkoutForm'); f.reset();
  $('#addrWrap').hidden = true; $('#qrBox').hidden = true;
  const last = load('wp_buyer', null); if (last) { f.name.value = last.name; f.phone.value = last.phone; }
  const now = new Date(), pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  f.date.min = today; f.date.value = today;
  f.time.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  f.dataset.dtTouched = '';
  $('#dateWord').textContent = $('#timeWord').textContent = 'ambil';
  $('#sumBox').innerHTML = '<b>Ringkasan</b>' + cart.map(c => {
    const m = menu.find(x => x.id === c.id);
    return `<div class="ln"><span>${c.qty}× ${esc(m.name)}${optText(c) ? ` <small>(${esc(optText(c))})</small>` : ''}</span><span>${rp(itemPrice(c) * c.qty)}</span></div>`;
  }).join('') + `<div class="ln tot"><span>Total</span><span>${rp(cartTotal())}</span></div>`;
  openM('m-checkout');
}

function fmtSchedule(date, time) {
  const [y, m, d] = String(date).split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const ds = dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return `${ds}, pukul ${String(time).replace(':', '.')}`;
}

function buildOrderText(o) {
  const lines = [];
  lines.push('=== PESANAN BARU WARUNG POJOK MAMAH DAVID ===');
  lines.push('Waktu: ' + new Date(o.createdAt).toLocaleString('id-ID'));
  lines.push('');
  lines.push('NAMA: ' + o.customer.name);
  lines.push('HP/WA: ' + o.customer.phone);
  lines.push('MODE: ' + (o.customer.mode === 'antar' ? 'Diantar' : 'Ambil di warung'));
  if (o.customer.mode === 'antar') lines.push('ALAMAT: ' + o.customer.address);
  if (o.customer.note) lines.push('CATATAN: ' + o.customer.note);
  lines.push((o.customer.mode === 'antar' ? 'WAKTU ANTAR: ' : 'WAKTU AMBIL: ') + fmtSchedule(o.customer.date, o.customer.time));
  lines.push('PEMBAYARAN: ' + (o.pay === 'cash' ? 'Cash (bayar di tempat)' : 'Cashless'));
  lines.push('');
  lines.push('--- ITEM PESANAN ---');
  o.items.forEach((i, idx) => {
    lines.push(`${idx + 1}. ${i.qty}× ${i.name}${i.flavor ? ' [Rasa: ' + i.flavor + ']' : ''}${i.toppings && i.toppings.length ? ' [Topping: ' + i.toppings.join(', ') + ']' : ''}${i.addon ? ' [+ Nasi]' : ''} = ${rp(i.price * i.qty)}`);
  });
  lines.push('');
  lines.push('TOTAL: ' + rp(o.total));
  lines.push('');
  lines.push('=== AKHIR PESANAN ===');
  return lines.join('\n');
}

async function submitOrder(e) {
  e.preventDefault();
  const f = e.target;

  if (!WEB3FORMS_KEY || WEB3FORMS_KEY === 'GANTI_DENGAN_ACCESS_KEY_KAMU') {
    toast('Access Key Web3Forms belum diisi. Cek file app.js.', 'err');
    return;
  }

  if (f.mode.value === 'antar' && !f.address.value.trim()) {
    toast('Isi alamat pengantaran', 'err');
    return;
  }

  if (!f.dataset.dtTouched) {
    const n = new Date(), p = x => String(x).padStart(2, '0');
    f.date.value = `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
    f.time.value = `${p(n.getHours())}:${p(n.getMinutes())}`;
  }
  if (!f.date.value || !f.time.value) {
    toast('Isi tanggal dan jam pesanan', 'err');
    return;
  }
  if (new Date(`${f.date.value}T${f.time.value}`).getTime() < Date.now() - 60000) {
    toast('Tanggal/jam sudah lewat, pilih waktu yang akan datang', 'err');
    return;
  }

  const o = {
    createdAt: Date.now(),
    customer: {
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      date: f.date.value,
      time: f.time.value,
      mode: f.mode.value,
      address: f.address.value.trim(),
      note: f.note.value.trim()
    },
    items: cart.map(c => {
      const m = menu.find(x => x.id === c.id);
      return { name: m.name, qty: c.qty, price: itemPrice(c), toppings: c.toppings, flavor: c.flavor || '', addon: !!c.addon };
    }),
    total: cartTotal(),
    pay: f.pay.value
  };

  const btn = $('#btnSubmitOrder');
  btn.disabled = true;
  btn.textContent = 'Mengirim...';

  try {
    const body = {
      access_key: WEB3FORMS_KEY,
      subject: `Pesanan Baru: ${o.customer.name} - ${rp(o.total)}`,
      from_name: 'Warung Pojok Mamah David',
      botcheck: '',

      Nama: o.customer.name,
      WhatsApp: o.customer.phone,
      Mode: o.customer.mode === 'antar' ? 'Diantar' : 'Ambil di warung',
      Alamat: o.customer.address || '-',
      [o.customer.mode === 'antar' ? 'Waktu_Antar' : 'Waktu_Ambil']: fmtSchedule(o.customer.date, o.customer.time),
      Catatan: o.customer.note || '-',
      Pembayaran: o.pay === 'cash' ? 'Cash' : 'Cashless',
      Pesanan: o.items.map(i =>
        `${i.qty}x ${i.name}` +
        (i.flavor ? ` (Rasa: ${i.flavor})` : '') +
        (i.toppings && i.toppings.length ? ` (Topping: ${i.toppings.join(', ')})` : '') +
        (i.addon ? ' (+ Nasi)' : '') +
        ` = ${rp(i.price * i.qty)}`
      ).join('\n'),
      Total: rp(o.total),
      Waktu: new Date(o.createdAt).toLocaleString('id-ID'),
      Detail: buildOrderText(o)
    };

    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || `Gagal kirim (HTTP ${res.status})`);
    }

    save('wp_buyer', { name: o.customer.name, phone: o.customer.phone });
    cart = []; saveCart();
    closeM($('#m-checkout'));

    $('#okName').textContent = o.customer.name;
    $('#okTotal').textContent = rp(o.total);
    const first = (o.customer.name || '').trim().split(/\s+/)[0];
    $('#okTitle').textContent = first ? `Mantap, ${first}! Pesanan terkirim` : 'Pesanan terkirim!';
    $('#okPay').textContent = o.pay === 'cash' ? 'Cash (di tempat)' : 'Cashless';
    $('#okWhen').textContent = fmtSchedule(o.customer.date, o.customer.time);
    $('#okWhenLabel').textContent = o.customer.mode === 'antar' ? 'Waktu antar' : 'Waktu ambil';
    $('#okWaBtn').onclick = () => {
      const wa = settings.phone.replace(/[^\d]/g, '').replace(/^0/, '62');
      const msg = encodeURIComponent(
        `Halo Warung Pojok Mamah David 👋\n\n` +
        `Saya sudah pesan lewat website:\n` +
        `Nama: ${o.customer.name}\n` +
        `Total: ${rp(o.total)}\n` +
        `${o.customer.mode === 'antar' ? 'Diantar' : 'Diambil'}: ${fmtSchedule(o.customer.date, o.customer.time)}\n` +
        `Pembayaran: ${o.pay === 'cash' ? 'Cash' : 'Cashless'}\n\n` +
        `Mohon dikonfirmasi ya. Terima kasih! 🙏`
      );
      window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
    };

    openM('m-success');
    launchConfetti();
  } catch (err) {
    console.error('Submit error:', err);
    toast('Gagal mengirim pesanan: ' + err.message, 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kirim pesanan';
  }
}

/* ---------- confetti: dua meriam + hujan, di canvas layar penuh ---------- */
function launchConfetti() {
  const cv = $('#confetti');
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cancelAnimationFrame(cv._raf);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr, ctx = cv.getContext('2d');
  const cols = ['#d62718', '#ffc933', '#ff8a3d', '#fff6e6', '#1f9d55'];
  let ps = [], t0 = performance.now(), fired = [0, 0];
  const add = (x, y, a, s) => ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, w: (6 + Math.random() * 6) * dpr, h: (4 + Math.random() * 8) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .3, k: Math.random() * 6, c: cols[Math.random() * cols.length | 0], o: Math.random() > .6 });
  const cannon = side => { for (let i = 0; i < 55; i++) { const d = (40 + Math.random() * 35) * Math.PI / 180; add(side ? W : 0, H * .9, -(side ? Math.PI - d : d), (12 + Math.random() * 11) * dpr); } };
  (function frame(now) {
    const t = now - t0;
    if (t > 400 && !fired[0]) { fired[0] = 1; cannon(0); cannon(1); }
    if (t > 1100 && !fired[1]) { fired[1] = 1; cannon(0); cannon(1); }
    if (t > 1500 && t < 3600) for (let i = 0; i < 2; i++) add(Math.random() * W, -10, Math.PI / 2, 2 * dpr);
    ctx.clearRect(0, 0, W, H);
    ps = ps.filter(p => p.y < H + 30);
    for (const p of ps) {
      p.vy += .35 * dpr; p.vx *= .988; p.vy *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.k += .15;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.o) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 7); ctx.fill(); } else ctx.fillRect(-p.w / 2, -p.h / 2 * Math.cos(p.k), p.w, p.h * Math.cos(p.k));
      ctx.restore();
    }
    if (($('#m-success').classList.contains('open')) && (t < 4200 || ps.length)) cv._raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  })(t0);
}

/* ---------- event handling ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const closeBtn = t.closest('[data-close]'); if (closeBtn) return closeM(closeBtn.closest('.modal,.drawer'));
  if (t.classList.contains('modal') || t.classList.contains('drawer')) return closeM(t);
  const a = t.closest('[data-action]');
  if (a) {
    const k = a.dataset.action;
    if (k === 'open-cart') { renderCartUI(); openM('m-cart'); }
    if (k === 'checkout') openCheckout();
    if (k === 'home') { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); }
    if (k === 'qna') $('#qna').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const add = t.closest('[data-add]');
  if (add) { const m = menu.find(x => x.id === add.dataset.add); return needsOpts(m) ? openOpts(m.id, add) : addToCart(m.id, [], '', add); }
  const cat = t.closest('[data-cat]'); if (cat) { activeCat = cat.dataset.cat; return renderMenu(); }
  const act = t.closest('[data-act]');
  if (act) {
    const c = cart.find(x => x.key === act.dataset.key); if (!c) return;
    c.qty += act.dataset.act === 'inc' ? 1 : -1;
    if (c.qty <= 0) cart = cart.filter(x => x !== c);
    return saveCart();
  }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.closest('#m-topping')) updOpts();
  if (t.name === 'pay') $('#qrBox').hidden = t.value !== 'cashless';
  if (t.id === 'modeSel') {
    $('#addrWrap').hidden = t.value !== 'antar';
    $('#dateWord').textContent = $('#timeWord').textContent = t.value === 'antar' ? 'antar' : 'ambil';
  }
});

$('#topAdd').onclick = () => { addToCart(topItem.id, topSel, flavSel, $('#topAdd'), addonSel); closeM($('#m-topping')); };
$('#checkoutForm').addEventListener('submit', submitOrder);
$('#checkoutForm').addEventListener('input', e => {
  if (e.target.name === 'date' || e.target.name === 'time') e.currentTarget.dataset.dtTouched = '1';
});

/* =========================================================
   TANYA JAWAB & SARAN ANONIM
   ========================================================= */
const waNum = () => settings.phone.replace(/[^\d]/g, '').replace(/^0/, '62');
const FAQ = [
  {
    q: 'Gimana cara pesan?',
    k: 'order keranjang whatsapp konfirmasi',
    a: () => 'Pilih menu lalu tekan <b>Tambah</b>. Buka keranjang, isi nama dan nomor WhatsApp, lalu kirim pesanan. Lalu setelah itu konfirmasi ke penjual.'
  },
  {
    q: 'Bisa diantar ke rumah?',
    k: 'antar delivery alamat ambil',
    a: () => 'Bisa. Pilih <b>Diantar</b> di formulir pemesanan dan isi alamat lengkap. Kalau mau ambil sendiri, pilih <b>Ambil di warung</b>. Detail pengantaran dikonfirmasi penjual lewat WhatsApp.'
  },
  {
    q: 'Bayarnya gimana?',
    k: 'cash cashless transfer qris bayar',
    a: () => 'Ada dua pilihan: <b>Cash</b> (bayar di tempat) atau <b>Cashless</b> (transfer / QRIS). Setelah pesananmu masuk, penjual mengonfirmasi lewat WhatsApp.'
  },
  {
    q: 'Mau request tanpa bawang atau catatan lain?',
    k: 'catatan request bawang pedas',
    a: () => 'Tulis di kolom <b>Catatan</b> pada formulir pemesanan, misalnya "jangan pakai bawang".'
  },
  {
    q: 'Pesanan mau diubah atau dibatalkan, bisa?',
    k: 'ubah batal ganti salah',
    a: () => `Segera hubungi penjual lewat <a href="https://wa.me/${waNum()}" target="_blank" rel="noopener">WhatsApp</a> atau telepon <a href="tel:${esc(settings.phone.replace(/[^\d+]/g, ''))}">${esc(settings.phone)}</a>. Makin cepat kamu kabari, makin besar peluang pesanan masih bisa diubah.`
  },
  {
    q: 'Kok ada menu yang tidak bisa dipesan?',
    k: 'menu masih up coming untuk pembelian melalui website',
    a: () => 'Menu yang bertanda <b>Upcoming</b> sedang tidak tersedia. Coba cek lagi nanti atau pilih menu lain.'
  },
  {
    q: 'Data dan saranku aman?',
    k: 'privasi anonim nomor nama data',
    a: () => 'Nama dan nomor HP di formulir pesanan hanya dipakai untuk memproses pesananmu, lalu disimpan di HP-mu supaya tidak perlu mengetik ulang. Saran dan pertanyaan anonim tidak mengirim nama maupun nomor HP.'
  },
  {
    q: 'Di mana warungnya?',
    k: 'alamat lokasi telepon kontak',
    a: () => `${esc(settings.address)}. Telepon: <a href="tel:${esc(settings.phone.replace(/[^\d+]/g, ''))}">${esc(settings.phone)}</a>.`
  }
];

let faqHay = [];
function renderFaq() {
  $('#faqList').innerHTML = FAQ.map((f, i) => `<div class="faq-item${i === 0 ? ' open' : ''}">
    <h3><button type="button" class="faq-q" id="fq${i}" aria-expanded="${i === 0}" aria-controls="fa${i}"><span>${esc(f.q)}</span><i class="faq-ico" aria-hidden="true"></i></button></h3>
    <div class="faq-a" id="fa${i}" role="region" aria-labelledby="fq${i}"><div><p>${f.a()}</p></div></div>
  </div>`).join('');
  faqHay = FAQ.map(f => (f.q + ' ' + f.k + ' ' + f.a().replace(/<[^>]+>/g, ' ')).toLowerCase());
}

function filterFaq() {
  const q = $('#faqSearch').value.trim().toLowerCase();
  let n = 0;
  $$('#faqList .faq-item').forEach((el, i) => { const hit = !q || faqHay[i].includes(q); el.hidden = !hit; if (hit) n++; });
  $('#faqEmpty').hidden = n > 0;
  $('#faqQ').textContent = $('#faqSearch').value.trim();
}

function setTab(name, focus) {
  const send = name === 'send';
  $('#qnaTabs').style.setProperty('--i', send ? 1 : 0);
  $$('#qnaTabs [role="tab"]').forEach(b => {
    const on = b.dataset.tab === name;
    b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus();
  });
  $('#panel-faq').hidden = send; $('#panel-send').hidden = !send;
}

/* ---------- formulir saran ---------- */
let fbBusy = false;
const FB_HINT = {
  saran: ['Saranmu', 'Contoh: tolong tambah topping sosis bakar, atau rasa pedasnya pas banget…'],
  pertanyaan: ['Pertanyaanmu', 'Contoh: apakah bisa pesan 20 porsi untuk besok?']
};
function updFb() {
  const f = $('#feedbackForm'), kind = f.kind.value, len = f.msg.value.trim().length;
  $('#ratingWrap').hidden = kind !== 'saran';
  $('#fbMsgLabel').textContent = FB_HINT[kind][0];
  f.msg.placeholder = FB_HINT[kind][1];
  $('#fbCount').textContent = f.msg.value.length + '/500';
  $('#fbCount').classList.toggle('warn', f.msg.value.length >= 450);
  $('#fbHint').textContent = len < 10 ? `Tulis minimal 10 huruf (${len}/10)` : 'Siap dikirim';
  $('#fbHint').classList.toggle('ok', len >= 10);
  $('#fbBtn').disabled = len < 10 || fbBusy;
}
let draftT;
function saveDraft() {
  clearTimeout(draftT);
  draftT = setTimeout(() => {
    const f = $('#feedbackForm');
    try { localStorage.setItem('wp_fb_draft', JSON.stringify({ kind: f.kind.value, topic: f.topic.value, rating: f.rating.value, msg: f.msg.value })); } catch {}
  }, 300);
}
function restoreDraft() {
  const d = load('wp_fb_draft', null), f = $('#feedbackForm');
  if (!d) return;
  if (d.kind) f.kind.value = d.kind;
  if (d.topic) f.topic.value = d.topic;
  if (d.rating) f.rating.value = d.rating;
  if (d.msg) f.msg.value = String(d.msg).slice(0, 500);
}

async function submitFeedback(e) {
  e.preventDefault();
  const f = e.target, msg = f.msg.value.trim();
  if (msg.length < 10) return toast('Tulis minimal 10 huruf ya', 'err');
  const wait = 30000 - (Date.now() - Number(load('wp_fb_last', 0)));
  if (wait > 0) return toast(`Tunggu ${Math.ceil(wait / 1000)} detik sebelum kirim lagi`, 'err');
  if (!WEB3FORMS_KEY || WEB3FORMS_KEY === 'GANTI_DENGAN_ACCESS_KEY_KAMU') return toast('Access Key Web3Forms belum diisi. Cek file app.js.', 'err');

  const kind = f.kind.value, topic = f.topic.value, rating = kind === 'saran' ? (f.rating.value || '-') : '-';
  fbBusy = true; updFb();
  const btn = $('#fbBtn'); btn.classList.add('busy'); $('#fbBtnText').textContent = 'Mengirim…';
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `${kind === 'saran' ? 'Saran' : 'Pertanyaan'} anonim: ${topic}`,
        from_name: 'Anonim (website Warung Pojok)',
        botcheck: f.botcheck.checked ? 'true' : '',
        Pengirim: 'Anonim',
        Jenis: kind === 'saran' ? 'Saran' : 'Pertanyaan',
        Topik: topic,
        Kepuasan: rating,
        Pesan: msg,
        Waktu: new Date().toLocaleString('id-ID')
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || `Gagal kirim (HTTP ${res.status})`);

    save('wp_fb_last', Date.now());
    try { localStorage.removeItem('wp_fb_draft'); } catch {}
    f.reset(); fbBusy = false; updFb();
    $('#fbDoneSub').textContent = kind === 'saran'
      ? 'Sarannya sudah sampai ke penjual tanpa nama. Pendapatmu membantu warung ini makin enak.'
      : 'Pertanyaanmu sudah sampai ke penjual tanpa nama. Jawabannya bisa muncul di daftar Tanya jawab. Butuh cepat? Chat WhatsApp ya.';
    f.hidden = true; $('#fbDone').hidden = false; $('#fbDoneTitle').focus({ preventScroll: true });
  } catch (err) {
    console.error('Feedback error:', err);
    toast('Gagal mengirim: ' + err.message, 'err');
  } finally {
    fbBusy = false; btn.classList.remove('busy'); $('#fbBtnText').textContent = 'Kirim sebagai anonim'; updFb();
  }
}

function initQna() {
  renderFaq();
  const wa = $('#qnaWa'); wa.href = `https://wa.me/${waNum()}`;

  const box = $('#qnaBox');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    box.classList.add('pre');
    const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { box.classList.remove('pre'); io.disconnect(); } }, { threshold: .12 });
    io.observe(box);
  }

  $('#qnaTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
  $('#qnaTabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); setTab($('#panel-faq').hidden ? 'faq' : 'send', true);
  });

  $('#faqList').addEventListener('click', e => {
    const btn = e.target.closest('.faq-q'); if (!btn) return;
    const item = btn.closest('.faq-item'), willOpen = !item.classList.contains('open');
    $$('#faqList .faq-item.open').forEach(el => { el.classList.remove('open'); el.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); });
    if (willOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
  });
  $('#faqSearch').addEventListener('input', filterFaq);
  $('#faqAsk').addEventListener('click', () => {
    const f = $('#feedbackForm'), q = $('#faqSearch').value.trim();
    f.kind.value = 'pertanyaan';
    if (q && !f.msg.value.trim()) f.msg.value = q;
    $('#fbDone').hidden = true; f.hidden = false;
    updFb(); setTab('send'); f.msg.focus();
  });

  const f = $('#feedbackForm');
  restoreDraft(); updFb();
  f.addEventListener('input', () => { updFb(); saveDraft(); });
  f.addEventListener('submit', submitFeedback);
  $('#fbAgain').addEventListener('click', () => { $('#fbDone').hidden = true; f.hidden = false; f.msg.focus(); });
  $('#fbToFaq').addEventListener('click', () => { $('#fbDone').hidden = true; f.hidden = false; setTab('faq'); });
}

initQna();
renderMenu();
renderCartUI();
document.fonts?.ready.then(() => { tickKey = ''; buildTicker(); });
let rw = innerWidth; addEventListener('resize', () => { if (innerWidth !== rw) { rw = innerWidth; buildTicker(); } });

/* =========================================================
   MUSIK LATAR
   ========================================================= */
const MUSIC_SRC = 'audio/musik.mp3';
const MUSIC_VOL = 0.35;
(function initMusic() {
  const au = $('#bgm'), btn = $('#musicBtn');
  if (!au || !btn) return;
  au.src = MUSIC_SRC; au.volume = MUSIC_VOL; au.loop = true;
  let userMuted = load('wp_music_off', false);
  let wasPlaying = false;

  const sync = () => {
    const on = !au.paused;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Matikan musik' : 'Nyalakan musik');
    btn.title = on ? 'Matikan musik' : 'Nyalakan musik';
  };
  const tryPlay = () => au.play().then(sync, () => { sync(); return false; });

  au.addEventListener('play', sync);
  au.addEventListener('pause', sync);
  au.addEventListener('error', () => { btn.hidden = true; removeGesture(); });
  au.addEventListener('loadeddata', () => { btn.hidden = false; });

  btn.addEventListener('click', () => {
    if (au.paused) { userMuted = false; save('wp_music_off', false); tryPlay(); }
    else { userMuted = true; save('wp_music_off', true); au.pause(); }
  });

  const evs = ['pointerdown', 'touchstart', 'keydown'];
  function onGesture(e) {
    if (e.target.closest && e.target.closest('#musicBtn')) return;
    removeGesture();
    if (!userMuted && au.paused) tryPlay();
  }
  function removeGesture() { evs.forEach(ev => removeEventListener(ev, onGesture, true)); }
  if (!userMuted) {
    tryPlay().then(ok => { if (ok === false) evs.forEach(ev => addEventListener(ev, onGesture, true)); });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { wasPlaying = !au.paused; au.pause(); }
    else if (wasPlaying && !userMuted) tryPlay();
  });
})();

/* =========================================================
   INTRO SPLASH + SAMBUTAN (gelembung ucapan di hero)
   ========================================================= */
(function initIntro() {
  const intro = $('#intro');
  if (!intro) return;
  const src = $('.hero .bowl'), slot = $('#introBowl');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !src || !slot) { intro.remove(); showWelcome(); return; }
  document.body.classList.add('intro-lock');

  /* mangkuk intro = salinan mangkuk hero, jadi serah-terimanya mulus tanpa loncatan */
  const bowl = src.cloneNode(true);
  bowl.removeAttribute('class'); bowl.classList.add('ib'); bowl.id = 'introBowl';
  slot.replaceWith(bowl);

  const brand = $('#introBrand');
  brand.innerHTML = [...brand.textContent].map((ch, i) => `<i style="--i:${i}">${ch}</i>`).join('');

  /* percikan: ledakan kecil saat baso mendarat, lalu uap/bara naik dari mangkuk */
  const canvas = $('#introParticles'), ctx = canvas.getContext('2d');
  const D = devicePixelRatio || 1, COLORS = ['#ffc933', '#ffe08a', '#ff8a3d', '#fff6e6'];
  let W = 0, H = 0, ox = 0, oy = 0, ps = [], raf = 0, burst = false, leaving = false, t0 = performance.now();
  function resize() {
    W = canvas.width = innerWidth * D; H = canvas.height = innerHeight * D;
    const r = bowl.getBoundingClientRect();
    ox = (r.left + r.width / 2) * D; oy = (r.top + r.height * .45) * D;
  }
  const spark = (a, s, up) => ps.push({ x: ox + (up ? (Math.random() - .5) * 200 * D : 0), y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: (1.5 + Math.random() * 3.5) * D, color: COLORS[Math.random() * 4 | 0], life: 1, decay: .01 + Math.random() * .015, up });
  function draw(now) {
    const t = now - t0; ctx.clearRect(0, 0, W, H);
    if (t > 2100 && !burst) { burst = true; for (let i = 0; i < 36; i++) spark(Math.random() * 6.28, (1.5 + Math.random() * 3.5) * D, false); }
    if (t > 2300 && !leaving && ps.length < 70) spark(-Math.PI / 2, (.6 + Math.random() * 1.2) * D, true);
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.x += p.vx; p.y += p.vy; if (!p.up) p.vy += .05 * D; p.vx *= .985; p.life -= p.decay;
      if (p.life <= 0) { ps.splice(i, 1); continue; }
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, 7); ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  resize(); addEventListener('resize', resize); raf = requestAnimationFrame(draw);

  const timer = setTimeout(finishIntro, 4300);
  function finishIntro() {
    if (leaving) return; leaving = true; clearTimeout(timer);
    const body = document.body, stage = $('.bowl-stage');
    /* kalau dilewati di tengah jalan, selesaikan dulu animasi mangkuk supaya isinya lengkap */
    bowl.getAnimations({ subtree: true }).forEach(an => { if (an.effect.getComputedTiming().iterations !== Infinity) an.finish(); });
    body.classList.add('bowl-wait');
    body.classList.remove('intro-lock');
    intro.classList.add('done');
    const a = bowl.getBoundingClientRect(), b = src.getBoundingClientRect();

    intro.querySelectorAll('.intro-title,.intro-tagline,.intro-loader,.intro-skip,.intro-particles').forEach(el =>
      el.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-16px)' }], { duration: 450, easing: 'ease-in', fill: 'forwards' }));

    /* mangkuk "terbang" ke posisi mangkuk hero (kalau hero-nya terlihat), kalau tidak: membesar sambil memudar */
    const fits = b.width > 0 && b.top < innerHeight * .8 && b.bottom > 0;
    const to = fits
      ? { transform: `translate(${b.left + b.width / 2 - a.left - a.width / 2}px,${b.top + b.height / 2 - a.top - a.height / 2}px) scale(${b.width / a.width})` }
      : { transform: 'scale(1.12)', opacity: 0 };
    const fly = bowl.animate([{ transform: 'none', opacity: 1 }, to], { duration: 1050, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'forwards' });
    const land = () => {
      stage.style.transition = fits ? 'none' : 'opacity .7s ease';
      body.classList.remove('bowl-wait');
      bowl.style.visibility = 'hidden';
      showWelcome();
    };
    fly.finished.then(land, land);
    setTimeout(() => { cancelAnimationFrame(raf); removeEventListener('resize', resize); intro.remove(); }, 1300);
  }
  intro.addEventListener('click', finishIntro, { once: true });
})();

/* ---------- Sambutan: gelembung ucapan sesuai jam, diketik pelan ---------- */
function showWelcome() {
  const box = $('#heroGreet'); if (!box) return;
  const h = new Date().getHours();

  // Sapaan umum per jam — tidak mengasumsikan aktivitas (sarapan/makan siang/ngemil)
  const [hi, sub] = h < 4  ? ['Selamat malam', 'Lapar tengah malam? Tinggal pesan, kami siap.']
    : h < 11 ? ['Selamat pagi', 'Mau sarapan atau ngemil? Semua ada di sini.']
    : h < 15 ? ['Selamat siang', 'Jam makan siang nih. Mau yang mana?']
    : h < 18 ? ['Selamat sore', 'Pas banget buat ngemil sore.']
    :          ['Selamat malam', 'Mamah David siap masakin buat kamu.'];

  // Nama pembeli hanya dipakai jika memang ada (dari localStorage setelah pesan)
  const name = (load('wp_buyer', null)?.name || '').trim().split(/\s+/)[0];
  const full = name ? `${hi}, ${name}!` : `${hi}!`;

  const hiEl = $('#greetHi'), subEl = $('#greetSub');
  subEl.textContent = sub;
  box.hidden = false; box.classList.add('show');

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hiEl.textContent = full; return;
  }
  let i = 0;
  const tick = () => {
    hiEl.textContent = full.slice(0, ++i);
    if (i < full.length) setTimeout(tick, 45);
  };
  setTimeout(tick, 350);
}