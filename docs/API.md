# Student Attendance Management System — REST API Documentation

Base URL: `http://localhost:5001/api` (or configured via environment)  
Authentication: HTTP Bearer Token (`Authorization: Bearer <JWT>`)

---

## 1. Authentication Endpoints

### Register User
- **Method / Path:** `POST /api/auth/register`
- **Access / Permissions:** Public
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Prof. Robert Sharma",
    "email": "teacher@college.edu",
    "password": "Password123!",
    "role": "teacher",
    "department": "MCA",
    "phone": "+91 98765 43210",
    "studentId": "MCA2026001" // Required only if role === 'student'
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "67195b0...",
      "name": "Prof. Robert Sharma",
      "email": "teacher@college.edu",
      "role": "teacher",
      "department": "MCA"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: User with email already exists.

---

### Login User
- **Method / Path:** `POST /api/auth/login`
- **Access / Permissions:** Public
- **Request Body:**
  ```json
  {
    "email": "teacher@college.edu",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "67195b0...",
      "name": "Prof. Robert Sharma",
      "email": "teacher@college.edu",
      "role": "teacher",
      "department": "MCA"
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Invalid email or password.

---

### Get Authenticated User Profile
- **Method / Path:** `GET /api/auth/me`
- **Access / Permissions:** Authenticated (`Bearer <token>`)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "67195b0...",
      "name": "Prof. Robert Sharma",
      "email": "teacher@college.edu",
      "role": "teacher",
      "department": "MCA",
      "phone": "+91 98765 43210"
    }
  }
  ```

---

## 2. Class Management Endpoints

### List Classes
- **Method / Path:** `GET /api/classes`
- **Access / Permissions:** Authenticated
  - Teachers receive classes assigned to them.
  - Students receive the class they are enrolled in.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 2,
    "classes": [
      {
        "_id": "67195c1...",
        "name": "MCA 2nd Year - Section A",
        "code": "MCA-CC-2026",
        "subject": "Cloud Computing & DevOps",
        "semester": "Semester 4",
        "academicYear": "2025-2026",
        "roomNumber": "Lab 302",
        "teacher": { "name": "Prof. Robert Sharma", "email": "teacher@college.edu" },
        "students": ["67195d2...", "67195d3..."]
      }
    ]
  }
  ```

---

### Create Class
- **Method / Path:** `POST /api/classes`
- **Access / Permissions:** `teacher` or `admin` only (Students receive `403 Forbidden`)
- **Request Body:**
  ```json
  {
    "name": "MCA 2nd Year - Section B",
    "code": "MCA-DS-2026",
    "subject": "Data Science & Big Data",
    "academicYear": "2025-2026",
    "semester": "Semester 4",
    "roomNumber": "Lab 101"
  }
  ```
- **Success Response (201 Created):** Returns created class object.

---

### Get Class Details & Enrolled Students
- **Method / Path:** `GET /api/classes/:id`
- **Access / Permissions:** Authenticated
- **Success Response (200 OK):** Returns class with populated `students` array and `teacher`.

---

## 3. Student Management Endpoints

### List / Search Students
- **Method / Path:** `GET /api/students`
- **Query Parameters:**
  - `classId` (optional): Filter students by class.
  - `search` (optional): Search by name, roll number, student ID (USN), or email.
- **Access / Permissions:** `teacher` or `admin`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 10,
    "students": [
      {
        "_id": "67195d2...",
        "studentId": "MCA2026001",
        "rollNumber": "01",
        "name": "Rahul Verma",
        "email": "student@college.edu",
        "class": { "_id": "67195c1...", "code": "MCA-CC-2026" }
      }
    ]
  }
  ```

---

