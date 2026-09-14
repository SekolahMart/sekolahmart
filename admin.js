const login=document.getElementById('login');
const dash=document.getElementById('dashboard');
let editing=null;

function loginUI(){
  login.innerHTML=`
    <div class="loginbox">
      <h2>🔐 Admin SekolahMart</h2>
      <p>Masuk menggunakan akun admin Supabase.</p>

      <div class="field">
        <label>Email</label>
        <input id="email" type="email" placeholder="admin@email.com">
      </div>

      <div class="field">
        <label>Password</label>
        <input id="pass" type="password">
      </div>

      <button class="save" onclick="signIn()">Masuk</button>
      <p id="msg"></p>
    </div>
  `;
}

async function signIn(){
  let {error}=await sb.auth.signInWithPassword({
    email:email.value,
    password:pass.value
  });

  document.getElementById('msg').textContent=
    error?error.message:'';

  if(!error) boot();
}

async function boot(){
  let {data:{user}}=await sb.auth.getUser();

  if(!user){
    loginUI();
    return;
  }

  login.hidden=true;
  dash.hidden=false;
  load();
}

async function load(){
  let {data}=await sb.from('products')
    .select('*')
    .order('created_at',{ascending:false});

  document.getElementById('adminList').innerHTML=
    (data||[]).map(p=>`
      <div class="adminrow">
        <img src="${p.image_url||'assets/pensil_2b.jpg'}">

        <div class="grow">
          <b>${p.name}</b><br>
          ${rp(p.price)} • ${p.category}
        </div>

        <button class="small" onclick="edit(${p.id})">
          Edit
        </button>

        <button class="danger" onclick="del(${p.id})">
          Hapus
        </button>
      </div>
    `).join('');
}

const rp=n=>new Intl.NumberFormat('id-ID',{
  style:'currency',
  currency:'IDR',
  maximumFractionDigits:0
}).format(n);

function form(p={
  id:null,
  name:'',
  price:'',
  category:'Alat Tulis',
  image_url:''
}){
  editing=p;

  document.getElementById('modalContent').innerHTML=`
    <h2>${p.id?'Edit':'Tambah'} Produk</h2>

    <div class="field">
      <label>Nama</label>
      <input id="pn" value="${p.name}">
    </div>

    <div class="field">
      <label>Harga</label>
      <input id="pp" type="number" value="${p.price}">
    </div>

    <div class="field">
      <label>Kategori</label>

      <select id="pc">
        <option>Alat Tulis</option>
        <option>Buku</option>
        <option>Seragam</option>
        <option>Perlengkapan</option>
      </select>
    </div>

    <div class="field">
      <label>URL foto</label>
      <input id="pi" value="${p.image_url}">
    </div>

    <button class="save" onclick="saveP()">
      Simpan
    </button>
  `;

  pc.value=p.category;

  document.getElementById('modal').style.display='flex';
}

async function saveP(){

  let row={
    name:pn.value.trim(),
    price:Number(pp.value),
    category:pc.value,
    image_url:pi.value.trim(),
    active:true
  };

  let r=editing?.id
    ?await sb.from('products')
      .update(row)
      .eq('id',editing.id)
    :await sb.from('products')
      .insert(row);

  if(r.error){
    alert(r.error.message);
  }else{
    closeM();
    load();
  }
}

function edit(id){
  sb.from('products')
    .select('*')
    .eq('id',id)
    .single()
    .then(r=>form(r.data));
}

async function del(id){
  if(confirm('Hapus produk?')){
    let r=await sb.from('products')
      .update({active:false})
      .eq('id',id);

    if(r.error) alert(r.error.message);

    load();
  }
}

function closeM(){
  document.getElementById('modal').style.display='none';
}

document.getElementById('close').onclick=closeM;

document.getElementById('add').onclick=()=>form();

document.getElementById('logout').onclick=async()=>{
  await sb.auth.signOut();
  location.reload();
};

boot();
