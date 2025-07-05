"use client";
import { useState, useEffect, useRef } from "react";

export default function WorkRestTimer() {
  const [isWork, setIsWork] = useState(true);
  const [workHours, setWorkHours] = useState("");
  const [workMinutes, setWorkMinutes] = useState("");
  const [restHours, setRestHours] = useState("");
  const [restMinutes, setRestMinutes] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showAlarm, setShowAlarm] = useState(false);

  const alarmRef = useRef(null);

  const getCurrentSessionSeconds = () =>
    (parseInt(isWork ? workHours || "0" : restHours || "0") * 3600) +
    (parseInt(isWork ? workMinutes || "0" : restMinutes || "0") * 60);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s > 0) return s - 1;
        clearInterval(interval);
        handleTimeUp();
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleTimeUp = () => {
    setIsRunning(false);
    if (alarmRef.current) {
      alarmRef.current.play();
    }
    setShowAlarm(true);
  };

  const stopAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
    setShowAlarm(false);
    const nextSession = !isWork;
    setIsWork(nextSession);
    const nextTime = getCurrentSessionSeconds();
    if (nextTime > 0) {
      setSeconds(nextTime);
      setIsRunning(true);
    } else {
      setSessionStarted(false);
    }
  };

  const startSession = () => {
    const total = getCurrentSessionSeconds();
    if (total <= 0) return;
    setSeconds(total);
    setIsRunning(true);
    setSessionStarted(true);
  };

  const reset = () => {
    setIsRunning(false);
    setSeconds(getCurrentSessionSeconds());
  };

  const endSession = () => {
    setIsRunning(false);
    setSessionStarted(false);
    setIsWork(true);
    setSeconds(0);
    setWorkHours("");
    setWorkMinutes("");
    setRestHours("");
    setRestMinutes("");
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const totalSessionSeconds = getCurrentSessionSeconds() || 1;
  const progress = (seconds / totalSessionSeconds) * circumference;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white space-y-8 px-4 relative">
      <audio ref={alarmRef} src="/alarm.mp3" preload="auto" />
      <h2 className="text-4xl font-bold text-cyan-400 drop-shadow-lg tracking-wide">
        {isWork ? "💼 Work Session" : "😌 Rest Session"}
      </h2>

      {!sessionStarted ? (
        <div className="flex flex-col gap-6 max-w-md w-full">
          <div className="space-y-3">
            <h3 className="text-lg text-cyan-300 font-semibold">Set Work Time</h3>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Hours"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                className="w-full bg-[#1e293b] border border-cyan-500 text-white text-center p-3 rounded-md focus:ring-2 focus:ring-cyan-400"
              />
              <input
                type="number"
                placeholder="Minutes"
                value={workMinutes}
                onChange={(e) => setWorkMinutes(e.target.value)}
                className="w-full bg-[#1e293b] border border-cyan-500 text-white text-center p-3 rounded-md focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg text-cyan-300 font-semibold">Set Rest Time</h3>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Hours"
                value={restHours}
                onChange={(e) => setRestHours(e.target.value)}
                className="w-full bg-[#1e293b] border border-cyan-500 text-white text-center p-3 rounded-md focus:ring-2 focus:ring-cyan-400"
              />
              <input
                type="number"
                placeholder="Minutes"
                value={restMinutes}
                onChange={(e) => setRestMinutes(e.target.value)}
                className="w-full bg-[#1e293b] border border-cyan-500 text-white text-center p-3 rounded-md focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>

          <button
            onClick={startSession}
            className="bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-full shadow-lg text-black font-semibold tracking-wide"
          >
            Start Session
          </button>
        </div>
      ) : (
        <>
          <div className="relative w-60 h-60">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="#334155"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="#06b6d4"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-mono text-cyan-300 drop-shadow-md">
                {formatTime(seconds)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {!isRunning ? (
              <button
                onClick={() => setIsRunning(true)}
                className="bg-green-500 px-6 py-2 rounded-full hover:bg-green-600 text-black font-semibold shadow"
              >
                ▶️ Resume
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="bg-yellow-400 px-6 py-2 rounded-full hover:bg-yellow-500 text-black font-semibold shadow"
              >
                ⏸️ Pause
              </button>
            )}
            <button
              onClick={reset}
              className="bg-purple-500 px-6 py-2 rounded-full hover:bg-purple-600 text-white font-semibold shadow"
            >
              🔄 Reset
            </button>
            <button
              onClick={endSession}
              className="bg-red-600 px-6 py-2 rounded-full hover:bg-red-700 text-white font-semibold shadow"
            >
              ❌ End Session
            </button>
          </div>
        </>
      )}

      {showAlarm && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-lg p-8 text-center shadow-xl max-w-sm w-full">
            <h3 className="text-2xl font-bold mb-4">⏰ Time's Up!</h3>
            <p className="mb-6">Your {isWork ? "work" : "rest"} session has ended.</p>
            <button
              onClick={stopAlarm}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-semibold shadow"
            >
              Stop Alarm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
