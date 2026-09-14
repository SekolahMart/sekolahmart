let cat = 'Semua';
let products = [];
let cart = JSON.parse(localStorage.getItem('sm_cart') || '[]');

function rp(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

async function load() {
  const info = document.getElementById('info');
  const grid = document.getElementById('grid');

  if (!info || !grid) {
    console.error('Elemen #info atau #grid tidak ditemukan.');
    return;
  }

  info.textContent = 'Memuat produk...';

  try {
    const { data, error } = await sb
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      info.textContent = 'Error Supabase: ' + error.message;
      grid.innerHTML = '<p>Gagal mengambil produk.</p>';
      return;
    }

    products = data || [];
    render();

  } catch (error) {
    console.error('Connection error:', error);
    info.textContent = 'Error koneksi: ' + error.message;
    grid.innerHTML = '<p>Gagal terhubung ke Supabase.</p>';
  }
}

function render() {
  const qEl = document.getElementById('q');
  const grid = document.getElementById('grid');
  const info = document.getElementById('info');
  const cartCount = document.getElementById('cartCount');

  if (!grid) return;

  const q = (qEl?.value || '').toLowerCase().trim();

  const filtered = products.filter(p => {
    const name = String(p.name || '').toLowerCase();
    const category = String(p.category || '');

    return (
      (cat === 'Semua' || category === cat) &&
      name.includes(q)
    );
  });

  grid.innerHTML = filtered.map(p => `
    <article class="card">

      <img
        class="photo"
        src="${p.image_url || 'assets/pensil_2b.jpg'}"
        alt="${p.name || 'Produk'}"
        onerror="this.src='assets/pensil_2b.jpg'"
      >

      <div class="info">

        <div class="cat">
          ${p.category || 'Umum'}
        </div>

        <div class="name">
          ${p.name || 'Produk'}
        </div>

        <div class="price">
          ${rp(p.price)}
        </div>

        <button
          class="buy"
          onclick="add(${JSON.stringify(p.id)})">
          + Keranjang
        </button>

      </div>

    </article>
  `).join('') || '<p>Tidak ada produk.</p>';

  if (info) {
    info.textContent = filtered.length + ' produk';
  }

  if (cartCount) {
    cartCount.textContent =
      cart.reduce(
        (total, item) => total + Number(item.qty || 0),
        0
      );
  }
}

function add(id) {
  const existing =
    cart.find(c => String(c.id) === String(id));

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: id,
      qty: 1
    });
  }

  saveCart();
  render();
}

function openCart() {
  let total = 0;

  let html = '<h2>🛒 Keranjang</h2>';

  const validCart = cart.filter(c =>
    products.some(
      p => String(p.id) === String(c.id)
    )
  );

  html += validCart.length
    ? validCart.map(c => {

        const index = cart.indexOf(c);

        const p = products.find(
          x => String(x.id) === String(c.id)
        );

        if (!p) return '';

        total +=
          Number(p.price || 0) *
          Number(c.qty || 0);

        return `
          <div class="cartrow">

            <div class="grow">
              <b>${p.name}</b><br>
              ${rp(p.price)} × ${c.qty}
            </div>

            <button onclick="qty(${index}, -1)">
              −
            </button>

            <button onclick="qty(${index}, 1)">
              +
            </button>

            <button
              class="danger"
              onclick="removeC(${index})">
              Hapus
            </button>

          </div>
        `;

      }).join('')

    : '<p>Keranjang kosong.</p>';

  if (validCart.length) {

    html += `
      <h3>
        Total ${rp(total)}
      </h3>

      <button
        class="save"
        onclick="alert('Checkout demo berhasil. Untuk pembayaran nyata, sambungkan payment gateway.'); closeM()">

        Checkout Demo

      </button>
    `;
  }

  show(html);
}

function qty(i, d) {

  if (!cart[i]) return;

  cart[i].qty += d;

  if (cart[i].qty < 1) {
    cart.splice(i, 1);
  }

  saveCart();

  openCart();

  render();
}

function removeC(i) {

  if (!cart[i]) return;

  cart.splice(i, 1);

  saveCart();

  openCart();

  render();
}

function saveCart() {

  localStorage.setItem(
    'sm_cart',
    JSON.stringify(cart)
  );
}

function show(html) {

  const content =
    document.getElementById('modalContent');

  const modal =
    document.getElementById('modal');

  if (!content || !modal) return;

  content.innerHTML = html;

  modal.style.display = 'flex';
}

function closeM() {

  const modal =
    document.getElementById('modal');

  if (modal) {
    modal.style.display = 'none';
  }
}

function setupEvents() {

  const cartBtn =
    document.getElementById('cartBtn');

  const closeBtn =
    document.getElementById('close');

  const searchBtn =
    document.getElementById('searchBtn');

  const q =
    document.getElementById('q');

  const shop =
    document.getElementById('shop');

  if (cartBtn) {
    cartBtn.onclick = openCart;
  }

  if (closeBtn) {
    closeBtn.onclick = closeM;
  }

  if (searchBtn) {
    searchBtn.onclick = render;
  }

  if (q) {
    q.oninput = render;
  }

  if (shop) {

    shop.onclick = () => {

      const productsSection =
        document.querySelector('.products');

      if (productsSection) {

        productsSection.scrollIntoView({
          behavior: 'smooth'
        });

      }
    };
  }

  document
    .querySelectorAll('nav button')
    .forEach(button => {

      button.onclick = () => {

        cat =
          button.dataset.cat || 'Semua';

        render();
      };

    });
}

document.addEventListener(
  'DOMContentLoaded',
  () => {

    setupEvents();

    render();

    load();

  }
);
