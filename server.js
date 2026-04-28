const express = require('express');
const Database = require('better-sqlite3');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'groceryhub_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 }
}));

// ---------- SQLite Database Setup ----------
const db = new Database('grocery.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        unit TEXT NOT NULL,
        stock INTEGER NOT NULL,
        image TEXT DEFAULT 'https://via.placeholder.com/150?text=Grocery'
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_address TEXT NOT NULL,
        order_items TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Seed sample products if table is empty
const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (count === 0) {
    const insert = db.prepare(`
        INSERT INTO products (name, category, price, unit, stock, image) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const samples = [
        ['Basmati Rice', 'Grains', 120, 'kg', 50, 'https://via.placeholder.com/150?text=Rice'],
        ['Wheat Flour', 'Grains', 45, 'kg', 40, 'https://via.placeholder.com/150?text=Flour'],
        ['Sugar', 'Pantry', 40, 'kg', 60, 'https://via.placeholder.com/150?text=Sugar'],
        ['Mustard Oil', 'Oils', 110, 'liter', 30, 'https://via.placeholder.com/150?text=Oil'],
        ['Toor Dal', 'Pulses', 90, 'kg', 45, 'https://via.placeholder.com/150?text=Dal'],
        ['Tea Leaves', 'Beverages', 80, 'pack', 70, 'https://via.placeholder.com/150?text=Tea'],
        ['Tomato Ketchup', 'Sauces', 60, 'bottle', 25, 'https://via.placeholder.com/150?text=Ketchup'],
        ['Fresh Apples', 'Fruits', 140, 'kg', 20, 'https://via.placeholder.com/150?text=Apples'],
        ['Onions', 'Vegetables', 35, 'kg', 40, 'https://via.placeholder.com/150?text=Onions'],
        ['Potatoes', 'Vegetables', 30, 'kg', 55, 'https://via.placeholder.com/150?text=Potatoes'],
        ['Curd', 'Dairy', 45, 'pack', 15, 'https://via.placeholder.com/150?text=Curd'],
        ['Bread', 'Bakery', 35, 'loaf', 20, 'https://via.placeholder.com/150?text=Bread']
    ];
    samples.forEach(s => insert.run(...s));
}

// ---------- Customer APIs ----------
app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products').all();
    res.json(products);
});

app.post('/api/orders', (req, res) => {
    const { customer_name, customer_phone, customer_address, cartItems, total_price } = req.body;
    if (!customer_name || !customer_phone || !customer_address || !cartItems.length) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    const stmt = db.prepare(`
        INSERT INTO orders (customer_name, customer_phone, customer_address, order_items, total_price)
        VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(customer_name, customer_phone, customer_address, JSON.stringify(cartItems), total_price);
    res.json({ success: true, orderId: info.lastInsertRowid });
});

// ---------- Admin Middleware ----------
function isAdmin(req, res, next) {
    if (req.session && req.session.adminLoggedIn) next();
    else res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'groceryhub') {
        req.session.adminLoggedIn = true;
        res.json({ success: true });
    } else res.status(401).json({ error: 'Invalid' });
});

app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/admin/verify', (req, res) => {
    res.json({ isAdmin: !!req.session?.adminLoggedIn });
});

// Admin: Orders
app.get('/api/admin/orders', isAdmin, (req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY order_date DESC').all();
    res.json(orders);
});

app.put('/api/admin/orders/:id/status', isAdmin, (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
});

// Admin: Products CRUD
app.get('/api/admin/products', isAdmin, (req, res) => {
    res.json(db.prepare('SELECT * FROM products').all());
});

app.post('/api/admin/products', isAdmin, (req, res) => {
    const { name, category, price, unit, stock, image } = req.body;
    const stmt = db.prepare(`
        INSERT INTO products (name, category, price, unit, stock, image)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, category, price, unit, stock, image || 'https://via.placeholder.com/150?text=Grocery');
    res.json({ success: true, id: info.lastInsertRowid });
});

app.put('/api/admin/products/:id', isAdmin, (req, res) => {
    const { name, category, price, unit, stock, image } = req.body;
    db.prepare(`
        UPDATE products SET name=?, category=?, price=?, unit=?, stock=?, image=? WHERE id=?
    `).run(name, category, price, unit, stock, image, req.params.id);
    res.json({ success: true });
});

app.delete('/api/admin/products/:id', isAdmin, (req, res) => {
    db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
    res.json({ success: true });
});

// Serve frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.listen(PORT, () => console.log(`Grocery Hub running at http://localhost:${PORT}`));