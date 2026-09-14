let cat = 'Semua';
let products = [];
async function load(){
  const info = document.getElementById('info');
  const grid = document.getElementById('grid');
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

    info.textContent = products.length + ' produk';

    } catch (error) {
  console.error('Connection error:', error);
  info.textContent = 'Error koneksi: ' + error.message;
  grid.innerHTML = '<p>Gagal terhubung ke Supabase.</p>';
}
    info.textContent = 'Error koneksi: ' + err.message;
    grid.innerHTML = '<p>Gagal terhubung ke Supabase.</p>';
  }
}

function render(){
  let q=(document.getElementById('q').value||'').toLowerCase();

  let a=products.filter(p=>
    (err==='Semua'||p.category===cat)&&
    p.name.toLowerCase().includes(q)
  );

  document.getElementById('info').textContent=a.length+' produk';

  document.getElementById('grid').innerHTML=
    a.map(p=>`
      <article class="card">
        <img class="photo"
          src="${p.image_url||'assets/pensil_2b.jpg'}">
        <div class="info">
          <div class="cat">${p.category}</div>
          <div class="name">${p.name}</div>
          <div class="price">${rp(p.price)}</div>
          <button class="buy" onclick="add(${p.id})">
            + Keranjang
          </button>
        </div>
      </article>
    `).join('')||'<p>Tidak ada produk.</p>';

  document.getElementById('cartCount').textContent=
    cart.reduce((a,x)=>a+x.qty,0);
}

function add(id){
  let x=cart.find(c=>c.id===id);

  x?x.qty++:cart.push({id,qty:1});

  localStorage.setItem('sm_cart',JSON.stringify(cart));
  render();
}

function openCart(){
  let total=0;
  let html='<h2>🛒 Keranjang</h2>';

  html+=cart.length?
    cart.map((c,i)=>{
      let p=products.find(x=>x.id===c.id);
      if(!p)return '';

      total+=p.price*c.qty;

      return `
        <div class="cartrow">
          <div class="grow">
            <b>${p.name}</b><br>
            ${rp(p.price)} × ${c.qty}
          </div>
          <button onclick="qty(${i},-1)">−</button>
          <button onclick="qty(${i},1)">+</button>
          <button class="danger" onclick="removeC(${i})">
            Hapus
          </button>
        </div>
      `;
    }).join('')
    :
    '<p>Keranjang kosong.</p>';

  if(cart.length){
    html+=`
      <h3>Total ${rp(total)}</h3>
      <button class="save"
        onclick="alert('Checkout demo berhasil. Untuk pembayaran nyata, sambungkan payment gateway.');closeM()">
        Checkout Demo
      </button>
    `;
  }

  show(html);
}

function qty(i,d){
  cart[i].qty+=d;

  if(cart[i].qty<1)
    cart.splice(i,1);

  localStorage.setItem('sm_cart',JSON.stringify(cart));
  openCart();
  render();
}

function removeC(i){
  cart.splice(i,1);

  localStorage.setItem('sm_cart',JSON.stringify(cart));
  openCart();
  render();
}

function show(h){
  document.getElementById('modalContent').innerHTML=h;
  document.getElementById('modal').style.display='flex';
}

function closeM(){
  document.getElementById('modal').style.display='none';
}

document.getElementById('cartBtn').onclick=openCart;
document.getElementById('close').onclick=closeM;
document.getElementById('searchBtn').onclick=render;
document.getElementById('q').oninput=render;

document.getElementById('shop').onclick=()=>{
  document.querySelector('.products')
    .scrollIntoView({behavior:'smooth'});
};

document.querySelectorAll('nav button').forEach(b=>{
  b.onclick=()=>{
    cat=b.dataset.cat;
    render();
  };
});

load();
