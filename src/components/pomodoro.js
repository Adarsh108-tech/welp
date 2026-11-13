"use client";
import { useState, useEffect, useRef } from "react";
import { FiPlay, FiPause, FiRotateCcw, FiX, FiBell } from "react-icons/fi";

export default function PomodoroTimer() {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showAlarm, setShowAlarm] = useState(false);
  const alarmRef = useRef(null);

  const totalSeconds =
    (parseInt(hours || "0") * 3600) + (parseInt(minutes || "0") * 60);

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
    setShowAlarm(true);
    if (alarmRef.current) {
      alarmRef.current.play();
    }
  };

  const startSession = () => {
    const total = totalSeconds;
    if (total <= 0) return;
    setSeconds(total);
    setIsRunning(true);
    setSessionStarted(true);
  };

  const reset = () => {
    setIsRunning(false);
    setSeconds(totalSeconds);
  };

  const endSession = () => {
    setIsRunning(false);
    setSessionStarted(false);
    setHours("");
    setMinutes("");
    setSeconds(0);
  };

  const stopAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
    setShowAlarm(false);
    endSession();
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progress = (seconds / (totalSeconds || 1)) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#ffffff] border border-[#ebdcd0] rounded-3xl shadow-sm text-wine-950 space-y-6 max-w-md mx-auto">
      <audio ref={alarmRef} src="/alarm.mp3" preload="auto" />
      <div className="text-center">
        <span className="text-[10px] uppercase tracking-wider font-bold text-burgundy-900 bg-peach-100 px-3 py-1 rounded-full border border-peach-300">
          Focus Session
        </span>
        <h2 className="text-2xl font-black text-burgundy-950 mt-2">
          Pomodoro Timer
        </h2>
      </div>

      {!sessionStarted ? (
        <div className="flex flex-col items-center space-y-4 w-full">
          <div className="flex gap-3 w-full">
            <input
              type="number"
              placeholder="Hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full bg-[#fcfbf9] border border-[#dfd2c4] text-burgundy-950 text-center p-3 rounded-xl focus:outline-none focus:border-burgundy-700 text-sm font-semibold"
            />
            <input
              type="number"
              placeholder="Minutes"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full bg-[#fcfbf9] border border-[#dfd2c4] text-burgundy-950 text-center p-3 rounded-xl focus:outline-none focus:border-burgundy-700 text-sm font-semibold"
            />
          </div>
          <button
            onClick={startSession}
            disabled={totalSeconds <= 0}
            className="w-full bg-burgundy-800 hover:bg-burgundy-900 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
          >
            <FiPlay className="w-3.5 h-3.5 text-peach-300" />
            <span>Start Session</span>
          </button>
        </div>
      ) : (
        <>
          <div className="relative w-56 h-56">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="#f3ece4"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="#701124"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-mono font-bold text-burgundy-950">
                {formatTime(seconds)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {!isRunning ? (
              <button
                onClick={() => setIsRunning(true)}
                className="bg-burgundy-800 hover:bg-burgundy-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <FiPlay className="w-3.5 h-3.5 text-peach-300" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="bg-[#f7f2ea] hover:bg-peach-100 text-burgundy-950 border border-[#dfd2c4] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
              >
                <FiPause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}
            <button
              onClick={reset}
              className="bg-[#f7f2ea] hover:bg-peach-100 text-burgundy-950 border border-[#dfd2c4] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={endSession}
              className="bg-wine-100 hover:bg-wine-200 text-burgundy-950 border border-wine-300 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <FiX className="w-3.5 h-3.5" />
              <span>End</span>
            </button>
          </div>
        </>
      )}

      {showAlarm && (
        <div className="fixed inset-0 bg-burgundy-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#ffffff] border border-[#ebdcd0] rounded-3xl p-6 text-center shadow-xl max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-peach-100 border border-peach-300 flex items-center justify-center mx-auto text-burgundy-800">
              <FiBell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-burgundy-950">Time&apos;s Up</h3>
            <p className="text-xs text-wine-900/70 font-medium">Your focus session has completed.</p>
            <button
              onClick={stopAlarm}
              className="w-full bg-burgundy-800 hover:bg-burgundy-900 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
