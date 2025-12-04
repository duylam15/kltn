import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../context/authContext";
import { Users, Check, Clock, AlertCircle, UserCircle, LogOut, Calendar } from "lucide-react";
import dayjs from "dayjs";
import instance from "../../utils/axiosInstance";

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
    instance.get(
      `/sections-groups/${sectionId}/groups/available?studentId=${studentId}`
    )
      .then((res) => res.data)
      .then((data) => {
        if (data.success) {
          setGroupData(data.data);
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
    instance.get(
      `/sections-groups/${sectionId}/groups/${groupId}/students`
    )
      .then((res) => res.data)
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
    const newSocket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });


    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("joinSection", sectionId);
    });

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
          fetchGroupMembers(data.groupId);
        } else {
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

          if (groupData?.currentGroup?.id === data.groupId) {
            fetchGroupMembers(data.groupId);
          }
        }
      }
    });

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
      const res = await instance.post(
        `/sections-groups/${sectionId}/groups/${groupId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }
      );

      const data = await res.data;

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
      const res = await instance.post(
        `/sections-groups/${sectionId}/groups/leave`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }
      );

      const data = await res.data;

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Đã join nhóm - Hiển thị thông tin nhóm và danh sách thành viên
  if (groupData?.joined && groupData.currentGroup) {
    const { currentGroup } = groupData;
    const progressPercentage = (members.length / currentGroup.maxMembers) * 100;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
         

          {/* Danh sách thành viên - Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Thành viên nhóm
                  </h3>
                  <span className="px-3 py-1. 5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {members.length} thành viên
                  </span>
                </div>
              </div>

              <div className="p-6">
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
                  </div>
                ) : members.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {members.map((member, index) => (
                      <div
                        key={member.enrollmentId}
                        className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group border border-transparent hover:border-gray-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="relative">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.fullName}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-blue-400 transition-all"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-gray-200 group-hover:ring-blue-400 transition-all">
                              <span className="text-white font-bold text-lg">
                                {member.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {member.studentId === studentId && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-gray-900 truncate">
                              {member.fullName}
                            </p>
                            {member.studentId === studentId && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-md font-medium flex-shrink-0">
                                Bạn
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{member.studentCode}</p>
                        </div>

                        <div className="flex items-center gap-1. 5 text-gray-400 text-xs flex-shrink-0">
                          <Calendar className="w-3. 5 h-3.5" />
                          <span>{dayjs(member.enrolledAt).format("DD/MM/YY")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Chưa có thành viên nào</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Hãy mời bạn bè tham gia nhóm
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin nhóm - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#47689c] rounded-2xl shadow-xl p-6 text-white sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Nhóm của bạn</h2>
                  <p className="text-blue-100 text-sm">Đã tham gia</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-blue-100 text-xs uppercase tracking-wide mb-1">
                    Mã nhóm
                  </p>
                  <p className="text-2xl font-bold">
                    {currentGroup.groupCode || "N/A"}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-blue-100 text-xs uppercase tracking-wide mb-1">
                    Tên nhóm
                  </p>
                  <p className="text-lg font-semibold">
                    {currentGroup.groupName || "Chưa đặt tên"}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-blue-100 text-xs uppercase tracking-wide mb-2">
                    Thành viên
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{members.length}</span>
                    <span className="text-blue-100">/ {currentGroup.maxMembers}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleLeaveGroup}
                disabled={joining}
                className="w-full py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all flex items-center justify-center gap-2 group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {joining ? "Đang xử lý..." : "Rời nhóm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chưa join nhóm -> hiển thị danh sách
  return (
    <div className="max-w-7xl mx-auto sm:px-6 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chọn nhóm học tập
        </h1>
        <p className="text-gray-600">
          Tham gia một nhóm để cùng học tập và thảo luận.  Bạn chỉ có thể tham gia 1 nhóm.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0. 5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600 text-xl"
          >
            ×
          </button>
        </div>
      )}

      {groupData?.availableGroups && groupData.availableGroups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {groupData.availableGroups.map((group) => {
            const isFull = group.availableSlots === 0;
            const fillPercentage = (group.currentMembers / group.maxMembers) * 100;

            return (
              <div
                key={group.id}
                className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 overflow-hidden ${isFull
                    ? "border-gray-200 opacity-70"
                    : "border-blue-100 hover:border-blue-300 hover:-translate-y-1"
                  }`}
              >
                <div className={`h-2 ${isFull ? "bg-gray-300" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isFull
                            ? "bg-gray-100"
                            : "bg-gradient-to-br from-blue-500 to-indigo-600"
                          }`}
                      >
                        <Users
                          className={`w-5 h-5 ${isFull ? "text-gray-500" : "text-white"
                            }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate mb-0.5">
                          {group.groupName || "Chưa đặt tên"}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                          {group.groupCode || "N/A"}
                        </p>
                      </div>
                    </div>
                    {isFull && (
                      <span className="px-2. 5 py-1 bg-red-100 text-red-700 text-xs rounded-lg font-semibold flex-shrink-0">
                        Đầy
                      </span>
                    )}
                  </div>

                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Thành viên
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {group.currentMembers}/{group.maxMembers}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${isFull
                            ? "bg-gray-400"
                            : "bg-gradient-to-r from-blue-500 to-indigo-600"
                          }`}
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinGroup(group.id)}
                    disabled={isFull || joining}
                    className={`w-full py-2.5 rounded-xl font-semibold transition-all ${isFull
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 hover:shadow-lg active:scale-95"
                      } disabled:opacity-50`}
                  >
                    {joining ? (
                      <span className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        Đang xử lý...
                      </span>
                    ) : isFull ? (
                      "Nhóm đã đầy"
                    ) : (
                      "Tham gia ngay"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Không có nhóm nào
          </h3>
          <p className="text-gray-500">
            Hiện tại chưa có nhóm nào khả dụng. Vui lòng quay lại sau.
          </p>
        </div>
      )}
    </div>
  );
}