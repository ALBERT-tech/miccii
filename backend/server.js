// backend/server.js
// Простой Express сервер для админ-панели

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:8000',
        // Добавить твой GitHub Pages URL
        'https://YOUR_USERNAME.github.io'
    ]
}));
app.use(express.json());

// Конфигурация (из .env переменных)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // bcrypt хеш

// Утилита для проверки JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

/**
 * POST /admin/login
 * Вход администратора
 * 
 * Body: { password: "admin123" }
 * Response: { token: "jwt_token" } или ошибка 401
 */
app.post('/admin/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password required' });
        }

        // Сравнить пароль с bcrypt хешем
        const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Создать JWT токен (действует 1 час)
        const token = jwt.sign(
            { role: 'admin', iat: Date.now() },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({ token });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /admin/responses
 * Получить все ответы из Supabase
 * 
 * Headers: Authorization: Bearer JWT_TOKEN
 * Query params:
 *   ?from_date=2025-01-01
 *   ?to_date=2025-01-31
 */
app.get('/admin/responses', authenticateToken, async (req, res) => {
    try {
        const { from_date, to_date } = req.query;

        // Построить SQL запрос
        let query = `${SUPABASE_URL}/rest/v1/responses?`;

        // Сортировка
        query += 'order=created_at.desc';

        // Фильтры по датам
        if (from_date) {
            query += `&created_at=gte.${from_date}`;
        }
        if (to_date) {
            query += `&created_at=lte.${to_date}`;
        }

        // Запрос к Supabase (используем Service Key)
        const response = await fetch(query, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase error: ${response.status}`);
        }

        const data = await response.json();
        return res.json(data);

    } catch (error) {
        console.error('Fetch responses error:', error);
        return res.status(500).json({ error: 'Failed to fetch responses' });
    }
});

/**
 * POST /admin/responses/stats
 * Быстрая статистика
 */
app.get('/admin/responses/stats', authenticateToken, async (req, res) => {
    try {
        // Supabase RPC function для статистики (опционально)
        // Или можно считать на фронтенде из полученных данных
        
        const allResponses = await fetch(
            `${SUPABASE_URL}/rest/v1/responses?select=computed,created_at`,
            {
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                }
            }
        ).then(r => r.json());

        const total = allResponses.length;
        const bmiValues = allResponses
            .map(r => parseFloat(r.computed?.bmi || 0))
            .filter(b => b > 0);
        const avgBmi = bmiValues.length > 0
            ? (bmiValues.reduce((a, b) => a + b, 0) / bmiValues.length).toFixed(1)
            : 0;
        const latest = allResponses[0]?.created_at || null;

        return res.json({
            total,
            avg_bmi: avgBmi,
            latest_response: latest
        });

    } catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// Запуск
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Admin backend running on port ${PORT}`);
    console.log(`SUPABASE_URL: ${SUPABASE_URL}`);
    console.log(`JWT_SECRET configured: ${!!process.env.JWT_SECRET}`);
    console.log(`ADMIN_PASSWORD_HASH configured: ${!!process.env.ADMIN_PASSWORD_HASH}`);
});
