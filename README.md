# Student Attendance Management System (MCA College Major Project)

A complete, production-grade digital Student Attendance Management System engineered with **React Native (Expo)**, **Express.js**, **TypeScript**, and **MongoDB**. Designed for paperless daily attendance tracking, automated percentage calculation, duplicate entry prevention, and authorized audit logging for college academic departments.

---

## 👥 Two-Member Project Team

- **Developer 1 (Mobile Application):** MacBook Pro M4 (macOS)
- **Developer 2 (Backend & Database Architecture):** Windows Laptop
- **Collaboration Platform:** VS Code, Git & GitHub, Google Gemini

---

## 🌟 Key Application Features

### 👨‍🏫 Teacher Portal
1. **Secure Authentication:** JWT token authentication with bcrypt password hashing.
2. **Class & Section Management:** Create, edit, and organize course sections (e.g. MCA 2nd Year, Section A & B).
3. **Student Directory & Enrollment:** Search by roll number, USN, or name; enroll students with validation.
4. **Fast Daily Attendance Marking:**
   - Single-tap toggle for **Present (P)**, **Late (L)**, and **Absent (A)**.
   - Bulk shortcuts: *"Mark All Present"* / *"Mark All Absent"*.
   - Live summary ribbon updating counts in real-time.
   - Pre-submission confirmation modal.
5. **Database Duplicate Session Prevention:** Enforced compound unique index (`class + sessionDate + subject`). Cannot accidentally double-submit attendance for the same lecture.
6. **Authorized Record Corrections with Audit Trail:** Teachers can correct past attendance marks with mandatory justification, recorded with timestamp and faculty signature.
7. **Attendance Analytics & CSV Export:**
   - Class-wide percentage averages.
   - Low attendance warnings (< 75% college eligibility threshold).
   - One-click export of complete student rosters as downloadable `.csv` sheets.

### 🎓 Student Portal
1. **Secure Self-Service Access:** Students log in to view their academic records.
2. **Visual Attendance Gauges:** Responsive circular percentage chart and status distribution breakdown.
3. **Low-Attendance Shortage Alert:** Dynamic warning banner when attendance falls below 75%, showing the exact number of consecutive sessions needed to regain examination eligibility.
4. **Attendance History Timeline:** Detailed log of each lecture date, subject, attendance status, and faculty remarks.
5. **Tamper-Proof Permissions:** Read-only access enforced on backend APIs. Students cannot alter attendance records.

---

## 📐 Attendance Calculation Formula

All calculations are enforced server-side using standard college university rules:

$$\text{Effective Attended} = \text{Present} + (\text{Late} \times 0.5)$$

$$\text{Attendance Percentage} = \left(\frac{\text{Effective Attended}}{\text{Total Counted Sessions}}\right) \times 100$$

- **Present Session:** $1.0$ weight (Attended full lecture).
- **Late Session:** $0.5$ weight (Partial lecture attendance).
- **Absent Session:** $0.0$ weight (Missed session).
- **Zero Session Safety:** Handled safely ($0.0\%$, division-by-zero protected).
- **University Eligibility Cutoff:** $75.0\%$.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile App** | React Native, Expo (SDK 58), TypeScript, Expo Router, React Hook Form, Zod, Axios, Expo SecureStore, Expo Notifications, React Native SVG |
| **Backend API** | Node.js, Express.js, TypeScript, Mongoose, JSON Web Tokens (JWT), bcryptjs, Zod |
| **Database** | MongoDB (with compound indexes and schema validation) |
| **Testing** | Jest, Supertest, ts-jest |
| **Design System** | Modern Navy & White Palette (`#0F1E36`, `#1E3A8A`, `#2563EB`, `#10B981`, `#EF4444`, `#F59E0B`) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** v18 or higher (v22 tested and verified)
- **npm:** v9 or higher
- **MongoDB:** Running locally on port `27017` (e.g. via Homebrew on Mac or MongoDB Community Server on Windows)

---

### Step 1: Start Backend Server

```bash
cd server

# 1. Install dependencies
npm install

# 2. Seed database with realistic demo data (Teachers, Students, Classes, 14-day history)
npm run seed

# 3. Start development server
npm run dev
```

