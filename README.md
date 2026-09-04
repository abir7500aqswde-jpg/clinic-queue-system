# QueueWise — Real-Time Outpatient Queue & Appointment System

**Academic Project — Web Technologies**
Topics covered: HTML, CSS, JavaScript & the DOM, Client-Server Interaction, AJAX (Asynchronous JavaScript communication with a REST/JSON backend).

---

## 1. Problem Statement

Small clinics and diagnostic centres in most towns still run their outpatient
queue manually: patients take a paper token or simply wait in a physical
line, with no way to know how many people are ahead of them or how long the
wait will be. This causes overcrowded waiting rooms, wasted time, and no
visibility for staff into who is actually next.

**QueueWise** solves this with a small, real-time web application:

- A patient books a visit online and instantly receives a **live ticket
  number**.
- A **live queue board** shows the "now serving" number and the list of
  patients ahead, updating automatically every few seconds — without the
  page ever reloading.
- A **staff panel** lets the front desk call the next patient, and mark a
  visit complete or cancelled, which instantly reflects on every patient's
  screen.

This is a realistic, real-time problem (similar to airport check-in boards,
bank token systems, and telecom customer-care queues) and is small enough to
be implemented end-to-end as an academic project while still demonstrating
every required concept.

## 2. Objectives

1. Build a responsive, multi-page frontend using semantic **HTML5** and
   custom **CSS3** (no framework), including a distinct visual identity.
2. Manipulate the page dynamically using vanilla **JavaScript and the DOM**
   — rendering lists, cards, and live counters from data returned by the
   server.
3. Implement a proper **client-server architecture**: a Node.js/Express
   backend exposing a REST API, completely decoupled from the frontend.
4. Use **AJAX** (the Fetch API — the modern successor to `XMLHttpRequest`,
   exchanging **JSON** instead of raw XML, which is now the standard real-world
   implementation of "AJAX") for every read/write operation, so the UI never
   performs a full page reload.
