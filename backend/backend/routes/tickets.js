import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = express.Router();

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided.' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains ID, callsign/name, type, permissions
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

router.use(authMiddleware);

// GET /api/tickets - Fetch queues (Staff gets all, Customer gets only theirs)
router.get('/', async (req, res) => {
    const { status } = req.query;
    try {
        let query = `
            SELECT t.id, t.subject, t.status, t.priority, t.created_at, 
                   c.name as customer_name, s.callsign as agent_callsign
            FROM tickets t
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN staff s ON t.assigned_staff_id = s.id
        `;
        const params = [];
        
        if (req.user.type === 'CUSTOMER') {
            query += ` WHERE t.customer_id = $1`;
            params.push(req.user.id);
            if (status) {
                query += ` AND t.status = $2`;
                params.push(status.toUpperCase());
            }
        } else if (status) {
            query += ` WHERE t.status = $1`;
            params.push(status.toUpperCase());
        }
        query += ` ORDER BY t.created_at DESC LIMIT 100`;
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database query failed', details: err.message });
    }
});

// POST /api/tickets - Customer creates new ticket
router.post('/', async (req, res) => {
    if (req.user.type !== 'CUSTOMER') {
        return res.status(403).json({ error: 'Only customers can initiate tickets via this route.' });
    }
    
    const { subject, body, form_id, department_id, sla_id, custom_data } = req.body;
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        const ticketRes = await client.query(`
            INSERT INTO tickets (form_id, department_id, sla_id, customer_id, subject, custom_data, status, priority)
            VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', 'NORMAL')
            RETURNING id, subject, status, created_at
        `, [form_id, department_id, sla_id, req.user.id, subject, JSON.stringify(custom_data || {})]);
        
        const newTicket = ticketRes.rows[0];

        await client.query(`
            INSERT INTO ticket_threads (ticket_id, customer_id, body, is_internal)
            VALUES ($1, $2, $3, false)
        `, [newTicket.id, req.user.id, body]);

        await client.query('COMMIT');
        res.status(201).json(newTicket);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Failed to create ticket', details: err.message });
    } finally {
        client.release();
    }
});

// GET /api/tickets/:id - Ticket detail
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const ticketRes = await db.query(`
            SELECT t.*, c.name as customer_name, s.callsign as agent_callsign
            FROM tickets t
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN staff s ON t.assigned_staff_id = s.id
            WHERE t.id = $1
        `, [id]);

        if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

        // Security check: Customers can only view their own tickets
        if (req.user.type === 'CUSTOMER' && ticketRes.rows[0].customer_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden: Access restricted to own tickets.' });
        }

        const threadsRes = await db.query(`
            SELECT tt.id, tt.body, tt.is_internal, tt.created_at, 
                   s.callsign as staff_callsign, c.name as customer_name
            FROM ticket_threads tt
            LEFT JOIN staff s ON tt.staff_id = s.id
            LEFT JOIN customers c ON tt.customer_id = c.id
            WHERE tt.ticket_id = $1
            ORDER BY tt.created_at ASC
        `, [id]);

        // Filter out internal notes for customers
        const visibleThreads = req.user.type === 'CUSTOMER' 
            ? threadsRes.rows.filter(t => !t.is_internal)
            : threadsRes.rows;

        res.json({ ...ticketRes.rows[0], threads: visibleThreads });
    } catch (err) {
        res.status(500).json({ error: 'Database query failed', details: err.message });
    }
});

// POST /api/tickets/:id/reply
router.post('/:id/reply', async (req, res) => {
    const { id } = req.params;
    const { body, isInternal } = req.body;
    
    try {
        let result;
        if (req.user.type === 'STAFF') {
            result = await db.query(`
                INSERT INTO ticket_threads (ticket_id, staff_id, body, is_internal)
                VALUES ($1, $2, $3, $4)
                RETURNING id, body, is_internal, created_at
            `, [id, req.user.id, body, isInternal || false]);
            
            result.rows[0].staff_callsign = req.user.callsign;
            result.rows[0].customer_name = null;
        } else {
            // Customer reply - never internal
            result = await db.query(`
                INSERT INTO ticket_threads (ticket_id, customer_id, body, is_internal)
                VALUES ($1, $2, $3, false)
                RETURNING id, body, is_internal, created_at
            `, [id, req.user.id, body]);
            
            result.rows[0].staff_callsign = null;
            result.rows[0].customer_name = req.user.name;
        }
        
        await db.query('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to post reply', details: err.message });
    }
});

// PUT /api/tickets/:id/status (Staff only)
router.put('/:id/status', async (req, res) => {
    if (req.user.type !== 'STAFF') {
        return res.status(403).json({ error: 'Tactical status changes restricted to authorized personnel.' });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const result = await db.query(`
            UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 RETURNING id, status
        `, [status.toUpperCase(), id]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status', details: err.message });
    }
});

export default router;