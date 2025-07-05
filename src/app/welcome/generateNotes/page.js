"use client";
import { useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";

export default function GenerateNotes() {
  const [syllabus, setSyllabus] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/generate",
        { syllabus },
        { responseType: "blob" }
      );

      const pdfBlob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (err) {
      alert("Failed to generate notes: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar/>
      <div className="min-h-screen p-10 bg-gray-100 text-black mt-[3.2rem]">
        <h1 className="text-3xl mb-6 font-bold">AI Notes Generator</h1>
        <textarea
          className="w-full h-40 p-4 border border-gray-300 rounded"
          value={syllabus}
          onChange={(e) => setSyllabus(e.target.value)}
          placeholder="Enter your syllabus topics (each on new line)"
        />
        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Notes"}
        </button>

        {pdfUrl && (
          <div className="mt-6">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline"
            >
              View or Download Notes PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
