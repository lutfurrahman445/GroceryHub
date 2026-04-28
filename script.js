let products = [];
let cart = [];

async function loadProducts() {
    const res = await fetch('/api/products');
    products = await res.json();
    filterAndDisplay();
}

function filterAndDisplay() {
    const category = document.getElementById('categoryFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    let filtered = products;
    if (category !== 'all') filtered = filtered.filter(p => p.category === category);
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
    renderProducts(filtered);
}

function renderProducts(productList) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = productList.map(prod => `
        <div class="product-card">
            <img src="${prod.image}" alt="${prod.name}">
            <h4>${prod.name}</h4>
            <p>₹${prod.price} / ${prod.unit}</p>
            <p>Stock: ${prod.stock} left</p>
            <button class="btn-add" data-id="${prod.id}">Add to Cart</button>
        </div>
    `).join('');
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            addToCart(id);
        });
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        if (existing.quantity + 1 > product.stock) {
            alert('Out of stock!');
            return;
        }
        existing.quantity++;
    } else {
        if (product.stock < 1) return alert('Out of stock');
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cartItems');
    if (cart.length === 0) {
        container.innerHTML = '<p>Cart is empty</p>';
        document.getElementById('cartTotal').innerText = '0';
        return;
    }
    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <span>${item.name} x${item.quantity}</span>
                <span>₹${item.price * item.quantity}</span>
                <button class="remove-item" data-id="${item.id}">🗑️</button>
            </div>
        `;
    }).join('');
    document.getElementById('cartTotal').innerText = total;
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            cart = cart.filter(i => i.id !== id);
            updateCartUI();
        });
    });
}

document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) return alert('Cart empty');
    document.getElementById('orderModal').style.display = 'flex';
});
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('orderModal').style.display = 'none';
});
document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderData = {
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        cartItems: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, unit: i.unit })),
        total_price: total
    };
    const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });
    if (res.ok) {
        alert('Order placed successfully!');
        cart = [];
        updateCartUI();
        document.getElementById('orderModal').style.display = 'none';
        document.getElementById('orderForm').reset();
    } else alert('Order failed');
});

// Map initialization
function initMap() {
    const map = L.map('storeMap').setView([26.1445, 91.7362], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    L.marker([26.1445, 91.7362]).addTo(map)
        .bindPopup('Grocery Hub, Dhirenpara')
        .openPopup();
}

document.getElementById('categoryFilter').addEventListener('change', filterAndDisplay);
document.getElementById('searchInput').addEventListener('input', filterAndDisplay);
loadProducts();
initMap();