Server starts on: **`http://localhost:5001`**  
Health Check: **`http://localhost:5001/api/health`**

---

### Step 2: Start Mobile Application

Open a second terminal:

```bash
cd mobile

# 1. Install dependencies
npm install

# 2. Start Expo dev server
npm start
```

#### Running on Platforms:
- **Web Browser (Fastest):** Press `w` in terminal or run `npm run web`.
- **iOS Simulator (macOS Developer 1):** Press `i` in terminal or run `npm run ios`.
- **Android Emulator (Windows Developer 2):** Press `a` in terminal or run `npm run android`.
- **Physical Phone (Expo Go):** Scan the QR code displayed in the terminal using the Expo Go mobile app (ensure phone and PC are on the same Wi-Fi network).

---

## 🔑 Demo Login Credentials

The seeder initializes the database with pre-configured accounts:

| Role | Email Address | Password | Details |
| :--- | :--- | :--- | :--- |
| **Faculty / Teacher** | `teacher@college.edu` | `Password123!` | Prof. Robert Sharma (MCA Cloud Computing) |
| **Faculty / Teacher 2** | `teacher2@college.edu` | `Password123!` | Dr. Ananya Rao (MCA Java Programming) |
| **Student (Eligible)** | `student@college.edu` | `Password123!` | Rahul Verma (USN: `MCA2026001`, ~90% Attendance) |
| **Student 2** | `priya@college.edu` | `Password123!` | Priya Nair (USN: `MCA2026002`) |

*Note: The Login screen includes one-tap demo autofill buttons for both roles.*

---

## 🧪 Verified Automated Test Results

The backend includes automated integration and unit test suites:

```bash
cd server
npm test
```

### Test Suite Execution Output:
```text
PASS tests/api.test.ts
  1. Authentication & Role Permissions API
    ✓ Registers teacher successfully (95 ms)
    ✓ Registers student successfully (62 ms)
    ✓ Rejects duplicate email registration with 409 (5 ms)
    ✓ Login succeeds with valid credentials (58 ms)
    ✓ Login fails with invalid password (401) (56 ms)
    ✓ Login fails with non-existent email (401) (3 ms)
  2. Class & Student Management API
    ✓ Teacher can create a class (14 ms)
    ✓ Student CANNOT create a class (403 Forbidden) (10 ms)
    ✓ Teacher can enroll a student (24 ms)
    ✓ Student CANNOT create a student record (403 Forbidden) (4 ms)
  3. Attendance Submission & Duplicate Prevention API
    ✓ Teacher submits attendance successfully (12 ms)
    ✓ PREVENTS duplicate attendance submission for same class, date and subject (409 Conflict) (7 ms)
    ✓ Student CANNOT submit attendance (403 Forbidden) (4 ms)
  4. Authorized Attendance Correction & Audit Trail
    ✓ Student CANNOT alter their own attendance record (403 Forbidden) (3 ms)
    ✓ Teacher can perform authorized attendance correction with audit reason (11 ms)
  5. Student Dashboard & Attendance Retrieval
    ✓ Student can view their own attendance history and percentage (15 ms)
  6. Reports and CSV Export API
    ✓ Teacher can view class attendance report (10 ms)
    ✓ Teacher can export attendance CSV (7 ms)

PASS tests/calculations.test.ts
  Attendance Calculation Engine
    ✓ Handles zero sessions safely without division-by-zero errors (1 ms)
    ✓ Matches prompt example: 36 present out of 40 total = 90%
    ✓ Correctly weights Late sessions as 0.5 attendance
    ✓ Flags low attendance warning when below threshold (75%) (1 ms)
    ✓ Consistently handles 100% attendance

Test Suites: 2 passed, 2 total
Tests:       23 passed, 23 total
```

---

## 📚 Project Documentation

- [REST API Specifications (`docs/API.md`)](file:///Users/nishanthdhegde/attendence%20project/docs/API.md) — Detailed request and response documentation for all endpoints.
- [Team Workflow & Git Collaboration (`docs/TEAM_WORKFLOW.md`)](file:///Users/nishanthdhegde/attendence%20project/docs/TEAM_WORKFLOW.md) — Cross-platform macOS & Windows setup guide, IP configuration, and branching strategy.
