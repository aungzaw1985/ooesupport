import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = express.Router();

const adminMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided.' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.roleId !== 'a1b2c3d4-0002-0002-0002-000000000002') {
            return res.status(403).json({ error: 'Insufficient tactical clearance.' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

router.use(adminMiddleware);

// --- DYNAMIC FORMS ---
router.get('/forms', async (req, res) => {
    try {
        const forms = await db.query('SELECT * FROM ticket_forms ORDER BY created_at DESC');
        res.json(forms.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/forms', async (req, res) => {
    const { name, fields } = req.body;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const formRes = await client.query('INSERT INTO ticket_forms (name) VALUES ($1) RETURNING id', [name]);
        const formId = formRes.rows[0].id;

        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            await client.query(`
                INSERT INTO form_fields (form_id, label, field_type, config, sort_order)
                VALUES ($1, $2, $3, $4, $5)
            `, [formId, f.label, f.field_type, JSON.stringify(f.config || {}), i]);
        }

        await client.query('COMMIT');
        res.status(201).json({ id: formId, name });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Form creation failed', details: err.message });
    } finally {
        client.release();
    }
});

// --- SLA PLANS ---
router.get('/sla', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM sla_plans ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/sla', async (req, res) => {
    const { name, response_time_mins, resolution_time_mins } = req.body;
    try {
        const result = await db.query(`
            INSERT INTO sla_plans (name, response_time_mins, resolution_time_mins)
            VALUES ($1, $2, $3) RETURNING *
        `, [name, response_time_mins, resolution_time_mins]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DEPARTMENTS ---
router.get('/departments', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM departments ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/departments', async (req, res) => {
    const { name } = req.body;
    try {
        const result = await db.query('INSERT INTO departments (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;