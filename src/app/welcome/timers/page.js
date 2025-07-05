"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import PomodoroTimer from "@/components/pomodoro.js";
import WorkRestTimer from "@/components/workRestTimer.js";
import SimpleTimer from "@/components/simpleTimer.js";

const TIMER_TYPES = {
  pomodoro: "Pomodoro Timer",
  workRest: "Work / Rest Timer",
  simple: "Simple Timer",
};

export default function Timers() {
  const [selected, setSelected] = useState("pomodoro");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="flex mt-16 h-[calc(100vh-4rem)]">
        {/* Left Panel */}
        <div className="w-1/5 bg-gray-800 border-r border-gray-700 p-4 space-y-4">
          {Object.entries(TIMER_TYPES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`w-full text-left px-4 py-2 rounded ${
                selected === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right Panel */}
        <div className="w-4/5 flex items-center justify-center">
          {selected === "pomodoro" && <PomodoroTimer />}
          {selected === "workRest" && <WorkRestTimer />}
          {selected === "simple" && <SimpleTimer />}
        </div>
      </div>
    </div>
  );
}