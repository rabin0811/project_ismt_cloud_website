const API = '/api';
const TOKEN_KEY = 'ismt_admin_token';

const state = {
    token: localStorage.getItem(TOKEN_KEY),
    username: localStorage.getItem('ismt_admin_user') || '',
    students: [],
    courses: []
};

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[character]));
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (state.token) headers.Authorization = state.token;

    const response = await fetch(API + path, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401 && state.token) {
        logout();
        throw new Error('Your session expired. Please sign in again.');
    }
    if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
    }
    return data;
}

function showLogin() {
    $('dashboard').classList.add('hidden');
    $('loginScreen').classList.remove('hidden');
    $('loginError').classList.add('hidden');
    $('password').value = '';
}

function showDashboard() {
    $('loginScreen').classList.add('hidden');
    $('dashboard').classList.remove('hidden');
    $('welcomeUser').textContent = state.username ? `Hello, ${state.username}` : '';
    loadAll();
}

async function logout() {
    const token = state.token;
    state.token = null;
    state.username = '';
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('ismt_admin_user');
    if (token) {
        try {
            await fetch(API + '/logout', { method: 'POST', headers: { Authorization: token } });
        } catch {
            // The local session is already cleared.
        }
    }
    showLogin();
}

function setActiveView(viewId) {
    document.querySelectorAll('.tab').forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.view === viewId);
    });
    document.querySelectorAll('.view').forEach((view) => {
        view.classList.toggle('active', view.id === viewId);
    });
}

async function loadAll() {
    try {
        const [stats, courses, students, applications] = await Promise.all([
            api('/stats'),
            api('/courses'),
            api('/students'),
            api('/applications')
        ]);
        state.courses = courses;
        state.students = students;
        renderStats(stats);
        renderCourses(courses, students);
        renderStudents(students);
        renderApplications(applications);
    } catch (error) {
        alert(error.message);
    }
}

function renderStats(stats) {
    $('statTotal').textContent = stats.totalStudents ?? 0;
    $('statActive').textContent = stats.activeStudents ?? 0;
    $('statCourses').textContent = stats.totalCourses ?? 0;
    $('statApps').textContent = stats.totalApplications ?? 0;

    const campuses = stats.byCampus || [];
    if (!campuses.length) {
        $('campusChart').innerHTML = '<p class="muted">No campus data yet.</p>';
        return;
    }

    const max = Math.max(...campuses.map((item) => item.count), 1);
    $('campusChart').innerHTML = campuses.map((item) => `
        <div class="campus-row">
            <span>${escapeHtml(item.campus)}</span>
            <div class="campus-bar"><span style="width:${Math.round((item.count / max) * 100)}%"></span></div>
            <strong>${item.count}</strong>
        </div>
    `).join('');
}

function renderCourses(courses, students) {
    const counts = new Map();
    students.forEach((student) => {
        counts.set(student.course_id, (counts.get(student.course_id) || 0) + 1);
    });

    $('coursesTable').innerHTML = courses.map((course) => `
        <tr>
            <td>${escapeHtml(course.code)}</td>
            <td>${escapeHtml(course.title)}</td>
            <td>${escapeHtml(course.level)}</td>
            <td>${escapeHtml(course.partner)}</td>
            <td>${counts.get(course.id) || 0}</td>
        </tr>
    `).join('');

    $('sCourse').innerHTML = courses.map((course) => `
        <option value="${course.id}">${escapeHtml(course.code)} — ${escapeHtml(course.title)}</option>
    `).join('');
}

