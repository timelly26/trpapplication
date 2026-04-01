"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import PageHeader from "../../common/PageHeader";
import SearchInput from "../../common/SearchInput";
import ChatWindow from "./ChatWindow";
import { Chat, Status } from "./ChatList";
import Spinner from "../../common/Spinner";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100";

type AppointmentRow = {
  id: string;
  status: string;
  note: string | null;
  student?: {
    fatherName?: string;
    user?: { name?: string; photoUrl?: string | null };
  } | null;
  messages?: Array<{ content: string }>;
};

function mapAppointmentToChat(a: AppointmentRow): Chat {
  const statusMap: Record<string, Status> = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    ENDED: "ended",
  };
  const status = statusMap[a.status] ?? "pending";
  const lastMsg =
    a.messages?.[0]?.content ?? a.note ?? "Request to connect";
  return {
    id: a.id,
    parent: a.student?.fatherName ?? "Parent",
    student: a.student?.user?.name ?? "Student",
    lastMessage: lastMsg,
    status,
    avatar: a.student?.user?.photoUrl ?? DEFAULT_AVATAR,
  };
}

export default function TeacherParentChatTab() {
  const [activeTab, setActiveTab] = useState<"all" | Status>("all");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/communication/appointments");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? "Failed to load chats");
      }
      const data = await res.json();
      const list = Array.isArray(data.appointments) ? data.appointments : [];
      setChats(list.map(mapAppointmentToChat));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load chats");
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const filteredChats =
    activeTab === "all" ? chats : chats.filter((c) => c.status === activeTab);

  const updateStatus = async (id: string, status: Status) => {
    const action = status === "approved" ? "approve" : "reject";
    const res = await fetch(`/api/communication/appointments/${id}/${action}`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? `Failed to ${action}`);
      return;
    }
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const endChat = async (id: string) => {
    const res = await fetch(`/api/communication/appointments/${id}/end`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? "Failed to end chat");
      return;
    }
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "ended" as const } : c))
    );
  };

  return (
    <div className="max-w-7xl mx-auto h-full min-h-0 flex flex-col gap-3 sm:gap-6 px-3 sm:px-0 pb-20 lg:pb-6 overflow-hidden">
      <PageHeader
        title="Parent Communication"
        subtitle="Manage chat requests and conversations"
        compact
      />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] flex-1 min-h-0 gap-3 sm:gap-6 overflow-hidden">
        {/* ================= Sidebar ================= */}
        <div
          className={`glass-card rounded-xl sm:rounded-2xl flex flex-col overflow-hidden min-h-0
          ${activeChat ? "hidden lg:flex" : "flex"}
          w-full min-h-[280px] lg:min-h-0`}
        >
          {/* Tabs */}
          <div className="p-3 sm:p-4 flex gap-2 border-b border-white/10 -mb-px overflow-x-auto no-scrollbar">
            {(["all", "approved", "pending", "rejected", "ended"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs capitalize whitespace-nowrap shrink-0 min-h-[40px] sm:min-h-0 touch-manipulation
                    ${activeTab === tab
                      ? "bg-lime-500 text-black"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 active:bg-white/15"
                    }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>

          {/* Search */}
          <div className="p-3 sm:p-4 border-b border-white/10 shrink-0">
            <SearchInput icon={Search} placeholder="Search conversations..." />
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 space-y-1 sm:space-y-2 overscroll-contain">
            {loading ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                <Spinner />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-400 text-sm">
                {error}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No conversations
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className="w-full p-2.5 sm:p-3 rounded-xl flex gap-2 sm:gap-3 bg-white/5 hover:bg-white/10 active:bg-white/15 transition text-left touch-manipulation"
                >
                  <img
                    src={chat.avatar}
                    alt={chat.parent}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">
                      {chat.parent}
                    </p>
                    <p className="text-xs text-lime-400 truncate">
                      Parent of {chat.student}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {chat.lastMessage}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ================= Chat Window ================= */}
        <div
          className={`min-w-0 min-h-[300px] sm:min-h-0 glass-card rounded-xl sm:rounded-2xl overflow-hidden flex flex-col
          ${activeChat ? "flex" : "hidden lg:flex"}`}
        >
          {activeChat ? (
            <ChatWindow
              chat={activeChat}
              onBack={() => setActiveChatId(null)}
              onApprove={() => updateStatus(activeChat.id, "approved")}
              onReject={() => updateStatus(activeChat.id, "rejected")}
              onEndChat={() => endChat(activeChat.id)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
