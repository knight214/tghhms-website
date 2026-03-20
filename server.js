const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const sessionRoutes = require('./routes/sessions');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);

// Serve frontend files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/patients', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/patients.html'));
});

app.get('/sessions', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/sessions.html'));
});

app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/reports.html'));
});

app.get('/users', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/users.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════════════════════════╗
    ║  Talavera General Hospital Hemodialysis Management System     ║
    ║  Server running on http://localhost:${PORT}                   ║
    ║                                                                ║
    ║  Default Users:                                               ║
    ║  • Admin - username: admin, password: admin123               ║
    ║  • Nurse - username: nurse1, password: nurse123              ║
    ╚════════════════════════════════════════════════════════════════╝
    `);
});
