import { supabase } from './supabase-client.js';
import { uploadImage } from './cloudinary.js';

let allProducts = [];
let allCategories = [];

// Referencias DOM
const views = document.querySelectorAll('.admin-view');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('page-title');
const logoutBtn = document.getElementById('logout-btn');

// Formularios
const containerProd = document.getElementById('form-product-container');
const formProd = document.getElementById('form-product');
const formProdTitle = document.getElementById('form-prod-title');

const containerCat = document.getElementById('form-category-container');
const formCat = document.getElementById('form-category');
const formCatTitle = document.getElementById('form-cat-title');

// Previsualización de imágenes
const fileInputProd = document.getElementById('prod-img-file');
const previewContainerProd = document.getElementById('img-preview-container');
const previewImgProd = document.getElementById('img-preview');

const fileInputCat = document.getElementById('cat-img-file');
const previewContainerCat = document.getElementById('cat-img-preview-container');
const previewImgCat = document.getElementById('cat-img-preview');

// Verificar sesión
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) window.location.replace('/admin/login.html');
}

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.replace('/admin/login.html');
});

// Navegación
navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    navItems.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    views.forEach(v => v.hidden = true);
    
    containerProd.hidden = true;
    containerCat.hidden = true;
    
    const targetId = btn.getAttribute('data-target');
    document.getElementById(targetId).hidden = false;
    
    if (targetId === 'view-productos') { pageTitle.textContent = 'Gestión de Productos'; loadProducts(); }
    if (targetId === 'view-categorias') { pageTitle.textContent = 'Gestión de Categorías'; loadCategories(); }
    if (targetId === 'view-ajustes') { pageTitle.textContent = 'Ajustes Generales'; loadSettings(); }
  });
});

/* =========================================
   MANEJO DE IMÁGENES (PREVIEW)
   ========================================= */
fileInputProd.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      previewImgProd.src = ev.target.result;
      previewContainerProd.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    previewContainerProd.style.display = 'none';
    previewImgProd.src = '';
  }
});

fileInputCat.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      previewImgCat.src = ev.target.result;
      previewContainerCat.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    previewContainerCat.style.display = 'none';
    previewImgCat.src = '';
  }
});

/* =========================================
   PRODUCTOS
   ========================================= */
document.getElementById('btn-new-product').addEventListener('click', () => {
  formProd.reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-img-url').value = '';
  document.getElementById('prod-img-publicid').value = '';
  fileInputProd.value = '';
  previewContainerProd.style.display = 'none';
  formProdTitle.textContent = 'Nuevo Producto';
  
  const select = document.getElementById('prod-cat');
  select.innerHTML = allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  
  containerProd.hidden = false;
});

document.getElementById('btn-cancel-prod').addEventListener('click', () => {
  containerProd.hidden = true;
});

formProd.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = formProd.querySelector('button[type="submit"]');
  btn.textContent = 'Guardando...';
  btn.disabled = true;

  const id = document.getElementById('prod-id').value;
  const imageFile = fileInputProd.files[0];
  let imageUrl = document.getElementById('prod-img-url').value;
  let imagePublicId = document.getElementById('prod-img-publicid').value;

  try {
    // Subir imagen si hay una nueva
    if (imageFile) {
      btn.textContent = 'Subiendo imagen...';
      const uploadResult = await uploadImage(imageFile);
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.public_id;
    }

    const payload = {
      name: document.getElementById('prod-name').value.trim(),
      price: parseFloat(document.getElementById('prod-price').value),
      category_id: document.getElementById('prod-cat').value,
      description: document.getElementById('prod-desc').value.trim() || null,
      image_url: imageUrl || null,
      image_public_id: imagePublicId || null
    };

    if (id) await supabase.from('products').update(payload).eq('id', id);
    else await supabase.from('products').insert([payload]);
    
    alert('Producto guardado exitosamente');
    containerProd.hidden = true;
    loadProducts();
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btn.textContent = 'Guardar Producto';
    btn.disabled = false;
  }
});

async function loadProducts() {
  const tbody = document.getElementById('tbody-products');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>';
  
  const { data, error } = await supabase.from('products').select(`*, categories (name)`).order('sort_order', { ascending: true });

  if (error) { tbody.innerHTML = `<tr><td colspan="6" style="color:red">Error</td></tr>`; return; }

  allProducts = data;
  tbody.innerHTML = '';

  data.forEach(p => {
    const imgTag = p.image_url 
      ? `<img src="${p.image_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;">` 
      : `<span style="color: var(--text-muted);">Sin foto</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${imgTag}</td>
      <td><strong>${p.name}</strong></td>
      <td>${p.categories?.name || 'Sin categoría'}</td>
      <td class="text-gold">$${p.price}</td>
      <td><span class="${p.is_available ? 'badge-active' : 'badge-inactive'}">${p.is_available ? 'Disponible' : 'Agotado'}</span></td>
      <td>
        <button class="btn-icon btn-edit" data-id="${p.id}">✏️</button>
        <button class="btn-icon btn-toggle" data-id="${p.id}" data-status="${p.is_available}">${p.is_available ? '🚫' : '✅'}</button>
        <button class="btn-icon btn-delete" data-id="${p.id}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Editar
  document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', (e) => {
    const p = allProducts.find(x => x.id === e.target.dataset.id);
    document.getElementById('prod-id').value = p.id;
    formProdTitle.textContent = 'Editar Producto';
    
    const select = document.getElementById('prod-cat');
    select.innerHTML = allCategories.map(c => `<option value="${c.id}" ${p.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
    
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-desc').value = p.description || '';
    document.getElementById('prod-img-url').value = p.image_url || '';
    document.getElementById('prod-img-publicid').value = p.image_public_id || '';
    
    if (p.image_url) {
      previewImgProd.src = p.image_url;
      previewContainerProd.style.display = 'block';
    } else {
      previewContainerProd.style.display = 'none';
    }
    fileInputProd.value = ''; // Limpiar input

    containerProd.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  // Borrar
  document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', async (e) => {
    if (!confirm('¿Eliminar producto?')) return;
    await supabase.from('products').delete().eq('id', e.target.dataset.id);
    loadProducts();
  }));

  // Cambiar estado
  document.querySelectorAll('.btn-toggle').forEach(b => b.addEventListener('click', async (e) => {
    const status = e.target.dataset.status === 'true';
    await supabase.from('products').update({ is_available: !status }).eq('id', e.target.dataset.id);
    loadProducts();
  }));
}

