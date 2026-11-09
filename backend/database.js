const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'ismt.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    level TEXT NOT NULL,
    partner TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    campus TEXT NOT NULL,
    course_id INTEGER NOT NULL,
    enrollment_date TEXT DEFAULT (date('now')),
    status TEXT DEFAULT 'Active',
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    campus TEXT NOT NULL,
    course_id INTEGER NOT NULL,
    message TEXT,
    submitted_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );
`);

function seed() {
  const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admins').get().c;
  if (adminCount === 0) {
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', 'ismt2026');
  }

  const courseCount = db.prepare('SELECT COUNT(*) AS c FROM courses').get().c;
  if (courseCount === 0) {
    const insert = db.prepare('INSERT INTO courses (code, title, level, partner) VALUES (?, ?, ?, ?)');
    insert.run('BSC-IT', 'BSc (Hons) Computer Systems Engineering (IT)', 'Undergraduate', 'University of Sunderland');
    insert.run('BBA', 'BA (Hons) Business and Management (BBA)', 'Undergraduate', 'University of Sunderland');
    insert.run('BHM', 'BSc (Hons) International Tourism and Hospitality Management (BHM)', 'Undergraduate', 'University of Sunderland');
    insert.run('BSC-CS', 'BSc (Hons) Computer Science', 'Undergraduate', 'University of Sunderland');
    insert.run('BSC-CSF', 'BSc (Hons) Cyber Security and Digital Forensics', 'Undergraduate', 'University of Sunderland');
    insert.run('MBA', 'Master of Business Administration (MBA)', 'Postgraduate', 'University of Sunderland');
    insert.run('MSC-CMP', 'MSc Computing', 'Postgraduate', 'University of Sunderland');
  }

  const studentCount = db.prepare('SELECT COUNT(*) AS c FROM students').get().c;
  if (studentCount === 0) {
    const insert = db.prepare(
      'INSERT INTO students (full_name, email, phone, campus, course_id, enrollment_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insert.run('Susmita Singh', 'susmita.singh@ismt.edu.np', '9801000001', 'Kathmandu', 1, '2024-09-15', 'Active');
    insert.run('Grishma Amatya', 'grishma.amatya@ismt.edu.np', '9801000002', 'Kathmandu', 5, '2024-09-15', 'Active');
    insert.run('Reyon Rai', 'reyon.rai@ismt.edu.np', '9801000003', 'Pokhara', 2, '2024-09-20', 'Active');
    insert.run('Suman Mahato', 'suman.mahato@ismt.edu.np', '9801000004', 'Chitwan', 3, '2025-02-01', 'Active');
    insert.run('Bijay Upreti', 'bijay.upreti@ismt.edu.np', '9801000005', 'Biratnagar', 6, '2023-09-10', 'Graduated');
    insert.run('Anisha Shrestha', 'anisha.shrestha@ismt.edu.np', '9801000006', 'Butwal', 4, '2025-02-01', 'Active');
    insert.run('Prakash Gurung', 'prakash.gurung@ismt.edu.np', '9801000007', 'Kathmandu', 7, '2024-09-18', 'Active');
    insert.run('Nisha Karki', 'nisha.karki@ismt.edu.np', '9801000008', 'Pokhara', 1, '2025-02-05', 'Suspended');
  }
}

seed();

module.exports = db;
