# Phân Tích Liên Kết và Chức Năng Cơ Sở Dữ Liệu

## 1. SƠ ĐỒ LIÊN KẾT CÁC BẢNG

### 1.1. Liên kết chính (Core Relationships)

```
Users (Trung tâm)
├── roles (1:N) - Một vai trò có nhiều người dùng
├── students (1:1) - Mở rộng thông tin sinh viên
├── teachers (1:1) - Mở rộng thông tin giảng viên
└── activity_logs (1:N) - Một user có nhiều log hoạt động

Students
├── course_enrollments (1:N) - Sinh viên đăng ký nhiều học phần
├── assignment_submissions (1:N) - Sinh viên nộp nhiều bài tập
├── quiz_attempts (1:N) - Sinh viên làm nhiều bài kiểm tra
├── attendance (1:N) - Sinh viên có nhiều bản ghi điểm danh
├── learning_paths (1:1) - Mỗi sinh viên có một lộ trình học tập
└── recommendations (1:N) - Sinh viên nhận nhiều đề xuất

Teachers
└── courses (1:N) - Giảng viên dạy nhiều học phần

Subjects
└── courses (1:N) - Một môn học có nhiều lớp học phần

Courses (Trung tâm của học tập)
├── course_enrollments (1:N)
├── materials (1:N)
├── assignments (1:N)
├── quizzes (1:N)
├── forums (1:N)
└── attendance (1:N)
```

### 1.2. Liên kết phụ (Secondary Relationships)

```
Assignments
└── assignment_submissions (1:N)

Quizzes
├── quiz_questions (1:N)
└── quiz_attempts (1:N)

Quiz_Questions
└── quiz_question_options (1:N)

Forums
└── forum_topics (1:N)

Forum_Topics
└── forum_replies (1:N)

Forum_Replies
├── forum_replies (1:N) - Self-referencing cho reply lồng nhau
└── forum_votes (1:N)
```

---

## 2. PHÂN TÍCH LUỒNG DỮ LIỆU

### 2.1. Luồng Đăng Ký và Quản Lý Người Dùng

```
1. User đăng ký → users (role_id = student/teacher)
2. Nếu là sinh viên → tạo record trong students
3. Nếu là giảng viên → tạo record trong teachers
4. Phân quyền dựa trên roles.permissions
5. Mọi hoạt động → ghi vào activity_logs
```

### 2.2. Luồng Tạo và Quản Lý Học Phần

```
1. Admin tạo subjects (môn học)
2. Teacher/Admin tạo courses (học phần cụ thể)
3. Students đăng ký → course_enrollments
4. Teacher upload materials
5. Teacher tạo assignments/quizzes
6. Tạo forums cho mỗi course
```

### 2.3. Luồng Học Tập của Sinh Viên

```
1. Student login → cập nhật last_login
2. Xem courses đã đăng ký từ course_enrollments
3. Tải materials → tăng download_count
4. Làm assignments → assignment_submissions
5. Làm quizzes → quiz_attempts + answers JSON
6. Tham gia forums → forum_topics + forum_replies
7. Điểm danh → attendance records
8. Mọi hoạt động → activity_logs + study_statistics
```

### 2.4. Luồng Giảng Dạy của Giảng Viên

```
1. Teacher login
2. Quản lý courses của mình
3. Upload materials cho từng course
4. Tạo assignments với rubric JSON
5. Chấm assignment_submissions → score + feedback
6. Tạo quizzes với questions + options
7. Xem thống kê từ study_statistics
8. Trả lời trong forums
9. Điểm danh sinh viên → attendance
```

---

## 3. CHỨC NĂNG CHI TIẾT DỰA TRÊN LIÊN KẾT

### 3.1. CHỨC NĂNG ĐĂNG NHẬP/ĐĂNG KÝ

**Bảng liên quan:** `users`, `roles`, `students/teachers`

**Luồng xử lý:**

```sql
-- Đăng ký sinh viên
BEGIN TRANSACTION;
INSERT INTO users (email, password_hash, full_name, role_id)
VALUES ('student@email.com', 'hash', 'Nguyen Van A', 3);

INSERT INTO students (user_id, student_code, major, academic_year)
VALUES (LAST_INSERT_ID(), 'SV001', 'Công nghệ thông tin', '2021-2025');
COMMIT;

-- Đăng nhập
SELECT u.*, r.permissions
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.email = ? AND u.password_hash = ?;
```

### 3.2. CHỨC NĂNG QUẢN LÝ HỌC PHẦN

**Bảng liên quan:** `courses`, `subjects`, `teachers`, `course_enrollments`

**Các tính năng:**

-   **Tạo học phần:**

