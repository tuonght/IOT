import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { mockProfile } from "../mockData";

export default function Topbar() {
  const [open, setOpen] = useState(false);
  // Ref trỏ tới Topbar để phân biệt click bên trong và bên ngoài menu.
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const username = mockProfile.username || "Nguyễn Tường";
  const initial = username.charAt(0).toUpperCase();

  // Đăng ký listener khi mount và gỡ listener khi unmount để tránh rò sự kiện.
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xóa cờ đăng nhập rồi chuyển về trang Login.
  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    navigate("/login");
  }

  return (
    <div className="topbar" ref={dropdownRef}>
      {/* Bấm chip tài khoản để bật/tắt menu. */}
      <div className="user-chip" onClick={() => setOpen(!open)}>
        {username}
        <div className="avatar">{initial}</div>
      </div>

      {open && (
        <div className="dropdown">
          <Link to="/change-password" className="dropdown-item" onClick={() => setOpen(false)}>
            Đổi mật khẩu
          </Link>
          <div className="dropdown-item danger" onClick={handleLogout}>
            Đăng xuất
          </div>
        </div>
      )}
    </div>
  );
}
