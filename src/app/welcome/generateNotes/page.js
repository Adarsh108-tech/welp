"use client";
import { useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { soundManager } from "@/lib/soundFx";
import {
  FiFileText,
  FiDownload,
  FiCheckCircle,
  FiExternalLink,
  FiArrowRight,
  FiLoader,
  FiClipboard,
  FiLayers,
  FiBookOpen,
} from "react-icons/fi";

const TEMPLATES = [
  {
    title: "Meeting Minutes",
    icon: FiClipboard,
    desc: "Action items, key decisions & discussion points",
    content: "Project Kickoff Meeting\nSprint Goal & Milestones\nArchitecture Decisions\nAssigned Action Items",
  },
  {
    title: "Sprint Planning",
    icon: FiLayers,
    desc: "Sprint objectives, user stories & deliverables",
    content: "Sprint 14 Objectives\nFrontend Refactor & UI Improvements\nBackend Integration with Next.js\nTesting & Deployment Plan",
  },
  {
    title: "Study Guide",
    icon: FiBookOpen,
    desc: "Detailed topic breakdowns for study and review",
    content: "Binary Search Trees\nMerge Sort and Quick Sort Algorithms\nDynamic Programming Fundamentals\nGraph Traversal DFS and BFS",
  },
  {
    title: "Architecture Spec",
    icon: FiFileText,
    desc: "System components, APIs & data flows",
    content: "Microservices Architecture\nAuthentication & JWT Security\nDatabase Modeling & MongoDB Schema\nRealtime WebSockets with Socket.IO",
  },
];

export default function GenerateNotes() {
  const [syllabus, setSyllabus] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedDocName, setGeneratedDocName] = useState("");

  const handleSubmit = async () => {
    if (!syllabus.trim()) return;

    soundManager.playDing();
    setLoading(true);
    setPdfUrl(null);

    try {
      const res = await axios.post(
        "/api/generate",
        { syllabus },
        { responseType: "blob" }
      );

      const pdfBlob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setGeneratedDocName(`Office_Notes_${Date.now().toString().slice(-4)}.pdf`);
      soundManager.playBell();
    } catch (err) {
      alert("Failed to generate document: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (templateContent) => {
    setSyllabus(templateContent);
    setPdfUrl(null);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-wine-950 flex flex-col pt-16">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-[#ebdcd0]">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-burgundy-900 bg-peach-100 px-3 py-1 rounded-full border border-peach-300">
              Document Studio
            </span>
          </div>
          <h1 className="text-3xl font-black text-burgundy-950 mt-2 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-peach-100 text-burgundy-900">
              <FiFileText className="w-6 h-6" />
            </span>
            <span>Document & Note Generator</span>
          </h1>
          <p className="text-xs text-wine-900/70 mt-1 font-medium">
            Transform meeting agendas, sprint specs, and study outlines into structured, high-resolution PDF documents
          </p>
        </div>

        {/* Template Selector Grid */}
        <div>
          <span className="text-xs uppercase font-bold text-wine-900/60 tracking-wider block mb-3">
            Quick Document Templates
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((tmpl, idx) => {
              const Icon = tmpl.icon;
              return (
                <button
                  key={idx}
                  onClick={() => applyTemplate(tmpl.content)}
                  className="p-5 rounded-3xl bg-[#ffffff] border border-[#ebdcd0] hover:border-peach-400 hover:bg-peach-50/40 text-left transition group shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#f7f2ea] group-hover:bg-peach-100 text-burgundy-900 flex items-center justify-center mb-3 transition">
                    <Icon className="w-4 h-4 text-burgundy-800" />
                  </div>
                  <h3 className="font-bold text-sm text-burgundy-950 group-hover:text-burgundy-800 transition">
                    {tmpl.title}
                  </h3>
                  <p className="text-xs text-wine-900/70 mt-1 leading-relaxed">
                    {tmpl.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] text-burgundy-800 font-bold opacity-0 group-hover:opacity-100 transition">
                    <span>Use Template</span>
                    <FiArrowRight className="w-3 h-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input & Output Studio Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Editor (2 Cols) */}
          <div className="lg:col-span-2 bg-[#ffffff] border border-[#ebdcd0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-burgundy-950 flex items-center gap-2">
                <span>Topics or Agenda Items</span>
              </label>
              <span className="text-[11px] text-wine-900/50 font-medium">One topic or bullet per line</span>
            </div>

            <textarea
              className="w-full h-64 p-4 bg-[#fcfbf9] border border-[#dfd2c4] rounded-2xl text-xs text-burgundy-950 placeholder-wine-900/40 focus:outline-none focus:border-burgundy-700 font-mono leading-relaxed resize-none shadow-xs"
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              placeholder={`Enter topics or agenda items, each on a new line:\n\n1. Project Overview & Deliverables\n2. Key Architecture Decisions\n3. Action Items and Next Steps`}
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-wine-900/50 font-medium">
                {syllabus.split("\n").filter((t) => t.trim()).length} topics identified
              </span>

              <button
                className="px-6 py-3 bg-burgundy-800 hover:bg-burgundy-900 disabled:opacity-40 text-white font-bold rounded-2xl text-xs transition flex items-center gap-2 shadow-xs"
                onClick={handleSubmit}
                disabled={loading || !syllabus.trim()}
              >
                {loading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin text-peach-300" />
                    <span>Compiling Document...</span>
                  </>
                ) : (
                  <>
                    <FiFileText className="w-4 h-4 text-peach-300" />
                    <span>Generate Structured PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Preview & Download Card */}
          <div className="bg-[#ffffff] border border-[#ebdcd0] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-[#ebdcd0] mb-6">
                <FiCheckCircle className="w-5 h-5 text-burgundy-800" />
                <h3 className="font-black text-sm text-burgundy-950">Document Status</h3>
              </div>

              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-peach-100 border border-peach-300 flex items-center justify-center text-burgundy-800">
                    <FiLoader className="w-6 h-6 animate-spin text-burgundy-800" />
                  </div>
                  <h4 className="font-bold text-sm text-burgundy-950">Generating Notes & Tables</h4>
                  <p className="text-xs text-wine-900/60 max-w-xs font-medium">
                    Structuring topics with AI and compiling with custom NotoSans vector fonts...
                  </p>
                </div>
              ) : pdfUrl ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-peach-100 border border-peach-300 text-burgundy-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <FiCheckCircle className="w-4 h-4 text-burgundy-800" />
                      <span>Ready for Download</span>
                    </div>
                    <p className="text-[11px] text-wine-900/80 leading-relaxed font-medium">
                      Your document has been compiled into a high-resolution vector PDF.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fcfbf9] border border-[#dfd2c4] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-wine-900/50">Document Name</span>
                    <p className="text-xs font-mono font-bold text-burgundy-950 truncate">
                      {generatedDocName}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <a
                      href={pdfUrl}
                      download={generatedDocName}
                      className="w-full py-3 bg-burgundy-800 hover:bg-burgundy-900 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <FiDownload className="w-4 h-4 text-peach-300" />
                      <span>Download PDF</span>
                    </a>

                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-[#f7f2ea] hover:bg-peach-100 text-burgundy-950 rounded-2xl text-xs font-bold text-center transition border border-[#dfd2c4] flex items-center justify-center gap-1.5"
                    >
                      <span>Preview in New Tab</span>
                      <FiExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#f7f2ea] flex items-center justify-center text-wine-400">
                    <FiFileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-xs text-wine-900/60">No Document Generated Yet</h4>
                  <p className="text-[11px] text-wine-900/50 max-w-xs font-medium">
                    Select a template or input topics on the left, then click "Generate Structured PDF".
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#ebdcd0] text-[11px] text-wine-900/50 font-medium">
              Formatted with custom NotoSans vector fonts and structured tables
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
