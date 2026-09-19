🎫 One O Eight Support Platform (OOESupport)

A powerful, real-time, enterprise-grade ticketing system built with NestJS, React, and PostgreSQL. Designed to streamline customer support workflows with advanced SLA management, dynamic forms, role-based access control, and a beautiful Claymorphism UI.

✨ Key Features

Core Ticketing: Real-time WebSocket updates, rich text editor (TipTap), file attachments, ticket merging, tagging, and sub-tasks.

Advanced SLA Engine: Dual SLA timers (Response & Resolution) that dynamically respect business hours, holidays, and custom schedules.

Workflow Automation: Visual "If-This-Then-That" rule builder to auto-assign, prioritize, and escalate tickets.

Enterprise RBAC: Strict visibility rules for Agents, Team Leaders, Department Managers, and Organization Managers.

Dynamic Forms: Build custom intake forms with conditional visibility (Internal, Required for Agents, End Users Only). Custom data is saved natively as PostgreSQL JSONB.

Governed Knowledge Base: Draft -> Review -> Approve -> Publish workflow, version control, internal vs. external content, and stale content auditing.

Compliance & Security: Global Audit Logs (tracking IP & actions), API Rate Limiting, XSS sanitization, and AES-256 encrypted SMTP credentials.

Analytics: Advanced dashboard featuring MTTR, CSAT, Agent Workload, SLA Breach rates, and Ticket Arrival Heatmaps.

Custom Branding: Dynamic company logo, theme colors, and browser favicon manageable via the Admin UI.

🛠 Tech Stack

Backend:

NestJS (TypeScript)

Prisma ORM (PostgreSQL)

Socket.io (WebSockets)

Nodemailer (Emails)

Multer (File Uploads)

Frontend:

React 18 (TypeScript)

Vite

Tailwind CSS (Claymorphism design)

TipTap (Rich Text)

Recharts (Analytics)

Socket.io-client

Infrastructure:

PM2 (Process Manager)

Nginx (Reverse Proxy)

Ubuntu Server

🚀 Installation & Setup

This is a monorepo containing the backend (NestJS) and frontend (React).

Prerequisites

Node.js v20+

PostgreSQL database

npm or yarn

1. Backend Setup

cd backend

npm install

Configure Environment:

Copy the example env file and update it with your database credentials:

bash

cp .env.example .env

nano .env

(Ensure your DATABASE_URL points to your PostgreSQL instance. Generate a 32-char string for ENCRYPTION_KEY).

Run Database Migrations:

This will create all tables and seed the default Ticket Statuses, Email Templates, and the default Admin user.

bash

npx prisma migrate dev --name init

npx prisma generate

Start the Backend:

bash

# Development

npm run start:dev

# Production

npm run build

pm2 start dist/main.js --name ooessupport-backend

2. Frontend Setup

bash

cd ../frontend

npm install

Start the Frontend:

bash

# Development (Runs on port 5173)

npm run dev

# Production Build

npm run build

3. Default Admin Credentials

On first startup, the backend automatically seeds an Admin account. Please log in and change the password immediately.

Email: admin@ooesupport.com

Password: Admin123!

4. Production Deployment (Nginx)

Use Nginx to serve the React build folder and reverse-proxy API/WebSocket traffic to the NestJS backend.

nginx

server {
    listen 80;
    server_name yourdomain.com;

    # Serve React Frontend
    root /var/www/ooesupport/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to NestJS
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy WebSockets to NestJS
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Serve Uploaded Files
    location /uploads/ {
        alias /var/www/ooesupport/backend/uploads/;
    }
}

📖 Post-Installation Guide

Configure Mail Settings: Go to Admin Dashboard -> Mail Settings to input your SMTP credentials. Emails will use the default seeded templates.

Create Forms: Go to Admin Dashboard -> Dynamic Forms to create your Help Topics and custom fields.

Set up SLAs: Go to Admin Dashboard -> SLA Policies to define Response and Resolution grace periods.

Brand Your Portal: Go to Admin Dashboard -> Company Settings to upload your logo, favicon, and set your theme color.

📄 License

This software is proprietary. Copyright © 2024 One O Eight Support Platform.
