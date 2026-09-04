const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDB() { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDB(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
function doctor(db, id) { return db.doctors.find(d => d.id === id); }
function waitMinutes(db, ticket) {
  const d = doctor(db, ticket.doctorId);
  const per = d ? d.avgMinutesPerPatient : 10;
  return db.tickets.filter(t => t.doctorId === ticket.doctorId && t.status === 'waiting' && t.ticketNumber < ticket.ticketNumber).length * per;
}
function serialize(db, t) { return { ...t, estimatedWaitMinutes: t.status === 'waiting' ? waitMinutes(db, t) : 0 }; }

app.get('/api/doctors', (req, res) => res.json(readDB().doctors));

app.post('/api/tickets', (req, res) => {
  const { doctorId, patientName, phone, reason } = req.body;
  if (!doctorId || !patientName || !phone) return res.status(400).json({ error: 'doctorId, patientName and phone are required.' });
  const db = readDB();
  const d = doctor(db, doctorId);
  if (!d) return res.status(404).json({ error: 'Selected doctor was not found.' });
  const ticket = {
    id: 't' + Date.now() + Math.floor(Math.random() * 1000),
    ticketNumber: db.nextTicketNumber++, doctorId, doctorName: d.name,
    patientName, phone, reason: reason || 'General consultation', status: 'waiting',
    createdAt: new Date().toISOString()
  };
  db.tickets.push(ticket); writeDB(db); res.status(201).json(serialize(db, ticket));
});

app.get('/api/tickets/:id', (req, res) => {
  const db = readDB(); const t = db.tickets.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket not found.' });
  res.json(serialize(db, t));
});

app.get('/api/queue/:doctorId', (req, res) => {
  const db = readDB(); const d = doctor(db, req.params.doctorId);
  if (!d) return res.status(404).json({ error: 'Doctor not found.' });
  const list = db.tickets.filter(t => t.doctorId === d.id);
  const nowServing = list.find(t => t.status === 'in-consultation');
  const waiting = list.filter(t => t.status === 'waiting').sort((a,b) => a.ticketNumber - b.ticketNumber);
  res.json({ doctor: d, nowServing: nowServing ? serialize(db, nowServing) : null, waitingCount: waiting.length, waitingList: waiting.slice(0, 5).map(t => serialize(db, t)) });
});

app.get('/api/admin/tickets/:doctorId', (req, res) => {
  const db = readDB();
  res.json(db.tickets.filter(t => t.doctorId === req.params.doctorId && ['waiting','in-consultation'].includes(t.status)).sort((a,b) => a.ticketNumber-b.ticketNumber).map(t => serialize(db,t)));
});

app.put('/api/admin/tickets/:doctorId/call-next', (req, res) => {
  const db = readDB();
  if (db.tickets.some(t => t.doctorId === req.params.doctorId && t.status === 'in-consultation')) return res.status(409).json({ error: 'A patient is already in consultation. Complete that visit first.' });
  const next = db.tickets.filter(t => t.doctorId === req.params.doctorId && t.status === 'waiting').sort((a,b)=>a.ticketNumber-b.ticketNumber)[0];
  if (!next) return res.status(404).json({ error: 'No patients waiting in this queue.' });
  next.status = 'in-consultation'; next.calledAt = new Date().toISOString(); writeDB(db); res.json(serialize(db,next));
});

app.put('/api/admin/tickets/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['completed','cancelled'].includes(status)) return res.status(400).json({ error: 'status must be completed or cancelled.' });
  const db = readDB(); const t = db.tickets.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket not found.' });
  t.status = status; t.closedAt = new Date().toISOString(); writeDB(db); res.json(serialize(db,t));
});

app.listen(PORT, () => console.log(`QueueWise server running on port ${PORT}`));
