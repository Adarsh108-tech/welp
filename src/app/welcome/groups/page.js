"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { socket } from "@/socket";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [chats, setChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const socketInitialized = useRef(false);

  // Auth check + load users
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    if (!socketInitialized.current) {
      socket.emit("join", parsedUser._id);
      socketInitialized.current = true;
    }

    axios.get("http://localhost:5000/api/users").then((res) => {
      const validUsers = res.data.filter(
        (u) => u && u._id && u.username && u._id !== parsedUser._id
      );
      setUsers(validUsers);
    });

    return () => {
      socket.off("private-message");
    };
  }, []);

  // Listen for incoming messages
  useEffect(() => {
    if (!user || !selectedUser) return;

    const handleMessage = (data) => {
      if (
        (data.from === selectedUser._id && data.to === user._id) ||
        (data.from === user._id && data.to === selectedUser._id)
      ) {
        setChats((prev) => [...prev, data]);
      }
    };

    socket.on("private-message", handleMessage);
    return () => socket.off("private-message", handleMessage);
  }, [selectedUser, user]);

  // Load previous messages when a user is selected
  const fetchChat = async (targetUser) => {
    if (!user) return;
    setSelectedUser(targetUser);
    setChats([]);

    const res = await axios.get(
      `http://localhost:5000/api/users/messages/${targetUser._id}`,
      {
        headers: { userid: user._id },
      }
    );
    setChats(res.data);
  };

  // Send message
  const send = () => {
    if (!msg.trim() || !selectedUser || !user) return;

    const newMsg = {
      from: user._id,
      to: selectedUser._id,
      content: msg.trim(),
    };

    socket.emit("private-message", newMsg);
    setChats((prev) => [...prev, newMsg]);
    setMsg("");
  };

  if (!user)
    return <div className="text-center text-lg py-20">Loading...</div>;

  return (
    <div>
      <Navbar/>
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-100 to-indigo-100 text-black mt-[3.2rem]">
        <header className="p-4 text-xl font-bold bg-white shadow-md text-indigo-700">
          Welcome, {user.username}
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Users Sidebar */}
          <div className="w-64 bg-white border-r shadow-md p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Users</h3>
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => fetchChat(u)}
                  className={`p-2 rounded-lg cursor-pointer hover:bg-indigo-100 transition text-black ${
                    selectedUser?._id === u._id ? "bg-indigo-200 font-semibold" : ""
                  }`}
                >
                  {u.username}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col p-4">
            <h4 className="text-xl font-medium text-indigo-800 mb-2">
              Chat with {selectedUser?.username || "someone"}
            </h4>

            <div className="flex-1 overflow-y-auto bg-white rounded-lg p-4 shadow-inner space-y-2 mb-4">
              {chats.map((c, i) => (
                <div
                  key={i}
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    c.from === user._id
                      ? "ml-auto bg-indigo-200 text-right"
                      : "mr-auto bg-gray-200 text-left"
                  }`}
                >
                  {c.content}
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Type a message..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <button
                onClick={send}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
