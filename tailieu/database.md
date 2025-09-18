# Thiết kế Cơ sở Dữ liệu - Hệ thống Hỗ trợ Học tập Khoa CNTT

## NHÓM 1: QUẢN LÝ NGƯỜI DÙNG VÀ PHÂN QUYỀN

### 1.1. Bảng Users (Người dùng)

```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,           -- ID người dùng
    email VARCHAR(100) UNIQUE NOT NULL,               -- Email đăng nhập
    password_hash VARCHAR(255) NOT NULL,              -- Mật khẩu đã mã hóa
    full_name NVARCHAR(100) NOT NULL,                 -- Họ và tên
    avatar_url VARCHAR(500),                          -- Đường dẫn ảnh đại diện
    phone VARCHAR(15),                                -- Số điện thoại
    date_of_birth DATE,                               -- Ngày sinh
    address NVARCHAR(200),                            -- Địa chỉ
    role_id INT NOT NULL,                             -- ID vai trò
    is_active BOOLEAN DEFAULT TRUE,                   -- Trạng thái hoạt động
    email_verified BOOLEAN DEFAULT FALSE,             -- Email đã xác thực
    last_login TIMESTAMP,                             -- Lần đăng nhập cuối
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);
```

### 1.2. Bảng Roles (Vai trò)

```sql
CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,           -- ID vai trò
    role_name VARCHAR(50) UNIQUE NOT NULL,            -- Tên vai trò: 'student', 'teacher', 'admin'
    role_description NVARCHAR(200),                   -- Mô tả vai trò
    permissions JSON,                                 -- Danh sách quyền dạng JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP    -- Ngày tạo
);
```

### 1.3. Bảng Students (Sinh viên)