### Enroll New Student
- **Method / Path:** `POST /api/students`
- **Access / Permissions:** `teacher` or `admin` (Students receive `403 Forbidden`)
- **Request Body:**
  ```json
  {
    "studentId": "MCA2026011",
    "name": "Kiran Deshpande",
    "email": "kiran@college.edu",
    "rollNumber": "11",
    "classId": "67195c1...",
    "phone": "+91 91234 56711",
    "guardianPhone": "+91 98765 00011",
    "gender": "Male"
  }
  ```
- **Success Response (201 Created):** Student record created and enrolled in class.

---

## 4. Attendance Endpoints

### Submit Daily Attendance
- **Method / Path:** `POST /api/attendance/submit`
- **Access / Permissions:** `teacher` or `admin`
- **Constraint / Duplicate Prevention:** Rejects duplicate submissions for the same `classId`, `sessionDate` and `subject` with `409 Conflict`.
- **Request Body:**
  ```json
  {
    "classId": "67195c1...",
    "sessionDate": "2026-10-23",
    "subject": "Cloud Computing & DevOps",
    "remarks": "Lecture on Docker Containers",
    "records": [
      { "studentId": "67195d2...", "status": "present", "remarks": "On time" },
      { "studentId": "67195d3...", "status": "late", "remarks": "10 mins late" },
      { "studentId": "67195d4...", "status": "absent", "remarks": "" }
    ]
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Attendance submitted and recorded successfully",
    "session": {
      "id": "67195e5...",
      "class": "MCA 2nd Year - Section A",
      "subject": "Cloud Computing & DevOps",
      "sessionDate": "2026-10-23T00:00:00.000Z",
      "totalStudents": 3,
      "presentCount": 1,
      "absentCount": 1,
      "lateCount": 1
    }
  }
  ```

---

### Check Attendance by Date
- **Method / Path:** `GET /api/attendance/by-date?classId=...&date=YYYY-MM-DD`
- **Access / Permissions:** `teacher` or `admin`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "sessionExists": true,
    "session": { ... },
    "records": [ ... ]
  }
  ```

---

### Authorized Attendance Correction (Audit Trail)
- **Method / Path:** `PUT /api/attendance/record/:id/correct`
- **Access / Permissions:** `teacher` or `admin` (Students receive `403 Forbidden`)
- **Request Body:**
  ```json
  {
    "newStatus": "present",
    "reason": "Student submitted authorized college sports duty slip"
  }
  ```
- **Success Response (200 OK):**
  Updates record status, appends signature to `correctionHistory`, and recalculates parent session counts.

---

### Student Personal Attendance & Stats
- **Method / Path:** `GET /api/attendance/student/:studentId`
- **Access / Permissions:** Authenticated (Student can only access their own record; Teacher/Admin can access any)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "student": {
      "id": "67195d2...",
      "studentId": "MCA2026001",
      "name": "Rahul Verma",
      "rollNumber": "01"
    },
    "stats": {
      "totalSessions": 10,
      "presentCount": 9,
      "absentCount": 0,
      "lateCount": 1,
      "effectiveAttended": 9.5,
      "attendancePercentage": 95.0,
      "strictPresentPercentage": 90.0,
      "isLowAttendance": false,
      "shortageSessionsNeededFor75": 0
    },
    "records": [ ... ]
  }
  ```

---

### Class Attendance Report & Analytics
- **Method / Path:** `GET /api/attendance/class/:classId/report`
- **Query Parameters:** `startDate`, `endDate` (optional)
- **Access / Permissions:** `teacher` or `admin`
- **Success Response (200 OK):**
  Returns class average percentage, low attendance student count, list of all enrolled students with their respective attendance stats, and session history.

---

### Export Attendance CSV
- **Method / Path:** `GET /api/attendance/class/:classId/export/csv`
- **Access / Permissions:** `teacher` or `admin`
- **Response Headers:**
  - `Content-Type: text/csv`
  - `Content-Disposition: attachment; filename=attendance_...csv`
- **Response Content:** CSV rows with `Roll No, Student ID, Student Name, Total Sessions, Present, Absent, Late, Percentage, Eligibility Status`.
