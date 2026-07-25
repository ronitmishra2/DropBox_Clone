# ☁️ Dropbox Clone

> A cloud-native full-stack file management application inspired by enterprise cloud storage systems like Dropbox. This project demonstrates scalable cloud architecture by separating relational metadata from object storage while implementing secure authentication and efficient file delivery.

![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-Backend-black?logo=flask)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)
![MinIO](https://img.shields.io/badge/MinIO-S3%20Storage-red)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker)
![JWT](https://img.shields.io/badge/Auth-JWT-success)

---

# 📖 Overview

Dropbox Clone is a **cloud-native file storage application** that replicates the architecture used by modern cloud storage providers.

Instead of storing uploaded files directly inside a relational database, the application follows an **enterprise-grade decoupled storage architecture**, where:

- **PostgreSQL** stores users, folders, and metadata.
- **MinIO (S3-compatible Object Storage)** stores the actual binary file objects.
- **Flask API** acts as the secure control plane.
- **React** provides a responsive frontend.

This architecture improves scalability, maintainability, and storage performance.

---

# 🏗️ Architecture

```
                   +--------------------+
                   |     React Client   |
                   +---------+----------+
                             |
                       HTTP + JWT
                             |
                             ▼
                  +---------------------+
                  |    Flask Backend    |
                  | Authentication API  |
                  | File Metadata API   |
                  +----+-----------+----+
                       |           |
              SQLAlchemy           |
                       |           |
                       ▼           ▼
            PostgreSQL DB      MinIO (S3)
        Metadata & Users      Physical Files
```

---

# ✨ Features

## 🔐 Secure Authentication

- User Registration
- User Login
- JWT Authentication
- Password hashing using **bcrypt**

---

## ☁️ Cloud Storage

- Upload files
- View uploaded files
- Download files
- User-specific storage

---

## 📂 Metadata Management

PostgreSQL stores:

- User information
- Folder hierarchy
- Original filename
- File size
- Upload timestamps
- UUID object names

---

## 📦 Object Storage

MinIO stores:

- Actual binary files
- UUID-based filenames
- S3-compatible objects

---

## 🚀 High Performance Downloads

Downloads do **not** pass through Flask.

Instead:

1. Client requests download
2. Flask validates JWT
3. Flask generates a **Presigned URL**
4. Client downloads directly from MinIO

Benefits:

- Reduced backend bandwidth
- Faster downloads
- Better scalability
- Secure temporary access

---

## 🛡️ Zero-Trust Security

Every storage endpoint is protected using:

- JWT Bearer Tokens
- Custom authentication middleware
- Password hashing (bcrypt)

Only authenticated users can access their own files.

---

# 🚀 Cloud Architecture Highlights

## ✅ Decoupled Storage Architecture

Instead of saving files inside PostgreSQL:

```
React
   │
   ▼
Flask API
   │
   ├────────► PostgreSQL
   │           Metadata
   │
   └────────► MinIO
               Binary Files
```

Advantages:

- Highly scalable
- Easy backups
- Faster database queries
- Enterprise architecture

---

## ✅ Zero-Collision Uploads

When a user uploads:

```
resume.pdf
```

The backend stores it as:

```
8a41c39d-7d64-4bd4-b5c9-f97bcaf52c70.pdf
```

while PostgreSQL still remembers:

```
resume.pdf
```

This prevents filename collisions between users.

---

## ✅ Direct Downloads using Presigned URLs

Instead of:

```
Client
   │
Flask
   │
MinIO
```

the architecture becomes:

```
Client
   │
Flask
   │
Presigned URL
   │
   ▼
MinIO
```

Advantages:

- Less server load
- Better performance
- Secure temporary download links

---

# 🛠️ Tech Stack

| Layer | Technology |
|---------|------------|
| Frontend | React (Vite/CRA) |
| HTTP Client | Axios |
| Backend | Flask |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Password Security | bcrypt |
| Database | PostgreSQL |
| Object Storage | MinIO |
| Infrastructure | Docker |
| Container Orchestration | Docker Compose |

---

# 📁 Project Structure

```
Dropbox-Clone/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── run.py
│   ├── requirements.txt
│   └── .env
│
├── docker-compose.yml
│
└── README.md
```

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd Dropbox-Clone
```

---

## 2️⃣ Start Infrastructure

Start PostgreSQL and MinIO:

```bash
docker compose up -d
```

Services started:

| Service | Port |
|----------|------|
| PostgreSQL | 5432 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

---

## 3️⃣ Configure MinIO

Open:

```
http://localhost:9001
```

Login:

```
Username:
minioadmin

Password:
minioadmin123
```

Create a bucket named:

```
dropbox-files
```

---

## 4️⃣ Backend Environment Variables

Create:

```
backend/.env
```

```env
FLASK_APP=run.py
FLASK_DEBUG=1

SECRET_KEY=super-secret-jwt-key-change-this-in-production

DATABASE_URL=postgresql://dropbox_user:secretpassword@localhost:5432/dropbox_clone

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_SECURE=False
```

---

## 5️⃣ Install Backend

```bash
cd backend
```

Install dependencies

```bash
pip install -r requirements.txt
```

Start server

```bash
python run.py
```

The backend automatically creates all PostgreSQL tables during startup.

---

## 6️⃣ Start Frontend

```bash
cd frontend
npm install
npm run dev
```

or (CRA)

```bash
npm start
```

---

# 🔑 Authentication

Include the JWT in every protected request.

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

# 📡 REST API

## 🔐 Authentication APIs

Base URL

```
/api/auth
```

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and receive JWT |

---

## ☁️ Storage APIs

Base URL

```
/api/storage
```

**Requires JWT Authentication**

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/files` | List all files belonging to the authenticated user |
| POST | `/upload` | Upload a file using multipart/form-data |
| GET | `/download/<file_id>` | Returns a secure MinIO Presigned URL |

---

# 🔄 Upload Workflow

```
User
 │
 ▼
Select File
 │
 ▼
React Upload
 │
 ▼
Flask API
 │
 ├────────────► Generate UUID
 │
 ├────────────► Upload to MinIO
 │
 └────────────► Save Metadata
                in PostgreSQL
```

---

# 📥 Download Workflow

```
User
 │
 ▼
Request Download
 │
 ▼
Flask validates JWT
 │
 ▼
Generate Presigned URL
 │
 ▼
Client Downloads
Directly From MinIO
```

---

# 🔒 Security Features

- JWT Authentication
- Protected API Routes
- bcrypt Password Hashing
- UUID Object Names
- User Isolation
- Secure Presigned URLs
- Zero-Trust API Design

---

# 📈 Scalability Benefits

✔ Decoupled storage architecture

✔ Horizontal backend scaling

✔ Faster database queries

✔ Secure object storage

✔ Efficient large file handling

✔ Reduced backend bandwidth

✔ Enterprise-inspired cloud design

---

# 🎯 Future Improvements

- Folder sharing
- Role-Based Access Control (RBAC)
- File versioning
- Drag-and-drop uploads
- Search functionality
- File previews
- Multi-part uploads
- AWS S3 deployment
- Kubernetes deployment
- CI/CD with GitHub Actions

---

# 👨‍💻 Author

**Ronit Mishra**

- 💼 Cloud Computing Enthusiast
- 🐍 Python Developer
- ☁️ Cloud & DevOps Learner
- 🚀 Passionate about building scalable backend systems

---

# ⭐ If you found this project useful

Give the repository a ⭐ on GitHub!

It helps others discover the project and motivates future improvements.
