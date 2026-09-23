import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // Nếu chưa đăng nhập, đá thẳng về trang Login — không cho xem 4 trang bên trong
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">
          <Outlet /> {/* đây là nơi Dashboard/DataSensor/History/Profile được render vào */}
        </div>
      </div>
    </div>
  );
}