/* =========================================
   CATEGORÍAS
   ========================================= */
document.getElementById('btn-new-category').addEventListener('click', () => {
  formCat.reset();
  document.getElementById('cat-id').value = '';
  document.getElementById('cat-img-url').value = '';
  document.getElementById('cat-img-publicid').value = '';
  fileInputCat.value = '';
  previewContainerCat.style.display = 'none';
  
  formCatTitle.textContent = 'Nueva Categoría';
  document.getElementById('cat-order').value = allCategories.length + 1;
  containerCat.hidden = false;
});

document.getElementById('btn-cancel-cat').addEventListener('click', () => {
  containerCat.hidden = true;
});

formCat.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = formCat.querySelector('button[type="submit"]');
  btn.textContent = 'Guardando...';
  btn.disabled = true;

  const id = document.getElementById('cat-id').value;
  const imageFile = fileInputCat.files[0];
  let imageUrl = document.getElementById('cat-img-url').value;
  let imagePublicId = document.getElementById('cat-img-publicid').value;

  try {
    if (imageFile) {
      btn.textContent = 'Subiendo imagen...';
      const uploadResult = await uploadImage(imageFile);
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.public_id;
    }

    const payload = {
      name: document.getElementById('cat-name').value.trim(),
      sort_order: parseInt(document.getElementById('cat-order').value),
      image_url: imageUrl || null,
      image_public_id: imagePublicId || null
    };

    if (id) await supabase.from('categories').update(payload).eq('id', id);
    else await supabase.from('categories').insert([payload]);
    
    alert('Categoría guardada');
    containerCat.hidden = true;
    
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    allCategories = data || [];
    loadCategories();
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btn.textContent = 'Guardar Categoría';
    btn.disabled = false;
  }
});

async function loadCategories() {
  const tbody = document.getElementById('tbody-categories');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  
  if (error) { tbody.innerHTML = `<tr><td colspan="5" style="color:red">Error</td></tr>`; return; }
  
  allCategories = data;
  tbody.innerHTML = '';

  data.forEach(c => {
    const imgTag = c.image_url 
      ? `<img src="${c.image_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;">` 
      : `<span style="color: var(--text-muted);">Sin foto</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${imgTag}</td>
      <td><strong>${c.name}</strong></td>
      <td>${c.sort_order}</td>
      <td><span class="${c.is_active ? 'badge-active' : 'badge-inactive'}">${c.is_active ? 'Activa' : 'Inactiva'}</span></td>
      <td>
        <button class="btn-icon btn-edit-cat" data-id="${c.id}">✏️</button>
        <button class="btn-icon btn-delete-cat" data-id="${c.id}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.btn-edit-cat').forEach(b => b.addEventListener('click', (e) => {
    const c = allCategories.find(x => x.id === e.target.dataset.id);
    document.getElementById('cat-id').value = c.id;
    formCatTitle.textContent = 'Editar Categoría';
    document.getElementById('cat-name').value = c.name;
    document.getElementById('cat-order').value = c.sort_order;
    document.getElementById('cat-img-url').value = c.image_url || '';
    document.getElementById('cat-img-publicid').value = c.image_public_id || '';
    
    if (c.image_url) {
      previewImgCat.src = c.image_url;
      previewContainerCat.style.display = 'block';
    } else {
      previewContainerCat.style.display = 'none';
    }
    fileInputCat.value = '';

    containerCat.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  document.querySelectorAll('.btn-delete-cat').forEach(b => b.addEventListener('click', async (e) => {
    if (!confirm('¿Eliminar categoría?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', e.target.dataset.id);
    if (error) alert('No se puede borrar: tiene productos asignados.');
    else loadCategories();
  }));
}

/* =========================================
   AJUSTES
   ========================================= */
async function loadSettings() {
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
  if (data) {
    document.getElementById('set-name').value = data.site_name || '';
    document.getElementById('set-phone').value = data.contact_information?.phone || '';
    document.getElementById('set-desc').value = data.description || '';
  }
}

document.getElementById('form-settings').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Guardando...';
  
  const updates = {
    site_name: document.getElementById('set-name').value,
    description: document.getElementById('set-desc').value,
    contact_information: { phone: document.getElementById('set-phone').value }
  };

  const { error } = await supabase.from('site_settings').update(updates).eq('id', 1);
  
  if (error) alert('Error al guardar');
  else alert('¡Guardado!');
  
  btn.textContent = 'Guardar Cambios';
});

// Iniciar
checkAuth();
supabase.from('categories').select('*').order('sort_order').then(({data}) => { 
  allCategories = data || []; 
  loadProducts(); 
});