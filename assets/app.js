
const App = (() => {
  const state = {
    catalog: null,
    products: [],
    cart: JSON.parse(localStorage.getItem('ac_cart') || '[]')
  };

  const money = (value) => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(value || 0);

  async function loadCatalog() {
    if (state.catalog) return state.catalog;
    const res = await fetch('assets/products.json');
    state.catalog = await res.json();
    state.products = state.catalog.products || [];
    return state.catalog;
  }

  function saveCart() {
    localStorage.setItem('ac_cart', JSON.stringify(state.cart));
    updateCartUI();
  }

  function getCartCount() {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  async function getProduct(id) {
    await loadCatalog();
    return state.products.find(p => p.id === id);
  }

  async function getProductBySlug(slug) {
    await loadCatalog();
    return state.products.find(p => p.slug === slug);
  }

  async function addToCart(productId, quantity = 1) {
    const existing = state.cart.find(item => item.id === productId);
    if (existing) existing.quantity += quantity;
    else state.cart.push({ id: productId, quantity });
    saveCart();
    openCart();
  }

  function setQuantity(productId, quantity) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity = Math.max(1, quantity);
    saveCart();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
  }

  async function getCartDetailed() {
    await loadCatalog();
    return state.cart.map(item => {
      const product = state.products.find(p => p.id === item.id);
      return product ? {...product, quantity: item.quantity, lineTotal: product.price * item.quantity } : null;
    }).filter(Boolean);
  }

  function cartSubtotal(items) {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  }

  function currentPage() {
    const file = location.pathname.split('/').pop() || 'index.html';
    return file === '' ? 'index.html' : file;
  }

  function headerMarkup() {
    return `
      <header class="site-header">
        <div class="container header-inner">
          <a class="logo" href="index.html" aria-label="Alder & Cove home">
            <img src="assets/logo.svg" alt="Alder & Cove" />
          </a>
          <button class="mobile-toggle" type="button" aria-label="Toggle navigation">Menu</button>
          <nav class="nav">
            <a href="index.html" data-page="index.html">Home</a>
            <a href="shop.html" data-page="shop.html">Shop</a>
            <a href="about.html" data-page="about.html">About</a>
            <a href="contact.html" data-page="contact.html">Contact</a>
          </nav>
          <div class="header-actions">
            <button class="cart-button" type="button">
              <span>Cart</span>
              <span class="cart-count">0</span>
            </button>
          </div>
        </div>
      </header>
    `;
  }

  function footerMarkup() {
    return `
      <footer class="site-footer">
        <div class="container footer-grid">
          <div>
            <img src="assets/logo.svg" alt="Alder & Cove" style="width:220px;max-width:100%;margin-bottom:16px" />
            <p class="muted">A curated bath furnishings storefront with a calm, architectural point of view.</p>
            <p class="small" style="margin-top:12px">Customer care: <a href="mailto:info@foothillslistings.online">info@foothillslistings.online</a></p>
          </div>
          <div>
            <h4>Explore</h4>
            <div class="footer-links">
              <a href="shop.html">Shop Vanities</a>
              <a href="about.html">About Alder & Cove</a>
              <a href="contact.html">Contact</a>
              <a href="checkout.html">Checkout</a>
            </div>
          </div>
          <div>
            <h4>Policies</h4>
            <div class="footer-links">
              <a href="shipping.html">Shipping Policy</a>
              <a href="returns.html">Returns & Refunds</a>
              <a href="privacy.html">Privacy Policy</a>
              <a href="terms.html">Terms of Service</a>
              <a href="payment-policy.html">Payment Policy</a>
            </div>
          </div>
        </div>
        <div class="container footer-legal">
          <div>© <span id="year"></span> Alder & Cove. Operated by Foothills Online Listings LLC.</div>
        </div>
      </footer>
    `;
  }

  function cartDrawerMarkup() {
    return `
      <div class="cart-backdrop"></div>
      <aside class="cart-drawer" aria-label="Shopping cart">
        <div class="cart-header">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:16px">
            <div>
              <div class="eyebrow">Your cart</div>
              <h3 style="margin:8px 0 0">Alder & Cove</h3>
            </div>
            <button class="button button-secondary close-cart" type="button">Close</button>
          </div>
        </div>
        <div class="cart-items"></div>
        <div class="cart-footer">
          <div class="total-row"><span>Subtotal</span><strong class="cart-subtotal">$0.00</strong></div>
          <a class="button button-primary" href="checkout.html" style="width:100%">Proceed to Checkout</a>
          <p class="small" style="margin-top:12px">Taxes are calculated during checkout. Processing time: 72 hours.</p>
        </div>
      </aside>
    `;
  }

  async function initLayout() {
    document.body.insertAdjacentHTML('afterbegin', headerMarkup());
    document.body.insertAdjacentHTML('beforeend', cartDrawerMarkup());
    document.body.insertAdjacentHTML('beforeend', footerMarkup());

    document.querySelectorAll('.nav a').forEach(link => {
      if (link.dataset.page === currentPage()) link.classList.add('active');
    });
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    document.querySelector('.cart-button')?.addEventListener('click', openCart);
    document.querySelector('.close-cart')?.addEventListener('click', closeCart);
    document.querySelector('.cart-backdrop')?.addEventListener('click', closeCart);
    document.querySelector('.mobile-toggle')?.addEventListener('click', () => {
      document.querySelector('.nav')?.classList.toggle('open');
    });

    await loadCatalog();
    updateCartUI();
  }

  function openCart() {
    document.querySelector('.cart-drawer')?.classList.add('open');
    document.querySelector('.cart-backdrop')?.classList.add('open');
  }

  function closeCart() {
    document.querySelector('.cart-drawer')?.classList.remove('open');
    document.querySelector('.cart-backdrop')?.classList.remove('open');
  }

  function stars(rating) {
    if (!rating) return '';
    return `★ ${rating.toFixed(1)}`;
  }

  function productCard(product) {
    const compare = product.compareAt ? `<span class="compare-price">${money(product.compareAt)}</span>` : '';
    const rating = product.rating ? `<div class="rating">${stars(product.rating)} · ${product.reviewCount} reviews</div>` : '';
    return `
      <article class="product-card">
        <a class="image-wrap" href="product.html?slug=${encodeURIComponent(product.slug)}">
          <img src="${product.image}" alt="${product.name}" loading="lazy" />
        </a>
        <div class="content">
          <span class="badge">${product.badge}</span>
          <h3 style="font-size:34px;margin-top:12px"><a href="product.html?slug=${encodeURIComponent(product.slug)}">${product.name}</a></h3>
          <div class="card-meta">
            <span class="meta-pill">${product.mount}</span>
            <span class="meta-pill">${product.widthInches ? `${product.widthInches}" wide` : 'Curated size'}</span>
            <span class="meta-pill">${product.sinkCount === 2 ? 'Double sink' : 'Single sink'}</span>
          </div>
          ${rating}
          <div class="price-row">
            <span class="price">${money(product.price)}</span>
            ${compare}
          </div>
          <div class="card-actions">
            <a class="button button-secondary" href="product.html?slug=${encodeURIComponent(product.slug)}">View Details</a>
            <button class="button button-primary" data-add-cart="${product.id}" type="button">Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }

  function wireAddToCart(scope = document) {
    scope.querySelectorAll('[data-add-cart]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        await addToCart(btn.dataset.addCart, 1);
        btn.disabled = false;
      });
    });
  }

  async function updateCartUI() {
    const count = getCartCount();
    const countEl = document.querySelector('.cart-count');
    if (countEl) countEl.textContent = count;

    const itemsEl = document.querySelector('.cart-items');
    const subtotalEl = document.querySelector('.cart-subtotal');
    if (!itemsEl || !subtotalEl) return;

    const items = await getCartDetailed();
    if (!items.length) {
      itemsEl.innerHTML = `<div class="empty-state">Your cart is empty for now. Start with a vanity that fits your space and finish preference.</div>`;
      subtotalEl.textContent = money(0);
      return;
    }
    itemsEl.innerHTML = items.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <h4>${item.name}</h4>
          <div class="small">${item.mount} · ${item.widthInches ? `${item.widthInches}"` : 'Curated size'}</div>
          <div class="small" style="margin:8px 0">${money(item.price)} each</div>
          <div class="quantity-row">
            <div class="qty-control">
              <button type="button" data-qty-minus="${item.id}">−</button>
              <input type="number" min="1" value="${item.quantity}" data-qty-input="${item.id}" />
              <button type="button" data-qty-plus="${item.id}">+</button>
            </div>
            <span class="line-total">${money(item.lineTotal)}</span>
          </div>
          <div style="margin-top:10px"><button class="remove-link" type="button" data-remove-cart="${item.id}">Remove</button></div>
        </div>
      </div>
    `).join('');
    subtotalEl.textContent = money(cartSubtotal(items));

    itemsEl.querySelectorAll('[data-remove-cart]').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.removeCart));
    });
    itemsEl.querySelectorAll('[data-qty-minus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const found = state.cart.find(i => i.id === btn.dataset.qtyMinus);
        if (found) setQuantity(found.id, Math.max(1, found.quantity - 1));
      });
    });
    itemsEl.querySelectorAll('[data-qty-plus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const found = state.cart.find(i => i.id === btn.dataset.qtyPlus);
        if (found) setQuantity(found.id, found.quantity + 1);
      });
    });
    itemsEl.querySelectorAll('[data-qty-input]').forEach(input => {
      input.addEventListener('change', () => setQuantity(input.dataset.qtyInput, parseInt(input.value, 10) || 1));
    });
  }

  async function renderFeatured(selector, limit = 4) {
    await loadCatalog();
    const target = document.querySelector(selector);
    if (!target) return;
    const ids = state.catalog.featured || [];
    const items = ids.map(id => state.products.find(p => p.id === id)).filter(Boolean).slice(0, limit);
    target.innerHTML = items.map(productCard).join('');
    wireAddToCart(target);
  }

  async function renderShop() {
    await loadCatalog();
    const grid = document.querySelector('#product-grid');
    const search = document.querySelector('#search');
    const mount = document.querySelector('#mount-filter');
    const width = document.querySelector('#width-filter');
    const sort = document.querySelector('#sort-filter');
    const summary = document.querySelector('#results-summary');
    if (!grid) return;

    const draw = () => {
      let results = [...state.products];
      const q = (search?.value || '').trim().toLowerCase();
      if (q) {
        results = results.filter(product =>
          [product.name, product.description, product.finish, product.material, product.collection]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q)
        );
      }
      if (mount?.value) results = results.filter(product => product.mount === mount.value);
      if (width?.value) {
        results = results.filter(product => {
          const w = product.widthInches || 0;
          if (width.value === 'small') return w > 0 && w < 36;
          if (width.value === 'medium') return w >= 36 && w <= 48;
          if (width.value === 'large') return w > 48;
          return true;
        });
      }
      if (sort?.value === 'price-asc') results.sort((a,b) => a.price - b.price);
      if (sort?.value === 'price-desc') results.sort((a,b) => b.price - a.price);
      if (sort?.value === 'rating-desc') results.sort((a,b) => (b.rating || 0) - (a.rating || 0));
      if (sort?.value === 'featured') {
        const featuredSet = new Set(state.catalog.featured || []);
        results.sort((a,b) => Number(featuredSet.has(b.id)) - Number(featuredSet.has(a.id)));
      }
      summary.textContent = `${results.length} vanity${results.length === 1 ? '' : 'ies'} available`;
      grid.innerHTML = results.length ? results.map(productCard).join('') : `<div class="empty-state">No products match that filter combination yet.</div>`;
      wireAddToCart(grid);
    };

    [search, mount, width, sort].forEach(el => el?.addEventListener('input', draw));
    [mount, width, sort].forEach(el => el?.addEventListener('change', draw));
    draw();
  }

  async function renderProductPage() {
    const mount = document.querySelector('#product-page');
    if (!mount) return;
    await loadCatalog();
    const params = new URLSearchParams(location.search);
    const slug = params.get('slug');
    const product = await getProductBySlug(slug);
    if (!product) {
      mount.innerHTML = `<div class="empty-state">That product could not be found.</div>`;
      return;
    }
    document.title = `${product.name} · Alder & Cove`;
    const compare = product.compareAt ? `<span class="compare-price">${money(product.compareAt)}</span>` : '';
    mount.innerHTML = `
      <section class="section">
        <div class="container product-layout">
          <div class="product-gallery">
            <div class="panel">
              <img src="${product.image}" alt="${product.name}" />
            </div>
          </div>
          <div class="product-info info-stack">
            <div>
              <div class="eyebrow">${product.badge}</div>
              <h1 class="title">${product.name}</h1>
              <div class="rating">${stars(product.rating)} · ${product.reviewCount} reviews</div>
              <div class="price-row" style="margin-top:18px">
                <span class="price">${money(product.price)}</span>
                ${compare}
              </div>
            </div>
            <p class="lede">${product.description}</p>
            <div class="spec-grid">
              <div class="spec"><label>Mount</label><strong>${product.mount}</strong></div>
              <div class="spec"><label>Width</label><strong>${product.widthInches ? `${product.widthInches}"` : 'See details'}</strong></div>
              <div class="spec"><label>Sinks</label><strong>${product.sinkCount === 2 ? 'Double sink' : 'Single sink'}</strong></div>
              <div class="spec"><label>Material</label><strong>${product.material}</strong></div>
              <div class="spec"><label>Finish</label><strong>${product.finish}</strong></div>
              <div class="spec"><label>Processing</label><strong>Ships in 72 hours</strong></div>
            </div>
            <div class="quantity-row">
              <div class="qty-control">
                <button type="button" id="qty-minus">−</button>
                <input type="number" id="product-qty" min="1" value="1" />
                <button type="button" id="qty-plus">+</button>
              </div>
              <button class="button button-primary" type="button" id="add-product-cart">Add to Cart</button>
              <a class="button button-secondary" href="checkout.html">Go to Checkout</a>
            </div>
            <div class="notice">Taxes are calculated in checkout. Returns accepted within 30 days of delivery. Secure payment is processed through embedded Stripe checkout.</div>
          </div>
        </div>
      </section>

      <section class="section" style="padding-top:0">
        <div class="container split">
          <div class="panel pad">
            <div class="eyebrow">Highlights</div>
            <h2>Designed for refined daily use</h2>
            <ul class="feature-list">${product.features.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>
          <div class="panel pad">
            <div class="eyebrow">Assurance</div>
            <h2>Store policies at a glance</h2>
            <div class="table-like">
              <div class="row"><span>Processing time</span><strong>72 hours</strong></div>
              <div class="row"><span>Return window</span><strong>30 days</strong></div>
              <div class="row"><span>Shipping scope</span><strong>United States</strong></div>
              <div class="row"><span>Support</span><strong><a href="mailto:info@foothillslistings.online">Email only</a></strong></div>
            </div>
          </div>
        </div>
      </section>

      <section class="section" style="padding-top:0">
        <div class="container">
          <div class="eyebrow">You may also like</div>
          <h2>More from the collection</h2>
          <div id="related-products" class="grid grid-3"></div>
        </div>
      </section>
    `;

    document.getElementById('qty-minus').addEventListener('click', () => {
      const input = document.getElementById('product-qty');
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
      const input = document.getElementById('product-qty');
      input.value = (parseInt(input.value, 10) || 1) + 1;
    });
    document.getElementById('add-product-cart').addEventListener('click', async () => {
      const qty = parseInt(document.getElementById('product-qty').value, 10) || 1;
      await addToCart(product.id, qty);
    });

    const related = state.products
      .filter(item => item.id !== product.id && (item.mount === product.mount || item.widthInches === product.widthInches))
      .slice(0,3);
    const relatedMount = document.getElementById('related-products');
    relatedMount.innerHTML = related.map(productCard).join('');
    wireAddToCart(relatedMount);
  }

  async function renderCheckoutPage() {
    const mount = document.querySelector('#checkout-page');
    if (!mount) return;
    await loadCatalog();
    const items = await getCartDetailed();
    if (!items.length) {
      mount.innerHTML = `
        <section class="section">
          <div class="container">
            <div class="empty-state">
              <h2>Your cart is empty</h2>
              <p>Add a vanity before starting checkout.</p>
              <a class="button button-primary" href="shop.html" style="margin-top:16px">Browse the Collection</a>
            </div>
          </div>
        </section>
      `;
      return;
    }
    const subtotal = cartSubtotal(items);
    mount.innerHTML = `
      <section class="section">
        <div class="container checkout-shell">
          <aside class="panel pad">
            <div class="eyebrow">Order summary</div>
            <h2>Checkout</h2>
            <div class="table-like">
              ${items.map(item => `
                <div class="row">
                  <div>
                    <strong>${item.name}</strong>
                    <div class="small">Qty ${item.quantity}</div>
                  </div>
                  <strong>${money(item.lineTotal)}</strong>
                </div>`).join('')}
              <div class="row"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
              <div class="row"><span>Taxes</span><strong>Calculated in checkout</strong></div>
              <div class="row"><span>Processing time</span><strong>72 hours</strong></div>
            </div>
            <p class="small" style="margin-top:16px">U.S. checkout only at launch. Automated tax collection should be enabled in Stripe before going live.</p>
          </aside>
          <div>
            <div class="panel pad" style="margin-bottom:18px">
              <div class="eyebrow">Secure payment</div>
              <h2>Embedded Stripe checkout</h2>
              <p class="muted">This storefront is wired for embedded Stripe Checkout. Once your Stripe keys and Pages Function environment variables are added, the payment form mounts below.</p>
            </div>
            <div id="checkout-container" class="panel pad">
              <div id="checkout"></div>
              <div class="checkout-placeholder" id="checkout-fallback">
                <strong>Stripe setup pending</strong>
                <p class="muted">Add your publishable key in <code>assets/config.js</code> and your secret key as <code>STRIPE_SECRET_KEY</code> in Cloudflare Pages. Then this page will create a Checkout Session and mount the embedded form automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    if (!window.STORE_CONFIG?.stripePublishableKey || window.STORE_CONFIG.stripePublishableKey.includes('replace_me')) return;

    try {
      if (!window.Stripe) throw new Error('Stripe.js not loaded');
      const stripe = window.Stripe(window.STORE_CONFIG.stripePublishableKey);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          cart: state.cart
        })
      });
      if (!response.ok) throw new Error('Unable to create checkout session');
      const { clientSecret } = await response.json();
      if (!clientSecret) throw new Error('Missing client secret');

      document.getElementById('checkout-fallback')?.remove();

      if (stripe.initEmbeddedCheckout) {
        const checkout = await stripe.initEmbeddedCheckout({clientSecret});
        checkout.mount('#checkout');
      } else {
        throw new Error('Stripe embedded checkout is not available in this Stripe.js build');
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function renderSuccessPage() {
    const mount = document.querySelector('#success-page');
    if (!mount) return;
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    mount.innerHTML = `
      <section class="section">
        <div class="container">
          <div class="panel pad success-card">
            <div class="eyebrow">Order update</div>
            <h1>Thanks for your order</h1>
            <div id="session-status" class="muted">Checking payment status…</div>
            <div style="margin-top:22px;display:flex;gap:12px;flex-wrap:wrap">
              <a class="button button-primary" href="shop.html">Continue Shopping</a>
              <a class="button button-secondary" href="contact.html">Need Help?</a>
            </div>
          </div>
        </div>
      </section>
    `;
    if (!sessionId) {
      document.getElementById('session-status').textContent = 'We could not find a session ID on this return page.';
      return;
    }
    try {
      const res = await fetch(`/api/session-status?session_id=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      const statusEl = document.getElementById('session-status');
      if (data.status === 'complete') {
        statusEl.innerHTML = `Payment complete for <strong>${data.customer_email || 'your order'}</strong>. A confirmation email will arrive from Stripe, and Alder & Cove will begin processing within 72 hours.`;
        state.cart = [];
        saveCart();
      } else {
        statusEl.textContent = 'Your payment is still processing. If you need help, email info@foothillslistings.online.';
      }
    } catch (error) {
      document.getElementById('session-status').textContent = 'We could not verify the session yet. If you have a payment confirmation, your order is likely still being processed.';
    }
  }

  return {
    initLayout,
    renderFeatured,
    renderShop,
    renderProductPage,
    renderCheckoutPage,
    renderSuccessPage
  };
})();

document.addEventListener('DOMContentLoaded', async () => {
  await App.initLayout();
  await App.renderFeatured('#featured-grid', 4);
  await App.renderFeatured('#best-sellers-grid', 8);
  await App.renderShop();
  await App.renderProductPage();
  await App.renderCheckoutPage();
  await App.renderSuccessPage();
});
