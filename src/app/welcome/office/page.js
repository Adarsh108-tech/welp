"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { socket } from "@/socket";
import { soundManager } from "@/lib/soundFx";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiLayers,
  FiUsers,
  FiCoffee,
  FiZap,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiPlus,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiMessageSquare,
  FiCornerDownRight,
} from "react-icons/fi";

const ROOMS = [
  { id: "open-office", name: "Open Workspace", desc: "Co-working desks & general active floor" },
  { id: "deep-focus", name: "Deep Focus Pods", desc: "Silent sprint area for distraction-free work" },
  { id: "watercooler", name: "Team Lounge", desc: "Informal conversations & coffee break check-ins" },
  { id: "meeting-room", name: "Conference Room", desc: "Meeting space, standups & team reviews" },
];

const DESK_COUNT = 12;

export default function VirtualOffice() {
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("open-office");
  const [myDesk, setMyDesk] = useState(null);
  const [myTask, setMyTask] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [actionNotification, setActionNotification] = useState(null);
  const [teamTimer, setTeamTimer] = useState({
    running: false,
    title: "Team Focus Sprint",
    duration: 25 * 60,
    remaining: 25 * 60,
  });
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/");
      return;
    }
    const user = JSON.parse(stored);
    setCurrentUser(user);
    if (user.currentDesk !== undefined) setMyDesk(user.currentDesk);
    if (user.currentTask) {
      setMyTask(user.currentTask);
      setTaskInput(user.currentTask);
    }
    if (user.currentRoom) setCurrentRoom(user.currentRoom);

    socket.emit("office-enter", user);

    socket.on("office-presence", (members) => {
      setOnlineMembers(members);
    });

    socket.on("team-timer-state", (state) => {
      setTeamTimer(state);
    });

    socket.on("office-action-received", (data) => {
      soundManager.playWave();
      setActionNotification(data);
      setTimeout(() => setActionNotification(null), 5000);
    });

    return () => {
      socket.off("office-presence");
      socket.off("team-timer-state");
      socket.off("office-action-received");
    };
  }, [router]);

  useEffect(() => {
    let interval = null;
    if (teamTimer.running && teamTimer.remaining > 0) {
      interval = setInterval(() => {
        setTeamTimer((prev) => {
          if (prev.remaining <= 1) {
            soundManager.playBell();
            return { ...prev, remaining: 0, running: false };
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [teamTimer.running, teamTimer.remaining]);

  const handleRoomChange = (roomId) => {
    setCurrentRoom(roomId);
    if (currentUser) {
      const updated = { ...currentUser, currentRoom: roomId };
      setCurrentUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));

      socket.emit("status-update", {
        userId: currentUser._id,
        currentRoom: roomId,
      });

      axios.post("/api/users/status", {
        userId: currentUser._id,
        currentRoom: roomId,
      });
    }
  };

  const handleDeskClick = (deskIndex) => {
    const isOccupiedByOther = onlineMembers.some(
      (m) => m._id !== currentUser?._id && m.currentDesk === deskIndex
    );
    if (isOccupiedByOther) return;

    const newDesk = myDesk === deskIndex ? null : deskIndex;
    setMyDesk(newDesk);

    if (currentUser) {
      const updated = { ...currentUser, currentDesk: newDesk };
      setCurrentUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));

      socket.emit("status-update", {
        userId: currentUser._id,
        currentDesk: newDesk,
      });

      axios.post("/api/users/status", {
        userId: currentUser._id,
        currentDesk: newDesk,
      });
    }
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskInput.trim() || !currentUser) return;
    setMyTask(taskInput.trim());

    const updated = { ...currentUser, currentTask: taskInput.trim() };
    setCurrentUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));

    socket.emit("status-update", {
      userId: currentUser._id,
      currentTask: taskInput.trim(),
    });

    axios.post("/api/users/status", {
      userId: currentUser._id,
      currentTask: taskInput.trim(),
    });
  };

  const sendOfficeAction = (targetUser, actionType) => {
    if (!currentUser || !targetUser) return;
    soundManager.playDing();

    let message = "";
    if (actionType === "wave") message = `sent you a wave`;
    if (actionType === "coffee") message = `offered a coffee break`;
    if (actionType === "knock") message = `knocked on your desk`;

    socket.emit("office-action", {
      fromUser: {
        _id: currentUser._id,
        username: currentUser.username,
      },
      toUser: {
        _id: targetUser._id,
        username: targetUser.username,
      },
      action: actionType,
      message,
    });
  };

  const handleStartTeamTimer = (mins = 25) => {
    soundManager.playDing();
    socket.emit("team-timer-start", {
      title: "Team Focus Sprint",
      duration: mins * 60,
      startedBy: currentUser?.username || "Team",
    });
  };

  const handlePauseTeamTimer = () => {
    socket.emit("team-timer-pause");
  };

  const handleResetTeamTimer = () => {
    socket.emit("team-timer-reset");
  };

  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "In Focus":
      case "Deep Focus":
        return { label: "Deep Focus", pillClass: "bg-[#faeef0] text-[#701124] border-[#f4cfd5]" };
      case "Coffee Break":
      case "On Break":
        return { label: "On Break", pillClass: "bg-[#feeae2] text-[#ea6541] border-[#f8bfae]" };
      case "In Meeting":
        return { label: "In Meeting", pillClass: "bg-sky-50 text-sky-800 border-sky-200" };
      case "Away":
        return { label: "Away", pillClass: "bg-amber-50 text-amber-800 border-amber-200" };
      default:
        return { label: "Available", pillClass: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1e080d] flex flex-col pt-15 font-sans">
      <Navbar />

      {/* Action Notification Banner */}
      {actionNotification && (
        <div className="fixed top-20 right-6 z-50 bg-[#701124] text-white px-4 py-3 rounded-md shadow-lg border border-[#f4cfd5] flex items-center gap-3 text-xs">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold">
            !
          </div>
          <div>
            <span className="font-semibold">{actionNotification.fromUser?.username}</span>{" "}
            <span className="text-[#fce4e8]">{actionNotification.message}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#ffffff] border border-[#e6dfd5] p-5 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <h1 className="text-xl font-bold tracking-tight text-[#1e080d]">
                Team Workspace Floor
              </h1>
            </div>
            <p className="text-xs text-[#5e484c] mt-0.5">
              Live presence, seat assignments, and co-working focus sessions
            </p>
          </div>

          {/* Focus Task Input Form */}
          <form onSubmit={handleSaveTask} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="What are you currently working on?"
              className="px-3.5 py-1.5 bg-[#fcfbf9] border border-[#d9cdc1] rounded-md text-xs text-[#1e080d] focus:outline-none focus:border-[#701124] focus:ring-1 focus:ring-[#701124] w-full md:w-64 placeholder-[#a69296]"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#701124] hover:bg-[#560b1b] text-white font-semibold rounded-md text-xs transition shadow-xs whitespace-nowrap"
            >
              Update Focus
            </button>
          </form>
        </div>

        {/* Synchronized Team Co-Focus Sprint Bar */}
        <div className="bg-[#ffffff] border border-[#e6dfd5] p-4 rounded-lg flex flex-wrap items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#faeef0] text-[#701124] flex items-center justify-center font-bold">
              <FiClock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1e080d] uppercase tracking-wide">
                  {teamTimer.title}
                </span>
                {teamTimer.running && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#faeef0] text-[#701124] font-semibold border border-[#f4cfd5]">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#5e484c]">
                Initiated by: <span className="font-medium text-[#1e080d]">{teamTimer.startedBy}</span>
              </p>
            </div>
          </div>

          {/* Numerical Countdown Display */}
          <div className="text-2xl font-mono font-bold tracking-tight bg-[#fcfbf9] px-4 py-1.5 rounded-md border border-[#e6dfd5] text-[#701124]">
            {formatTimer(teamTimer.remaining)}
          </div>

          {/* Timer Actions */}
          <div className="flex items-center gap-2">
            {!teamTimer.running ? (
              <>
                <button
                  onClick={() => handleStartTeamTimer(25)}
                  className="px-3.5 py-1.5 bg-[#701124] hover:bg-[#560b1b] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition shadow-xs"
                >
                  <FiPlay className="w-3.5 h-3.5" /> Start 25m Sprint
                </button>
                <button
                  onClick={() => handleStartTeamTimer(15)}
                  className="px-3 py-1.5 bg-[#fcfbf9] hover:bg-[#f6f3ed] border border-[#d9cdc1] text-[#1e080d] text-xs font-medium rounded-md transition"
                >
                  15m Standup
                </button>
              </>
            ) : (
              <button
                onClick={handlePauseTeamTimer}
                className="px-3.5 py-1.5 bg-[#ea6541] hover:bg-[#d65634] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition shadow-xs"
              >
                <FiPause className="w-3.5 h-3.5" /> Pause
              </button>
            )}
            <button
              onClick={handleResetTeamTimer}
              title="Reset Timer"
              className="p-2 bg-[#fcfbf9] hover:bg-[#f6f3ed] text-[#5e484c] border border-[#d9cdc1] rounded-md transition"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Room Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ROOMS.map((room) => {
            const isCurrent = currentRoom === room.id;
            const countInRoom = onlineMembers.filter(
              (m) => (m.currentRoom || "open-office") === room.id
            ).length;

            return (
              <button
                key={room.id}
                onClick={() => handleRoomChange(room.id)}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  isCurrent
                    ? "bg-[#faeef0] border-[#701124] shadow-xs"
                    : "bg-[#ffffff] border-[#e6dfd5] hover:border-[#d4c8ba] hover:bg-[#fcfbf9]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-semibold text-xs ${isCurrent ? "text-[#701124]" : "text-[#1e080d]"}`}>
                    {room.name}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      isCurrent
                        ? "bg-[#701124] text-white"
                        : "bg-[#f6f3ed] text-[#5e484c]"
                    }`}
                  >
                    {countInRoom} {countInRoom === 1 ? "person" : "people"}
                  </span>
                </div>
                <p className="text-[11px] text-[#5e484c] leading-relaxed">{room.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Floor Workspace Grid */}
        <div className="bg-[#ffffff] border border-[#e6dfd5] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          {/* Header of Floor Grid */}
          <div className="flex items-center justify-between pb-4 border-b border-[#f0e8dc] mb-5">
            <div>
              <h2 className="text-sm font-bold text-[#1e080d] capitalize">
                {currentRoom.replace("-", " ")} Desks
              </h2>
              <p className="text-xs text-[#5e484c]">
                Click an unoccupied desk to seat yourself, or select a colleague to interact
              </p>
            </div>

            <div className="text-xs text-[#5e484c] flex items-center gap-2">
              <span>My Assigned Desk:</span>
              <span className="font-semibold text-[#701124] font-mono">
                {myDesk !== null ? `Desk #${myDesk + 1}` : "Unseated"}
              </span>
            </div>
          </div>

          {/* Desks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {Array.from({ length: DESK_COUNT }).map((_, index) => {
              const occupant = onlineMembers.find((m) => m.currentDesk === index);
              const isMyDesk = myDesk === index;

              return (
                <div
                  key={index}
                  onClick={() => !occupant && handleDeskClick(index)}
                  className={`group relative p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isMyDesk
                      ? "bg-[#faeef0] border-[#701124] ring-1 ring-[#701124]"
                      : occupant
                      ? "bg-[#fcfbf9] border-[#e6dfd5]"
                      : "bg-[#ffffff] border-dashed border-[#d9cdc1] hover:border-[#701124] hover:bg-[#faf8f5]"
                  }`}
                >
                  {/* Desk Number & Status Tag */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-mono font-medium text-[#8a7377]">
                      Desk #{index + 1}
                    </span>
                    {occupant && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                          getStatusBadge(occupant.status).pillClass
                        }`}
                      >
                        {getStatusBadge(occupant.status).label}
                      </span>
                    )}
                  </div>

                  {/* Occupant or Available State */}
                  {occupant ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-[#701124] text-white font-bold flex items-center justify-center text-xs">
                          {occupant.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-xs text-[#1e080d] truncate">
                            {occupant.username}{" "}
                            {occupant._id === currentUser?._id && (
                              <span className="text-[11px] text-[#701124] font-medium">(You)</span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#5e484c] truncate">
                            {occupant.currentTask || "Working on tasks"}
                          </p>
                        </div>
                      </div>

                      {/* Interaction Actions */}
                      {occupant._id !== currentUser?._id && (
                        <div className="pt-2 border-t border-[#f0e8dc] flex items-center justify-between gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendOfficeAction(occupant, "wave");
                            }}
                            className="px-2 py-1 rounded bg-[#f6f3ed] hover:bg-[#faeef0] text-[#701124] text-[11px] font-medium transition"
                          >
                            Wave
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendOfficeAction(occupant, "coffee");
                            }}
                            className="px-2 py-1 rounded bg-[#feeae2] hover:bg-[#fcd9cc] text-[#ea6541] text-[11px] font-medium transition"
                          >
                            Coffee
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendOfficeAction(occupant, "knock");
                            }}
                            className="px-2 py-1 rounded bg-[#f6f3ed] hover:bg-[#faeef0] text-[#701124] text-[11px] font-medium transition"
                          >
                            Knock
                          </button>
                        </div>
                      )}

                      {/* Vacate Desk */}
                      {isMyDesk && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeskClick(index);
                          }}
                          className="w-full text-center text-[11px] text-[#701124] hover:bg-[#fce4e8] py-0.5 rounded border border-[#f4cfd5] font-medium mt-1"
                        >
                          Vacate Desk
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-5 flex flex-col items-center justify-center text-center">
                      <FiPlus className="w-4 h-4 text-[#8a7377] group-hover:text-[#701124] transition mb-1" />
                      <span className="text-xs font-medium text-[#5e484c] group-hover:text-[#1e080d] transition">
                        Available
                      </span>
                      <span className="text-[10px] text-[#8a7377]">Click to sit</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Bar */}
          <div className="mt-6 pt-4 border-t border-[#f0e8dc] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#5e484c]">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>
                {onlineMembers.length} team {onlineMembers.length === 1 ? "member" : "members"} online in workspace
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push("/welcome/groups")}
                className="px-3.5 py-1.5 bg-[#fcfbf9] hover:bg-[#f6f3ed] border border-[#d9cdc1] text-[#1e080d] rounded-md font-semibold flex items-center gap-1.5 transition"
              >
                <FiMessageSquare className="w-3.5 h-3.5 text-[#701124]" /> Open Team Chat
              </button>
              <button
                onClick={() => router.push("/welcome/timers")}
                className="px-3.5 py-1.5 bg-[#701124] hover:bg-[#560b1b] text-white rounded-md font-semibold transition"
              >
                Focus Timers Suite →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
