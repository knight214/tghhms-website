// ============ API CONFIGURATION ============
const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));

// ============ AUTHENTICATION ============
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;
    const messageEl = document.getElementById('loginMessage');

    if (!username || !password) {
        showMessage(messageEl, 'Username and password required', 'error');
        return;
    }

    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showMessage(messageEl, data.error, 'error');
        } else {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showMessage(messageEl, 'Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showMessage(messageEl, 'Error connecting to server', 'error');
    });
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

function showMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `message show ${type}`;
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

// ============ CHECK AUTHENTICATION ============
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '/';
        return false;
    }
    
    authToken = token;
    currentUser = JSON.parse(user);
    updateUserInfo();
    return true;
}

function updateUserInfo() {
    const usernameEl = document.getElementById('username-display');
    const roleEl = document.getElementById('role-display');
    
    if (usernameEl) usernameEl.textContent = currentUser.username;
    if (roleEl) roleEl.textContent = currentUser.role;
}

// ============ DATETIME DISPLAY ============
function updateDateTime() {
    const now = new Date();
    
    // Format digital time HH:MM:SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    // Format calendar date
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    
    // Format day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayString = daysOfWeek[now.getDay()];
    
    // Update all datetime displays on the page
    const timeElements = document.querySelectorAll('#digitalTime');
    const dateElements = document.querySelectorAll('#calendarDate');
    const dayElements = document.querySelectorAll('#dayOfWeek');
    
    timeElements.forEach(el => el.textContent = timeString);
    dateElements.forEach(el => el.textContent = dateString);
    dayElements.forEach(el => el.textContent = dayString);
}

// Initialize and update datetime every second
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateDateTime();
        setInterval(updateDateTime, 1000);
    });
} else {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}


// ============ API HELPER ============
function makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    return fetch(`${API_BASE_URL}${endpoint}`, options)
        .then(response => response.json())
        .catch(error => {
            console.error('API Error:', error);
            return { error: 'Network error' };
        });
}

// ============ PATIENTS MANAGEMENT ============
let patients = [];
let currentPatientId = null;

async function loadPatients() {
    const data = await makeRequest('/patients');
    if (!data.error) {
        patients = data;
        displayPatients();
    }
}

