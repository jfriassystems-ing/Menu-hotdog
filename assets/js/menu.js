import { supabase } from './supabase-client.js';
import { CONFIG } from './config.js';

// Utilidades
const priceFormatter = new Intl.NumberFormat(CONFIG.LOCALE, {
  style: 'currency',
  currency: CONFIG.CURRENCY,
  minimumFractionDigits: 0,
});

function formatPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) ? priceFormatter.format(n) : '—';
}

// Estado global
let allCategories = [];
let allProducts = [];
let activeCategoryId = null;

// Referencias DOM
const el = {
  viewCategories: document.getElementById('view-categories'),
  categoriesGrid: document.getElementById('categories-grid'),
  viewProducts: document.getElementById('view-products'),
  productsGrid: document.getElementById('products-grid'),
  btnBack: document.getElementById('btn-back'),
  activeCategoryTitle: document.getElementById('active-category-title'),
  stateLoading: document.getElementById('state-loading'),
  stateError: document.getElementById('state-error'),
  retryBtn: document.getElementById('retry-btn'),
  year: document.getElementById('year'),
  footerContact: document.getElementById('footer-contact'),
};

el.year.textContent = new Date().getFullYear();

/* =========================================
   CARGA DE DATOS
   ========================================= */
async function loadData() {
  el.stateLoading.hidden = false;
  el.viewCategories.hidden = true;
  el.viewProducts.hidden = true;
  el.stateError.hidden = true;

  try {
    // Cargar Configuración del sitio
    const { data: settings } = await supabase
      .from('site_settings')
      .select('contact_information')
      .eq('id', 1)
      .maybeSingle();

    if (settings?.contact_information?.phone) {
      el.footerContact.innerHTML = `📞 <a href="tel:${settings.contact_information.phone}" style="color:var(--accent-gold);text-decoration:none;">${settings.contact_information.phone}</a>`;
    }

    // Cargar Categorías Activas
    const { data: cats, error: catsErr } = await supabase
      .from('categories')
      .select('id, name, image_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (catsErr) throw catsErr;
    allCategories = cats || [];

    // Cargar Productos Activos y Disponibles
    const { data: prods, error: prodsErr } = await supabase
      .from('products')
      .select('id, category_id, name, description, price, image_url, is_available')
      .eq('is_active', true)
      .eq('is_available', true)
      .order('sort_order', { ascending: true });
    
    if (prodsErr) throw prodsErr;
    allProducts = prods || [];

    // Renderizar Vista A
    renderCategories();
    el.stateLoading.hidden = true;
    el.viewCategories.hidden = false;

  } catch (err) {
    console.error('Error cargando datos:', err);
    el.stateLoading.hidden = true;
    el.stateError.hidden = false;
  }
}

/* =========================================
   VISTA A: RENDERIZAR CATEGORÍAS (ZIGZAG)
   ========================================= */
function renderCategories() {
  el.categoriesGrid.innerHTML = '';

  if (allCategories.length === 0) {
    el.categoriesGrid.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No hay categorías disponibles.</p>';
    return;
  }

  allCategories.forEach((cat, index) => {
    // Si el índice es impar (1, 3, 5...), la imagen va a la derecha
    const isReverse = index % 2 !== 0;
    const imgUrl = cat.image_url || '/assets/images/placeholder.svg';
    
    const card = document.createElement('div');
    card.className = `category-card ${isReverse ? 'reverse' : ''}`;
    
    card.innerHTML = `
      <img src="${imgUrl}" alt="${cat.name}" class="category-card-img" loading="lazy">
      <div class="category-card-content">
        <h3 class="category-card-name">${cat.name}</h3>
        <span class="category-card-btn">Ver Productos →</span>
      </div>
    `;
    
    // Al hacer clic, ir a la Vista B
    card.addEventListener('click', () => showProductsByCategory(cat.id, cat.name));
    el.categoriesGrid.appendChild(card);
  });
}

/* =========================================
   VISTA B: RENDERIZAR PRODUCTOS
   ========================================= */
function showProductsByCategory(categoryId, categoryName) {
  activeCategoryId = categoryId;
  
  // Actualizar títulos
  el.activeCategoryTitle.textContent = categoryName;
  
  // Filtrar productos
  const filtered = allProducts.filter(p => p.category_id === categoryId);
  el.productsGrid.innerHTML = '';

  if (filtered.length === 0) {
    el.productsGrid.innerHTML = '<p style="text-align:center; color:var(--text-muted); grid-column: 1/-1;">No hay productos en esta categoría.</p>';
  } else {
    filtered.forEach(prod => {
      const imgUrl = prod.image_url || '/assets/images/placeholder.svg';
      const statusText = prod.is_available ? 'Disponible' : 'Agotado';
      const statusClass = prod.is_available ? '' : 'agotado';

      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${imgUrl}" alt="${prod.name}" class="product-card-img" loading="lazy">
        <div class="product-card-body">
          <div>
            <h3 class="product-card-name">${prod.name}</h3>
            ${prod.description ? `<p class="product-card-desc">${prod.description}</p>` : ''}
          </div>
          <div class="product-card-bottom">
            <span class="product-card-price">${formatPrice(prod.price)}</span>
            <span class="product-card-status ${statusClass}">${statusText}</span>
          </div>
        </div>
      `;
      el.productsGrid.appendChild(card);
    });
  }

  // Cambiar de vista (Ocultar A, Mostrar B)
  el.viewCategories.hidden = true;
  el.viewProducts.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =========================================
   NAVEGACIÓN
   ========================================= */
el.btnBack.addEventListener('click', () => {
  activeCategoryId = null;
  el.viewProducts.hidden = true;
  el.viewCategories.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

el.retryBtn.addEventListener('click', loadData);

// Iniciar
loadData();