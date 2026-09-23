import { useState } from "react";

export default function ChangePassword({ onBack, onLogout }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Xóa thông báo lỗi khi người dùng gõ lại
  }

  function handleSubmit(e) {
    e.preventDefault();

    // 1. Kiểm tra rỗng
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }

    // 2. Kiểm tra độ dài tối thiểu
    if (formData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    // 3. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
    if (formData.currentPassword === formData.newPassword) {
      setError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    // 4. Kiểm tra khớp mật khẩu xác nhận
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    // TODO: Khi nối API thật:
    // axios.post('/api/auth/change-password', formData)
    setSuccess(true);
    alert("Đổi mật khẩu thành công! Bạn cần đăng nhập lại.");

    // Tự động đăng xuất sau khi đổi pass thành công nếu muốn
    if (onLogout) {
      onLogout();
    }
  }

  return (
    <div style={{ maxWidth: "480px", margin: "40px auto", padding: "0 16px" }}>
      <div className="page-title" style={{ textAlign: "center", marginBottom: "24px" }}>
        Đổi Mật Khẩu
      </div>

      <div className="panel" style={{ padding: "28px" }}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "16px",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "16px",
              backgroundColor: "#dcfce7",
              color: "#16a34a",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            Đổi mật khẩu thành công!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              name="currentPassword"
              placeholder="Nhập mật khẩu cũ"
              value={formData.currentPassword}
              onChange={handleChange}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>
              Mật khẩu mới
            </label>
            <input
              type="password"
              name="newPassword"
              placeholder="Tối thiểu 6 ký tự"
              value={formData.newPassword}
              onChange={handleChange}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu mới"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <button type="submit" className="btn-sm" style={{ flex: 1, padding: "10px 0" }}>
              Xác Nhận Đổi
            </button>
            {onBack && (
              <button
                type="button"
                className="btn-sm btn-ghost"
                onClick={onBack}
                style={{ flex: 1, padding: "10px 0" }}
              >
                Hủy / Quay Lại
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}