```sql
INSERT INTO courses (subject_id, teacher_id, course_code, semester, schedule)
VALUES (1, 2, 'IT001.01', 'HK1_2024', '{"monday": {"start": "07:30", "end": "09:30", "room": "A101"}}');
```

-   **Đăng ký học phần:**

```sql
-- Kiểm tra điều kiện đăng ký
SELECT COUNT(*) FROM course_enrollments ce
JOIN courses c ON ce.course_id = c.course_id
WHERE ce.student_id = ? AND c.semester = 'HK1_2024';

-- Đăng ký nếu còn chỗ và chưa vượt quá giới hạn
INSERT INTO course_enrollments (course_id, student_id)
SELECT ?, ? WHERE (
    SELECT current_students FROM courses WHERE course_id = ?
) < (
    SELECT max_students FROM courses WHERE course_id = ?
);
```

-   **Dashboard sinh viên:**

```sql
SELECT c.course_code, s.subject_name, t.full_name as teacher_name,
       ce.midterm_score, ce.final_score, ce.grade
FROM course_enrollments ce
JOIN courses c ON ce.course_id = c.course_id
JOIN subjects s ON c.subject_id = s.subject_id
JOIN teachers te ON c.teacher_id = te.teacher_id
JOIN users t ON te.user_id = t.user_id
WHERE ce.student_id = ? AND c.semester = 'HK1_2024';
```

### 3.3. CHỨC NĂNG QUẢN LÝ BÀI TẬP

**Bảng liên quan:** `assignments`, `assignment_submissions`, `courses`

**Luồng tạo bài tập:**

```sql
INSERT INTO assignments (
    course_id, title, description, type, total_points, due_date,
    instructions, rubric, is_published, created_by
) VALUES (
    1, 'Bài tập lập trình Java', 'Viết chương trình quản lý sinh viên',
    'programming', 100.00, '2024-12-15 23:59:59',
    'Chi tiết yêu cầu...',
    '{"criteria": [{"name": "Logic", "points": 40}, {"name": "Code style", "points": 30}]}',
    true, 2
);
```

**Luồng nộp bài:**

```sql
-- Kiểm tra deadline và số lần nộp
SELECT max_attempts, due_date FROM assignments WHERE assignment_id = ?;

-- Nộp bài
INSERT INTO assignment_submissions (
    assignment_id, student_id, submission_text, file_paths,
    is_late, attempt_number
) VALUES (
    1, 123, 'Mô tả bài làm...',
    '["uploads/assignment1_student123.zip"]',
    NOW() > (SELECT due_date FROM assignments WHERE assignment_id = 1),
    1
);
```

**Luồng chấm bài:**

```sql
UPDATE assignment_submissions
SET score = ?, feedback = ?, graded_at = NOW(), graded_by = ?, status = 'graded'
WHERE submission_id = ?;

-- Cập nhật điểm vào course_enrollments nếu cần
```

### 3.4. CHỨC NĂNG QUIZ TRẮC NGHIỆM

**Bảng liên quan:** `quizzes`, `quiz_questions`, `quiz_question_options`, `quiz_attempts`

**Tạo quiz:**

```sql
-- Tạo quiz
BEGIN TRANSACTION;
INSERT INTO quizzes (course_id, title, total_points, time_limit, created_by)
VALUES (1, 'Kiểm tra giữa kỳ', 100, 60, 2);

SET @quiz_id = LAST_INSERT_ID();

-- Thêm câu hỏi
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points)
VALUES (@quiz_id, 'Java là ngôn ngữ lập trình gì?', 'multiple_choice', 10);

SET @question_id = LAST_INSERT_ID();

-- Thêm lựa chọn
INSERT INTO quiz_question_options (question_id, option_text, is_correct)
VALUES
(@question_id, 'Ngôn ngữ thông dịch', false),
(@question_id, 'Ngôn ngữ biên dịch', true),
(@question_id, 'Ngôn ngữ markup', false);
COMMIT;
```

**Làm bài quiz:**

```sql
-- Bắt đầu làm bài
INSERT INTO quiz_attempts (quiz_id, student_id, attempt_number)
VALUES (1, 123, 1);

-- Lưu câu trả lời
UPDATE quiz_attempts
SET answers = '{"1": "B", "2": "A", "3": "C"}',
    end_time = NOW(), is_completed = true,
    time_taken = TIMESTAMPDIFF(SECOND, start_time, NOW())
WHERE attempt_id = ?;

-- Tính điểm tự động
UPDATE quiz_attempts
SET total_score = (
    SELECT SUM(q.points)
    FROM quiz_questions q
    WHERE q.quiz_id = 1 AND JSON_EXTRACT(answers, CONCAT('$."', q.question_id, '"')) = q.correct_answer
)
WHERE attempt_id = ?;
```

### 3.5. CHỨC NĂNG DIỄN ĐÀN

**Bảng liên quan:** `forums`, `forum_topics`, `forum_replies`, `forum_votes`

**Tạo chủ đề mới:**

```sql
BEGIN TRANSACTION;
INSERT INTO forum_topics (forum_id, title, content, created_by)
VALUES (1, 'Thắc mắc về bài tập 1', 'Em không hiểu yêu cầu...', 123);

-- Cập nhật thống kê forum
UPDATE forums SET topic_count = topic_count + 1 WHERE forum_id = 1;
COMMIT;
```

**Trả lời và vote:**

```sql
-- Trả lời
INSERT INTO forum_replies (topic_id, content, created_by)
VALUES (1, 'Bạn có thể tham khảo...', 124);

-- Vote cho reply
INSERT INTO forum_votes (reply_id, user_id, vote_type)
VALUES (1, 125, 'up')
ON DUPLICATE KEY UPDATE vote_type = 'up';

-- Cập nhật điểm vote
UPDATE forum_replies
SET vote_score = (
    SELECT SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END)
    FROM forum_votes WHERE reply_id = 1
)
WHERE reply_id = 1;
```

### 3.6. CHỨC NĂNG THÔNG BÁO

**Bảng liên quan:** `notifications`, `assignments`, `courses`

**Tự động tạo thông báo:**

```sql
-- Thông báo deadline bài tập (chạy job hàng ngày)
INSERT INTO notifications (user_id, title, content, type, related_id, related_type)
SELECT ce.student_id,
       CONCAT('Sắp đến hạn: ', a.title),
       CONCAT('Bài tập ', a.title, ' sẽ hết hạn vào ', a.due_date),
       'reminder', a.assignment_id, 'assignment'
FROM assignments a
JOIN course_enrollments ce ON a.course_id = ce.course_id
WHERE a.due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 DAY)
  AND a.is_published = true
  AND NOT EXISTS (
      SELECT 1 FROM assignment_submissions s
      WHERE s.assignment_id = a.assignment_id AND s.student_id = ce.student_id
  );
```

### 3.7. CHỨC NĂNG THỐNG KÊ VÀ BÁO CÁO

**Bảng liên quan:** `study_statistics`, `activity_logs`, `course_enrollments`

**Thống kê cho sinh viên:**

```sql
-- Tổng quan học tập trong tuần
SELECT
    DATE(date) as study_date,
    total_study_time,
    assignments_completed,
    materials_accessed,
    login_count
FROM study_statistics
WHERE user_id = ?
  AND date BETWEEN DATE_SUB(NOW(), INTERVAL 7 DAY) AND NOW()
ORDER BY date DESC;

-- Tiến độ học tập theo môn
SELECT s.subject_name,
       ce.midterm_score, ce.final_score, ce.total_score,
       COUNT(DISTINCT asm.assignment_id) as total_assignments,
       COUNT(DISTINCT sub.assignment_id) as completed_assignments
FROM course_enrollments ce
JOIN courses c ON ce.course_id = c.course_id
JOIN subjects s ON c.subject_id = s.subject_id
LEFT JOIN assignments asm ON c.course_id = asm.course_id AND asm.is_published = true
LEFT JOIN assignment_submissions sub ON asm.assignment_id = sub.assignment_id AND sub.student_id = ce.student_id
WHERE ce.student_id = ?
GROUP BY ce.enrollment_id;
```

**Thống kê cho giảng viên:**

```sql
-- Thống kê lớp học
SELECT c.course_code,
       COUNT(ce.student_id) as enrolled_students,
       AVG(ce.total_score) as class_average,
       COUNT(DISTINCT a.assignment_id) as total_assignments,
       AVG(sub_stats.completion_rate) as avg_completion_rate
FROM courses c
LEFT JOIN course_enrollments ce ON c.course_id = ce.course_id
LEFT JOIN assignments a ON c.course_id = a.course_id
LEFT JOIN (
    SELECT a.assignment_id,
           COUNT(s.student_id) * 100.0 / COUNT(ce.student_id) as completion_rate
    FROM assignments a
    JOIN course_enrollments ce ON a.course_id = ce.course_id
    LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id AND s.student_id = ce.student_id
    GROUP BY a.assignment_id
) sub_stats ON a.assignment_id = sub_stats.assignment_id
WHERE c.teacher_id = ?
GROUP BY c.course_id;
```

### 3.8. CHỨC NĂNG HỖ TRỢ HỌC TẬP THÔNG MINH

**Bảng liên quan:** `learning_paths`, `recommendations`, `study_statistics`

**Tạo lộ trình học tập:**

```sql
-- Phân tích tiến độ và tạo đề xuất
INSERT INTO recommendations (student_id, type, title, description, relevance_score, reason)
SELECT s.student_id,
       'external_resource',
       'Khóa học Java cơ bản - Coursera',
       'Khóa học phù hợp để củng cố kiến thức Java',
       0.85,
       'Dựa trên điểm thấp ở môn Lập trình Java'
FROM students s
JOIN course_enrollments ce ON s.student_id = ce.student_id
JOIN courses c ON ce.course_id = c.course_id
JOIN subjects sub ON c.subject_id = sub.subject_id
WHERE sub.subject_name LIKE '%Java%'
  AND ce.total_score < 60
  AND s.student_id = ?;
```

---

## 4. TRIGGERS VÀ STORED PROCEDURES HỖ TRỢ

### 4.1. Triggers tự động cập nhật thống kê

```sql
-- Trigger cập nhật current_students khi có đăng ký mới
DELIMITER $$
CREATE TRIGGER update_current_students_after_enrollment
AFTER INSERT ON course_enrollments
FOR EACH ROW
BEGIN
    UPDATE courses
    SET current_students = current_students + 1
    WHERE course_id = NEW.course_id;
END$$

-- Trigger ghi log hoạt động
CREATE TRIGGER log_user_activity
AFTER INSERT ON assignment_submissions
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, target_type, target_id, details)
    SELECT s.user_id, 'submit_assignment', 'assignment', NEW.assignment_id,
           JSON_OBJECT('submission_id', NEW.submission_id, 'attempt', NEW.attempt_number)
    FROM students st
    WHERE st.student_id = NEW.student_id;
END$$
DELIMITER ;
```

### 4.2. Stored Procedures cho báo cáo

```sql
DELIMITER $$
CREATE PROCEDURE GetStudentDashboard(IN p_student_id INT)
BEGIN
    -- Thông tin sinh viên
    SELECT u.full_name, s.student_code, s.gpa, s.major
    FROM students s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.student_id = p_student_id;

    -- Các môn đang học
    SELECT c.course_code, sub.subject_name, te.full_name as teacher_name,
           ce.total_score, ce.grade
    FROM course_enrollments ce
    JOIN courses c ON ce.course_id = c.course_id
    JOIN subjects sub ON c.subject_id = sub.subject_id
    JOIN teachers t ON c.teacher_id = t.teacher_id
    JOIN users te ON t.user_id = te.user_id
    WHERE ce.student_id = p_student_id AND ce.status = 'enrolled';

    -- Bài tập sắp đến hạn
    SELECT a.title, a.due_date, c.course_code
    FROM assignments a
    JOIN courses c ON a.course_id = c.course_id
    JOIN course_enrollments ce ON c.course_id = ce.course_id
    WHERE ce.student_id = p_student_id
      AND a.due_date > NOW()
      AND a.due_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
      AND NOT EXISTS (
          SELECT 1 FROM assignment_submissions s
          WHERE s.assignment_id = a.assignment_id AND s.student_id = p_student_id
      )
    ORDER BY a.due_date;
END$$
DELIMITER ;
```

---

## 5. CHIẾN LƯỢC INDEXING VÀ TỐI ƯU

### 5.1. Index Composite cho truy vấn phức tạp

```sql
-- Index cho dashboard sinh viên
CREATE INDEX idx_enrollment_student_semester ON course_enrollments(student_id, status);

-- Index cho tìm kiếm bài tập
CREATE INDEX idx_assignment_course_published_due ON assignments(course_id, is_published, due_date);

-- Index cho thống kê hoạt động
CREATE INDEX idx_activity_user_action_date ON activity_logs(user_id, action, created_at);

-- Index cho forum
CREATE INDEX idx_forum_topic_updated ON forum_topics(forum_id, updated_at DESC);
```

### 5.2. Partitioning cho dữ liệu lớn

```sql
-- Partition activity_logs theo tháng
ALTER TABLE activity_logs PARTITION BY RANGE (MONTH(created_at)) (
    PARTITION p0 VALUES LESS THAN (2),
    PARTITION p1 VALUES LESS THAN (3),
    PARTITION p2 VALUES LESS THAN (4),
    -- ...
    PARTITION p11 VALUES LESS THAN (13)
);
```

Thiết kế này đảm bảo:

-   **Tính toàn vẹn**: Foreign keys và constraints
-   **Hiệu suất**: Index tối ưu cho từng use case
-   **Mở rộng**: JSON fields cho dữ liệu linh hoạt
-   **Theo dõi**: Comprehensive logging và analytics
-   **Tự động hóa**: Triggers và procedures hỗ trợ
