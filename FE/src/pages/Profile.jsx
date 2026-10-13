import { useEffect, useState } from "react";
import { api, apiAssetUrl } from "../api";
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
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

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
      let updated = await api.updateProfile({ ...draft, avatar: profile.avatar });
      if (selectedAvatar) {
        updated = await api.uploadAvatar(selectedAvatar);
      }
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
      setSelectedAvatar(null);
      setAvatarPreview("");
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

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh đại diện không được lớn hơn 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Không thể đọc ảnh đã chọn.");
        return;
      }
      setError("");
      setSelectedAvatar(file);
      setAvatarPreview(reader.result);
    };
    reader.onerror = () => setError("Không thể đọc ảnh đã chọn.");
    reader.readAsDataURL(file);
  }

  const getDisplayValue = (value) => (value && value.trim() ? value : EMPTY_TEXT);
  const normalizedAvatarPath = profile.avatar?.replace(
    /^\/api\/profile\/avatar\//,
    "/uploads/"
  );
  const savedAvatarUrl = normalizedAvatarPath?.startsWith("/")
    ? apiAssetUrl(normalizedAvatarPath)
    : normalizedAvatarPath;

  if (isLoading) return <div className="page-title">Đang tải hồ sơ...</div>;

  return (
    <div>
      <div className="page-title">My Profile</div>
      {error && <div className="error-text">{error}</div>}
      <div className="profile-card">
        <div className="profile-photo-wrap">
          <div className={`profile-photo ${profile.avatar ? "has-image" : ""}`}>
            {avatarPreview || savedAvatarUrl ? (
              <img src={avatarPreview || savedAvatarUrl} alt="Ảnh đại diện" />
            ) : (
              <span className="profile-photo-placeholder">
                {(profile.username || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {isEditing && (
            <label className="photo-upload-btn">
              + Chọn ảnh từ máy
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleAvatarChange}
                aria-label="Chọn ảnh đại diện từ máy"
              />
            </label>
          )}
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
                setSelectedAvatar(null);
                setAvatarPreview("");
                setIsEditing(true);
              }}>
                Thêm / Sửa
              </button>
              {saved && <span className="profile-success">Đã cập nhật hồ sơ.</span>}
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
              <button type="button" className="profile-btn profile-btn-cancel" disabled={isSaving} onClick={() => {
                setDraft(profile);
                setSelectedAvatar(null);
                setAvatarPreview("");
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
