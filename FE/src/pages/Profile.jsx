import { useState } from "react";
import { mockProfile } from "../mockData";

const EMPTY_TEXT = "--- ";

const defaultProfile = {
  fullName: mockProfile.fullName || mockProfile.username || "",
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
  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(mockProfile.avatar || "");

  const fields = [
    { key: "fullName", label: "Họ và Tên" },
    { key: "email", label: "Email" },
    { key: "studentId", label: "Mã Sinh Viên" },
    { key: "className", label: "Lớp" },
    { key: "github", label: "Github" },
    { key: "pdfLink", label: "PDF Link" },
    { key: "apiDocs", label: "Postman" },
    { key: "figma", label: "Figma" },
  ];

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
      <div className="page-title">My Profile</div>
      <div className="profile-card">
        <div className="profile-photo-wrap">
          <div className={`profile-photo ${photoPreview ? "has-image" : ""}`}>
            {photoPreview ? (
              <img src={photoPreview} alt="Profile preview" />
            ) : (
              <span className="profile-photo-placeholder">T</span>
            )}
          </div>

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
