async function checkAuth() {
    const res = await fetch('/api/admin/verify');
    const { isAdmin } = await res.json();
    if (isAdmin) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadOrders();
        loadProducts();
    } else {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    }
}

document.getElementById('loginBtn').onclick = async () => {
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;
    const res = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password}) });
    if (res.ok) location.reload();
    else alert('Wrong credentials');
};
document.getElementById('logoutBtn').onclick = async () => { await fetch('/api/admin/logout', { method:'POST' }); location.reload(); };

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('ordersTab').classList.toggle('active', btn.dataset.tab === 'orders');
        document.getElementById('productsTab').classList.toggle('active', btn.dataset.tab === 'products');
        if (btn.dataset.tab === 'orders') loadOrders();
        if (btn.dataset.tab === 'products') loadProducts();
    };
});

async function loadOrders() {
    const res = await fetch('/api/admin/orders');
    const orders = await res.json();
    const container = document.getElementById('ordersList');
    container.innerHTML = orders.map(o => `
        <div class="order-card">
            <strong>${o.customer_name}</strong> (${o.customer_phone})<br>
            Address: ${o.customer_address}<br>
            Items: ${o.order_items}<br>
            Total: ₹${o.total_price}<br>
            Date: ${new Date(o.order_date).toLocaleString()}<br>
            Status: 
            <select class="status-update" data-id="${o.id}">
                <option ${o.status==='pending'?'selected':''}>pending</option>
                <option ${o.status==='shipped'?'selected':''}>shipped</option>
                <option ${o.status==='delivered'?'selected':''}>delivered</option>
            </select>
        </div>
    `).join('');
    document.querySelectorAll('.status-update').forEach(sel => {
        sel.onchange = async () => {
            await fetch(`/api/admin/orders/${sel.dataset.id}/status`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:sel.value}) });
            loadOrders();
        };
    });
}

async function loadProducts() {
    const res = await fetch('/api/admin/products');
    const products = await res.json();
    const container = document.getElementById('productsList');
    container.innerHTML = products.map(p => `
        <div class="product-card-admin">
            <b>${p.name}</b> (${p.category}) - ₹${p.price}/${p.unit} | Stock: ${p.stock}
            <button class="edit-product" data-id="${p.id}" data-name="${p.name}" data-cat="${p.category}" data-price="${p.price}" data-unit="${p.unit}" data-stock="${p.stock}" data-img="${p.image}">✏️ Edit</button>
            <button class="delete-product" data-id="${p.id}">🗑️ Delete</button>
        </div>
    `).join('');
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.onclick = async () => {
            if(confirm('Delete product?')) {
                await fetch(`/api/admin/products/${btn.dataset.id}`, { method:'DELETE' });
                loadProducts();
            }
        };
    });
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.onclick = async () => {
            const newName = prompt('New name', btn.dataset.name);
            if(!newName) return;
            const updated = {
                name: newName,
                category: prompt('Category', btn.dataset.cat),
                price: parseFloat(prompt('Price', btn.dataset.price)),
                unit: prompt('Unit', btn.dataset.unit),
                stock: parseInt(prompt('Stock', btn.dataset.stock)),
                image: prompt('Image URL', btn.dataset.img)
            };
            await fetch(`/api/admin/products/${btn.dataset.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(updated) });
            loadProducts();
        };
    });
}

document.getElementById('showAddProductBtn').onclick = () => {
    const div = document.getElementById('productFormDiv');
    div.style.display = div.style.display === 'none' ? 'block' : 'none';
};
document.getElementById('productForm').onsubmit = async (e) => {
    e.preventDefault();
    const newProduct = {
        name: document.getElementById('prodName').value,
        category: document.getElementById('prodCategory').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        unit: document.getElementById('prodUnit').value,
        stock: parseInt(document.getElementById('prodStock').value),
        image: document.getElementById('prodImage').value
    };
    await fetch('/api/admin/products', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(newProduct) });
    loadProducts();
    e.target.reset();
    document.getElementById('productFormDiv').style.display = 'none';
};

checkAuth();