```sql
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,                      -- ID sinh viên
    user_id INT UNIQUE NOT NULL,                                    -- ID người dùng
    student_code VARCHAR(20) UNIQUE NOT NULL,                       -- Mã số sinh viên
    class_name VARCHAR(50),                                         -- Tên lớp
    major VARCHAR(100),                                             -- Ngành học
    academic_year VARCHAR(10),                                      -- Khóa học VD: 2021-2025
    enrollment_year INT,                                            -- Năm nhập học
    gpa DECIMAL(3,2) DEFAULT 0.00,                                  -- Điểm trung bình tích lũy
    status ENUM('active', 'suspended', 'graduated', 'dropped') DEFAULT 'active', -- Trạng thái sinh viên
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                 -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### 1.4. Bảng Teachers (Giảng viên)

```sql
CREATE TABLE teachers (
    teacher_id INT PRIMARY KEY AUTO_INCREMENT,                     -- ID giảng viên
    user_id INT UNIQUE NOT NULL,                                   -- ID người dùng
    teacher_code VARCHAR(20) UNIQUE NOT NULL,                      -- Mã giảng viên
    department NVARCHAR(100),                                      -- Khoa/Bộ môn
    position NVARCHAR(50),                                         -- Chức vụ: Giảng viên, Phó giáo sư, Giáo sư
    specialization NVARCHAR(200),                                  -- Chuyên môn
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

---

## NHÓM 2: QUẢN LÝ MÔN HỌC VÀ HỌC PHẦN

### 2.1. Bảng Courses (Học phần/Lớp học phần)

```sql
CREATE TABLE courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,                      -- ID học phần
    teacher_id INT NOT NULL,                                       -- ID giảng viên
    course_code VARCHAR(30) UNIQUE NOT NULL,                       -- Mã học phần VD: IT001.01
    semester VARCHAR(20) NOT NULL,                                 -- Học kỳ VD: HK1_2023-2024
    max_students INT DEFAULT 50,                                   -- Sỉ số tối đa
    current_students INT DEFAULT 0,                                -- Số sinh viên hiện tại
    schedule JSON,                                                 -- Lịch học dạng JSON
    start_date DATE,                                               -- Ngày bắt đầu
    end_date DATE,                                                 -- Ngày kết thúc
    status ENUM('planned', 'ongoing', 'completed', 'cancelled') DEFAULT 'planned', -- Trạng thái học phần
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);
```

### 2.2. Bảng Course_Enrollments (Đăng ký học phần)
// ma giang vien
```sql
CREATE TABLE course_enrollments (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,                  -- ID đăng ký
    course_id INT NOT NULL,                                        -- ID học phần
    student_id INT NOT NULL,                                       -- ID sinh viên
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,           -- Ngày đăng ký
    status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled', -- Trạng thái đăng ký
    midterm_score DECIMAL(4,2),                                    -- Điểm giữa kỳ
    final_score DECIMAL(4,2),                                      -- Điểm cuối kỳ
    total_score DECIMAL(4,2),                                      -- Điểm tổng kết
    grade VARCHAR(5),                                              -- Điểm chữ: A+, A, B+, B, C+, C, D+, D, F
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    UNIQUE KEY unique_enrollment (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);
```

// ql sv theo nhom hp

### 2.3. Bảng Attendance (Điểm danh)

```sql
CREATE TABLE attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,                  -- ID điểm danh
    course_id INT NOT NULL,                                        -- ID học phần
    student_id INT NOT NULL,                                       -- ID sinh viên
    session_date DATE NOT NULL,                                    -- Ngày học
    session_number INT NOT NULL,                                   -- Buổi học thứ mấy
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,  -- Trạng thái: có mặt, vắng, trễ, có phép
    check_in_time TIMESTAMP,                                       -- Thời gian điểm danh
    notes TEXT,                                                    -- Ghi chú
    marked_by INT,                                                 -- Người điểm danh
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                 -- Thời gian ghi nhận
    UNIQUE KEY unique_attendance (course_id, student_id, session_date, session_number),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (marked_by) REFERENCES teachers(teacher_id)
    // dia diem diem danh
);
```

gian vien co the reset mk sinh vien

---
co the luu tren drive(link) hoac server
## NHÓM 3: QUẢN LÝ TÀI LIỆU HỌC TẬP

### 3.1. Bảng Materials (Tài liệu)

```sql
CREATE TABLE materials (
    material_id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID tài liệu
    course_id INT NOT NULL,                                        -- ID học phần
    title NVARCHAR(200) NOT NULL,                                  -- Tiêu đề tài liệu
    description TEXT,                                              -- Mô tả tài liệu
    file_name NVARCHAR(255),                                       -- Tên file
    file_path VARCHAR(500),                                        -- Đường dẫn file
    file_size BIGINT,                                              -- Kích thước file (bytes)
    file_type VARCHAR(50),                                         -- Loại file: pdf, docx, pptx, video
    category ENUM('lecture', 'slide', 'exercise', 'reference', 'syllabus', 'other') DEFAULT 'other', -- Danh mục tài liệu
    is_public BOOLEAN DEFAULT FALSE,                               -- Tài liệu công khai
    download_count INT DEFAULT 0,                                  -- Số lượt tải
    uploaded_by INT NOT NULL,                                      -- Người tải lên
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,               -- Thời gian tải lên
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);
```

---

## NHÓM 4: QUẢN LÝ BÀI TẬP VÀ ĐÁNH GIÁ

### 4.1. Bảng Assignments (Bài tập)

```sql
CREATE TABLE assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,                  -- ID bài tập
    course_id INT NOT NULL,                                        -- ID học phần
    title NVARCHAR(200) NOT NULL,                                  -- Tiêu đề bài tập
    description TEXT,                                              -- Mô tả bài tập
    type ENUM('programming', 'essay', 'quiz', 'project') NOT NULL, -- Loại bài tập
    total_points DECIMAL(5,2) NOT NULL,                            -- Tổng điểm
    due_date TIMESTAMP NOT NULL,                                   -- Hạn nộp
    late_submission_allowed BOOLEAN DEFAULT TRUE,                  -- Cho phép nộp trễ
    late_penalty_percent DECIMAL(3,2) DEFAULT 0.00,                -- Phần trăm trừ điểm nộp trễ
    max_attempts INT DEFAULT 1,                                    -- Số lần làm tối đa
    is_group_work BOOLEAN DEFAULT FALSE,                           -- Bài tập nhóm
    max_group_size INT DEFAULT 1,                                  -- Số thành viên nhóm tối đa
    instructions TEXT,                                             -- Hướng dẫn làm bài
    rubric JSON,                                                   -- Tiêu chí chấm điểm dạng JSON
    files_required BOOLEAN DEFAULT FALSE,                          -- Yêu cầu nộp file
    allowed_file_types JSON,                                       -- Các loại file được phép
    max_file_size BIGINT,                                          -- Kích thước file tối đa (bytes)
    is_published BOOLEAN DEFAULT FALSE,                            -- Đã xuất bản
    created_by INT NOT NULL,                                       -- Người tạo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (created_by) REFERENCES teachers(teacher_id)
);
```

### 4.2. Bảng Assignment_Submissions (Nộp bài)

```sql
CREATE TABLE assignment_submissions (
    submission_id INT PRIMARY KEY AUTO_INCREMENT,                  -- ID bài nộp
    assignment_id INT NOT NULL,                                    -- ID bài tập
    student_id INT NOT NULL,                                       -- ID sinh viên
    submission_text TEXT,                                          -- Nội dung bài làm
    file_paths JSON,                                               -- Danh sách file đính kèm
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,              -- Thời gian nộp
    is_late BOOLEAN DEFAULT FALSE,                                 -- Nộp trễ
    attempt_number INT DEFAULT 1,                                  -- Lần thử thứ mấy
    score DECIMAL(5,2),                                            -- Điểm số
    feedback TEXT,                                                 -- Phản hồi từ GV
    graded_at TIMESTAMP,                                           -- Thời gian chấm
    graded_by INT,                                                 -- Người chấm
    status ENUM('submitted', 'graded', 'returned') DEFAULT 'submitted', -- Trạng thái bài nộp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    UNIQUE KEY unique_submission (assignment_id, student_id, attempt_number),
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (graded_by) REFERENCES teachers(teacher_id)
);
```

---

## NHÓM 5: HỆ THỐNG KIỂM TRA TRẮC NGHIỆM

### 5.1. Bảng Quizzes (Bài kiểm tra trắc nghiệm)

```sql
CREATE TABLE quizzes (
    quiz_id INT PRIMARY KEY AUTO_INCREMENT,                        -- ID bài kiểm tra
    course_id INT NOT NULL,                                        -- ID học phần
    title NVARCHAR(200) NOT NULL,                                  -- Tiêu đề bài kiểm tra
    description TEXT,                                              -- Mô tả bài kiểm tra
    total_points DECIMAL(5,2) NOT NULL,                            -- Tổng điểm
    time_limit INT,                                                -- Thời gian làm bài (phút)
    start_time TIMESTAMP,                                          -- Thời gian bắt đầu
    end_time TIMESTAMP,                                            -- Thời gian kết thúc
    max_attempts INT DEFAULT 1,                                    -- Số lần làm tối đa
    show_results BOOLEAN DEFAULT TRUE,                             -- Hiển thị kết quả
    show_correct_answers BOOLEAN DEFAULT FALSE,                    -- Hiển thị đáp án đúng
    randomize_questions BOOLEAN DEFAULT FALSE,                     -- Xáo trộn câu hỏi
    randomize_answers BOOLEAN DEFAULT FALSE,                       -- Xáo trộn đáp án
    is_published BOOLEAN DEFAULT FALSE,                            -- Đã xuất bản
    created_by INT NOT NULL,                                       -- Người tạo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (created_by) REFERENCES teachers(teacher_id)
);
```

### 5.2. Bảng Quiz_Questions (Câu hỏi trắc nghiệm)

```sql
CREATE TABLE quiz_questions (
    question_id INT PRIMARY KEY AUTO_INCREMENT,                    -- ID câu hỏi
    quiz_id INT NOT NULL,                                          -- ID bài kiểm tra
    question_text TEXT NOT NULL,                                   -- Nội dung câu hỏi
    question_type ENUM('multiple_choice', 'true_false', 'fill_blank', 'essay') NOT NULL, -- Loại câu hỏi
    points DECIMAL(4,2) NOT NULL,                                  -- Điểm số
    correct_answer TEXT,                                           -- Đáp án đúng
    explanation TEXT,                                              -- Giải thích đáp án
    order_index INT,                                               -- Thứ tự câu hỏi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);
```

### 5.3. Bảng Quiz_Question_Options (Lựa chọn câu trả lời)

```sql
CREATE TABLE quiz_question_options (
    option_id INT PRIMARY KEY AUTO_INCREMENT,                      -- ID lựa chọn
    question_id INT NOT NULL,                                      -- ID câu hỏi
    option_text NVARCHAR(500) NOT NULL,                            -- Nội dung lựa chọn
    is_correct BOOLEAN DEFAULT FALSE,                              -- Đáp án đúng
    order_index INT,                                               -- Thứ tự hiển thị
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id) ON DELETE CASCADE
);
```

### 5.4. Bảng Quiz_Attempts (Lần làm bài)

```sql
CREATE TABLE quiz_attempts (
    attempt_id INT PRIMARY KEY AUTO_INCREMENT,                     -- ID lần làm bài
    quiz_id INT NOT NULL,                                          -- ID bài kiểm tra
    student_id INT NOT NULL,                                       -- ID sinh viên
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Thời gian bắt đầu
    end_time TIMESTAMP,                                            -- Thời gian kết thúc
    total_score DECIMAL(5,2),                                      -- Tổng điểm
    is_completed BOOLEAN DEFAULT FALSE,                            -- Đã hoàn thành
    attempt_number INT,                                            -- Lần thử thứ mấy
    time_taken INT,                                                -- Thời gian làm bài (giây)
    answers JSON,                                                  -- Câu trả lời của sinh viên
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);
```

---

## NHÓM 6: HỆ THỐNG DIỄN ĐÀN

### 6.1. Bảng Forums (Diễn đàn)

```sql
CREATE TABLE forums (
    forum_id INT PRIMARY KEY AUTO_INCREMENT,                       -- ID diễn đàn
    course_id INT NOT NULL,                                        -- ID học phần
    name NVARCHAR(200) NOT NULL,                                   -- Tên diễn đàn
    description TEXT,                                              -- Mô tả diễn đàn
    is_active BOOLEAN DEFAULT TRUE,                                -- Trạng thái hoạt động
    created_by INT NOT NULL,                                       -- Người tạo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

### 6.2. Bảng Forum_Topics (Chủ đề thảo luận)

```sql
CREATE TABLE forum_topics (
    topic_id INT PRIMARY KEY AUTO_INCREMENT,                       -- ID chủ đề
    forum_id INT NOT NULL,                                         -- ID diễn đàn
    title NVARCHAR(200) NOT NULL,                                  -- Tiêu đề chủ đề
    content TEXT,                                                  -- Nội dung chủ đề
    is_pinned BOOLEAN DEFAULT FALSE,                               -- Ghim bài viết
    is_locked BOOLEAN DEFAULT FALSE,                               -- Khóa thảo luận
    view_count INT DEFAULT 0,                                      -- Số lượt xem
    reply_count INT DEFAULT 0,                                     -- Số lượt trả lời
    last_reply_at TIMESTAMP,                                       -- Thời gian trả lời cuối
    last_reply_by INT,                                             -- Người trả lời cuối
    created_by INT NOT NULL,                                       -- Người tạo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    FOREIGN KEY (forum_id) REFERENCES forums(forum_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (last_reply_by) REFERENCES users(user_id)
);
```

### 6.3. Bảng Forum_Replies (Trả lời)

```sql
CREATE TABLE forum_replies (
    reply_id INT PRIMARY KEY AUTO_INCREMENT,                       -- ID trả lời
    topic_id INT NOT NULL,                                         -- ID chủ đề
    content TEXT NOT NULL,                                         -- Nội dung trả lời
    parent_reply_id INT,                                           -- ID trả lời cha (trả lời cho reply khác)
    is_solution BOOLEAN DEFAULT FALSE,                             -- Đánh dấu là câu trả lời đúng
    vote_score INT DEFAULT 0,                                      -- Điểm bình chọn
    created_by INT NOT NULL,                                       -- Người tạo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    FOREIGN KEY (topic_id) REFERENCES forum_topics(topic_id),
    FOREIGN KEY (parent_reply_id) REFERENCES forum_replies(reply_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

---

## NHÓM 7: HỆ THỐNG THÔNG BÁO VÀ GIAO TIẾP

### 7.1. Bảng Notifications (Thông báo)

```sql
CREATE TABLE notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,                -- ID thông báo
    user_id INT NOT NULL,                                          -- ID người nhận
    title NVARCHAR(200) NOT NULL,                                  -- Tiêu đề thông báo
    content TEXT,                                                  -- Nội dung thông báo
    type ENUM('assignment', 'grade', 'announcement', 'forum', 'system', 'reminder') NOT NULL, -- Loại thông báo
    related_id INT,                                                -- ID đối tượng liên quan
    related_type VARCHAR(50),                                      -- Loại đối tượng: 'assignment', 'course', 'forum_topic'
    is_read BOOLEAN DEFAULT FALSE,                                 -- Đã đọc
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',       -- Mức độ ưu tiên
    scheduled_at TIMESTAMP,                                        -- Thời gian dự định gửi
    sent_at TIMESTAMP,                                             -- Thời gian thực tế gửi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

---

## NHÓM 8: HỖ TRỢ HỌC TẬP THÔNG MINH

### 8.1. Bảng Learning_Paths (Lộ trình học tập)

```sql
CREATE TABLE learning_paths (
    path_id INT PRIMARY KEY AUTO_INCREMENT,                        -- ID lộ trình
    student_id INT NOT NULL,                                       -- ID sinh viên
    major VARCHAR(100),                                            -- Ngành học
    target_career NVARCHAR(200),                                   -- Mục tiêu nghề nghiệp
    recommended_subjects JSON,                                     -- Danh sách môn học được đề xuất
    completed_subjects JSON,                                       -- Danh sách môn đã hoàn thành
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,                 -- Phần trăm tiến độ
    estimated_completion_date DATE,                                -- Ngày dự kiến hoàn thành
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);
```

### 8.2. Bảng Recommendations (Đề xuất học tập)

```sql
CREATE TABLE recommendations (
    recommendation_id INT PRIMARY KEY AUTO_INCREMENT,              -- ID đề xuất
    student_id INT NOT NULL,                                       -- ID sinh viên
    type ENUM('course', 'material', 'external_resource') NOT NULL, -- Loại đề xuất
    title NVARCHAR(200) NOT NULL,                                  -- Tiêu đề đề xuất
    description TEXT,                                              -- Mô tả đề xuất
    url VARCHAR(500),                                              -- Đường dẫn
    provider VARCHAR(100),                                         -- Nhà cung cấp: Coursera, Udemy, YouTube
    relevance_score DECIMAL(3,2),                                  -- Điểm liên quan (0.00 - 1.00)
    reason TEXT,                                                   -- Lý do đề xuất
    is_clicked BOOLEAN DEFAULT FALSE,                              -- Đã click
    is_dismissed BOOLEAN DEFAULT FALSE,                            -- Đã bỏ qua
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);
```

---

## NHÓM 9: THỐNG KÊ VÀ BÁO CÁO

### 9.1. Bảng Activity_Logs (Nhật ký hoạt động)

```sql
CREATE TABLE activity_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,                         -- ID nhật ký
    user_id INT NOT NULL,                                          -- ID người dùng
    action VARCHAR(100) NOT NULL,                                  -- Hành động thực hiện
    target_type VARCHAR(50),                                       -- Loại đối tượng: 'course', 'assignment', 'material'
    target_id INT,                                                 -- ID đối tượng
    details JSON,                                                  -- Chi tiết hành động dạng JSON
    ip_address VARCHAR(45),                                        -- Địa chỉ IP
    user_agent TEXT,                                               -- Thông tin trình duyệt
    session_duration INT,                                          -- Thời gian phiên (giây)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### 9.2. Bảng Study_Statistics (Thống kê học tập)

```sql
CREATE TABLE study_statistics (
    stat_id INT PRIMARY KEY AUTO_INCREMENT,                        -- ID thống kê
    user_id INT NOT NULL,                                          -- ID người dùng
    date DATE NOT NULL,                                            -- Ngày thống kê
    total_study_time INT DEFAULT 0,                                -- Tổng thời gian học (phút)
    assignments_completed INT DEFAULT 0,                           -- Số bài tập hoàn thành
    materials_accessed INT DEFAULT 0,                              -- Số tài liệu đã truy cập
    forum_posts INT DEFAULT 0,                                     -- Số bài đăng diễn đàn
    login_count INT DEFAULT 0,                                     -- Số lần đăng nhập
    last_activity TIMESTAMP,                                       -- Hoạt động cuối cùng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày cập nhật
    UNIQUE KEY unique_daily_stat (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```
