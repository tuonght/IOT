import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    // Thanh điều hướng trái; className active được thêm tự động cho route hiện tại.
    <div className="sidebar">
      {/* Tên/nhận diện của ứng dụng. */}
      <div className="brand">
        <div className="brand-mark">IoT</div>
        <div className="brand-name">IOT CONTROL</div>
      </div>

      {/* Mỗi NavLink ánh xạ một mục menu sang URL của trang. */}
      <NavLink to="/dashboard" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
        Dashboard
      </NavLink>
      <NavLink to="/data-sensor" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
        Data Sensor
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
        History
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
        My Profile
      </NavLink>
    </div>
  );
}
