import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

const router = express.Router();

// Staff Login
router.post('/staff/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query(`
            SELECT s.id, s.callsign, s.email, s.password_hash, s.role_id, r.permissions
            FROM staff s
            JOIN staff_roles r ON s.role_id = r.id
            WHERE s.email = $1 AND s.is_active = true
        `, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Access Denied: Operator not found.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Access Denied: Authentication failure.' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                callsign: user.callsign, 
                roleId: user.role_id,
                permissions: user.permissions,
                type: 'STAFF'
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            operator: {
                id: user.id,
                callsign: user.callsign,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'System Error', details: err.message });
    }
});

// Customer Login
router.post('/customer/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query(`
            SELECT id, name, email, password_hash
            FROM customers
            WHERE email = $1 AND is_active = true
        `, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Access Denied: Customer profile not found.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Access Denied: Authentication failure.' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                name: user.name,
                email: user.email,
                type: 'CUSTOMER'
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            customer: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'System Error', details: err.message });
    }
});

export default router;