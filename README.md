# LAND TRANSPORTATION OFFICE (LTO) INFORMATION MANAGEMENT SYSTEM

A centralized information management system designed to simulate the core operations of the Philippine Land Transportation Office (LTO). The system allows LTO personnel to efficiently manage driver records, motor vehicle information, vehicle registrations, and traffic violations while ensuring data integrity, a relational database design, and SQL-based reporting. 

Built as a final project for CMSC 127 – File Processing and Database Systems at the University of the Philippines Los Baños (UPLB).

---

## Tech Stack

### Backend

- express - Node.js web server and API
- mysql2 - MySQL client for Node.js
- dotenv - environment variable management
- cron - time-based job scheduler used for system maintenance
- nodemon (dev dependency) — auto-restart server during development whenever file changes are made
- prompt-sync – synchronous command-line input (used for DB setup CLI)

### Frontend

- React

---

## Project Structure

```
LTO-INFORMATION-MANAGEMENT-DATABASE/
├── backend
│   └── src
|       ├── config/
│       ├── controllers/
│       ├── routes/
│       ├── service/
│       └── server.js
│
├── frontend
│   └── src/
|       ├── assets/
|       ├── components/
|       ├── pages/
│       ├── App.jsx
│       ├── main.jsx
│       ├── App.css
│       └── index.css
│
├── vite.config.js
├── .gitignore
└── README.md
```

---

## Installation & Setup Guide

### Clone the Repository

```
git clone https://github.com/DaemonChu/CMSC127-Final-Project.git
cd CMSC127-Final-Project
```

### Backend setup

**1. Navigate to Backend**

```
cd backend
```

**2. Install Dependencies**

```
npm install
```

**3. Run Backend Server**

Development mode:

```
npm run dev
```

Production mode:

```
npm start
```

Backend should run on:

```
http://localhost:5000
```

### Frontend Setup

**1. Navigate to Backend**

```
cd frontend
```

**2. Install Dependencies**

```
npm install
```

**3. Start Frontend Server**

```
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

### Database Setup (CLI Tool)

This project includes a custom CLI tool to manage the database easily

**Run the DB CLI**

from the project folder, run:

```
npm run db
```

You will see:

```
======================
   LTO DB CLI MENU
======================
[0] !!QUICK SETUP!!
[1] Init Database
[2] Reset Database
[3] Seed Database
[4] Exit
```

What each option does:

- `[0] QUICK SETUP` – Runs everything (init + seed). Use for first-time setup.
- `[1] Init Database` – Creates database and tables only (no data) (WARNING: overwrites existing data).
- `[2] Reset Database` – Deletes database (WARNING: wipes everything).
- `[3] Seed Database` – Inserts sample data.
- `[4] Exit` – Closes the CLI.

---

## Environment Variables

The `.env` file is **not included in the repository**.

Each developer must create their own `.env` file inside `backend/`.

### Required variables:

```env
# MARIADB CREDENTIALS
DB_HOST=localhost
DB_USER=<USERNAME>
DB_PASSWORD=<PASSWORD>
DB_NAME=LTO_IMS_DB

# DEFAULT PORT
PORT=3000
```

> ⚠️ Ask groupmates for the correct MariaDB credentials

---

## Notes

- `node_modules/` is not included — run `npm install` in both `backend` and `frontend`
- `.env` is ignored for security reasons

---

## Contributors

- Denise Kirssy F. Chua
- Frannieczeska Erene U. Tandang
- Natasha Lois Montas

## Notes for Developers

- (for development only!) This project uses **`concurrently`** to run both the frontend and backend servers at the same time using a single command

  this is configured in the root `package.json`

  To run both frontend and backend together:

  ```
  npm run dev
  ```

- Please make sure that backend and frontend are properly integrated before pushing
- # Make sure to use branches and create pull requests!
