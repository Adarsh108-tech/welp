"use client";
import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiMail,
  FiLock,
  FiUser,
} from "react-icons/fi";
import { soundManager } from "@/lib/soundFx";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post("/api/auth/login", {
          email,
          password,
        });

        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }
        soundManager.playDing();
        router.push("/welcome/office");
      } else {
        await axios.post("/api/auth/register", {
          username,
          email,
          password,
        });

        soundManager.playWave();
        setIsLogin(true);
        setError("Account created successfully. Please sign in.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Authentication failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfbf9] text-[#1e080d] flex flex-col justify-center items-center px-4 py-12 font-sans">
      <div className="w-full max-w-5xl bg-[#ffffff] border border-[#e6dfd5] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Overview Section (7 Columns) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-[#e6dfd5] bg-[#ffffff] space-y-6">
          {/* Company Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Welp Logo"
              width={48}
              height={38}
              className="h-11 w-auto rounded-lg shadow-xs object-contain"
              priority
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight text-[#1e080d]">
                Welp
              </span>
              <span className="text-xs font-semibold text-[#701124] tracking-wider uppercase">
                Workplace
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1e080d] leading-tight">
              A structured virtual office for distributed teams.
            </h1>

            <p className="text-sm sm:text-base text-[#5e484c] mt-4 leading-relaxed max-w-lg">
              Coordinate co-working desks, execute synchronized focus sprints, and keep your distributed team connected without meeting fatigue.
            </p>
          </div>
        </div>

        {/* Right Authentication Form (5 Columns) */}
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-center bg-[#faf8f5]">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#1e080d]">
              {isLogin ? "Sign In to Workspace" : "Create an Account"}
            </h2>
            <p className="text-xs text-[#5e484c] mt-1">
              {isLogin
                ? "Enter your credentials to enter your team office"
                : "Register with your name and email to join"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-[#1e080d] block mb-1">
                  Full Name / Username
                </label>
                <div className="relative">
                  <FiUser className="w-3.5 h-3.5 text-[#8a7377] absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Alex Rivera"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-[#ffffff] border border-[#d9cdc1] rounded-md text-xs text-[#1e080d] placeholder-[#a69296] focus:outline-none focus:border-[#701124] focus:ring-1 focus:ring-[#701124] shadow-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#1e080d] block mb-1">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="w-3.5 h-3.5 text-[#8a7377] absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-[#ffffff] border border-[#d9cdc1] rounded-md text-xs text-[#1e080d] placeholder-[#a69296] focus:outline-none focus:border-[#701124] focus:ring-1 focus:ring-[#701124] shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1e080d] block mb-1">
                Password
              </label>
              <div className="relative">
                <FiLock className="w-3.5 h-3.5 text-[#8a7377] absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-[#ffffff] border border-[#d9cdc1] rounded-md text-xs text-[#1e080d] placeholder-[#a69296] focus:outline-none focus:border-[#701124] focus:ring-1 focus:ring-[#701124] shadow-xs"
                />
              </div>
            </div>

            {error && (
              <div
                className={`p-2.5 rounded text-xs text-center font-medium ${
                  error.includes("successfully")
                    ? "bg-[#feeae2] text-[#ea6541] border border-[#f8bfae]"
                    : "bg-[#faeef0] text-[#701124] border border-[#f4cfd5]"
                }`}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#701124] hover:bg-[#560b1b] disabled:opacity-50 text-white font-semibold rounded-md text-xs transition flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Register Account"}</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-[#5e484c]">
                {isLogin ? "Don’t have an account yet?" : "Already registered?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="text-[#701124] hover:underline font-bold"
                >
                  {isLogin ? "Create one" : "Sign in"}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
