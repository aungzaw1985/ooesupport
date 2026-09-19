CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations & Customers
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff Roles & Permissions
CREATE TABLE staff_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{"tickets.view": true, "tickets.reply": true, "admin.access": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Staff (Agents & Admins)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES staff_roles(id) ON DELETE SET NULL,
    callsign VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Routing & SLA
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sla_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    response_time_mins INT NOT NULL,
    resolution_time_mins INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Forms
CREATE TABLE ticket_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES ticket_forms(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES ticket_forms(id),
    department_id UUID REFERENCES departments(id),
    sla_id UUID REFERENCES sla_plans(id),
    customer_id UUID REFERENCES customers(id),
    assigned_staff_id UUID REFERENCES staff(id),
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN',
    priority VARCHAR(50) DEFAULT 'NORMAL',
    custom_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id),
    customer_id UUID REFERENCES customers(id),
    body TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_staff ON tickets(assigned_staff_id);
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_threads_ticket ON ticket_threads(ticket_id);

-- Seed Data
INSERT INTO organizations (id, name) VALUES ('a1b2c3d4-0001-0001-0001-000000000001', 'Global Tactical Ops');

INSERT INTO staff_roles (id, name, permissions) VALUES 
('a1b2c3d4-0002-0002-0002-000000000002', 'Command Admin', '{"tickets.view": true, "tickets.reply": true, "admin.access": true, "admin.forms": true, "admin.staff": true}'),
('a1b2c3d4-0003-0003-0003-000000000003', 'Field Agent', '{"tickets.view": true, "tickets.reply": true}');

-- Default Staff: admin@tacops.io / password: admin123
INSERT INTO staff (id, role_id, callsign, email, password_hash) 
VALUES ('a1b2c3d4-0004-0004-0004-000000000004', 'a1b2c3d4-0002-0002-0002-000000000002', 'OVERLORD-01', 'admin@tacops.io', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq8BZvKpYHxQYzqXQ8m1v.u5IvDZ.e');

-- Default Customer: customer@tacops.io / password: customer123
INSERT INTO customers (id, organization_id, name, email, password_hash) 
VALUES ('b1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'Civilian Contact', 'customer@tacops.io', '$2a$10$8yVZ.6RxW4Qv8Z1xR2l6B.9s9Gc0qyDQUvJ6oqyDqJ9xY2g3lZJq');

INSERT INTO departments (id, name) VALUES ('a1b2c3d4-0005-0005-0005-000000000005', 'Cyber Defense');
INSERT INTO sla_plans (id, name, response_time_mins, resolution_time_mins) VALUES ('a1b2c3d4-0006-0006-0006-000000000006', 'Priority Alpha', 15, 60);

INSERT INTO ticket_forms (id, name) VALUES ('a1b2c3d4-0007-0007-0007-000000000007', 'Default Incident Form');
INSERT INTO form_fields (id, form_id, label, field_type, config, sort_order) VALUES 
('a1b2c3d4-0008-0008-0008-000000000008', 'a1b2c3d4-0007-0007-0007-000000000007', 'Affected System', 'dropdown', '{"options": ["Mainframe", "Grid Network", "IoT Array"]}', 1),
('a1b2c3d4-0009-0009-0009-000000000009', 'a1b2c3d4-0007-0007-0007-000000000007', 'Incident Code', 'regex', '{"regex": "^[A-Z]{3}-\\d{4}$"}', 2);

-- Seed a ticket
INSERT INTO tickets (id, form_id, department_id, sla_id, customer_id, assigned_staff_id, subject, status, priority) 
VALUES ('c1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0007-0007-0007-000000000007', 'a1b2c3d4-0005-0005-0005-000000000005', 'a1b2c3d4-0006-0006-0006-000000000006', 'b1b2c3d4-0001-0001-0001-000000000001', 'a1b2c3d4-0004-0004-0004-000000000004', 'Grid Network Compromised', 'OPEN', 'HIGH');

INSERT INTO ticket_threads (ticket_id, customer_id, body, is_internal) 
VALUES ('c1b2c3d4-0001-0001-0001-000000000001', 'b1b2c3d4-0001-0001-0001-000000000001', 'Main grid firewall bypassed. Need immediate tactical support.', false);