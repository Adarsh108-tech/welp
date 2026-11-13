"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiLayout,
  FiClock,
  FiMessageSquare,
  FiFileText,
  FiCpu,
  FiVolume2,
  FiVolumeX,
  FiLogOut,
  FiChevronDown,
  FiMenu,
  FiX,
  FiCheck,
  FiCircle,
} from "react-icons/fi";
import { soundManager } from "@/lib/soundFx";
import { socket } from "@/socket";
import axios from "axios";

const STATUS_OPTIONS = [
  { label: "Available", statusDot: "bg-emerald-600" },
  { label: "Deep Focus", statusDot: "bg-[#701124]" },
  { label: "On Break", statusDot: "bg-[#ea6541]" },
  { label: "In Meeting", statusDot: "bg-sky-600" },
  { label: "Away", statusDot: "bg-amber-500" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("Available");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [ambientActive, setAmbientActive] = useState(null);
  const [ambientMenuOpen, setAmbientMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef(null);
  const statusRef = useRef(null);
  const ambientRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        if (parsed.status) setCurrentStatus(parsed.status);
        socket.emit("office-enter", parsed);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusMenuOpen(false);
      }
      if (ambientRef.current && !ambientRef.current.contains(e.target)) {
        setAmbientMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (status) => {
    setCurrentStatus(status);
    setStatusMenuOpen(false);

    if (user) {
      const updatedUser = { ...user, status };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      socket.emit("status-update", {
        userId: user._id,
        status,
      });

      try {
        await axios.post("/api/users/status", {
          userId: user._id,
          status,
        });
      } catch (e) {}
    }
  };

  const handleAmbientToggle = (type) => {
    if (ambientActive === type) {
      soundManager.stopAmbient();
      setAmbientActive(null);
    } else {
      soundManager.startAmbient(type, 0.2);
      setAmbientActive(type);
    }
    setAmbientMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    soundManager.stopAmbient();
    router.push("/");
  };

  const navLinks = [
    { href: "/welcome/office", label: "Workspace", icon: FiLayout },
    { href: "/welcome/dashboard", label: "Dashboard", icon: FiCheck },
    { href: "/welcome/timers", label: "Focus Timers", icon: FiClock },
    { href: "/welcome/groups", label: "Team Chat", icon: FiMessageSquare },
    { href: "/welcome/generateNotes", label: "Documents", icon: FiFileText },
    { href: "/welcome/chatbot", label: "Assistant", icon: FiCpu },
  ];

  const currentStatusObj =
    STATUS_OPTIONS.find((s) => s.label === currentStatus) || STATUS_OPTIONS[0];

  return (
    <nav className="w-full bg-[#ffffff] border-b border-[#e6dfd5] text-[#1e080d] fixed top-0 left-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Brand Logo */}
          <Link href="/welcome/office" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#701124] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs group-hover:bg-[#560b1b] transition">
              W
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold tracking-tight text-[#1e080d]">
                Welp
              </span>
              <span className="text-[11px] font-medium text-[#701124] tracking-wide uppercase">
                Workplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#faeef0] text-[#701124] font-semibold border border-[#f4cfd5]"
                      : "text-[#5e484c] hover:text-[#1e080d] hover:bg-[#f6f3ed]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#701124]" : "text-[#8a7377]"}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Controls: Ambient sound, Status selector, User Profile */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Ambient Sound Controller */}
            <div className="relative" ref={ambientRef}>
              <button
                onClick={() => setAmbientMenuOpen(!ambientMenuOpen)}
                className={`px-2.5 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition ${
                  ambientActive
                    ? "bg-[#feeae2] border-[#f8bfae] text-[#ea6541]"
                    : "bg-[#fcfbf9] border-[#e6dfd5] text-[#5e484c] hover:border-[#d4c8ba]"
                }`}
              >
                {ambientActive ? (
                  <>
                    <FiVolume2 className="w-3.5 h-3.5" />
                    <span className="capitalize">{ambientActive}</span>
                  </>
                ) : (
                  <>
                    <FiVolumeX className="w-3.5 h-3.5 text-[#8a7377]" />
                    <span>Ambience</span>
                  </>
                )}
              </button>

              {ambientMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-[#ffffff] border border-[#e6dfd5] rounded-lg shadow-lg p-1.5 z-50 space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8a7377] uppercase tracking-wider">
                    Audio Backdrop
                  </div>
                  <button
                    onClick={() => handleAmbientToggle("rain")}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition ${
                      ambientActive === "rain"
                        ? "bg-[#701124] text-white"
                        : "text-[#1e080d] hover:bg-[#f6f3ed]"
                    }`}
                  >
                    <span>Rainfall</span>
                    {ambientActive === "rain" && <span className="text-[10px]">On</span>}
                  </button>
                  <button
                    onClick={() => handleAmbientToggle("cafe")}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition ${
                      ambientActive === "cafe"
                        ? "bg-[#701124] text-white"
                        : "text-[#1e080d] hover:bg-[#f6f3ed]"
                    }`}
                  >
                    <span>Cafe Ambience</span>
                    {ambientActive === "cafe" && <span className="text-[10px]">On</span>}
                  </button>
                  <button
                    onClick={() => handleAmbientToggle("whitenoise")}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition ${
                      ambientActive === "whitenoise"
                        ? "bg-[#701124] text-white"
                        : "text-[#1e080d] hover:bg-[#f6f3ed]"
                    }`}
                  >
                    <span>Focus Noise</span>
                    {ambientActive === "whitenoise" && <span className="text-[10px]">On</span>}
                  </button>
                  {ambientActive && (
                    <button
                      onClick={() => handleAmbientToggle(ambientActive)}
                      className="w-full text-center px-2 py-1 text-[11px] text-[#701124] hover:bg-[#faeef0] rounded mt-1 border-t border-[#f0e8dc]"
                    >
                      Turn Off
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#fcfbf9] border border-[#e6dfd5] hover:border-[#d4c8ba] text-xs text-[#1e080d] font-medium transition"
              >
                <span className={`w-2 h-2 rounded-full ${currentStatusObj.statusDot}`} />
                <span>{currentStatus}</span>
                <FiChevronDown className="w-3 h-3 text-[#8a7377]" />
              </button>

              {statusMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-[#ffffff] border border-[#e6dfd5] rounded-lg shadow-lg p-1.5 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8a7377] uppercase tracking-wider">
                    My Presence
                  </div>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleStatusChange(opt.label)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition ${
                        currentStatus === opt.label
                          ? "bg-[#faeef0] text-[#701124] font-semibold"
                          : "text-[#1e080d] hover:bg-[#f6f3ed]"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${opt.statusDot}`} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile & Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#e6dfd5]">
                <div className="w-7 h-7 rounded-md bg-[#701124] text-white font-semibold flex items-center justify-center text-xs">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-[#5e484c] hover:text-[#701124] hover:bg-[#f6f3ed] rounded transition"
                >
                  <FiLogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/"
                className="px-3.5 py-1.5 bg-[#701124] hover:bg-[#560b1b] text-white rounded-md text-xs font-semibold transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-[#1e080d] hover:bg-[#f6f3ed]"
            >
              {isOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div ref={menuRef} className="lg:hidden bg-[#ffffff] border-b border-[#e6dfd5] px-4 pt-2 pb-5 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition ${
                  isActive
                    ? "bg-[#faeef0] text-[#701124] font-semibold border border-[#f4cfd5]"
                    : "text-[#5e484c] hover:bg-[#f6f3ed]"
                }`}
              >
                <Icon className="w-4 h-4 text-[#701124]" />
                {link.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-[#e6dfd5] flex items-center justify-between text-xs">
            <span className="text-[#5e484c]">
              Signed in as <strong className="text-[#1e080d]">{user?.username || "Guest"}</strong>
            </span>
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-[#701124] font-semibold"
              >
                <FiLogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
