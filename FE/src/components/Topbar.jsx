import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { mockProfile } from "../mockData";

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const username = mockProfile.username || "Nguyễn Tường";
  const initial = username.charAt(0).toUpperCase();

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    navigate("/login");
  }

  return (
    <div className="topbar" ref={dropdownRef}>
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
