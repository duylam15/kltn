# 🎓 SGU Learning Management System (LMS)

A fullstack multi-role academic portal built for **Administrators**, **Lecturers**, and **Students** at Sai Gon University. The platform streamlines course management, online assignments, automated grading, gradebook calculations, and real-time classroom communication.

🎥 **Video Demo:** [Watch Full Walkthrough on Google Drive](https://drive.google.com/file/d/1T9x5Bzat81q-qzEpmDgy4yX5TW2ejaW1/view)

---

## 🎯 Key Features

### 🔐 Authentication & Role-Based Access Control (RBAC)
- Secure login and session management using **JWT (JSON Web Tokens)**.
- Strict route and API protection across three distinct roles: **Admin**, **Lecturer**, and **Student**.

### 👨‍💼 Administrator Portal
- Manage user accounts (lecturers & students), academic semesters, subjects, and course classes.
- Monitor system-wide enrollment and teaching assignments.

### 👨‍🏫 Lecturer Portal
- Create and organize course materials, announcements, and assignments with deadlines.
- Configure custom grading weights and leverage **automated grading** alongside manual review.
- Manage class gradebooks with automatic weighted score calculations and exportable reports.

### 👨‍🎓 Student Portal
- Enroll in assigned courses, access lecture materials, and submit assignments online.
- Track real-time submission statuses, detailed feedback, and cumulative course grades.

### 💬 Real-Time Course Chat Rooms
- Built-in live messaging channels per course powered by **Socket.IO**, enabling instant Q&A and announcements between lecturers and students.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, TypeScript, Tailwind CSS, Ant Design |
| **Backend** | Node.js, Express.js, Prisma ORM |
| **Database** | PostgreSQL |
| **Real-Time & Auth** | Socket.IO, JWT (Role-Based Access Control) |
| **Deployment** | Docker, Nginx, Linux VPS |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js `v20+`
- PostgreSQL `v14+`

### 1. Clone the repository
```bash
git clone [https://github.com/duylam15/kltn.git](https://github.com/duylam15/kltn.git)
cd kltn
