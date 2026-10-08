import { useState } from "react";
import { mockProfile } from "../mockData";
import "./Profile.css";
const EMPTY_TEXT = "--- ";

// Chuẩn hóa dữ liệu mẫu sang các tên field 
const defaultProfile = {
  username: mockProfile.username || "",
  email: mockProfile.email || "",
  studentId: mockProfile.studentId || "",
  className: mockProfile.className || "",
  github: mockProfile.github || "",
  pdfLink: mockProfile.pdfLink || "",
  apiDocs: mockProfile.apiDocs || "",
  figma: mockProfile.figma || "",
};

export default function Profile() {
  
  const [profile, setProfile] = useState(defaultProfile);
  const [draft, setDraft] = useState(defaultProfile);
  // Cờ chuyển giữa chế độ xem và chế độ chỉnh sửa.
  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(mockProfile.avatar || "");

  const fields = [
    { key: "username", label: "Họ và Tên" },
    { key: "email", label: "Email" },
    { key: "studentId", label: "Mã Sinh Viên" },
    { key: "className", label: "Lớp" },
    { key: "github", label: "Github" },
    { key: "pdfLink", label: "PDF Link" },
    { key: "apiDocs", label: "Postman" },
    { key: "figma", label: "Figma" },
  ];

  // Cập nhật đúng thuộc tính draft dựa trên name của input.
  function handleFieldChange(e) {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  }


  function handleConfirm() {
    setProfile(draft);
    setIsEditing(false);
  }


  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  }

  
  const getDisplayValue = (value) => (value && value.trim() ? value : EMPTY_TEXT);

  return (
    <div>
      {/* Khung hồ sơ gồm khu vực ảnh và nội dung/form. */}
      <div className="page-title">My Profile</div>
      <div className="profile-card">
        <div className="profile-photo-wrap">
          {/* HIện ảnh/ k hiện */}
          <div className={`profile-photo ${photoPreview ? "has-image" : ""}`}>
            {photoPreview ? (
              <img src={photoPreview} alt="Profile preview" />
            ) : (
              <span className="profile-photo-placeholder">T</span>
            )}
          </div>

          {/* Nút tải ảnh */}
          {isEditing && (
            <label className="photo-upload-btn">
              Thêm ảnh
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>
          )}
        </div>

        {!isEditing ? (
          <div className="profile-content">
            {fields.map((field) => (
              <div className="profile-row" key={field.key}>
                <b>{field.label}</b>
                <span>{getDisplayValue(profile[field.key])}</span>
              </div>
            ))}

            <div className="profile-actions">
              <button type="button" className="profile-btn" onClick={() => {
                setDraft(profile);
                setIsEditing(true);
              }}>
                Thêm / Sửa
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-form">
            {/* Tạo một input cho từng thông tin trong fields. */}
            {fields.map((field) => (
              <div className="profile-field" key={field.key}>
                <label>{field.label}</label>
                <input
                  type="text"
                  name={field.key}
                  value={draft[field.key]}
                  onChange={handleFieldChange}
                  placeholder={EMPTY_TEXT}
                />
              </div>
            ))}

            {/* Xác nhận  */}
            <div className="profile-actions">
              <button type="button" className="profile-btn" onClick={handleConfirm}>
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
