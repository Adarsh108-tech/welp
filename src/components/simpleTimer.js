"use client";
import { useState, useEffect } from "react";

export default function SimpleTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const reset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const format = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) % 3600 / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progress = (seconds % 3600) / 3600 * circumference; // 1 hour loop visual

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white space-y-8 px-4">
      <h2 className="text-4xl font-bold text-cyan-400 tracking-wide drop-shadow-lg">⏱ Simple Timer</h2>

      {/* Circular Progress */}
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
            stroke="#0ea5e9"
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
            {format(seconds)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {!isRunning && (
          <button
            onClick={() => setIsRunning(true)}
            className="bg-green-500 px-6 py-2 rounded-full hover:bg-green-600 text-black font-semibold shadow"
          >
            ▶️ Start
          </button>
        )}
        {isRunning && (
          <button
            onClick={() => setIsRunning(false)}
            className="bg-yellow-400 px-6 py-2 rounded-full hover:bg-yellow-500 text-black font-semibold shadow"
          >
            ⏸️ Pause
          </button>
        )}
        <button
          onClick={reset}
          className="bg-red-600 px-6 py-2 rounded-full hover:bg-red-700 text-white font-semibold shadow"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
