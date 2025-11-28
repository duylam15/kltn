npx prisma migrate reset
npx prisma migrate dev --name add_
npx prisma generate

npx prisma studio


📝 Test Accounts:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin:
  Email: admin@university.edu
  Password: Password123!

Teacher:
  Email: teacher1@university.edu
  Password: Password123!

Student:
  Email: (check database for student emails)     
  Password: Password123!

- Tạo câu hỏi-) mhoc-chương(có mức độ:khó, dễ, tb).
với chức năng tự động thì chọn Môn học-) Chương-> nhập số câu, điểm của câu khó, dễ, tb. Nếu không đủ 10đ thì hiện cảnh báo. khi chọn Chương thì nó lấy random câu hỏi
*Thống kê:
- DS điểm của tất cả học phần mình chọn
- DS thống kê số lượng sv theo điểm trong 1 nhóm hoặc toàn môn
- Tì lệ điểm danh
- Gv qly nhóm học phần, tải tài liệu dưới dạng link
- UI tổng quan của gv có dạng chọn phép chọn cái cần hiện ra
- Tlieu -) chia sẽ/ không chia sẽ. Không chia sẽ là của nhóm đó, còn chia sẽ là chọn lớp
- cấu hình cho admin/gv xóa/ sửa tin nhắn
- vd tạo lớp 1 -) tạo btap. thì tạo lớp 2 -) tạo btap có nút sử dụng lại tài liệu
Cho phép sửa điểm danh trễ (nhập điểm)
tự tạo nhóm, nhập bao nhiêu đứa, bao nhiêu group =) tạo link, sv join
tạo điể danh tự động, xóa sửa buổi điểm danh
Xóa nhóm, ẩn, lọc nhóm học phần
sửa ui, nhìn rõ ràng, nổi bật hơn
hiện chuông thông báo khi có btap, thảo luận