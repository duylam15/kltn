import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../context/authContext";
import { Users, Check, Clock, AlertCircle, UserCircle } from "lucide-react";
import dayjs from "dayjs";

type Group = {
  id: number;
  groupCode: string | null;
  groupName: string | null;
  maxMembers: number;
  currentMembers: number;
  availableSlots: number;
  isActive: boolean;
};

type CurrentGroup = {
  id: number;
  groupCode: string | null;
  groupName: string | null;
  maxMembers: number;
};

type GroupData = {
  joined: boolean;
  currentGroup?: CurrentGroup;
  availableGroups?: Group[];
};

type GroupMember = {
  enrollmentId: number;
  studentId: number;
  studentCode: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  enrolledAt: string;
};

export default function Group() {
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [joining, setJoining] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState("");

  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  const { user } = useAuth();
  const studentId = user?.student?.id;

  // Fetch danh sách nhóm
  const fetchGroups = () => {
    if (!studentId) return;

    setLoading(true);
    fetch(
      `http://localhost:4000/api/v1/sections-groups/${sectionId}/groups/available?studentId=${studentId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGroupData(data.data);
          // Nếu đã join nhóm, fetch danh sách thành viên
          if (data.data.joined && data.data.currentGroup) {
            fetchGroupMembers(data.data.currentGroup.id);
          }
        }
      })
      .catch(() => setError("Không thể tải danh sách nhóm"))
      .finally(() => setLoading(false));
  };

  // Fetch danh sách thành viên trong nhóm
  const fetchGroupMembers = (groupId: number) => {
    setLoadingMembers(true);
    fetch(
      `http://localhost:4000/api/v1/sections-groups/${sectionId}/groups/${groupId}/students`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMembers(data.data);
        }
      })
      .catch(() => setError("Không thể tải danh sách thành viên"))
      .finally(() => setLoadingMembers(false));
  };

  useEffect(() => {
    fetchGroups();
  }, [sectionId, studentId]);

  // Socket realtime
  useEffect(() => {
    const newSocket = io("http://localhost:4000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("joinSection", sectionId);
    });

    // Handler: groupJoined
    newSocket.on("groupJoined", (data: any) => {
      if (data.sectionId === sectionId) {
        if (data.student.id === studentId) {
          setGroupData({
            joined: true,
            currentGroup: {
              id: data.groupId,
              groupCode: null,
              groupName: null,
              maxMembers: data.maxMembers,
            },
          });
          // Fetch danh sách thành viên ngay sau khi join
          fetchGroupMembers(data.groupId);
        } else {
          // Cập nhật danh sách nhóm
          setGroupData((prev) => {
            if (!prev || !prev.availableGroups) return prev;

            return {
              ...prev,
              availableGroups: prev.availableGroups.map((group) =>
                group.id === data.groupId
                  ? {
                    ...group,
                    currentMembers: data.currentMembers,
                    availableSlots: data.availableSlots,
                  }
                  : group
              ),
            };
          });

          // Nếu đang xem nhóm này, refresh danh sách thành viên
          if (groupData?.currentGroup?.id === data.groupId) {
            fetchGroupMembers(data.groupId);
          }
        }
      }
    });

    // Handler: groupLeft
    newSocket.on("groupLeft", (data: any) => {
      if (data.sectionId === sectionId) {
        if (data.studentId === studentId) {
          fetchGroups();
          setMembers([]);
        } else {
          setGroupData((prev) => {
            if (!prev || !prev.availableGroups || !data.groupId) return prev;

            return {
              ...prev,
              availableGroups: prev.availableGroups.map((group) =>
                group.id === data.groupId
                  ? {
                    ...group,
                    currentMembers: data.currentMembers,
                    availableSlots: data.availableSlots,
                  }
                  : group
              ),
            };
          });

          // Nếu đang xem nhóm này, refresh danh sách thành viên
          if (groupData?.currentGroup?.id === data.groupId) {
            fetchGroupMembers(data.groupId);
          }
        }
      }
    });

    return () => {
      newSocket.emit("leaveSection", sectionId);
      newSocket.disconnect();
    };
  }, [sectionId, studentId, groupData?.currentGroup?.id]);

  // Join nhóm
  const handleJoinGroup = async (groupId: number) => {
    if (!studentId || joining) return;

    setJoining(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/sections-groups/${sectionId}/groups/${groupId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setGroupData({
          joined: true,
          currentGroup: {
            id: data.data.group?.id || groupId,
            groupCode: data.data.group?.groupCode || null,
            groupName: data.data.group?.groupName || null,
            maxMembers: data.data.group?.maxMembers || 0,
          },
        });
        // Fetch danh sách thành viên
        fetchGroupMembers(data.data.group?.id || groupId);
      } else {
        setError(data.message || "Không thể tham gia nhóm");
      }
    } catch (err) {
      setError("Lỗi kết nối");
    } finally {
      setJoining(false);
    }
  };

  // Leave nhóm
  const handleLeaveGroup = async () => {
    if (!studentId || joining) return;

    setJoining(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/sections-groups/${sectionId}/groups/leave`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        fetchGroups();
        setMembers([]);
      } else {
        setError(data.message || "Không thể rời nhóm");
      }
    } catch (err) {
      setError("Lỗi kết nối");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Đã join nhóm - Hiển thị thông tin nhóm và danh sách thành viên
  if (groupData?.joined && groupData.currentGroup) {
    const { currentGroup } = groupData;
    return (
      <div className="px-6 py-6">
        {/* Card thông tin nhóm */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Nhóm học tập của bạn</h2>
              <p className="text-sm text-gray-500">Thông tin nhóm hiện tại</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div>
              <p className="text-sm text-gray-600">Mã nhóm:</p>
              <p className="text-lg font-bold text-blue-600">
                {currentGroup.groupCode || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tên nhóm:</p>
              <p className="text-base font-semibold text-gray-800">
                {currentGroup.groupName || "Chưa đặt tên"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Số lượng thành viên:</p>
              <p className="text-base font-semibold text-gray-800">
                {members.length}/{currentGroup.maxMembers}
              </p>
            </div>
          </div>

          {/* Thanh trạng thái số lượng */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${(members.length / currentGroup.maxMembers) * 100}%` }}
            ></div>
          </div>

          <button
            onClick={handleLeaveGroup}
            disabled={joining}
            className="mt-6 w-full py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium transition"
          >
            {joining ? "Đang xử lý..." : "Rời nhóm"}
          </button>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Card danh sách thành viên */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Thành viên nhóm</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
              {members.length}/{currentGroup.maxMembers}
            </span>
          </div>

          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.enrollmentId}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{member.fullName}</p>
                      {member.studentId === studentId && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Bạn
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{member.studentCode}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {dayjs(member.enrolledAt).format("DD/MM/YYYY")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Chưa có thành viên nào</p>
            </div>
          )}
        </div>
      </div>

    );
  }

  // Chưa join nhóm -> hiển thị danh sách
  return (
    <div className="pl-6 pr-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Chọn nhóm học tập
        </h1>
        <p className="text-gray-600">
          Chọn một nhóm để tham gia. Bạn chỉ có thể tham gia 1 nhóm duy nhất.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groupData?.availableGroups?.map((group) => {
          const isFull = group.availableSlots === 0;

          return (
            <div
              key={group.id}
              className={`bg-white rounded-xl shadow border p-5 transition hover:shadow-xl ${isFull ? "border-gray-200 opacity-60" : "border-blue-200"
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${isFull ? "bg-gray-100" : "bg-blue-100"
                      }`}
                  >
                    <Users
                      className={`w-5 h-5 ${isFull ? "text-gray-500" : "text-blue-600"
                        }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {group.groupName || "Chưa đặt tên"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {group.groupCode || "N/A"}
                    </p>
                  </div>
                </div>
                {isFull && (
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                    Đầy
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all"
                    style={{
                      width: `${(group.currentMembers / group.maxMembers) * 100
                        }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {group.currentMembers}/{group.maxMembers}
                </span>
              </div>

              <button
                onClick={() => handleJoinGroup(group.id)}
                disabled={isFull || joining}
                className={`w-full py-2 rounded-lg font-medium transition ${isFull
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                  } disabled:opacity-50`}
              >
                {joining ? (
                  <span className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    Đang tham gia...
                  </span>
                ) : isFull ? (
                  "Nhóm đã đầy"
                ) : (
                  "Tham gia nhóm"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {groupData?.availableGroups?.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Không có nhóm nào khả dụng</p>
        </div>
      )}
    </div>
  );
}