function renderStudents(students) {
    if (!students.length) {
        $('studentsTable').innerHTML = '<tr><td colspan="7" class="muted">No students found.</td></tr>';
        return;
    }

    $('studentsTable').innerHTML = students.map((student) => `
        <tr>
            <td>${student.id}</td>
            <td>${escapeHtml(student.full_name)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${escapeHtml(student.campus)}</td>
            <td>${escapeHtml(student.course_code || '')} — ${escapeHtml(student.course_title || '')}</td>
            <td>${escapeHtml(student.status)}</td>
            <td class="table-actions">
                <button type="button" class="btn-outline btn-sm edit-student" data-id="${student.id}">Edit</button>
                <button type="button" class="btn-outline btn-sm delete-student" data-id="${student.id}">Delete</button>
            </td>
        </tr>
    `).join('');

    document.querySelectorAll('.edit-student').forEach((button) => {
        button.addEventListener('click', () => {
            const student = state.students.find((item) => item.id === Number(button.dataset.id));
            if (student) openStudentModal(student);
        });
    });

    document.querySelectorAll('.delete-student').forEach((button) => {
        button.addEventListener('click', () => deleteStudent(Number(button.dataset.id)));
    });
}

function renderApplications(applications) {
    if (!applications.length) {
        $('applicationsTable').innerHTML = '<tr><td colspan="6" class="muted">No applications yet.</td></tr>';
        return;
    }

    $('applicationsTable').innerHTML = applications.map((application) => `
        <tr>
            <td>${escapeHtml(formatDate(application.submitted_at))}</td>
            <td>${escapeHtml(application.full_name)}</td>
            <td>${escapeHtml(application.email)}</td>
            <td>${escapeHtml(application.campus)}</td>
            <td>${escapeHtml(application.course_title || '')}</td>
            <td>${escapeHtml(application.message || '')}</td>
        </tr>
    `).join('');
}

function openStudentModal(student = null) {
    $('studentForm').reset();
    $('studentId').value = student ? student.id : '';
    $('modalTitle').textContent = student ? 'Edit Student' : 'Add Student';

    if (student) {
        $('sName').value = student.full_name || '';
        $('sEmail').value = student.email || '';
        $('sPhone').value = student.phone || '';
        $('sCampus').value = student.campus || 'Kathmandu';
        $('sCourse').value = String(student.course_id || '');
        $('sStatus').value = student.status || 'Active';
    } else {
        $('sStatus').value = 'Active';
    }

    $('studentModal').classList.remove('hidden');
}

function closeStudentModal() {
    $('studentModal').classList.add('hidden');
}

async function deleteStudent(id) {
    if (!confirm('Delete this student record? This cannot be undone.')) return;
    try {
        await api(`/students/${id}`, { method: 'DELETE' });
        await loadAll();
    } catch (error) {
        alert(error.message);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    $('loginError').classList.add('hidden');

    try {
        const result = await api('/login', {
            method: 'POST',
            body: JSON.stringify({
                username: $('username').value.trim(),
                password: $('password').value
            })
        });
        state.token = result.token;
        state.username = result.username;
        localStorage.setItem(TOKEN_KEY, state.token);
        localStorage.setItem('ismt_admin_user', state.username);
        showDashboard();
    } catch (error) {
        $('loginError').textContent = error.message;
        $('loginError').classList.remove('hidden');
    }
}

async function handleStudentSubmit(event) {
    event.preventDefault();
    const id = $('studentId').value;
    const payload = {
        full_name: $('sName').value.trim(),
        email: $('sEmail').value.trim(),
        phone: $('sPhone').value.trim(),
        campus: $('sCampus').value,
        course_id: Number($('sCourse').value),
        status: $('sStatus').value
    };

    try {
        await api(id ? `/students/${id}` : '/students', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });
        closeStudentModal();
        await loadAll();
    } catch (error) {
        alert(error.message);
    }
}

function init() {
    $('loginForm').addEventListener('submit', handleLogin);
    $('logoutBtn').addEventListener('click', logout);
    $('addStudentBtn').addEventListener('click', () => openStudentModal());
    $('cancelModal').addEventListener('click', closeStudentModal);
    $('studentForm').addEventListener('submit', handleStudentSubmit);

    document.querySelectorAll('.tab').forEach((tab) => {
        tab.addEventListener('click', () => setActiveView(tab.dataset.view));
    });

    $('studentModal').addEventListener('click', (event) => {
        if (event.target === $('studentModal')) closeStudentModal();
    });

    if (state.token) {
        showDashboard();
    } else {
        showLogin();
    }
}

document.addEventListener('DOMContentLoaded', init);
