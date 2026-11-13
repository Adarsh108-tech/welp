import { io } from "socket.io-client";

const socketUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export const socket = io(socketUrl, {
  autoConnect: true,
});
