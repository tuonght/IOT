import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

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
