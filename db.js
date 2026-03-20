const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'hd_system.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Create Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('Admin', 'Nurse')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create Patients table
    db.run(`
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_number TEXT UNIQUE NOT NULL,
            philhealth_number TEXT,
            last_name TEXT NOT NULL,
            first_name TEXT NOT NULL,
            middle_name TEXT,
            birth_date DATE NOT NULL,
            age INTEGER,
            sex TEXT NOT NULL CHECK(sex IN ('Male', 'Female')),
            contact_number TEXT,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create Hemodialysis Sessions table
    db.run(`
        CREATE TABLE IF NOT EXISTS hemodialysis_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            session_type TEXT NOT NULL CHECK(session_type IN ('Elective', 'Emergency')),
            access_type TEXT NOT NULL CHECK(access_type IN ('AVF', 'Perm Cath', 'IJ Cath')),
            session_date DATE NOT NULL,
            time_in TIME NOT NULL,
            time_out TIME,
            machine_number TEXT,
            dialyzer_used TEXT,
            anticoagulant_used TEXT,
            complications TEXT,
            nurse_in_charge TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
    `);

    // Check if admin user exists, if not create one
    db.get(`SELECT * FROM users WHERE username = 'admin'`, (err, row) => {
        if (!row) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.run(
                `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
                ['admin', hashedPassword, 'Admin'],
                (err) => {
                    if (!err) {
                        console.log('Default admin user created (username: admin, password: admin123)');
                    }
                }
            );
        }
    });

    // Create a default nurse user
    db.get(`SELECT * FROM users WHERE username = 'nurse1'`, (err, row) => {
        if (!row) {
            const hashedPassword = bcrypt.hashSync('nurse123', 10);
            db.run(
                `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
                ['nurse1', hashedPassword, 'Nurse'],
                (err) => {
                    if (!err) {
                        console.log('Default nurse user created (username: nurse1, password: nurse123)');
                    }
                }
            );
        }
    });
}

// Database utility functions
function runAsync(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

function getAsync(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function allAsync(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    db,
    runAsync,
    getAsync,
    allAsync
};
