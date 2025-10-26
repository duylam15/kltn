import pandas as pd

# Đọc file CSV gốc (đã có cột score, completionTime, attemptCount, avgScore, attendanceRate, activityCount)
df = pd.read_csv("../training_data.csv")

# Hàm gán label nâng cao
def label_student(row):
    score = row["score"]
    avg_score = row["avgScore"]
    attendance = row["attendanceRate"]
    activity = row.get("activityCount", 0)     # mặc định 0 nếu thiếu
    attempts = row.get("attemptCount", 1)      # mặc định 1 nếu thiếu

    # ✅ Tính điểm tổng hợp (weighted score)
    # score và avgScore quan trọng nhất
    weighted_score = (
        0.4 * score +
        0.3 * avg_score +
        0.2 * (attendance * 10) +   # attendanceRate = 0.8 -> 8 điểm
        0.1 * (min(activity, 20) / 2)  # hoạt động nhiều thì cộng thêm
    )

    # ✅ Điều chỉnh theo số lần làm bài (attempts nhiều quá thì trừ điểm)
    if attempts > 3:
        weighted_score -= 0.5  

    # ✅ Phân loại theo ngưỡng
    if weighted_score < 5:
        return "REMEDIAL"
    elif weighted_score < 7.5:
        return "NORMAL"
    else:
        return "ADVANCED"

# Áp dụng hàm gán label cho từng dòng
df["label"] = df.apply(label_student, axis=1)

# Xuất ra file mới
df.to_csv("../training_data_labeled.csv", index=False)

print("✅ Đã tạo training_data_labeled.csv với nhãn nâng cao")
