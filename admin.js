const login = document.getElementById('login');
const dash = document.getElementById('dashboard');

let editing = null;


// ===============================
// FORMAT RUPIAH
// ===============================
const rp = n =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n);


// ===============================
// LOGIN UI
// ===============================
function loginUI(){

  login.innerHTML = `
    <div class="loginbox">

      <h1>Admin SekolahMart</h1>

      <div class="field">
        <label>Email</label>
        <input id="email" type="email" placeholder="Email admin">
      </div>

      <div class="field">
        <label>Password</label>
        <input id="password" type="password" placeholder="Password">
      </div>

      <button class="save" onclick="signIn()">
        Masuk
      </button>

    </div>
  `;

}


// ===============================
// LOGIN
// ===============================
async function signIn(){

  const email =
    document.getElementById('email').value.trim();

  const password =
    document.getElementById('password').value;

  if(!email || !password){

    alert('Email dan password wajib diisi.');

    return;
  }

  const { error } =
    await sb.auth.signInWithPassword({
      email,
      password
    });

  if(error){

    alert('Login gagal: ' + error.message);

    return;
  }

  boot();

}


// ===============================
// CEK LOGIN
// ===============================
async function boot(){

  const {
    data: {
      session
    }
  } = await sb.auth.getSession();

  if(!session){

    login.style.display = 'block';
    dash.style.display = 'none';

    loginUI();

    return;
  }

  login.style.display = 'none';
  dash.style.display = 'block';

  load();

}


// ===============================
// LOAD PRODUK
// ===============================
async function load(){

  const {
    data,
    error
  } = await sb
    .from('products')
    .select('*')
    .order('created_at', {
      ascending: false
    });

  if(error){

    alert('Gagal mengambil produk: ' + error.message);

    return;
  }

  document.getElementById('adminList').innerHTML =
    (data || []).map(p => `

      <div class="adminrow">

        <img
          src="${p.image_url || 'assets/pensil_2b.jpg'}"
          onerror="this.src='assets/pensil_2b.jpg'"
        >

        <div class="grow">

          <b>${p.name}</b>

          <br>

          ${rp(p.price)} • ${p.category}

        </div>

        <button
          class="small"
          onclick="edit(${p.id})"
        >
          Edit
        </button>

        <button
          class="danger"
          onclick="del(${p.id})"
        >
          Hapus
        </button>

      </div>

    `).join('');

}


// ===============================
// FORM TAMBAH / EDIT
// ===============================
function form(p = {

  id: null,
  name: '',
  price: '',
  category: 'Alat Tulis',
  image_url: ''

}){

  editing = p;

  document.getElementById('modalContent').innerHTML = `

    <h2>
      ${p.id ? 'Edit' : 'Tambah'} Produk
    </h2>


    <div class="field">

      <label>Nama Produk</label>

      <input
        id="pn"
        type="text"
        value="${p.name || ''}"
        placeholder="Nama produk"
      >

    </div>


    <div class="field">

      <label>Harga</label>

      <input
        id="pp"
        type="number"
        value="${p.price || ''}"
        placeholder="Contoh: 5000"
      >

    </div>


    <div class="field">

      <label>Kategori</label>

      <select id="pc">

        <option value="Alat Tulis">
          Alat Tulis
        </option>

        <option value="Buku">
          Buku
        </option>

        <option value="Seragam">
          Seragam
        </option>

        <option value="Perlengkapan">
          Perlengkapan
        </option>

      </select>

    </div>


    <div class="field">

      <label>Foto Produk</label>

      <input
        id="photoFile"
        type="file"
        accept="image/*"
      >

      <small>
        Pilih foto dari HP. Maksimal 5 MB.
        Jika tidak memilih foto baru,
        foto lama tetap digunakan.
      </small>

    </div>


    <button
      class="save"
      onclick="saveP()"
    >
      Simpan
    </button>

  `;


  document.getElementById('pc').value =
    p.category || 'Alat Tulis';


  document.getElementById('modal').style.display =
    'flex';

}


