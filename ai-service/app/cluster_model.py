# app/cluster_model.py
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

class StudentClusterModel:
    def __init__(self, n_clusters=3):
        self.n_clusters = n_clusters
        self.scaler = StandardScaler()
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)

    def fit(self, df: pd.DataFrame):
        features = df[["avgScore", "attendanceRate", "lateSubmissions", "activityScore"]]
        X_scaled = self.scaler.fit_transform(features)
        self.kmeans.fit(X_scaled)

    def predict(self, df: pd.DataFrame):
        features = df[["avgScore", "attendanceRate", "lateSubmissions", "activityScore"]]
        X_scaled = self.scaler.transform(features)
        clusters = self.kmeans.predict(X_scaled)
        df["cluster"] = clusters

        # Tính trung bình để gán nhãn Top/Nguy cơ/Trung bình
        cluster_stats = df.groupby("cluster")[["avgScore","attendanceRate"]].mean()
        label_map = {}
        risk_group = cluster_stats.mean(axis=1).idxmin()
        top_group = cluster_stats.mean(axis=1).idxmax()
        for c in range(self.n_clusters):
            if c == risk_group:
                label_map[c] = "Nguy cơ"
            elif c == top_group:
                label_map[c] = "Top"
            else:
                label_map[c] = "Trung bình"
        df["label"] = df["cluster"].map(label_map)
        return df[["studentId","avgScore","attendanceRate","lateSubmissions","activityScore","label"]]