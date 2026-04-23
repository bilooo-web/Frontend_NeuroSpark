import { useState, useEffect } from "react";
import { X, User, Mail, AtSign, Lock, Check } from "lucide-react";
import adminService from "../../services/adminService";

const AdminProfileModal = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setFormData({
          full_name: user.full_name || "",
          username: user.username || "",
          email: user.admin?.email || user.email || "",
          password: "",
          password_confirmation: "",
        });
      } catch {
        // fallback
      }
      setErrors({});
      setSuccess(false);
    }
  }, [open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    setSuccess(false);

    try {
      const payload = {};
      if (formData.full_name) payload.full_name = formData.full_name;
      if (formData.username) payload.username = formData.username;
      if (formData.email) payload.email = formData.email;
      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      const res = await adminService.updateProfile(payload);

      if (res.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
      }

      setSuccess(true);
      setFormData((prev) => ({ ...prev, password: "", password_confirmation: "" }));

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      if (err.data?.errors) {
        setErrors(err.data.errors);
      } else {
        setErrors({ general: err.message || "Failed to update profile" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="ad-profile-modal-overlay" onClick={onClose}>
      <div className="ad-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ad-profile-modal-header">
          <h2>Edit Profile</h2>
          <button className="ad-profile-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="ad-profile-modal-body">
          {errors.general && (
            <div className="ad-profile-modal-error">{errors.general}</div>
          )}

          {success && (
            <div className="ad-profile-modal-success">
              <Check size={16} /> Profile updated successfully!
            </div>
          )}

          <div className="ad-profile-modal-field">
            <label>
              <User size={14} /> Full Name
            </label>
            <input
              className="ad-form-input"
              type="text"
              value={formData.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Your full name"
            />
            {errors.full_name && (
              <p className="ad-profile-modal-field-error">
                {Array.isArray(errors.full_name) ? errors.full_name[0] : errors.full_name}
              </p>
            )}
          </div>

          <div className="ad-profile-modal-field">
            <label>
              <AtSign size={14} /> Username
            </label>
            <input
              className="ad-form-input"
              type="text"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              placeholder="Username"
            />
            {errors.username && (
              <p className="ad-profile-modal-field-error">
                {Array.isArray(errors.username) ? errors.username[0] : errors.username}
              </p>
            )}
          </div>

          <div className="ad-profile-modal-field">
            <label>
              <Mail size={14} /> Email
            </label>
            <input
              className="ad-form-input"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="admin@example.com"
            />
            {errors.email && (
              <p className="ad-profile-modal-field-error">
                {Array.isArray(errors.email) ? errors.email[0] : errors.email}
              </p>
            )}
          </div>

          <div className="ad-profile-modal-divider" />

          <p className="ad-text-muted ad-text-sm" style={{ marginBottom: 12 }}>
            Leave password fields empty to keep your current password.
          </p>

          <div className="ad-profile-modal-field">
            <label>
              <Lock size={14} /> New Password
            </label>
            <input
              className="ad-form-input"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="New password (optional)"
            />
            {errors.password && (
              <p className="ad-profile-modal-field-error">
                {Array.isArray(errors.password) ? errors.password[0] : errors.password}
              </p>
            )}
          </div>

          <div className="ad-profile-modal-field">
            <label>
              <Lock size={14} /> Confirm Password
            </label>
            <input
              className="ad-form-input"
              type="password"
              value={formData.password_confirmation}
              onChange={(e) => handleChange("password_confirmation", e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div className="ad-profile-modal-footer">
          <button className="ad-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="ad-btn ad-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileModal;