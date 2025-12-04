import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../context/authContext";
import { MoreVertical, Send, Users, Smile } from "lucide-react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import instance from "../../utils/axiosInstance";

type Sender = {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
};

type Message = {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender: Sender;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [roomId, setRoomId] = useState<number | null>(null); // 👈 Thêm state cho roomId
  const [loading, setLoading] = useState(true); // 👈 Loading state

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 👤 user login
  const { user } = useAuth();
  const currentUserId = user?.id;
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  // 🔹 Lấy roomId từ API /by-context
  useEffect(() => {
    const fetchRoomId = async () => {
      try {
        const response = await instance.get(
          `/chats/by-context`,
          { params: { sectionId } }
        );
        if (response.data.success && response.data.data) {
          setRoomId(response.data.data.id);
        } else {
          console.error("Không tìm thấy phòng chat cho sectionId:", sectionId);
        }
      } catch (error) {
        console.error("Lỗi khi lấy roomId:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomId();
  }, [sectionId]);

  // 🔹 Lấy lịch sử tin nhắn khi có roomId
  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      try {
        const response = await instance.get(
          `/chats/${roomId}/messages`
        );
        if (response.data.success) {
          setMessages(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy tin nhắn:", error);
      }
    };

    fetchMessages();
  }, [roomId]);

  // 🔹 Socket realtime
  useEffect(() => {
    if (!roomId) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("joinUser", currentUserId);
      newSocket.emit("joinRoom", roomId);
    });

    newSocket.on("newMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, currentUserId]);

  // 🔹 Gửi tin nhắn
  const handleSend = async () => {
    if (!content.trim() || !roomId) return;

    try {
      await instance.post(
        `/chats/${roomId}/messages`,
        { senderId: currentUserId, content }
      );
      setContent("");
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  // 🔹 Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <div className="text-gray-500">Đang tải phòng chat...</div>
      </div>
    );
  }

  // 🔹 Không tìm thấy phòng
  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <div className="text-red-500">Không tìm thấy phòng chat</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] bg-white rounded-tl-xl rounded-tr-xl shadow border border-gray-200">
      {/* Header */}
      <div className="relative px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-black font-semibold text-base">Thảo luận</h2>
              <p className="text-black text-xs">
                {messages.length > 0 &&
                  `${new Set(messages.map((m) => m.senderId)).size} người tham gia`}
              </p>
            </div>
          </div>
          <MoreVertical className="w-5 h-5 text-black" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-end gap-2 ${m.senderId === currentUserId ? "justify-end" : "justify-start"
              }`}
          >
            {m.senderId !== currentUserId && (
              <img
                src={
                  m.sender.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${m.sender.fullName}&background=8b5cf6&color=fff&bold=true`
                }
                alt="avatar"
                className="w-8 h-8 rounded-full border"
              />
            )}
            <div className="flex flex-col max-w-sm">
              {m.senderId !== currentUserId && (
                <span className="text-xs text-gray-500 mb-1">
                  {m.sender.fullName}
                </span>
              )}
              <div
                className={`px-3 py-2 rounded-l-xl rounded-r-xl ${m.senderId === currentUserId
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                  }`}
              >
                <div className="text-sm break-words">{m.content}</div>
                <div
                  className={`text-[10px] mt-1 ${m.senderId === currentUserId ? "text-blue-100" : "text-gray-400"
                    }`}
                >
                  {dayjs(m.createdAt).format("HH:mm")}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2 items-center relative">
        {/* Nút emoji */}
        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Smile className="w-5 h-5" />
        </button>
        {showEmoji && (
          <div className="absolute bottom-14 left-3 z-50 shadow-lg">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <input
          className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
        />
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}