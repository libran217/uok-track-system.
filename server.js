const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const app = express();

// --- STORAGE CONFIGURATION ---
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => { 
        cb(null, 'uok_' + Date.now() + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./'));
app.use('/uploads', express.static('uploads'));
app.use(session({
    secret: 'uok_secure_key_2026',
    resave: false,
    saveUninitialized: true
}));

// --- CLOUD DATABASE CONNECTION (AIVEN) ---
const db = mysql.createConnection({
    host: 'mysql-3f560227-songolian2-f64d.b.aivencloud.com',
    port: 27591,
    user: 'avnadmin',
    password: process.env.DB_PASSWORD, // Set this in Render Dashboard -> Environment
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.stack);
        return;
    }
    console.log('✅ Connected to Aiven Cloud Database');
});

// --- ROUTES ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, results) => {
        if (err) return res.status(500).send("Database Error");
        if (results && results.length > 0) {
            req.session.user = username;
            res.redirect('/index.html');
        } else {
            res.send("<script>alert('Invalid Login'); window.location='/login.html';</script>");
        }
    });
});

app.post('/report-item', upload.single('item_image'), (req, res) => {
    const { item_name, status, location, description, category } = req.body;
    const img = req.file ? req.file.filename : null;
    db.query("INSERT INTO items (item_name, status, location, description, image_url, category) VALUES (?,?,?,?,?,?)", 
    [item_name, status, location, description, img, category], (err) => {
        if (err) console.log(err);
        db.query("INSERT INTO notifications (message) VALUES (?)", [`NEW: ${item_name} found at ${location}`]);
        res.send("<script>alert('Item Logged Successfully'); window.location='/index.html';</script>");
    });
});

app.get('/api/items', (req, res) => {
    db.query("SELECT * FROM items ORDER BY id DESC", (err, results) => {
        res.json(results || []);
    });
});

app.get('/api/notifications', (req, res) => {
    db.query("SELECT * FROM notifications ORDER BY id DESC LIMIT 10", (err, results) => {
        res.json(results || []);
    });
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UoK System Live on Port ${PORT}`);
});

