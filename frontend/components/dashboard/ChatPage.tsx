"use client";

import { useState, useEffect, useRef } from "react";
import { useSidebar } from "./SidebarContext";
import {
  useConversations,
  useThread,
  Conversation,
  Message,
} from "@/lib/hooks/useMessages";
import {
  MessageIcon,
  SearchIcon,
  XIcon,
  ArrowRightIcon,
  RefreshIcon,
  PackageIcon,
  AlertTriangleIcon,
} from "@/components/Icons";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({
  name,
  image,
  size = 10,
}: {
  name: string;
  image?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 text-[#ff2d2d] text-[11px] font-bold font-[var(--font-syne)]`;
  if (image)
    return (
      <img
        src={image}
        alt={name}
        className={`${cls} object-cover`}
        style={{ width: size * 4, height: size * 4, borderRadius: "50%" }}
      />
    );
  return (
    <div className={cls} style={{ width: size * 4, height: size * 4 }}>
      {initials}
    </div>
  );
}

/* ─── Conversation item ───────────────────────────────────────────────────── */
function ConvoItem({
  convo,
  active,
  onClick,
}: {
  convo: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const { participant, lastMessage, unreadCount } = convo;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-none
        ${active ? "bg-[#ff2d2d]/10 border-r-2 border-r-[#ff2d2d]" : "bg-transparent hover:bg-white/[0.02]"}`}
    >
      <div className="relative shrink-0">
        <Avatar
          name={participant.name}
          image={participant.profileImage}
          size={10}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-[#ff2d2d] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p
            className={`text-[13px] truncate ${unreadCount > 0 ? "font-semibold text-[#f0f0f0]" : "font-medium text-[#e0e0e0]"}`}
          >
            {participant.name}
          </p>
          <span className="text-[10px] text-[#555] shrink-0">
            {timeAgo(lastMessage.createdAt)}
          </span>
        </div>
        <p
          className={`text-[12px] truncate ${unreadCount > 0 ? "text-[#aaa]" : "text-[#555]"}`}
        >
          {lastMessage.fileUrl && !lastMessage.content
            ? "📎 Attachment"
            : (lastMessage.content ?? "")}
        </p>
      </div>
    </button>
  );
}

/* ─── Message bubble ──────────────────────────────────────────────────────── */
function Bubble({ message, isMe }: { message: Message; isMe: boolean }) {
  return (
    <div
      className={`flex gap-2.5 items-end ${isMe ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isMe && (
        <Avatar
          name={message.sender.name}
          image={message.sender.profileImage}
          size={8}
        />
      )}
      <div
        className={`flex flex-col gap-1 max-w-[75%] ${isMe ? "items-end" : "items-start"}`}
      >
        {/* File attachment */}
        {message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-[12px] no-underline
              ${
                isMe
                  ? "bg-[#ff2d2d] text-white rounded-br-sm"
                  : "bg-[#222] text-[#e0e0e0] border border-[#2a2a2a] rounded-bl-sm"
              }`}
          >
            <PackageIcon size={14} color="currentColor" />
            <span>View attachment</span>
            <ArrowRightIcon size={12} color="currentColor" />
          </a>
        )}
        {/* Text */}
        {message.content && (
          <div
            className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed
            ${
              isMe
                ? "bg-[#ff2d2d] text-white rounded-br-sm"
                : "bg-[#1e1e1e] text-[#e0e0e0] border border-[#2a2a2a] rounded-bl-sm"
            }`}
          >
            {message.content}
          </div>
        )}
        <span className="text-[10px] text-[#555]">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

/* ─── Thread view ─────────────────────────────────────────────────────────── */
function ThreadView({
  userId,
  userName,
  userImage,
  onBack,
}: {
  userId: string;
  userName: string;
  userImage?: string;
  onBack: () => void;
}) {
  const { messages, loading, sending, error, send, myId } = useThread(userId);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() && !file) return;
    await send(text, undefined, file ?? undefined);
    setText("");
    setFile(null);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const last = grouped[grouped.length - 1];
    if (last?.date === date) last.messages.push(msg);
    else grouped.push({ date, messages: [msg] });
  });

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1e1e1e] bg-[#141414] shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <Avatar name={userName} image={userImage} size={10} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#f0f0f0] truncate">
            {userName}
          </p>
          <p className="text-[11px] text-[#555]">Tap to view profile</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
            <AlertTriangleIcon size={13} color="currentColor" />
            {error}
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-3 text-[#555]">
            <MessageIcon size={36} color="#2a2a2a" />
            <p className="text-[13px]">No messages yet</p>
            <p className="text-[11px] text-[#444] text-center">
              Send a message to start the conversation
            </p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.date} className="flex flex-col gap-3">
            {/* Date separator */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#1e1e1e]" />
              <span className="text-[10px] text-[#555] px-2 whitespace-nowrap">
                {group.date}
              </span>
              <div className="flex-1 h-px bg-[#1e1e1e]" />
            </div>
            {group.messages.map((msg) => (
              <Bubble
                key={msg._id}
                message={msg}
                isMe={myId ? msg.sender._id === myId : false}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* File preview */}
      {file && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
          <PackageIcon size={14} color="#ff2d2d" />
          <span className="text-[12px] text-[#aaa] truncate flex-1">
            {file.name}
          </span>
          <button
            onClick={() => setFile(null)}
            className="bg-transparent border-none cursor-pointer shrink-0"
          >
            <XIcon size={13} color="#555" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-[#1e1e1e] bg-[#141414] shrink-0">
        {/* Attach file */}
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2 text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer shrink-0 transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        {/* Text input */}
        <div className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-2xl px-4 py-2.5 focus-within:border-[#ff2d2d] transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message..."
            rows={1}
            style={{ resize: "none", minHeight: "24px", maxHeight: "96px" }}
            className="w-full bg-transparent border-none outline-none text-[13px] text-[#e0e0e0] placeholder:text-[#444] leading-relaxed"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || (!text.trim() && !file)}
          className="p-2.5 bg-[#ff2d2d] text-white rounded-full border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function ChatsPage() {
  const { toggle } = useSidebar();
  const { conversations, loading, error, refetch, setConversations } =
    useConversations();
  const [search, setSearch] = useState("");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeName, setActiveName] = useState("");
  const [activeImage, setActiveImage] = useState<string | undefined>();
  const [showThread, setShowThread] = useState(false);

  const filtered = conversations.filter((c) =>
    c.participant.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openThread = (convo: Conversation) => {
    setActiveUserId(convo.participant._id);
    setActiveName(convo.participant.name);
    setActiveImage(convo.participant.profileImage);
    setShowThread(true);
    // Mark as read locally
    setConversations((prev) =>
      prev.map((c) =>
        c.participant._id === convo.participant._id
          ? { ...c, unreadCount: 0 }
          : c,
      ),
    );
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Conversations sidebar ── */}
      <div
        className={`flex flex-col shrink-0 w-full lg:w-[320px] lg:border-r border-[#1e1e1e] bg-[#0f0f0f]
        ${showThread ? "hidden lg:flex" : "flex"}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0f0f0f] flex items-center justify-between px-4 py-4 border-b border-[#1e1e1e] shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={toggle}
              className="lg:hidden flex flex-col justify-center gap-[5px] w-8 h-8 cursor-pointer bg-transparent border-none shrink-0"
            >
              <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
              <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
              <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-[var(--font-syne)] font-bold text-[18px] text-[#f0f0f0]">
                Messages
              </h1>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 bg-[#ff2d2d] text-white text-[10px] font-bold rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={refetch}
            className="p-2 text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer transition-colors"
          >
            <RefreshIcon size={14} color="currentColor" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#1e1e1e] shrink-0">
          <div className="flex items-center bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2 gap-2 focus-within:border-[#ff2d2d] transition-colors">
            <SearchIcon size={13} color="#555" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="bg-transparent border-none outline-none text-[13px] text-[#aaa] w-full placeholder:text-[#444]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="bg-transparent border-none cursor-pointer"
              >
                <XIcon size={12} color="#555" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-7 h-7 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#555] text-sm">Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 mx-4 mt-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
              <AlertTriangleIcon size={13} color="currentColor" />
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 px-4">
              <MessageIcon size={36} color="#2a2a2a" />
              <p className="text-[14px] font-medium text-[#777]">
                {search ? "No conversations match" : "No messages yet"}
              </p>
              <p className="text-[12px] text-[#555] text-center">
                {!search &&
                  "Conversations with buyers and sellers will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#111]">
              {filtered.map((convo) => (
                <ConvoItem
                  key={convo.participant._id}
                  convo={convo}
                  active={activeUserId === convo.participant._id}
                  onClick={() => openThread(convo)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Thread panel ── */}
      <div
        className={`flex-1 flex flex-col min-w-0
        ${showThread ? "flex" : "hidden lg:flex"}`}
      >
        {activeUserId ? (
          <ThreadView
            userId={activeUserId}
            userName={activeName}
            userImage={activeImage}
            onBack={() => setShowThread(false)}
          />
        ) : (
          /* Desktop empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#555] p-8">
            <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center">
              <MessageIcon size={36} color="#2a2a2a" />
            </div>
            <p className="text-[16px] font-medium text-[#777]">
              Select a conversation
            </p>
            <p className="text-[13px] text-center max-w-xs">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
