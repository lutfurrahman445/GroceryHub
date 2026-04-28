let products = [], cart = [];

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
    grid.innerHTML = productList.map(p => `
        <div class="product-card">
            <img src="${p.image}" alt="${p.name}">
            <h4>${p.name}</h4>
            <p>₹${p.price} / ${p.unit}</p>
            <p>Stock: ${p.stock}</p>
            <button class="btn-add" data-id="${p.id}">Add to Cart</button>
        </div>
    `).join('');
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id)));
    });
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const existing = cart.find(i => i.id === id);
    if (existing) {
        if (existing.quantity + 1 > product.stock) return alert('Out of stock');
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cartItems');
    if (cart.length === 0) {
        container.innerHTML = '<p>Cart empty</p>';
        document.getElementById('cartTotal').innerText = '0';
        return;
    }
    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `<div class="cart-item">${item.name} x${item.quantity} - ₹${item.price*item.quantity} <button class="remove-item" data-id="${item.id}">❌</button></div>`;
    }).join('');
    document.getElementById('cartTotal').innerText = total;
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            cart = cart.filter(i => i.id != btn.dataset.id);
            updateCartUI();
        });
    });
}

document.getElementById('checkoutBtn').onclick = () => {
    if (!cart.length) return alert('Cart empty');
    document.getElementById('orderModal').style.display = 'flex';
};
document.querySelector('.close').onclick = () => document.getElementById('orderModal').style.display = 'none';
document.getElementById('orderForm').onsubmit = async (e) => {
    e.preventDefault();
    const order = {
        customer_name: document.getElementById('custName').value,
        customer_phone: document.getElementById('custPhone').value,
        customer_address: document.getElementById('custAddress').value,
        cartItems: cart.map(i => ({ id:i.id, name:i.name, price:i.price, quantity:i.quantity })),
        total_price: cart.reduce((s,i)=> s + i.price*i.quantity,0)
    };
    const res = await fetch('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(order) });
    if (res.ok) {
        alert('Order placed successfully!');
        cart = [];
        updateCartUI();
        document.getElementById('orderModal').style.display = 'none';
        e.target.reset();
    } else alert('Order failed');
};

// Map
const map = L.map('storeMap').setView([26.1445, 91.7362], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
L.marker([26.1445, 91.7362]).addTo(map).bindPopup('Grocery Hub, Dhirenpara').openPopup();

document.getElementById('categoryFilter').onchange = filterAndDisplay;
document.getElementById('searchInput').oninput = filterAndDisplay;
loadProducts();