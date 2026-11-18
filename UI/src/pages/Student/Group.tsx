import React, { useEffect, useState, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../context/authContext";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  Search,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Hash,
  Mail,
  Filter,
} from "lucide-react";
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

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Group() {
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);
  const { user } = useAuth();
  const studentId = user?.student?.id;

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
          if (data.data.joined && data.data.currentGroup) {
            fetchGroupMembers(data.data.currentGroup.id);
          }
        }
      })
      .catch(() => setError("Không thể tải danh sách nhóm. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  };

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

  useEffect(() => {
    const newSocket = io("http://localhost:4000", {
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
          fetchGroups();
        } else {
          setGroupData((prev) => {
            if (!prev) return prev;
            if (prev.currentGroup?.id === data.groupId) {
              fetchGroupMembers(data.groupId);
            }
            if (!prev.availableGroups) return prev;
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
            if (!prev) return prev;
            if (prev.currentGroup?.id === data.groupId) {
              fetchGroupMembers(data.groupId);
            }
            if (!prev.availableGroups || !data.groupId) return prev;
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
        }
      }
    });

    return () => {
      newSocket.emit("leaveSection", sectionId);
      newSocket.disconnect();
    };
  }, [sectionId, studentId]);

  const handleJoinGroup = async (group: Group) => {
    if (!studentId || joiningGroupId !== null) return;
    setJoiningGroupId(group.id);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/sections-groups/${sectionId}/groups/${group.id}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }
      );
      const data = await res.json();
      if (data.success) {
        const joinedId = data.data.group?.id || group.id;
        setGroupData({
          joined: true,
          currentGroup: {
            id: joinedId,
            groupCode: data.data.group?.groupCode || group.groupCode,
            groupName: data.data.group?.groupName || group.groupName,
            maxMembers: data.data.group?.maxMembers || group.maxMembers,
          },
        });
        fetchGroupMembers(joinedId);
      } else {
        setError(data.message || "Không thể tham gia nhóm");
      }
    } catch (err) {
      setError("Lỗi kết nối đến máy chủ");
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!studentId || leaving) return;
    setLeaving(true);
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
        setConfirmLeave(false);
        fetchGroups();
        setMembers([]);
      } else {
        setError(data.message || "Không thể rời nhóm");
      }
    } catch (err) {
      setError("Lỗi kết nối đến máy chủ");
    } finally {
      setLeaving(false);
    }
  };

  const handleCopyCode = (code: string | null) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredGroups = useMemo(() => {
    if (!groupData?.availableGroups) return [];
    return groupData.availableGroups.filter((group) => {
      const matchesSearch =
        (group.groupName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (group.groupCode?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      const matchesSlot = onlyAvailable ? group.availableSlots > 0 : true;
      return matchesSearch && matchesSlot;
    });
  }, [groupData?.availableGroups, searchQuery, onlyAvailable]);

  if (loading) {
    return (
      <div className="w-full px-6 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-36 bg-slate-100 rounded-2xl border border-slate-200"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-slate-100 rounded-2xl border border-slate-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRẠNG THÁI 1: ĐÃ THAM GIA NHÓM (FULL WIDTH)
  // =========================================================================
  if (groupData?.joined && groupData.currentGroup) {
    const { currentGroup } = groupData;
    const fillPercentage = Math.min(
      100,
      Math.round((members.length / (currentGroup.maxMembers || 1)) * 100)
    );

    return (
      <div className="w-full px-6 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Hero Card: Tràn toàn bộ chiều rộng */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã tham gia
                  </span>
                  {currentGroup.groupCode && (
                    <button
                      onClick={() => handleCopyCode(currentGroup.groupCode)}
                      title="Sao chép mã nhóm"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-white/15 hover:bg-white/25 transition cursor-pointer"
                    >
                      <Hash className="w-3 h-3" />
                      {currentGroup.groupCode}
                      {copiedCode ? (
                        <Check className="w-3 h-3 text-emerald-300" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-75" />
                      )}
                    </button>
                  )}
                </div>
                <h1 className="text-2xl font-bold mt-1.5 tracking-tight">
                  {currentGroup.groupName || "Nhóm học tập chưa đặt tên"}
                </h1>
              </div>
            </div>

            {/* Nút rời nhóm */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              {!confirmLeave ? (
                <button
                  onClick={() => setConfirmLeave(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-red-500 text-white border border-white/20 hover:border-red-500 transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Rời nhóm
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-md p-1.5 rounded-xl border border-white/15">
                  <span className="text-xs px-2 text-red-100 font-medium">Chắc chắn rời?</span>
                  <button
                    onClick={handleLeaveGroup}
                    disabled={leaving}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-50 cursor-pointer"
                  >
                    {leaving ? "Đang rời..." : "Xác nhận"}
                  </button>
                  <button
                    onClick={() => setConfirmLeave(false)}
                    disabled={leaving}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Thanh thống kê & tiến độ sĩ số */}
          <div className="px-6 py-5 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sĩ số nhóm hiện tại
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-800">{members.length}</span>
                <span className="text-sm text-slate-500">
                  / {currentGroup.maxMembers} thành viên
                </span>
                {members.length === currentGroup.maxMembers ? (
                  <span className="ml-2 text-xs font-medium px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
                    Đã đủ thành viên
                  </span>
                ) : (
                  <span className="ml-2 text-xs font-medium px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                    Còn {currentGroup.maxMembers - members.length} chỗ trống
                  </span>
                )}
              </div>
            </div>

            <div className="w-full sm:w-96">
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                <span>Mức độ lấp đầy</span>
                <span className="font-semibold text-slate-700">{fillPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách thành viên: Tràn toàn bộ chiều rộng, chia 4 cột trên màn hình lớn */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Danh sách thành viên
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                  {members.length}
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Các thành viên cùng học tập và làm bài tập lớn trong nhóm này
              </p>
            </div>
          </div>

          {loadingMembers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-28 bg-slate-100 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map((member) => {
                const isMe = member.studentId === studentId;
                return (
                  <div
                    key={member.enrollmentId}
                    className={`relative flex items-start gap-3.5 p-4 rounded-xl border transition-all ${
                      isMe
                        ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-500/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.fullName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm shrink-0 ${
                          isMe
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600"
                            : "bg-gradient-to-br from-slate-600 to-slate-800"
                        }`}
                      >
                        {getInitials(member.fullName)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 truncate">{member.fullName}</p>
                        {isMe && (
                          <span className="shrink-0 px-2 py-0.5 bg-blue-600 text-white text-[11px] font-semibold rounded-full">
                            Bạn
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        MSSV: {member.studentCode}
                      </p>

                      {member.email && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                          <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate">{member.email}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                        <Calendar className="w-3 h-3" />
                        <span>Tham gia: {dayjs(member.enrolledAt).format("DD/MM/YYYY")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">Chưa có thành viên nào trong nhóm</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRẠNG THÁI 2: CHƯA THAM GIA NHÓM (FULL WIDTH)
  // =========================================================================
  const totalGroups = groupData?.availableGroups?.length || 0;
  const availableCount =
    groupData?.availableGroups?.filter((g) => g.availableSlots > 0).length || 0;

  return (
    <div className="w-full px-6 py-6">
      {/* Header & Thanh công cụ lọc */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2.5 border border-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            Đăng ký nhóm học phần
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Chọn nhóm học tập
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Chọn một nhóm phù hợp bên dưới để tham gia. Mỗi sinh viên chỉ được tham gia{" "}
            <span className="font-semibold text-slate-700">1 nhóm duy nhất</span>.
          </p>
        </div>

        {totalGroups > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã nhóm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition cursor-pointer ${
                onlyAvailable
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Còn chỗ ({availableCount}/{totalGroups})</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Grid danh sách nhóm trải đều toàn màn hình */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGroups.map((group) => {
            const isFull = group.availableSlots === 0;
            const isAlmostFull = !isFull && group.availableSlots <= 2;
            const percent = Math.min(
              100,
              Math.round((group.currentMembers / (group.maxMembers || 1)) * 100)
            );
            const isJoiningThis = joiningGroupId === group.id;

            return (
              <div
                key={group.id}
                className={`group flex flex-col justify-between bg-white rounded-2xl border p-5 transition-all duration-200 ${
                  isFull
                    ? "border-slate-200 bg-slate-50/60 opacity-75"
                    : "border-slate-200/90 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                        isFull
                          ? "bg-slate-200/70 text-slate-500"
                          : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                      }`}
                    >
                      <Users className="w-5 h-5" />
                    </div>

                    {isFull ? (
                      <span className="px-2.5 py-1 bg-slate-200/80 text-slate-600 text-xs rounded-full font-semibold">
                        Đã đầy
                      </span>
                    ) : isAlmostFull ? (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 text-xs rounded-full font-semibold">
                        Còn {group.availableSlots} chỗ
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs rounded-full font-semibold">
                        Còn {group.availableSlots} chỗ
                      </span>
                    )}
                  </div>

                  <div className="mb-5">
                    <h3 className="font-bold text-base text-slate-800 line-clamp-1">
                      {group.groupName || "Chưa đặt tên nhóm"}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {group.groupCode || "NO-CODE"}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">Thành viên</span>
                      <span className="font-bold text-slate-700">
                        {group.currentMembers}/{group.maxMembers}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull
                            ? "bg-slate-400"
                            : isAlmostFull
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinGroup(group)}
                    disabled={isFull || joiningGroupId !== null}
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      isFull
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm shadow-blue-600/20 cursor-pointer"
                    } disabled:opacity-60`}
                  >
                    {isJoiningThis ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Đang tham gia...</span>
                      </>
                    ) : isFull ? (
                      <span>Nhóm đã đầy</span>
                    ) : (
                      <span>Tham gia nhóm</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            {searchQuery || onlyAvailable
              ? "Không tìm thấy nhóm phù hợp"
              : "Chưa có nhóm nào được tạo"}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || onlyAvailable
              ? "Thử thay đổi từ khóa tìm kiếm hoặc tắt bộ lọc nhóm còn chỗ."
              : "Giảng viên chưa mở danh sách nhóm cho học phần này. Vui lòng quay lại sau."}
          </p>
          {(searchQuery || onlyAvailable) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setOnlyAvailable(false);
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
}