function displayPatients(searchTerm = '') {
    const tbody = document.getElementById('patientTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let filtered = patients;
    if (searchTerm) {
        filtered = patients.filter(p => 
            p.hospital_number.includes(searchTerm) ||
            p.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.last_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="10">No patients found</td></tr>';
        return;
    }
    
    filtered.forEach(patient => {
        const row = `
            <tr>
                <td>${patient.hospital_number}</td>
                <td>${patient.first_name} ${patient.last_name}</td>
                <td>${patient.age}</td>
                <td>${patient.sex}</td>
                <td>${formatDate(patient.birth_date)}</td>
                <td>${patient.philhealth_number || '-'}</td>
                <td>${patient.contact_number || '-'}</td>
                <td>${patient.address || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="openPatientModal(${patient.id})">Edit</button>
                        <button class="btn-delete" onclick="deletePatient(${patient.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function openPatientModal(patientId = null) {
    const modal = document.getElementById('patientModal');
    const form = document.getElementById('patientForm');
    const title = document.querySelector('.modal-header h2');
    
    if (patientId) {
        currentPatientId = patientId;
        const patient = patients.find(p => p.id === patientId);
        
        document.getElementById('patientFirstName').value = patient.first_name;
        document.getElementById('patientLastName').value = patient.last_name;
        document.getElementById('patientMiddleName').value = patient.middle_name || '';
        document.getElementById('patientHospitalNumber').value = patient.hospital_number;
        document.getElementById('patientPhilhealth').value = patient.philhealth_number || '';
        document.getElementById('patientBirthDate').value = patient.birth_date;
        document.getElementById('patientAge').value = patient.age;
        document.getElementById('patientSex').value = patient.sex;
        document.getElementById('patientContact').value = patient.contact_number || '';
        document.getElementById('patientAddress').value = patient.address || '';
        
        title.textContent = 'Edit Patient';
    } else {
        currentPatientId = null;
        form.reset();
        title.textContent = 'Add New Patient';
    }
    
    modal.classList.remove('hidden');
}

function closePatientModal() {
    document.getElementById('patientModal').classList.add('hidden');
    currentPatientId = null;
}

function handlePatientSubmit(event) {
    event.preventDefault();
    
    const patientData = {
        hospital_number: document.getElementById('patientHospitalNumber').value,
        philhealth_number: document.getElementById('patientPhilhealth').value,
        first_name: document.getElementById('patientFirstName').value,
        last_name: document.getElementById('patientLastName').value,
        middle_name: document.getElementById('patientMiddleName').value,
        birth_date: document.getElementById('patientBirthDate').value,
        sex: document.getElementById('patientSex').value,
        contact_number: document.getElementById('patientContact').value,
        address: document.getElementById('patientAddress').value
    };
    
    const endpoint = currentPatientId ? `/patients/${currentPatientId}` : '/patients';
    const method = currentPatientId ? 'PUT' : 'POST';
    
    makeRequest(endpoint, method, patientData)
        .then(data => {
            if (data.error) {
                showMessage(document.getElementById('patientMessage'), data.error, 'error');
            } else {
                loadPatients();
                closePatientModal();
                showMessage(document.getElementById('patientMessage'), 'Patient saved successfully', 'success');
            }
        });
}

function deletePatient(patientId) {
    if (confirm('Are you sure you want to delete this patient?')) {
        makeRequest(`/patients/${patientId}`, 'DELETE')
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    loadPatients();
                    showMessage(document.getElementById('patientMessage'), 'Patient deleted successfully', 'success');
                }
            });
    }
}

function searchPatients() {
    const searchTerm = document.getElementById('patientSearch')?.value || '';
    displayPatients(searchTerm);
}

// ============ SESSIONS MANAGEMENT ============
let sessions = [];
let currentSessionId = null;

async function loadSessions() {
    const data = await makeRequest('/sessions');
    if (!data.error) {
        sessions = data;
        displaySessions();
    }
}

function displaySessions(searchTerm = '') {
    const tbody = document.getElementById('sessionTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let filtered = sessions;
    if (searchTerm) {
        filtered = sessions.filter(s => 
            s.hospital_number.includes(searchTerm) ||
            s.first_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="12">No sessions found</td></tr>';
        return;
    }
    
    filtered.forEach(session => {
        const row = `
            <tr>
                <td>${session.hospital_number}</td>
                <td>${session.first_name} ${session.last_name}</td>
                <td>${session.philhealth_number || '-'}</td>
                <td><span class="status-badge ${session.session_type.toLowerCase()}">${session.session_type}</span></td>
                <td>${session.access_type}</td>
                <td>${formatDate(session.session_date)}</td>
                <td>${session.time_in}</td>
                <td>${session.time_out || '-'}</td>
                <td>${session.machine_number || '-'}</td>
                <td>${session.nurse_in_charge}</td>
                <td>
                    ${session.complications ? '<span class="complication-badge">⚠️ Yes</span>' : '<span class="complication-badge none">No</span>'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="openSessionModal(${session.id})">Edit</button>
                        <button class="btn-delete" onclick="deleteSession(${session.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    
    updateSessionStats();
}

function openSessionModal(sessionId = null) {
    const modal = document.getElementById('sessionModal');
    const form = document.getElementById('sessionForm');
    const title = document.querySelector('.modal-header h2');
    
    if (sessionId) {
        currentSessionId = sessionId;
        const session = sessions.find(s => s.id === sessionId);
        
        document.getElementById('sessionPatientName').value = `${session.first_name} ${session.last_name}`;
        document.getElementById('sessionType').value = session.session_type;
        document.getElementById('accessType').value = session.access_type;
        document.getElementById('sessionDate').value = session.session_date;
        document.getElementById('timeIn').value = session.time_in;
        document.getElementById('timeOut').value = session.time_out || '';
        document.getElementById('machineNumber').value = session.machine_number || '';
        document.getElementById('dialyzerUsed').value = session.dialyzer_used || '';
        document.getElementById('anticoagulant').value = session.anticoagulant_used || '';
        document.getElementById('complications').value = session.complications || '';
        document.getElementById('nurseInCharge').value = session.nurse_in_charge;
        
        title.textContent = 'Edit Session';
    } else {
        currentSessionId = null;
        form.reset();
        title.textContent = 'Add New Session';
    }
    
    modal.classList.remove('hidden');
}

function closeSessionModal() {
    document.getElementById('sessionModal').classList.add('hidden');
    currentSessionId = null;
}

async function handleSessionSubmit(event) {
    event.preventDefault();
    
    const patientName = document.getElementById('sessionPatientName').value.trim();
    
    // Look up patient by name
    const allPatients = await makeRequest('/patients');
    if (allPatients.error || !allPatients.length) {
        showMessage(document.getElementById('sessionMessage'), 'Error loading patients', 'error');
        return;
    }
    
    const patient = allPatients.find(p => 
        (p.first_name + ' ' + p.last_name).toLowerCase() === patientName.toLowerCase() ||
        (p.hospital_number === patientName)
    );
    
    if (!patient) {
        showMessage(document.getElementById('sessionMessage'), 'Patient not found. Please check the name and try again.', 'error');
        return;
    }
    
    const sessionData = {
        patient_id: patient.id,
        session_type: document.getElementById('sessionType').value,
        access_type: document.getElementById('accessType').value,
        session_date: document.getElementById('sessionDate').value,
        time_in: document.getElementById('timeIn').value,
        time_out: document.getElementById('timeOut').value,
        machine_number: document.getElementById('machineNumber').value,
        dialyzer_used: document.getElementById('dialyzerUsed').value,
        anticoagulant_used: document.getElementById('anticoagulant').value,
        complications: document.getElementById('complications').value,
        nurse_in_charge: document.getElementById('nurseInCharge').value
    };
    
    const endpoint = currentSessionId ? `/sessions/${currentSessionId}` : '/sessions';
    const method = currentSessionId ? 'PUT' : 'POST';
    
    makeRequest(endpoint, method, sessionData)
        .then(data => {
            if (data.error) {
                showMessage(document.getElementById('sessionMessage'), data.error, 'error');
            } else {
                loadSessions();
                closeSessionModal();
                showMessage(document.getElementById('sessionMessage'), 'Session saved successfully', 'success');
            }
        });
}

function deleteSession(sessionId) {
    if (confirm('Are you sure you want to delete this session?')) {
        makeRequest(`/sessions/${sessionId}`, 'DELETE')
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    loadSessions();
                    showMessage(document.getElementById('sessionMessage'), 'Session deleted successfully', 'success');
                }
            });
    }
}

// ============ DASHBOARD ============
async function loadDashboard() {
    const patientData = await makeRequest('/patients');
    const sessionData = await makeRequest('/sessions');
    
    if (!patientData.error) {
        patients = patientData;
        document.getElementById('totalPatients').textContent = patients.length;
    }
    
    if (!sessionData.error) {
        sessions = sessionData;
        updateSessionStats();
    }
}

function updateSessionStats() {
    let emergencyCount = 0;
    let electiveCount = 0;
    let today = new Date().toISOString().split('T')[0];
    let todayCount = 0;
    
    sessions.forEach(session => {
        if (session.session_type === 'Emergency') emergencyCount++;
        if (session.session_type === 'Elective') electiveCount++;
        if (session.session_date === today) todayCount++;
    });
    
    const emergencyEl = document.getElementById('emergencySessions');
    const electiveEl = document.getElementById('electiveSessions');
    const todayEl = document.getElementById('todaySessions');
    
    if (emergencyEl) emergencyEl.textContent = emergencyCount;
    if (electiveEl) electiveEl.textContent = electiveCount;
    if (todayEl) todayEl.textContent = todayCount;
}

// ============ UTILITY FUNCTIONS ============
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Update age automatically
document.addEventListener('change', function(e) {
    if (e.target.id === 'patientBirthDate') {
        const age = calculateAge(e.target.value);
        document.getElementById('patientAge').value = age;
    }
    if (e.target.id === 'editBirthDate') {
        const age = calculateAge(e.target.value);
        document.getElementById('editAge').value = age;
    }
});

// ============ EXPORT TO CSV ============
function exportPatientsToCsv() {
    let csv = 'Hospital #,First Name,Last Name,Age,Sex,Birth Date,PhilHealth #,Contact,Address\n';
    
    patients.forEach(p => {
        csv += `${p.hospital_number},"${p.first_name}","${p.last_name}",${p.age},${p.sex},${p.birth_date},"${p.philhealth_number || ''}","${p.contact_number || ''}","${p.address || ''}"\n`;
    });
    
    downloadCsv(csv, 'patients.csv');
}

function exportSessionsToCsv() {
    let csv = 'Hospital #,Patient Name,PhilHealth #,Session Type,Access Type,Date,Time In,Time Out,Machine,Nurse\n';
    
    sessions.forEach(s => {
        csv += `${s.hospital_number},"${s.first_name} ${s.last_name}","${s.philhealth_number || ''}",${s.session_type},${s.access_type},${s.session_date},${s.time_in},"${s.time_out || ''}","${s.machine_number || ''}",${s.nurse_in_charge}\n`;
    });
    
    downloadCsv(csv, 'sessions.csv');
}

function downloadCsv(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ============ PRINT FUNCTIONALITY ============
function printReport(reportType) {
    window.print();
}

// ============ USER MANAGEMENT ============
let users = [];
let currentUserId = null;

async function loadUsers() {
    const data = await makeRequest('/users');
    if (!data.error) {
        users = data;
        displayUsers();
    }
}

function displayUsers(searchTerm = '') {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let filtered = users;
    if (searchTerm) {
        filtered = users.filter(u => 
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No users found</td></tr>';
        return;
    }
    
    filtered.forEach(user => {
        const row = `
            <tr>
                <td>${user.username}</td>
                <td><span class="status-badge ${user.role.toLowerCase()}">${user.role}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="openEditRoleModal(${user.id},'${user.username}','${user.role}')">Edit</button>
                        <button class="btn-delete" onclick="deleteUser(${user.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch')?.value || '';
    displayUsers(searchTerm);
}

function openUserModal() {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.querySelector('#userModal .modal-header h2');
    
    currentUserId = null;
    form.reset();
    title.textContent = 'Add New User';
    
    modal.classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
    currentUserId = null;
}

function handleUserSubmit(event) {
    event.preventDefault();
    
    const userData = {
        username: document.getElementById('userUsername').value,
        password: document.getElementById('userPassword').value,
        role: document.getElementById('userRole').value
    };
    
    makeRequest('/users', 'POST', userData)
        .then(data => {
            if (data.error) {
                showMessage(document.getElementById('userMessage'), data.error, 'error');
            } else {
                loadUsers();
                closeUserModal();
                showMessage(document.getElementById('userMessage'), 'User created successfully', 'success');
            }
        });
}

function openEditRoleModal(userId, username, role) {
    const modal = document.getElementById('editRoleModal');
    currentUserId = userId;
    
    document.getElementById('editRoleUsername').value = username;
    document.getElementById('editRole').value = role;
    
    modal.classList.remove('hidden');
}

function closeEditRoleModal() {
    document.getElementById('editRoleModal').classList.add('hidden');
    currentUserId = null;
}

function handleRoleUpdate(event) {
    event.preventDefault();
    
    const roleData = {
        role: document.getElementById('editRole').value
    };
    
    makeRequest(`/users/${currentUserId}`, 'PUT', roleData)
        .then(data => {
            if (data.error) {
                showMessage(document.getElementById('editRoleMessage'), data.error, 'error');
            } else {
                loadUsers();
                closeEditRoleModal();
                showMessage(document.getElementById('userMessage'), 'User role updated successfully', 'success');
            }
        });
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        makeRequest(`/users/${userId}`, 'DELETE')
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    loadUsers();
                    showMessage(document.getElementById('userMessage'), 'User deleted successfully', 'success');
                }
            });
    }
}
