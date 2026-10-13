import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "../api";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const [authStatus, setAuthStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;
    api.currentUser()
      .then((user) => {
        if (!mounted) return;
        localStorage.setItem("email", user.email);
        localStorage.setItem("username", user.username);
        setAuthStatus("authenticated");
      })
      .catch(() => {
        if (!mounted) return;
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("authToken");
        localStorage.removeItem("email");
        localStorage.removeItem("username");
        setAuthStatus("unauthenticated");
      });
    return () => { mounted = false; };
  }, []);

  if (authStatus === "checking") {
    return <div className="page-title">Đang kiểm tra đăng nhập...</div>;
  }
  if (authStatus !== "authenticated") return <Navigate to="/login" replace />;

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
