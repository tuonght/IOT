import { useEffect, useState } from "react";
import { api } from "../api";
import "./Profile.css";
const EMPTY_TEXT = "--- ";

const emptyProfile = {
  username: "",
  email: "",
  studentId: "",
  className: "",
  github: "",
  pdfLink: "",
  apiDocs: "",
  figma: "",
  avatar: "",
};

export default function Profile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fields = [
    { key: "username", label: "Họ và Tên" },
    { key: "email", label: "Email" },
    { key: "studentId", label: "Mã Sinh Viên" },
    { key: "className", label: "Lớp" },
    { key: "github", label: "Github" },
    { key: "pdfLink", label: "PDF Link" },
    { key: "apiDocs", label: "Postman" },
    { key: "figma", label: "Figma" },
    { key: "avatar", label: "Avatar URL" },
  ];

  useEffect(() => {
    let mounted = true;
    api.profile()
      .then((data) => {
        if (!mounted) return;
        const profileData = {
          username: data.username || "",
          email: data.email || "",
          studentId: data.studentId || "",
          className: data.className || "",
          github: data.github || "",
          pdfLink: data.pdfLink || "",
          apiDocs: data.apiDocs || "",
          figma: data.figma || "",
          avatar: data.avatar || "",
        };
        setProfile(profileData);
        setDraft(profileData);
      })
      .catch((requestError) => {
        if (mounted) setError(requestError.message);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  function handleFieldChange(e) {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  async function handleConfirm() {
    setIsSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await api.updateProfile(draft);
      const profileData = {
        username: updated.username || "",
        email: updated.email || "",
        studentId: updated.studentId || "",
        className: updated.className || "",
        github: updated.github || "",
        pdfLink: updated.pdfLink || "",
        apiDocs: updated.apiDocs || "",
        figma: updated.figma || "",
        avatar: updated.avatar || "",
      };
      setProfile(profileData);
      setDraft(profileData);
      localStorage.setItem("email", profileData.email);
      localStorage.setItem("username", profileData.username);
      setIsEditing(false);
      setSaved(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  const getDisplayValue = (value) => (value && value.trim() ? value : EMPTY_TEXT);

  if (isLoading) return <div className="page-title">Đang tải hồ sơ...</div>;

  return (
    <div>
      <div className="page-title">My Profile</div>
      {error && <div className="error-text">{error}</div>}
      {saved && <div className="success-text">Đã cập nhật hồ sơ.</div>}
      <div className="profile-card">
        <div className="profile-photo-wrap">
          <div className={`profile-photo ${profile.avatar ? "has-image" : ""}`}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="Ảnh đại diện" />
            ) : (
              <span className="profile-photo-placeholder">
                {(profile.username || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {!isEditing ? (
          <div className="profile-content">
            {fields.filter((field) => field.key !== "avatar").map((field) => (
              <div className="profile-row" key={field.key}>
                <b>{field.label}</b>
                <span>{getDisplayValue(profile[field.key])}</span>
              </div>
            ))}

            <div className="profile-actions">
              <button type="button" className="profile-btn" onClick={() => {
                setDraft(profile);
                setError("");
                setSaved(false);
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
                  type={field.key === "email" ? "email" : "text"}
                  name={field.key}
                  value={draft[field.key]}
                  onChange={handleFieldChange}
                  placeholder={EMPTY_TEXT}
                />
              </div>
            ))}

            {/* Xác nhận  */}
            <div className="profile-actions">
              <button type="button" className="profile-btn" onClick={handleConfirm} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Xác nhận"}
              </button>
              <button type="button" className="profile-btn" onClick={() => {
                setDraft(profile);
                setIsEditing(false);
              }}>
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
