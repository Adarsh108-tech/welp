"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { socket } from "@/socket";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { soundManager } from "@/lib/soundFx";
import {
  FiHash,
  FiCoffee,
  FiZap,
  FiBell,
  FiSearch,
  FiSend,
  FiUsers,
  FiMessageSquare,
  FiSmile,
  FiActivity,
  FiCheckCircle,
} from "react-icons/fi";

const CHANNELS = [
  { id: "channel_open-office", name: "open-office", desc: "General office discussion & co-working", icon: FiHash },
  { id: "channel_watercooler", name: "watercooler", desc: "Casual coffee break banter & team catch-ups", icon: FiCoffee },
  { id: "channel_deep-focus", name: "deep-focus", desc: "Silent focus sprints & accountability logs", icon: FiZap },
  { id: "channel_announcements", name: "announcements", desc: "Office notices & product updates", icon: FiBell },
];

const QUICK_RESPONSES = [
  "On it",
  "Acknowledged",
  "Taking a quick break",
  "Ready to sync",
  "Focusing for 30m",
  "Sounds great",
];

export default function TeamLounge() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [chats, setChats] = useState([]);
  const [activeTarget, setActiveTarget] = useState(CHANNELS[0]);
  const [isChannel, setIsChannel] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const router = useRouter();
  const chatScrollRef = useRef(null);

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(stored);
    setCurrentUser(parsedUser);

    socket.emit("join", parsedUser._id);
    socket.emit("office-enter", parsedUser);

    const token = localStorage.getItem("token");
    const headers = { userid: parsedUser._id };
    if (token) headers.Authorization = `Bearer ${token}`;

    axios.get("/api/users", { headers }).then((res) => {
      const validUsers = res.data.filter(
        (u) => u && u._id && u._id !== parsedUser._id
      );
      setUsers(validUsers);
    });

    fetchChannelMessages("channel_open-office");

    return () => {
      socket.off("private-message");
      socket.off("channel-message");
    };
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    const handlePrivateMessage = (data) => {
      soundManager.playDing();
      if (
        !isChannel &&
        ((data.from === activeTarget?._id && data.to === currentUser._id) ||
          (data.from === currentUser._id && data.to === activeTarget?._id))
      ) {
        setChats((prev) => [...prev, data]);
      }
    };

    const handleChannelMessage = (data) => {
      if (isChannel && data.channel === activeTarget?.id) {
        soundManager.playDing();
        setChats((prev) => [...prev, data]);
      }
    };

    socket.on("private-message", handlePrivateMessage);
    socket.on("channel-message", handleChannelMessage);

    return () => {
      socket.off("private-message", handlePrivateMessage);
      socket.off("channel-message", handleChannelMessage);
    };
  }, [currentUser, activeTarget, isChannel]);

  const fetchChannelMessages = async (channelId) => {
    setLoadingChats(true);
    setChats([]);
    try {
      const res = await axios.get(`/api/users/messages/${channelId}`);
      setChats(res.data);
    } catch (err) {
      console.error("Fetch channel messages error:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchDirectMessages = async (targetUser) => {
    if (!currentUser) return;
    setLoadingChats(true);
    setChats([]);
    try {
      const token = localStorage.getItem("token");
      const headers = { userid: currentUser._id };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.get(`/api/users/messages/${targetUser._id}`, { headers });
      setChats(res.data);
    } catch (err) {
      console.error("Fetch direct messages error:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSelectChannel = (channel) => {
    setIsChannel(true);
    setActiveTarget(channel);
    fetchChannelMessages(channel.id);
  };

  const handleSelectUser = (u) => {
    setIsChannel(false);
    setActiveTarget(u);
    fetchDirectMessages(u);
  };

  const handleSend = () => {
    if (!msg.trim() || !currentUser || !activeTarget) return;

    if (isChannel) {
      const newMsg = {
        from: currentUser._id,
        channel: activeTarget.id,
        senderName: currentUser.username,
        content: msg.trim(),
        timestamp: new Date().toISOString(),
      };
      socket.emit("channel-message", newMsg);
      setChats((prev) => [...prev, newMsg]);
    } else {
      const newMsg = {
        from: currentUser._id,
        to: activeTarget._id,
        senderName: currentUser.username,
        content: msg.trim(),
        timestamp: new Date().toISOString(),
      };
      socket.emit("private-message", newMsg);
      setChats((prev) => [...prev, newMsg]);
    }
    setMsg("");
  };

  const appendQuickResponse = (text) => {
    setMsg(text);
  };

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-wine-950 flex flex-col pt-16">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        <div className="flex-1 bg-[#ffffff] border border-[#ebdcd0] rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[calc(100vh-7rem)]">
          {/* Left Sidebar: Channels & Coworkers */}
          <div className="w-full md:w-80 bg-[#faf6f0] border-r border-[#ebdcd0] flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-[#ebdcd0]">
              <div className="relative">
                <FiSearch className="w-4 h-4 text-wine-600 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search channels or team..."
                  className="w-full pl-9 pr-3 py-2 bg-[#ffffff] border border-[#dfd2c4] rounded-xl text-xs text-burgundy-950 placeholder-wine-900/40 focus:outline-none focus:border-burgundy-700 shadow-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-6">
              {/* Office Channels */}
              <div>
                <span className="text-[11px] font-bold text-wine-900/60 uppercase tracking-wider px-2 block mb-2">
                  Office Channels
                </span>
                <div className="space-y-1">
                  {CHANNELS.map((ch) => {
                    const isSelected = isChannel && activeTarget?.id === ch.id;
                    const Icon = ch.icon;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => handleSelectChannel(ch)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                          isSelected
                            ? "bg-burgundy-800 text-white shadow-xs"
                            : "text-wine-900 hover:bg-peach-100/70"
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-peach-200" : "text-wine-600"}`} />
                        <span className="truncate">#{ch.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Messages with Coworkers */}
              <div>
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-[11px] font-bold text-wine-900/60 uppercase tracking-wider">
                    Direct Messages
                  </span>
                  <span className="text-[10px] text-burgundy-800 font-bold font-mono">
                    {filteredUsers.length} online
                  </span>
                </div>

                <div className="space-y-1">
                  {filteredUsers.length === 0 ? (
                    <p className="text-xs text-wine-900/50 px-2 py-3">No other teammates online</p>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = !isChannel && activeTarget?._id === u._id;
                      return (
                        <button
                          key={u._id}
                          onClick={() => handleSelectUser(u)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                            isSelected
                              ? "bg-burgundy-800 text-white shadow-xs"
                              : "text-wine-900 hover:bg-peach-100/70"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="relative flex-shrink-0">
                              <div className="w-7 h-7 rounded-full bg-burgundy-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                {u.username?.charAt(0).toUpperCase()}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-wine-600 border border-[#ffffff]" />
                            </div>
                            <span className="truncate">{u.username}</span>
                          </div>

                          {u.status && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                isSelected
                                  ? "bg-burgundy-950/60 text-peach-200"
                                  : "bg-[#ebdcd0] text-wine-900"
                              }`}
                            >
                              {u.status}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Chat Area */}
          <div className="flex-1 flex flex-col bg-[#ffffff]">
            {/* Chat Header */}
            <div className="p-4 px-6 border-b border-[#ebdcd0] flex items-center justify-between bg-[#ffffff]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-peach-100 border border-peach-300 flex items-center justify-center text-burgundy-900 font-bold">
                  {isChannel ? (
                    <FiHash className="w-5 h-5 text-burgundy-800" />
                  ) : (
                    activeTarget?.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-black text-sm text-burgundy-950 flex items-center gap-2">
                    {isChannel ? `#${activeTarget?.name}` : activeTarget?.username}
                    {!isChannel && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-peach-100 text-burgundy-900 border border-peach-300 font-bold">
                        {activeTarget?.status || "Online"}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-wine-900/60 font-medium">
                    {isChannel
                      ? activeTarget?.desc
                      : activeTarget?.currentTask || "Direct message thread"}
                  </p>
                </div>
              </div>

              {!isChannel && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      socket.emit("office-action", {
                        fromUser: { _id: currentUser._id, username: currentUser.username },
                        toUser: { _id: activeTarget._id, username: activeTarget.username },
                        action: "coffee",
                        message: "sent you a warm cup of coffee",
                      });
                      soundManager.playDing();
                    }}
                    className="px-3 py-1.5 bg-peach-100 hover:bg-peach-200 border border-peach-300 text-burgundy-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <FiCoffee className="w-3.5 h-3.5 text-peach-700" />
                    <span>Coffee Break</span>
                  </button>
                  <button
                    onClick={() => {
                      socket.emit("office-action", {
                        fromUser: { _id: currentUser._id, username: currentUser.username },
                        toUser: { _id: activeTarget._id, username: activeTarget.username },
                        action: "wave",
                        message: "waved at you",
                      });
                      soundManager.playWave();
                    }}
                    className="px-3 py-1.5 bg-wine-100 hover:bg-wine-200 border border-wine-300 text-burgundy-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <FiSmile className="w-3.5 h-3.5 text-wine-700" />
                    <span>Wave</span>
                  </button>
                </div>
              )}
            </div>

            {/* Message Stream */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-6 overflow-y-auto space-y-4 font-sans bg-[#fcfbf9]"
            >
              {loadingChats ? (
                <div className="text-center py-20 text-wine-400 text-xs animate-pulse">
                  Loading discussion...
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-20 text-wine-900/60 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-peach-100 border border-peach-200 flex items-center justify-center mx-auto text-burgundy-800">
                    <FiMessageSquare className="w-6 h-6 text-burgundy-800" />
                  </div>
                  <p className="text-sm font-bold text-burgundy-950">
                    No messages here yet
                  </p>
                  <p className="text-xs text-wine-900/60">
                    Send a note to kickstart the conversation.
                  </p>
                </div>
              ) : (
                chats.map((c, i) => {
                  const isMe = c.from === currentUser?._id;
                  return (
                    <div
                      key={c._id || i}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[11px] font-bold text-wine-900/70">
                          {isMe ? "You" : c.senderName || "Teammate"}
                        </span>
                        {c.timestamp && (
                          <span className="text-[10px] text-wine-900/40 font-mono">
                            {new Date(c.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div
                        className={`max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-burgundy-800 text-white rounded-br-xs shadow-xs"
                            : "bg-[#ffffff] text-burgundy-950 border border-[#dfd2c4] rounded-bl-xs shadow-xs"
                        }`}
                      >
                        {c.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Box */}
            <div className="p-4 bg-[#ffffff] border-t border-[#ebdcd0] space-y-2">
              {/* Quick Responses Bar */}
              <div className="flex items-center gap-1.5 px-1 overflow-x-auto pb-1">
                <span className="text-[10px] text-wine-900/60 uppercase font-bold tracking-wider mr-1 whitespace-nowrap">
                  Quick Reply:
                </span>
                {QUICK_RESPONSES.map((txt) => (
                  <button
                    key={txt}
                    onClick={() => appendQuickResponse(txt)}
                    className="px-2.5 py-1 bg-[#f7f2ea] hover:bg-peach-100 text-wine-900 hover:text-burgundy-950 text-[11px] font-semibold rounded-lg transition border border-[#ebdcd0] whitespace-nowrap"
                  >
                    {txt}
                  </button>
                ))}
              </div>

              {/* Input & Send */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`Message ${
                    isChannel ? `#${activeTarget?.name}` : activeTarget?.username || "team"
                  }...`}
                  className="flex-1 px-4 py-3 bg-[#fcfbf9] border border-[#dfd2c4] rounded-xl text-xs text-burgundy-950 placeholder-wine-900/40 focus:outline-none focus:border-burgundy-700 shadow-xs"
                />
                <button
                  onClick={handleSend}
                  disabled={!msg.trim()}
                  className="px-5 py-3 bg-burgundy-800 hover:bg-burgundy-900 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
