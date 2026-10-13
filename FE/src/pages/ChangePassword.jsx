import { useState } from "react";
import { api } from "../api";
import PasswordInput from "../components/PasswordInput";
import "./ChangePassword.css";

export default function ChangePassword({ onBack }) {
  // Gom ba ô mật khẩu vào một object state để cập nhật theo name input.
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Hai trạng thái để render thông báo kết quả.
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cập nhật input đang gõ và xóa lỗi cũ để người dùng thử lại.
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Xóa thông báo lỗi khi người dùng gõ lại
    setSuccess(false);
  }

  // Validate các điều kiện trước khi đánh dấu thao tác thành công.
  async function handleSubmit(e) {
    e.preventDefault();

    // 1. Kiểm tra rỗng
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await api.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess(true);
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // Class riêng để layout đổi mật khẩu có thể style độc lập.
    <div className="change-password-page">
      <div className="page-title change-password-title">
        Đổi Mật Khẩu
      </div>

      <div className="panel change-password-panel">
        {/* Thông báo lỗi/thành công chỉ được render khi state tương ứng bật. */}
        {error && (
          <div className="change-password-message change-password-error">
            {error}
          </div>
        )}

        {success && (
          <div className="change-password-message change-password-success">
            Đổi mật khẩu thành công!
          </div>
        )}

        {/* Submit form gọi handleSubmit; input controlled theo formData. */}
        <form className="change-password-form" onSubmit={handleSubmit}>
          <div>
            <label className="change-password-label">
              Mật khẩu hiện tại
            </label>
            <PasswordInput
              name="currentPassword"
              placeholder="Nhập mật khẩu cũ"
              value={formData.currentPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="change-password-label">
              Mật khẩu mới
            </label>
            <PasswordInput
              name="newPassword"
              placeholder="Tối thiểu 6 ký tự"
              value={formData.newPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="change-password-label">
              Xác nhận mật khẩu mới
            </label>
            <PasswordInput
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu mới"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          {/* Nhóm nút; nút quay lại chỉ hiện nếu component cha truyền onBack. */}
          <div className="change-password-actions">
            <button type="submit" className="btn-sm" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Xác Nhận Đổi"}
            </button>
            {onBack && (
              <button
                type="button"
                className="btn-sm btn-ghost"
                onClick={onBack}
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