5. Simulate **real-time behaviour** using periodic AJAX polling, so multiple
   browsers (a patient's phone and the staff desktop) stay in sync.

## 3. Tech Stack

| Layer            | Technology                                             |
|-------------------|--------------------------------------------------------|
| Structure         | HTML5                                                  |
| Styling           | CSS3 (custom properties / design tokens, Grid, Flexbox)|
| Client logic      | Vanilla JavaScript (ES6+), DOM APIs, Fetch/AJAX         |
| Server            | Node.js + Express.js (REST API)                        |
| Data persistence  | JSON file store (`data/db.json`) — no external DB setup required |
| Real-time updates | AJAX polling (`setInterval` + `fetch`) every 3–4 seconds |

A JSON file is used instead of a full database (MySQL/MongoDB) to keep the
project **small and easy to run/grade** on any machine with just Node.js
installed — the same REST endpoints could be pointed at a real database
with no change to the frontend, which is a natural "future work" extension.

## 4. System Architecture

```text
 ┌─────────────────┐        AJAX (fetch, JSON)        ┌───────────────────┐
 │  Patient Browser │ ───────────────────────────────▶ │                    │
 │  index.html      │ ◀─────────────────────────────── │   Express Server   │
 │  patient.js      │        polling every 3–4s         │   server.js        │
 └─────────────────┘                                    │                    │
                                                          │  REST API layer   │
 ┌─────────────────┐        AJAX (fetch, JSON)           │  /api/doctors     │
 │  Staff Browser   │ ───────────────────────────────▶  │  /api/tickets     │
 │  admin.html      │ ◀───────────────────────────────  │  /api/queue/:id   │
 │  admin.js        │        polling every 3s            │  /api/admin/...   │
 └─────────────────┘                                    └─────────┬──────────┘
                                                                    │
                                                                    ▼
                                                          ┌───────────────────┐
                                                          │  data/db.json      │
                                                          │ (doctors, tickets) │
                                                          └───────────────────┘
```

## 5. Data Model

**Doctor**
```text
{ id, name, department, avgMinutesPerPatient }
```

**Ticket**
```text
{
  id, ticketNumber, doctorId, doctorName,
  patientName, phone, reason,
  status: "waiting" | "in-consultation" | "completed" | "cancelled",
  createdAt, calledAt, closedAt
}
```

## 6. REST / AJAX API Reference

| Method | Endpoint                                 | Purpose                                   |
|--------|-------------------------------------------|--------------------------------------------|
| GET    | `/api/doctors`                            | List all doctors/departments               |
| POST   | `/api/tickets`                            | Book a new ticket (patient)                |
| GET    | `/api/tickets/:id`                        | Poll a single ticket's live status         |
| GET    | `/api/queue/:doctorId`                    | Live board snapshot for a doctor           |
| GET    | `/api/admin/tickets/:doctorId`            | Full active queue for staff panel          |
| PUT    | `/api/admin/tickets/:doctorId/call-next`  | Call the next waiting patient              |
| PUT    | `/api/admin/tickets/:id/status`           | Mark a ticket `completed` or `cancelled`   |

All requests/responses use JSON and are called from the browser using the
Fetch API (`patient.js`, `admin.js`) — no `<form>` submission ever reloads
the page.

## 7. Folder Structure

```text
clinicqueue/
├── server.js              # Express app + REST API
├── package.json
├── data/
│   └── db.json             # persisted doctors + tickets
├── public/
│   ├── index.html           # patient booking page + live board
│   ├── admin.html            # staff queue management panel
│   ├── css/
│   │   └── style.css          # design tokens + all styling
│   └── js/
│       ├── patient.js         # AJAX logic for patients
│       └── admin.js           # AJAX logic for staff
└── README.md
```

## 8. How to Run

**Prerequisite:** [Node.js](https://nodejs.org) v16 or later.

```bash
# 1. Unzip the project and move into it
cd clinicqueue

# 2. Install the one dependency (Express)
npm install

# 3. Start the server
npm start

# 4. Open in your browser
#    Patient view:  http://localhost:3000/
#    Staff view:    http://localhost:3000/admin.html
```

**Suggested demo flow:**
1. Open the patient page in one browser tab and the staff panel in another.
2. On the patient page, select "Dr. Ayesha Rahman — General Medicine" and
   book two or three tickets with different names.
3. Switch to the staff panel (same doctor selected) and click
   **"Call next patient"** — watch the "now serving" number update on the
   patient tab automatically within a few seconds, with no reload.
4. Click **"Mark visit complete"** and call the next patient again to see
   the queue count drop live.

## 9. Key Concepts Demonstrated (for viva)

- **DOM manipulation:** every dynamic value (queue numbers, ticket status,
  waiting list, table rows) is rendered by JavaScript reading a server
  response and updating `innerHTML`/`textContent`, not by server-rendered
  HTML.
- **Client-server interaction:** the frontend and backend are fully
  separated; the server only returns JSON, and all UI/rendering logic lives
  in the browser.
- **AJAX:** all communication uses `fetch()` (`GET`/`POST`/`PUT`) with
  `async`/`await`, matching the historical `XMLHttpRequest`-based AJAX
  pattern but with JSON as the payload, which is the standard modern
  implementation.
- **Real-time simulation:** `setInterval` polling (every 3–4 seconds) keeps
  every open browser tab in sync with server state — a simple, well
  understood technique for real-time-style UIs where WebSockets would be
  overkill for the project's scope.
- **Error handling:** invalid bookings, calling "next" with an empty queue,
  or calling next while someone is already being seen all return meaningful
  HTTP error codes/messages, shown in the UI without breaking the page.

## 10. Possible Future Enhancements

- Replace polling with **WebSockets/Socket.IO** for true push-based updates.
- Add authentication for the staff panel (currently open for demo purposes).
- Persist data in a real database (MySQL/MongoDB) instead of a JSON file.
- SMS/email notification when a patient's turn is close.
- Multi-branch support (multiple clinic locations).

## 11. Author's Note

This project is intentionally kept small in scope (one backend file, two
HTML pages, two small client scripts, one stylesheet) while still covering
 every required concept end-to-end, so it can be understood, explained, and
extended within a limited academic timeframe.
