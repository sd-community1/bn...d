const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// إعداد التخزين
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // التمييز بين ملف السكن الأصلي وصورة العرض
        const ext = file.fieldname === 'skin' ? '.png' : '_preview.png';
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage }).fields([
    { name: 'skin', maxCount: 1 },
    { name: 'preview', maxCount: 1 }
]);

app.use(express.static('public'));
app.use(express.json());

const DB_FILE = path.join(__dirname, 'data', 'skins.json');

app.get('/api/skins', (req, res) => {
    if (!fs.existsSync(DB_FILE)) return res.json([]);
    const data = fs.readFileSync(DB_FILE);
    const skins = JSON.parse(data);
    res.json(skins.reverse());
});

app.post('/api/upload', upload, (req, res) => {
    if (!req.files || !req.files.skin || !req.files.preview) {
        return res.status(400).json({ error: 'Missing files' });
    }

    const newSkin = {
        id: Date.now(),
        skinFilename: req.files.skin[0].filename,
        previewFilename: req.files.preview[0].filename,
        name: req.body.name || 'Unknown Skin',
        description: req.body.description || 'No description provided.',
        date: new Date().toLocaleDateString()
    };

    let skins = [];
    if (fs.existsSync(DB_FILE)) {
        skins = JSON.parse(fs.readFileSync(DB_FILE));
    }
    skins.push(newSkin);
    
    fs.writeFileSync(DB_FILE, JSON.stringify(skins, null, 2));
    res.json({ success: true, skin: newSkin });
});

app.listen(port, () => {
    console.log(`🚀 Platform running!`);
});
