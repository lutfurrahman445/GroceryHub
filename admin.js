(async function initAdmin() {
    const verify = await fetch('/api/admin/verify');
    const { isAdmin } = await verify.json();
    if (!isAdmin) {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
    } else {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadOrders();
        loadProductsAdmin();
    }
})();

document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;
    const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (res.ok) {
        location.reload();
    } else alert('Invalid login');
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    location.reload();
});

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById('ordersTab').classList.toggle('active', tab === 'orders');
        document.getElementById('productsTab').classList.toggle('active', tab === 'products');
        if (tab === 'orders') loadOrders();
        if (tab === 'products') loadProductsAdmin();
    });
});

async function loadOrders() {
    const res = await fetch('/api/admin/orders');
    const orders = await res.json();
    const container = document.getElementById('ordersList');
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <p><strong>${order.customer_name}</strong> | ${order.customer_phone}</p>
            <p>Address: ${order.customer_address}</p>
            <p>Items: ${order.order_items}</p>
            <p>Total: ₹${order.total_price}</p>
            <p>Date: ${new Date(order.order_date).toLocaleString()}</p>
            <select class="status-select" data-id="${order.id}">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            </select>
        </div>
    `).join('');
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = select.dataset.id;
            const newStatus = select.value;
            await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            loadOrders();
        });
    });
}

async function loadProductsAdmin() {
    const res = await fetch('/api/admin/products');
    const products = await res.json();
    const container = document.getElementById('productsList');
    container.innerHTML = products.map(p => `
        <div class="product-card-admin">
            <strong>${p.name}</strong> (${p.category}) - ₹${p.price}/${p.unit} | Stock: ${p.stock}
            <button class="edit-product" data-id="${p.id}">Edit</button>
            <button class="delete-product" data-id="${p.id}">Delete</button>
        </div>
    `).join('');
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm('Delete product?')) {
                const id = btn.dataset.id;
                await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
                loadProductsAdmin();
            }
        });
    });
    // Simplified edit: prompt based (in real app expand)
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', async () => {
            alert('For full edit, implement modal. Use "Add product" to update. Delete and re-add for demo.');
        });
    });
}

document.getElementById('showAddProductForm')?.addEventListener('click', () => {
    const formDiv = document.getElementById('productFormContainer');
    formDiv.style.display = formDiv.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newProduct = {
        name: document.getElementById('prodName').value,
        category: document.getElementById('prodCategory').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        unit: document.getElementById('prodUnit').value,
        stock: parseInt(document.getElementById('prodStock').value),
        image: document.getElementById('prodImage').value
    };
    await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
    });
    loadProductsAdmin();
    e.target.reset();
    document.getElementById('productFormContainer').style.display = 'none';
});