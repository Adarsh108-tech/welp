"use client";
import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { socket } from "@/socket";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiPlus,
  FiTrash2,
  FiHome,
  FiZap,
  FiFileText,
  FiUsers,
  FiX,
  FiCheck,
} from "react-icons/fi";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [collections, setCollections] = useState(["Today's Focus", "Sprint Deliverables", "Personal"]);
  const [activeCollection, setActiveCollection] = useState("Today's Focus");
  const [subTasks, setSubTasks] = useState({
    "Today's Focus": [
      { id: 1, desc: "Review morning standup notes", done: true },
      { id: 2, desc: "Complete 45m deep focus sprint", done: false },
      { id: 3, desc: "Sync with team in Watercooler Lounge", done: false },
    ],
    "Sprint Deliverables": [{ id: 4, desc: "Refactor API route endpoints", done: false }],
    Personal: [{ id: 5, desc: "10-minute posture stretch", done: false }],
  });
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [onlineCount, setOnlineCount] = useState(1);
  const [teamTimer, setTeamTimer] = useState({ running: false, title: "Team Sprint", remaining: 25 * 60 });

  const [boardNotes, setBoardNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("Standup");
  const [newNoteColor, setNewNoteColor] = useState("yellow");
  const [loadingNotes, setLoadingNotes] = useState(false);

  const modalRef = useRef();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/");
      return;
    }
    const user = JSON.parse(stored);
    setCurrentUser(user);

    socket.emit("office-enter", user);
    socket.on("office-presence", (members) => {
      setOnlineCount(members.length);
    });

    socket.on("team-timer-state", (state) => {
      setTeamTimer(state);
    });

    fetchBoardNotes();

    return () => {
      socket.off("office-presence");
      socket.off("team-timer-state");
    };
  }, [router]);

  const fetchBoardNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await axios.get("/api/board");
      setBoardNotes(res.data);
    } catch (e) {
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleCreateBoardNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !currentUser) return;

    try {
      const res = await axios.post("/api/board", {
        authorId: currentUser._id,
        authorName: currentUser.username,
        content: newNoteContent.trim(),
        category: newNoteCategory,
        color: newNoteColor,
      });
      setBoardNotes([res.data, ...boardNotes]);
      setNewNoteContent("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBoardNote = async (id) => {
    try {
      await axios.delete(`/api/board?id=${id}`);
      setBoardNotes(boardNotes.filter((n) => n._id !== id));
    } catch (err) {}
  };

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setShowModal(false);
      setNewCollectionName("");
    }
  };

  useEffect(() => {
    if (showModal) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showModal]);

  const confirmAddCollection = () => {
    const name = newCollectionName.trim();
    if (name && !collections.includes(name)) {
      setCollections([...collections, name]);
      setSubTasks({ ...subTasks, [name]: [] });
      setActiveCollection(name);
    }
    setNewCollectionName("");
    setShowModal(false);
  };

  const deleteCollection = (name) => {
    const updated = collections.filter((c) => c !== name);
    const newTasks = { ...subTasks };
    delete newTasks[name];
    setCollections(updated);
    setSubTasks(newTasks);
    if (activeCollection === name) {
      setActiveCollection(updated[0] || "");
    }
  };

  const addSubTask = () => {
    const newId = Date.now();
    setSubTasks({
      ...subTasks,
      [activeCollection]: [
        ...(subTasks[activeCollection] || []),
        { id: newId, desc: "", done: false },
      ],
    });
  };

  const updateSubTask = (id, field, value) => {
    const updated = (subTasks[activeCollection] || []).map((t) =>
      t.id === id ? { ...t, [field]: value } : t
    );
    setSubTasks({ ...subTasks, [activeCollection]: updated });
  };

  const toggleTaskDone = (id) => {
    const updated = (subTasks[activeCollection] || []).map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    setSubTasks({ ...subTasks, [activeCollection]: updated });
  };

  const deleteTask = (id) => {
    const updated = (subTasks[activeCollection] || []).filter((t) => t.id !== id);
    setSubTasks({ ...subTasks, [activeCollection]: updated });
  };

  const currentTasks = subTasks[activeCollection] || [];
  const completedTasks = currentTasks.filter((t) => t.done).length;
  const progressPercent =
    currentTasks.length > 0 ? Math.round((completedTasks / currentTasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-wine-950 flex flex-col pt-16">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Command Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#ebdcd0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-burgundy-900 bg-peach-100 px-3 py-1 rounded-full border border-peach-300">
                Workspace Dashboard
              </span>
            </div>
            <h1 className="text-3xl font-black text-burgundy-950 mt-2">
              Welcome back, {currentUser?.username || "Teammate"}
            </h1>
            <p className="text-xs text-wine-900/70 mt-1 font-medium">
              Manage your daily priorities, team bulletin board, and office flow
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/welcome/office")}
              className="px-4 py-2.5 bg-burgundy-800 hover:bg-burgundy-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
            >
              <FiHome className="w-4 h-4 text-peach-300" />
              <span>Office Floor</span>
            </button>
          </div>
        </div>

        {/* Quick Executive Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#ffffff] border border-[#ebdcd0] p-5 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-peach-100 border border-peach-300 flex items-center justify-center text-burgundy-800 flex-shrink-0">
              <FiUsers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-wine-900/60 font-bold">Office Presence</p>
              <h3 className="text-2xl font-black text-burgundy-950">
                {onlineCount} {onlineCount === 1 ? "Colleague" : "Colleagues"} Online
              </h3>
            </div>
          </div>

          <div className="bg-[#ffffff] border border-[#ebdcd0] p-5 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-wine-100 border border-wine-300 flex items-center justify-center text-burgundy-800 flex-shrink-0">
              <FiZap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-wine-900/60 font-bold">Team Focus Session</p>
              <h3 className="text-2xl font-black text-burgundy-950">
                {teamTimer.running ? "Active Sprint" : "Standing By"}
              </h3>
            </div>
          </div>

          <div className="bg-[#ffffff] border border-[#ebdcd0] p-5 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-peach-100 border border-peach-300 flex items-center justify-center text-burgundy-800 flex-shrink-0">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-wine-900/60 font-bold">Task Completion</p>
              <h3 className="text-2xl font-black text-burgundy-950">
                {completedTasks}/{currentTasks.length} ({progressPercent}%)
              </h3>
            </div>
          </div>
        </div>

        {/* Main Content: Tasks Manager (Left) + Bulletin Sticky Board (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Collections Manager (Left 2 Columns) */}
          <div className="lg:col-span-2 bg-[#ffffff] border border-[#ebdcd0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Collection Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#ebdcd0]">
              {collections.map((name) => (
                <div
                  key={name}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    activeCollection === name
                      ? "bg-burgundy-800 text-white shadow-xs"
                      : "bg-[#f7f2ea] text-wine-900 hover:bg-peach-100"
                  }`}
                >
                  <button onClick={() => setActiveCollection(name)}>{name}</button>
                  {collections.length > 1 && (
                    <button
                      onClick={() => deleteCollection(name)}
                      className="text-peach-200 hover:text-white p-0.5 ml-1"
                      title="Delete list"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={() => setShowModal(true)}
                className="p-2 rounded-xl bg-[#f7f2ea] hover:bg-peach-100 text-burgundy-900 transition text-xs font-bold border border-[#dfd2c4] flex-shrink-0"
                title="Add collection"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Collection Progress & Add Task Button */}
            {activeCollection && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-burgundy-950">{activeCollection}</h2>
                    <p className="text-xs text-wine-900/60 font-semibold">
                      {completedTasks} of {currentTasks.length} tasks completed
                    </p>
                  </div>

                  <button
                    onClick={addSubTask}
                    className="px-4 py-2 bg-burgundy-800 hover:bg-burgundy-900 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <FiPlus className="w-4 h-4 text-peach-300" />
                    <span>Add Task</span>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#f7f2ea] rounded-full h-2 overflow-hidden border border-[#eee3d8]">
                  <div
                    className="bg-burgundy-800 h-2 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Tasks List */}
                <div className="space-y-2.5 pt-2">
                  {currentTasks.length === 0 ? (
                    <div className="text-center py-12 text-wine-900/40 text-xs font-semibold">
                      No tasks in this list. Click "+ Add Task" to begin.
                    </div>
                  ) : (
                    currentTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition ${
                          task.done
                            ? "bg-[#faf6f0] border-[#eee3d8] opacity-60"
                            : "bg-[#fcfbf9] border-[#dfd2c4] hover:border-peach-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTaskDone(task.id)}
                          className="w-4 h-4 text-burgundy-800 rounded bg-[#ffffff] border-[#dfd2c4] focus:ring-0 cursor-pointer"
                        />

                        <input
                          type="text"
                          value={task.desc}
                          onChange={(e) => updateSubTask(task.id, "desc", e.target.value)}
                          placeholder="Task description..."
                          className={`flex-1 bg-transparent text-xs text-burgundy-950 focus:outline-none font-medium ${
                            task.done ? "line-through text-wine-900/40" : ""
                          }`}
                        />

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-wine-400 hover:text-burgundy-900 transition"
                          title="Delete task"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Team Bulletin & Standup Sticky Notes (Right Column) */}
          <div className="bg-[#ffffff] border border-[#ebdcd0] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#ebdcd0]">
              <div className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-burgundy-800" />
                <h3 className="font-black text-sm text-burgundy-950">Bulletin Board</h3>
              </div>
              <span className="text-[10px] text-wine-900/60 font-semibold">Team notes & updates</span>
            </div>

            {/* Post Note Form */}
            <form onSubmit={handleCreateBoardNote} className="space-y-3">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Post an announcement, update, or quick question..."
                rows={3}
                className="w-full p-3 bg-[#fcfbf9] border border-[#dfd2c4] rounded-2xl text-xs text-burgundy-950 placeholder-wine-900/40 focus:outline-none focus:border-burgundy-700 resize-none shadow-xs"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "yellow", bg: "bg-amber-200" },
                    { id: "blue", bg: "bg-sky-200" },
                    { id: "green", bg: "bg-emerald-200" },
                    { id: "pink", bg: "bg-rose-200" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewNoteColor(c.id)}
                      className={`w-5 h-5 rounded-full border-2 transition ${c.bg} ${
                        newNoteColor === c.id ? "border-burgundy-900 scale-110" : "border-transparent"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!newNoteContent.trim()}
                  className="px-3.5 py-1.5 bg-burgundy-800 hover:bg-burgundy-900 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shadow-xs"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Pin Note</span>
                </button>
              </div>
            </form>

            {/* Pinned Sticky Notes Stream */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {loadingNotes ? (
                <div className="text-center py-8 text-xs text-wine-900/40 font-semibold">Loading bulletin...</div>
              ) : boardNotes.length === 0 ? (
                <div className="text-center py-8 text-xs text-wine-900/40 font-semibold">
                  No notes pinned yet. Share an update above.
                </div>
              ) : (
                boardNotes.map((note) => {
                  const colorClass =
                    note.color === "blue"
                      ? "bg-sky-50/90 border-sky-200 text-sky-950"
                      : note.color === "green"
                      ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                      : note.color === "pink"
                      ? "bg-rose-50/90 border-rose-200 text-burgundy-950"
                      : "bg-amber-50/90 border-amber-200 text-amber-950";

                  return (
                    <div
                      key={note._id}
                      className={`p-3.5 rounded-2xl border shadow-xs space-y-1.5 relative group ${colorClass}`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span>{note.authorName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] opacity-60 font-mono">
                            {new Date(note.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {note.authorId === currentUser?._id && (
                            <button
                              onClick={() => handleDeleteBoardNote(note._id)}
                              className="text-wine-500 hover:text-burgundy-900 opacity-0 group-hover:opacity-100 transition"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed font-medium">{note.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal for New Collection */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-burgundy-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              ref={modalRef}
              className="bg-[#ffffff] border border-[#ebdcd0] p-6 rounded-3xl shadow-xl w-full max-w-sm space-y-4"
            >
              <h3 className="text-base font-black text-burgundy-950">New Task List</h3>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-[#fcfbf9] border border-[#dfd2c4] rounded-xl text-xs text-burgundy-950 placeholder-wine-900/40 focus:outline-none focus:border-burgundy-700 shadow-xs"
                placeholder="e.g. Q4 Sprint, Client Review"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmAddCollection();
                }}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewCollectionName("");
                  }}
                  className="px-4 py-2 bg-[#f7f2ea] text-wine-900 hover:bg-peach-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddCollection}
                  className="px-4 py-2 bg-burgundy-800 text-white rounded-xl text-xs font-bold hover:bg-burgundy-900 shadow-xs"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
