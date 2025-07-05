"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // for signup
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        // Login
        const res = await axios.post("http://localhost:5000/api/auth/login", {
          email,
          password,
        });

        localStorage.setItem("user", JSON.stringify(res.data.user));
        router.push("/welcome/dashboard");
      } else {
        // Signup
        await axios.post("http://localhost:5000/api/auth/register", {
          username,
          email,
          password,
        });

        setIsLogin(true); // After registration, switch to login
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-red-100 text-gray-800 px-4">
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden bg-white/30 backdrop-blur-md">
        {/* Left Section */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center gap-6 bg-white/60">
          <h1 className="text-4xl font-extrabold text-blue-600 mb-4">Get Started</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="p-3 rounded-md bg-white shadow-inner border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="p-3 rounded-md bg-white shadow-inner border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="p-3 rounded-md bg-white shadow-inner border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className={`${
                isLogin ? "bg-blue-600 hover:bg-blue-700" : "bg-red-500 hover:bg-red-600"
              } text-white font-bold py-2 rounded-md transition`}
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <p className="text-sm text-gray-600 text-center">
              {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setUsername("");
                  setEmail("");
                  setPassword("");
                }}
                className="text-blue-600 underline"
              >
                {isLogin ? "Sign up" : "Login"}
              </button>
            </p>
          </form>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/2 p-10 bg-gradient-to-br from-blue-500 to-red-500 text-white flex flex-col justify-center items-center text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
            <span className="text-3xl font-bold text-blue-600">WP</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome to Welp</h2>
          <p className="text-lg max-w-md">
            We bring futuristic solutions to your fingertips. Sign up or log in to explore what we
            have to offer and join the journey of innovation.
          </p>
        </div>
      </div>
    </main>
  );
}
