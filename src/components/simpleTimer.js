"use client";
import { useState, useEffect } from "react";
import { FiPlay, FiPause, FiRotateCcw } from "react-icons/fi";

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
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progress = ((seconds % 3600) / 3600) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#ffffff] border border-[#ebdcd0] rounded-3xl shadow-sm text-wine-950 space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <span className="text-[10px] uppercase tracking-wider font-bold text-burgundy-900 bg-peach-100 px-3 py-1 rounded-full border border-peach-300">
          Stopwatch
        </span>
        <h2 className="text-2xl font-black text-burgundy-950 mt-2">Simple Timer</h2>
      </div>

      {/* Circular Progress */}
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
            {format(seconds)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2">
        {!isRunning ? (
          <button
            onClick={() => setIsRunning(true)}
            className="bg-burgundy-800 hover:bg-burgundy-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition"
          >
            <FiPlay className="w-3.5 h-3.5 text-peach-300" />
            <span>Start</span>
          </button>
        ) : (
          <button
            onClick={() => setIsRunning(false)}
            className="bg-[#f7f2ea] hover:bg-peach-100 text-burgundy-950 border border-[#dfd2c4] text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
          >
            <FiPause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        )}
        <button
          onClick={reset}
          className="bg-wine-100 hover:bg-wine-200 text-burgundy-950 border border-wine-300 text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
        >
          <FiRotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
