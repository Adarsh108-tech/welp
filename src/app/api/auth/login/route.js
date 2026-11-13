import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const safeUser = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    const token = signToken({
      userId: safeUser._id,
      username: safeUser.username,
      email: safeUser.email,
    });

    const response = NextResponse.json({
      token,
      user: safeUser,
    });

    // Set cookie for SSR / session authentication
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to login" },
      { status: 500 }
    );
  }
}
