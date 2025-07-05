"use client";
import { useState, useRef } from "react";
import axios from "axios";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import RotatingSphere from "@/components/RotatingSphere";
import Navbar from "@/components/Navbar";

export default function Chatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const sphereSpeed = useRef(0.01);

  const askAgent = async () => {
    if (!question.trim()) return;

    setLoading(true);
    sphereSpeed.current = 0.08;

    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setQuestion("");

    try {
      const res = await axios.post("http://localhost:5000/ask", {
        question,
      });

      setMessages([
        ...newMessages,
        { role: "assistant", content: res.data.response },
      ]);
    } catch (err) {
      console.log(err);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "⚠️ Error: Could not get response." },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
      sphereSpeed.current = 0.01;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-900 overflow-hidden">
      <Navbar />

      {/* Background Sphere */}
      <div className="fixed inset-0 -z-10">
        <Canvas className="w-full h-full" camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 2, 2]} />
          <RotatingSphere speedRef={sphereSpeed} />
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>

      {/* Chat Output Area */}
      <div className="pt-20 pr-4 pl-4 flex justify-end">
        <div className="w-full md:w-1/2 bg-white/70 backdrop-blur-md rounded-xl shadow-lg border p-6 min-h-[75vh] overflow-y-auto space-y-4">

          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-sm px-4 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-center text-gray-500 animate-pulse">Generating response...</div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Input at Bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t p-4 z-20">
        <div className="flex max-w-4xl mx-auto gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askAgent()}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={askAgent}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