// ===============================
// SIMPAN PRODUK
// ===============================
async function saveP(){

  const name =
    document.getElementById('pn')
      .value
      .trim();


  const price =
    Number(
      document.getElementById('pp').value
    );


  const category =
    document.getElementById('pc').value;


  const fileInput =
    document.getElementById('photoFile');


  const file =
    fileInput
      ? fileInput.files[0]
      : null;


  // =============================
  // VALIDASI NAMA
  // =============================
  if(!name){

    alert('Nama produk wajib diisi.');

    return;
  }


  // =============================
  // VALIDASI HARGA
  // =============================
  if(!price || price < 0){

    alert('Harga produk tidak valid.');

    return;
  }


  // =============================
  // FOTO LAMA
  // =============================
  let image_url =
    editing?.image_url || '';


  // =============================
  // UPLOAD FOTO BARU
  // =============================
  if(file){

    // Pastikan file gambar
    if(!file.type.startsWith('image/')){

      alert('File harus berupa gambar.');

      return;
    }


    // Maksimal 5 MB
    if(file.size > 5 * 1024 * 1024){

      alert('Ukuran foto maksimal 5 MB.');

      return;
    }


    // Ambil ekstensi file
    const ext =
      file.name
        .split('.')
        .pop()
        .toLowerCase();


    // Nama file unik
    const fileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;


    // ===========================
    // UPLOAD KE SUPABASE STORAGE
    // ===========================
    const {
      error: uploadError
    } = await sb.storage
      .from('product-images')
      .upload(
        fileName,
        file,
        {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        }
      );


    if(uploadError){

      alert(
        'Upload foto gagal: ' +
        uploadError.message
      );

      return;
    }


    // ===========================
    // AMBIL URL FOTO
    // ===========================
    const {
      data: publicData
    } = sb.storage
      .from('product-images')
      .getPublicUrl(fileName);


    image_url =
      publicData.publicUrl;

  }


  // =============================
  // DATA PRODUK
  // =============================
  const row = {

    name: name,

    price: price,

    category: category,

    image_url: image_url,

    active: true

  };


  let r;


  // =============================
  // EDIT PRODUK
  // =============================
  if(editing?.id){

    r = await sb
      .from('products')
      .update(row)
      .eq('id', editing.id);

  }


  // =============================
  // TAMBAH PRODUK
  // =============================
  else{

    r = await sb
      .from('products')
      .insert(row);

  }


  // =============================
  // HASIL SIMPAN
  // =============================
  if(r.error){

    alert(
      'Gagal menyimpan: ' +
      r.error.message
    );

  }

  else{

    alert(
      'Produk berhasil disimpan.'
    );

    closeM();

    load();

  }

}


// ===============================
// EDIT PRODUK
// ===============================
function edit(id){

  sb
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
    .then(r => {

      if(r.error){

        alert(
          'Gagal mengambil produk: ' +
          r.error.message
        );

        return;
      }

      form(r.data);

    });

}


// ===============================
// HAPUS / NONAKTIFKAN PRODUK
// ===============================
async function del(id){

  if(!confirm('Hapus produk?')){

    return;
  }


  const r =
    await sb
      .from('products')
      .update({
        active: false
      })
      .eq('id', id);


  if(r.error){

    alert(
      'Gagal menghapus: ' +
      r.error.message
    );

    return;
  }


  alert('Produk berhasil dihapus.');

  load();

}


// ===============================
// TUTUP MODAL
// ===============================
function closeM(){

  document.getElementById('modal')
    .style.display = 'none';

}


// ===============================
// TOMBOL TUTUP
// ===============================
document.getElementById('close')
  .onclick = closeM;


// ===============================
// TOMBOL TAMBAH PRODUK
// ===============================
document.getElementById('add')
  .onclick = () => form();


// ===============================
// LOGOUT
// ===============================
document.getElementById('logout')
  .onclick = async () => {

    await sb.auth.signOut();

    location.reload();

  };


// ===============================
// MULAI APLIKASI
// ===============================
boot();
