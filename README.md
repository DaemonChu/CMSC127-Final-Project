# LAND TRANSPORTATION OFFICE (LTO) INFORMATION MANAGEMENT SYSTEM

Lorem ipsum, I forgot the rest. Insert a short description here.

---

## Tech Stack

### Backend

- express - Node.js web server and API
- mysql2 - MySQL client for Node.js
- dotenv - environment variable management
- nodemon (dev dependency) — auto-restart server during development whenever file changes are made

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
-
- ***

## Notes for Developers

- (for development only!) This project uses **`concurrently`** to run both the frontend and backend servers at the same time using a single command

  this is configured in the root `package.json`

  To run both frontend and backend together:

  ```
  npm run dev
  ```

- Please make sure that backend and frontend are properly integrated before pushing
- Make sure to use brances and create pull requests!
