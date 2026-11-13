"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import RotatingSphere from "@/components/RotatingSphere";
import Navbar from "@/components/Navbar";
import { soundManager } from "@/lib/soundFx";
import {
  FiCpu,
  FiSend,
  FiRotateCcw,
  FiCopy,
  FiCheck,
  FiCalendar,
  FiMail,
  FiActivity,
  FiTarget,
  FiLoader,
} from "react-icons/fi";

const QUICK_PROMPTS = [
  { label: "Standup Agenda", icon: FiCalendar, prompt: "Draft a concise 15-minute daily standup agenda for a remote engineering and design team." },
  { label: "Follow-up Email", icon: FiMail, prompt: "Write a polite, professional email following up on a pending project review." },
  { label: "Ergonomics Stretches", icon: FiActivity, prompt: "Give me 4 quick 1-minute ergonomics stretches I can do right now at my desk." },
  { label: "Deep Focus Plan", icon: FiTarget, prompt: "I am feeling distracted while working from home. Give me a 3-step action plan to enter deep focus." },
];

export default function Chatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your Welp AI Office Co-Worker. I can help you draft emails, structure meeting notes, outline deliverables, and keep your remote workday productive. What are you working on today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const sphereSpeed = useRef(0.01);
  const chatScrollRef = useRef(null);

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const askAgent = async (overridePrompt) => {
    const query = overridePrompt || question;
    if (!query.trim()) return;

    soundManager.playDing();
    setLoading(true);
    sphereSpeed.current = 0.08;

    const newMessages = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    if (!overridePrompt) setQuestion("");

    try {
      const res = await axios.post("/api/ask", {
        question: query,
      });

      setMessages([
        ...newMessages,
        { role: "assistant", content: res.data.response },
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Unable to reach the AI service at this moment. Please check your connection or try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
      sphereSpeed.current = 0.01;
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Conversation cleared. How can I assist you with your workday?",
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-wine-950 flex flex-col pt-16 relative overflow-hidden">
      <Navbar />

      {/* 3D Sphere Canvas in Background */}
      <div className="fixed inset-0 z-0 opacity-25 pointer-events-none">
        <Canvas className="w-full h-full" camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 2, 2]} />
          <RotatingSphere speedRef={sphereSpeed} />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      {/* Main Chat Interface */}
      <main className="max-w-4xl mx-auto w-full flex-1 px-4 sm:px-6 py-6 flex flex-col z-10 relative">
        <div className="flex-1 bg-[#ffffff]/95 border border-[#ebdcd0] rounded-3xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-7rem)]">
          {/* Header */}
          <div className="p-4 px-6 border-b border-[#ebdcd0] bg-[#ffffff] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-peach-100 border border-peach-300 flex items-center justify-center text-burgundy-900 shadow-xs">
                <FiCpu className="w-5 h-5 text-burgundy-800" />
              </div>
              <div>
                <h2 className="text-sm font-black text-burgundy-950 flex items-center gap-2">
                  <span>Welp AI Office Co-Worker</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-peach-100 text-burgundy-900 border border-peach-300 font-bold">
                    Online
                  </span>
                </h2>
                <p className="text-[11px] text-wine-900/60 font-medium">
                  Productivity assistant for remote teams
                </p>
              </div>
            </div>

            <button
              onClick={clearChat}
              title="Reset Conversation"
              className="p-2 rounded-xl bg-[#f7f2ea] hover:bg-peach-100 text-wine-900 hover:text-burgundy-950 text-xs font-bold transition flex items-center gap-1.5 border border-[#dfd2c4]"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-6 py-2.5 bg-[#faf6f0] border-b border-[#ebdcd0] flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] uppercase font-bold text-wine-900/60 tracking-wider whitespace-nowrap">
              Suggestions:
            </span>
            {QUICK_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => askAgent(item.prompt)}
                  disabled={loading}
                  className="px-3 py-1 bg-[#ffffff] hover:bg-peach-100 border border-[#dfd2c4] hover:border-peach-300 rounded-xl text-xs font-semibold text-burgundy-900 whitespace-nowrap transition flex items-center gap-1.5 shadow-xs"
                >
                  <Icon className="w-3.5 h-3.5 text-wine-700" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Message Stream */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-6 overflow-y-auto space-y-4 font-sans bg-[#fcfbf9]"
          >
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold text-wine-900/70">
                      {isUser ? "You" : "Welp AI"}
                    </span>
                  </div>

                  <div
                    className={`group relative max-w-xl px-5 py-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? "bg-burgundy-800 text-white rounded-br-xs shadow-xs"
                        : "bg-[#ffffff] text-burgundy-950 border border-[#dfd2c4] rounded-bl-xs shadow-xs font-medium"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {!isUser && (
                      <button
                        onClick={() => copyToClipboard(msg.content, i)}
                        className="absolute bottom-2 right-2 p-1 text-wine-400 hover:text-burgundy-900 rounded opacity-0 group-hover:opacity-100 transition"
                        title="Copy message"
                      >
                        {copiedIndex === i ? (
                          <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <FiCopy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-burgundy-900 text-xs py-2 px-3 bg-peach-100 border border-peach-300 rounded-xl w-fit font-bold">
                <FiLoader className="w-4 h-4 animate-spin text-burgundy-800" />
                <span>Generating response...</span>
              </div>
            )}
          </div>

          {/* Fixed Input at Bottom */}
          <div className="p-4 bg-[#ffffff] border-t border-[#ebdcd0]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && askAgent()}
                placeholder="Ask Welp AI for assistance, task planning, or drafts..."
                className="flex-1 px-4 py-3 bg-[#fcfbf9] border border-[#dfd2c4] rounded-xl text-xs text-burgundy-950 placeholder-wine-900/40 focus:outline-none focus:border-burgundy-700 shadow-xs"
              />
              <button
                onClick={() => askAgent()}
                disabled={loading || !question.trim()}
                className="px-6 py-3 bg-burgundy-800 hover:bg-burgundy-900 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <FiSend className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
