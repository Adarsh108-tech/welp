"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { socket } from "@/socket";
import { soundManager } from "@/lib/soundFx";
import {
  FiClock,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiPlus,
  FiTrash2,
  FiUsers,
  FiBell,
  FiCheckCircle,
} from "react-icons/fi";

export default function TimersPage() {
  const [activeTab, setActiveTab] = useState("team");
  const [user, setUser] = useState(null);

  const [teamTimer, setTeamTimer] = useState({
    running: false,
    title: "Team Sprint",
    duration: 25 * 60,
    remaining: 25 * 60,
    startedBy: "Team",
  });

  const [customTitle, setCustomTitle] = useState("");
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("25");
  const [savedCustomTimers, setSavedCustomTimers] = useState([
    { id: 1, title: "Daily Standup Review", duration: 15 * 60 },
    { id: 2, title: "Deep Work Sprint", duration: 45 * 60 },
    { id: 3, title: "Code Review & Inbox Sweep", duration: 20 * 60 },
  ]);

  const [personalSeconds, setPersonalSeconds] = useState(25 * 60);
  const [personalTotal, setPersonalTotal] = useState(25 * 60);
  const [isPersonalRunning, setIsPersonalRunning] = useState(false);
  const [timerTitle, setTimerTitle] = useState("Pomodoro Focus");
  const [alarmActive, setAlarmActive] = useState(false);

  const [isWorkSession, setIsWorkSession] = useState(true);
  const [workDuration, setWorkDuration] = useState(52 * 60);
  const [restDuration, setRestDuration] = useState(17 * 60);

  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }

    socket.on("team-timer-state", (state) => {
      setTeamTimer(state);
    });

    return () => {
      socket.off("team-timer-state");
    };
  }, []);

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

  useEffect(() => {
    let interval = null;
    if (isPersonalRunning && personalSeconds > 0) {
      interval = setInterval(() => {
        setPersonalSeconds((s) => {
          if (s <= 1) {
            soundManager.playBell();
            setIsPersonalRunning(false);
            setAlarmActive(true);

            if (activeTab === "workRest") {
              const nextSession = !isWorkSession;
              setIsWorkSession(nextSession);
              const nextTime = nextSession ? workDuration : restDuration;
              setPersonalTotal(nextTime);
              return nextTime;
            }

            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPersonalRunning, personalSeconds, activeTab, isWorkSession, workDuration, restDuration]);

  useEffect(() => {
    let interval = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const handleStartTeamTimer = (mins = 25, title = "Team Focus Sprint") => {
    soundManager.playDing();
    socket.emit("team-timer-start", {
      title,
      duration: mins * 60,
      startedBy: user?.username || "Colleague",
    });
  };

  const handlePauseTeamTimer = () => {
    socket.emit("team-timer-pause");
  };

  const handleResetTeamTimer = () => {
    socket.emit("team-timer-reset");
  };

  const handleCreateCustomTimer = (e) => {
    e.preventDefault();
    const mins = parseInt(customMinutes || "0", 10);
    const hrs = parseInt(customHours || "0", 10);
    const total = hrs * 3600 + mins * 60;
    if (total <= 0) return;

    const newTimer = {
      id: Date.now(),
      title: customTitle.trim() || `Focus Session (${mins}m)`,
      duration: total,
    };

    setSavedCustomTimers([...savedCustomTimers, newTimer]);
    setCustomTitle("");
    setCustomHours("");
    setCustomMinutes("25");

    loadPersonalTimer(newTimer.title, newTimer.duration);
  };

  const loadPersonalTimer = (title, duration) => {
    setTimerTitle(title);
    setPersonalTotal(duration);
    setPersonalSeconds(duration);
    setIsPersonalRunning(false);
    setAlarmActive(false);
  };

  const deleteCustomTimer = (id) => {
    setSavedCustomTimers(savedCustomTimers.filter((t) => t.id !== id));
  };

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const currentTotal = activeTab === "team" ? teamTimer.duration : personalTotal || 1;
  const currentRemaining = activeTab === "team" ? teamTimer.remaining : personalSeconds;
  const strokeDashoffset = circumference - (currentRemaining / currentTotal) * circumference;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1e080d] flex flex-col pt-15 font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#e6dfd5]">
          <div>
            <h1 className="text-xl font-bold text-[#1e080d] flex items-center gap-2">
              <FiClock className="w-5 h-5 text-[#701124]" /> Focus & Co-Working Timers
            </h1>
            <p className="text-xs text-[#5e484c] mt-0.5">
              Live synchronized team sprints, custom intervals, and ergonomic work-rest cycles
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#ffffff] border border-[#e6dfd5] rounded-lg">
            <button
              onClick={() => setActiveTab("team")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "team"
                  ? "bg-[#701124] text-white"
                  : "text-[#5e484c] hover:bg-[#f6f3ed]"
              }`}
            >
              <FiUsers className="w-3.5 h-3.5" /> Team Sprint
            </button>
            <button
              onClick={() => {
                setActiveTab("custom");
                loadPersonalTimer("Custom Focus Session", 25 * 60);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === "custom"
                  ? "bg-[#701124] text-white"
                  : "text-[#5e484c] hover:bg-[#f6f3ed]"
              }`}
            >
              <FiPlus className="w-3.5 h-3.5" /> Custom
            </button>
            <button
              onClick={() => {
                setActiveTab("pomodoro");
                loadPersonalTimer("Pomodoro Focus (25m)", 25 * 60);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "pomodoro"
                  ? "bg-[#701124] text-white"
                  : "text-[#5e484c] hover:bg-[#f6f3ed]"
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => {
                setActiveTab("workRest");
                setIsWorkSession(true);
                loadPersonalTimer("Work Session (52m)", 52 * 60);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "workRest"
                  ? "bg-[#701124] text-white"
                  : "text-[#5e484c] hover:bg-[#f6f3ed]"
              }`}
            >
              52/17 Interval
            </button>
            <button
              onClick={() => setActiveTab("stopwatch")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "stopwatch"
                  ? "bg-[#701124] text-white"
                  : "text-[#5e484c] hover:bg-[#f6f3ed]"
              }`}
            >
              Stopwatch
            </button>
          </div>
        </div>

        {/* Alarm Banner */}
        {alarmActive && (
          <div className="bg-[#feeae2] border border-[#f8bfae] text-[#ea6541] p-3.5 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 font-semibold">
              <FiBell className="w-4 h-4 text-[#ea6541]" />
              <span>Interval Complete — Take a short break, stretch, and hydrate.</span>
            </div>
            <button
              onClick={() => setAlarmActive(false)}
              className="px-3 py-1 bg-[#ffffff] border border-[#f8bfae] text-[#ea6541] font-semibold rounded hover:bg-[#fcfbf9] transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Timer Display (Left 2 Columns) */}
          <div className="lg:col-span-2 bg-[#ffffff] border border-[#e6dfd5] rounded-lg p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center relative">
            <div className="text-center mb-4">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#701124] bg-[#faeef0] px-2.5 py-0.5 rounded border border-[#f4cfd5]">
                {activeTab === "team"
                  ? "Synchronized Team Co-Focus"
                  : activeTab === "workRest"
                  ? isWorkSession
                    ? "Work Interval (52m)"
                    : "Recharge Interval (17m)"
                  : activeTab === "stopwatch"
                  ? "Continuous Stopwatch"
                  : timerTitle}
              </span>
              <h2 className="text-lg font-bold text-[#1e080d] mt-2">
                {activeTab === "team" ? teamTimer.title : timerTitle}
              </h2>
            </div>

            {/* Circular Timer Ring */}
            <div className="relative w-64 h-64 my-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  stroke="#feeae2"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r={radius}
                  stroke="#701124"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-mono font-bold tracking-tight text-[#1e080d]">
                  {activeTab === "stopwatch"
                    ? formatTime(stopwatchSeconds)
                    : formatTime(currentRemaining)}
                </span>
                <span className="text-[11px] text-[#5e484c] mt-1 font-medium">
                  {activeTab === "team"
                    ? teamTimer.running
                      ? "Synchronizing Live"
                      : "Paused"
                    : isPersonalRunning
                    ? "Active Focus"
                    : "Ready"}
                </span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              {activeTab === "team" ? (
                <>
                  {!teamTimer.running ? (
                    <button
                      onClick={() => handleStartTeamTimer(25)}
                      className="px-5 py-2.5 bg-[#701124] hover:bg-[#560b1b] text-white font-semibold rounded-md text-xs flex items-center gap-1.5 transition shadow-xs"
                    >
                      <FiPlay className="w-3.5 h-3.5 fill-current" /> Start Team Sprint
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseTeamTimer}
                      className="px-5 py-2.5 bg-[#ea6541] hover:bg-[#d65634] text-white font-semibold rounded-md text-xs flex items-center gap-1.5 transition shadow-xs"
                    >
                      <FiPause className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}
                  <button
                    onClick={handleResetTeamTimer}
                    className="p-2.5 bg-[#fcfbf9] hover:bg-[#f6f3ed] text-[#5e484c] rounded-md transition border border-[#d9cdc1]"
                  >
                    <FiRotateCcw className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : activeTab === "stopwatch" ? (
                <>
                  {!isStopwatchRunning ? (
                    <button
                      onClick={() => setIsStopwatchRunning(true)}
                      className="px-5 py-2.5 bg-[#701124] hover:bg-[#560b1b] text-white font-semibold rounded-md text-xs flex items-center gap-1.5 transition shadow-xs"
                    >
                      <FiPlay className="w-3.5 h-3.5 fill-current" /> Start Stopwatch
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsStopwatchRunning(false)}
                      className="px-5 py-2.5 bg-[#ea6541] hover:bg-[#d65634] text-white font-semibold rounded-md text-xs flex items-center gap-1.5 transition shadow-xs"
                    >
                      <FiPause className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsStopwatchRunning(false);
                      setStopwatchSeconds(0);
                    }}
                    className="p-2.5 bg-[#fcfbf9] hover:bg-[#f6f3ed] text-[#5e484c] rounded-md transition border border-[#d9cdc1]"
                  >
                    <FiRotateCcw className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  {!isPersonalRunning ? (
                    <button
                      onClick={() => {
                        soundManager.playDing();
                        setIsPersonalRunning(true);
                      }}
                      className="px-5 py-2.5 bg-[#701124] hover:bg-[#560b1b] text-white font-semibold rounded-md text-xs flex items-center gap-1.5 transition shadow-xs"
                    >
                      <FiPlay className="w-3.5 h-3.5 fill-current" /> Start Timer
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPersonalRunning(false)}
                      className="px-5 py-2.5 bg-[#ea6541] hover:bg-[#d65634] text-white font-semibold rounded-md text-xs flex items-center gap-1.5 transition shadow-xs"
                    >
                      <FiPause className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsPersonalRunning(false);
                      setPersonalSeconds(personalTotal);
                    }}
                    className="p-2.5 bg-[#fcfbf9] hover:bg-[#f6f3ed] text-[#5e484c] rounded-md transition border border-[#d9cdc1]"
                  >
                    <FiRotateCcw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pt-5 border-t border-[#f0e8dc] w-full text-xs">
              <span className="text-[#8a7377] font-medium mr-1">Presets:</span>
              <button
                onClick={() => {
                  if (activeTab === "team") handleStartTeamTimer(15, "15m Standup");
                  else loadPersonalTimer("15-Minute Standup", 15 * 60);
                }}
                className="px-2.5 py-1 rounded bg-[#f6f3ed] hover:bg-[#faeef0] text-[#701124] font-medium transition"
              >
                15m Standup
              </button>
              <button
                onClick={() => {
                  if (activeTab === "team") handleStartTeamTimer(25, "Pomodoro Focus");
                  else loadPersonalTimer("Pomodoro Focus", 25 * 60);
                }}
                className="px-2.5 py-1 rounded bg-[#f6f3ed] hover:bg-[#faeef0] text-[#701124] font-medium transition"
              >
                25m Pomodoro
              </button>
              <button
                onClick={() => {
                  if (activeTab === "team") handleStartTeamTimer(45, "Deep Work Sprint");
                  else loadPersonalTimer("Deep Work Sprint", 45 * 60);
                }}
                className="px-2.5 py-1 rounded bg-[#f6f3ed] hover:bg-[#faeef0] text-[#701124] font-medium transition"
              >
                45m Sprint
              </button>
              <button
                onClick={() => {
                  if (activeTab === "team") handleStartTeamTimer(60, "Power Hour");
                  else loadPersonalTimer("Power Hour", 60 * 60);
                }}
                className="px-2.5 py-1 rounded bg-[#f6f3ed] hover:bg-[#faeef0] text-[#701124] font-medium transition"
              >
                60m Hour
              </button>
            </div>
          </div>

          {/* Right Sidebar: Create & Manage Custom Timers */}
          <div className="space-y-5">
            {/* Create Timer Form */}
            <div className="bg-[#ffffff] border border-[#e6dfd5] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <h3 className="font-bold text-sm text-[#1e080d] mb-3">
                Create Custom Timer
              </h3>

              <form onSubmit={handleCreateCustomTimer} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#5e484c] block mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Design Review, Sprint Planning"
                    className="w-full px-3 py-2 bg-[#fcfbf9] border border-[#d9cdc1] rounded-md text-xs text-[#1e080d] placeholder-[#a69296] focus:outline-none focus:border-[#701124] focus:ring-1 focus:ring-[#701124]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-[#5e484c] block mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-[#fcfbf9] border border-[#d9cdc1] rounded-md text-xs text-[#1e080d] placeholder-[#a69296] focus:outline-none focus:border-[#701124] text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#5e484c] block mb-1">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="59"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      placeholder="25"
                      className="w-full px-3 py-2 bg-[#fcfbf9] border border-[#d9cdc1] rounded-md text-xs text-[#1e080d] placeholder-[#a69296] focus:outline-none focus:border-[#701124] text-center font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#701124] hover:bg-[#560b1b] text-white font-semibold rounded-md text-xs transition shadow-xs mt-1"
                >
                  Save & Load Timer
                </button>
              </form>
            </div>

            {/* Saved Custom Timers */}
            <div className="bg-[#ffffff] border border-[#e6dfd5] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <h3 className="font-semibold text-xs text-[#5e484c] uppercase tracking-wider mb-2.5">
                Saved Presets ({savedCustomTimers.length})
              </h3>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {savedCustomTimers.map((timer) => (
                  <div
                    key={timer.id}
                    onClick={() => {
                      setActiveTab("custom");
                      loadPersonalTimer(timer.title, timer.duration);
                    }}
                    className="p-2.5 bg-[#fcfbf9] border border-[#e6dfd5] hover:border-[#701124] rounded-md flex items-center justify-between cursor-pointer transition group"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-[#1e080d] group-hover:text-[#701124]">
                        {timer.title}
                      </h4>
                      <p className="text-[10px] font-mono text-[#5e484c]">
                        {formatTime(timer.duration)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomTimer(timer.id);
                        }}
                        className="p-1 text-[#8a7377] hover:text-[#701124] transition opacity-0 group-hover:opacity-100"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] text-[#701124] font-semibold opacity-0 group-hover:opacity-100 transition">
                        Select
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
