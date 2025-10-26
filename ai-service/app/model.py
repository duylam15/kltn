import pandas as pd
from tabpfn import TabPFNClassifier

# Load dữ liệu đã có label
df = pd.read_csv("training_data_labeled.csv")

# Xác định các cột đặc trưng (features) và nhãn (label)
feature_cols = [col for col in df.columns if col != "label"]
X_train = df[feature_cols]
y_train = df["label"]

# Khởi tạo và train model
clf = TabPFNClassifier()
clf.fit(X_train, y_train)

def predict_label(input_data: dict):
    X_test = pd.DataFrame([[input_data[col] for col in feature_cols]], 
                          columns=feature_cols)
    pred = clf.predict(X_test)[0]
    return pred


def learning_path(label: str):
    if label == "REMEDIAL":
        return ["Ôn lại Chương 1", "Xem lại video cơ bản", "Làm quiz bổ sung"]
    elif label == "NORMAL":
        return ["Tiếp tục sang Chương mới", "Thực hành thêm bài tập mẫu"]
    elif label == "ADVANCED":
        return ["Khám phá tài liệu nâng cao", "Làm project nhỏ", "Thử sức với đề khó"]
    else:
        return ["Không có gợi ý"]
