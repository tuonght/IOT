import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "../api";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const [session, setSession] = useState("checking");

  useEffect(() => {
    let mounted = true;
    api.currentSession()
      .then((user) => {
        if (!mounted) return;
        localStorage.setItem("email", user.email);
        localStorage.setItem("username", user.username);
        setSession("authenticated");
      })
      .catch(() => {
        if (!mounted) return;
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("email");
        localStorage.removeItem("username");
        setSession("unauthenticated");
      });
    return () => { mounted = false; };
  }, []);

  if (session === "checking") {
    return <div className="page-title">Đang kiểm tra phiên đăng nhập...</div>;
  }
  if (session !== "authenticated") return <Navigate to="/login" replace />;

  return (
    // app-shell là khung flex chung chứa Sidebar và phần nội dung bên phải.
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">
          {/* Router thay Outlet bằng trang con đúng với URL hiện tại. */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}
