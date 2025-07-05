"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-xl font-semibold text-blue-600">Welp</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6 text-sm md:text-base font-medium">
          <Link href="/welcome/chatbot/" className="text-gray-700 hover:text-blue-600 transition">
            Chatbot
          </Link>
          <Link href="/welcome/dashboard/" className="text-gray-700 hover:text-blue-600 transition">
            Dashboard
          </Link>
          <Link href="/welcome/generateNotes/" className="text-gray-700 hover:text-blue-600 transition">
            Generate Notes
          </Link>
          <Link href="/welcome/groups/" className="text-gray-700 hover:text-blue-600 transition">
            Groups
          </Link>
          <Link href="/welcome/timers/" className="text-gray-700 hover:text-blue-600 transition">
            Timers
          </Link>
        </div>

        {/* Hamburger Icon for Mobile */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-gray-700 focus:outline-none">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div ref={menuRef} className="md:hidden bg-white shadow-md px-4 py-4 space-y-3 font-medium">
          <Link href="/welcome/chatbot/" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
            Chatbot
          </Link>
          <Link href="/welcome/dashboard/" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/welcome/generateNotes/" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
            Generate Notes
          </Link>
          <Link href="/welcome/tasks/" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
            Tasks
          </Link>
          <Link href="/welcome/timers/" onClick={closeMenu} className="block text-gray-700 hover:text-blue-600">
            Timers
          </Link>
        </div>
      )}
    </nav>
  );
}
