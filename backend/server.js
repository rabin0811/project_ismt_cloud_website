const express = require('express');
const path = require('path');
const crypto = require('crypto');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// simple in-memory token store (demonstration only)
const sessions = new Map();

function auth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
}

// ---------- AUTH ----------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, admin.username);
  res.json({ token, username: admin.username });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers['authorization'];
  sessions.delete(token);
  res.json({ message: 'Logged out' });
});

// ---------- PUBLIC: courses & applications ----------
app.get('/api/courses', (req, res) => {
  res.json(db.prepare('SELECT * FROM courses ORDER BY id').all());
});

app.post('/api/applications', (req, res) => {
  const { full_name, email, campus, course_id, message } = req.body;
  if (!full_name || !email || !campus || !course_id) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }
  const result = db.prepare(
    'INSERT INTO applications (full_name, email, campus, course_id, message) VALUES (?, ?, ?, ?, ?)'
  ).run(full_name, email, campus, course_id, message || '');
  res.status(201).json({ message: 'Application submitted successfully', application_id: result.lastInsertRowid });
});

// ---------- STUDENTS CRUD ----------
app.get('/api/students', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, c.code AS course_code, c.title AS course_title
    FROM students s JOIN courses c ON s.course_id = c.id
    ORDER BY s.id
  `).all();
  res.json(rows);
});

app.get('/api/students/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Student not found' });
  res.json(row);
});

app.post('/api/students', auth, (req, res) => {
  const { full_name, email, phone, campus, course_id, status } = req.body;
  if (!full_name || !email || !campus || !course_id) {
    return res.status(400).json({ error: 'Name, email, campus and course are required' });
  }
  try {
    const result = db.prepare(
      'INSERT INTO students (full_name, email, phone, campus, course_id, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(full_name, email, phone || '', campus, course_id, status || 'Active');
    res.status(201).json({ message: 'Student added', id: result.lastInsertRowid });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'A student with this email already exists' });
    }
    throw e;
  }
});

app.put('/api/students/:id', auth, (req, res) => {
  const { full_name, email, phone, campus, course_id, status } = req.body;
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Student not found' });
  db.prepare(
    'UPDATE students SET full_name = ?, email = ?, phone = ?, campus = ?, course_id = ?, status = ? WHERE id = ?'
  ).run(full_name, email, phone || '', campus, course_id, status || 'Active', req.params.id);
  res.json({ message: 'Student updated' });
});

app.delete('/api/students/:id', auth, (req, res) => {
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Student not found' });
  res.json({ message: 'Student deleted' });
});

// ---------- DASHBOARD STATS ----------
app.get('/api/stats', auth, (req, res) => {
  const totalStudents = db.prepare('SELECT COUNT(*) AS c FROM students').get().c;
  const activeStudents = db.prepare("SELECT COUNT(*) AS c FROM students WHERE status = 'Active'").get().c;
  const totalCourses = db.prepare('SELECT COUNT(*) AS c FROM courses').get().c;
  const totalApplications = db.prepare('SELECT COUNT(*) AS c FROM applications').get().c;
  const byCampus = db.prepare('SELECT campus, COUNT(*) AS count FROM students GROUP BY campus').all();
  res.json({ totalStudents, activeStudents, totalCourses, totalApplications, byCampus });
});

// ---------- APPLICATIONS (admin view) ----------
app.get('/api/applications', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, c.title AS course_title
    FROM applications a JOIN courses c ON a.course_id = c.id
    ORDER BY a.submitted_at DESC
  `).all();
  res.json(rows);
});

// ---------- HEALTH CHECK (for load balancer) ----------
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', instance: process.env.INSTANCE_ID || 'EC2-1', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`ISMT cloud platform running on http://localhost:${PORT}`);
});
