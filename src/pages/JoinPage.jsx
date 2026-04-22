import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./JoinPage.css";

const JoinPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    rank: "",
    primaryRole: "",
    secondaryRole: "",
  });

  const ranks = [
    "Epic",
    "Legend",
    "Mythic",
    "Mythical Glory",
    "Mythical Immortal",
  ];
  const roles = ["Exp Lane", "Jungle", "Mid Lane", "Gold Lane", "Roam"];

  const fireAlert = (title, text, icon) => {
    Swal.fire({
      title,
      text,
      icon,
      background: "#1e293b",
      color: "#fff",
      confirmButtonColor: "#3b82f6",
    });
  };

  const handleJoin = async (e) => {
    e.preventDefault();

    // فحص البيانات قبل الإرسال
    if (!formData.name.trim() || formData.name.length < 3) {
      return fireAlert("تنبيه", "الاسم قصير جداً!", "warning");
    }
    if (!formData.rank || !formData.primaryRole || !formData.secondaryRole) {
      return fireAlert("تنبيه", "يرجى تعبئة جميع الحقول", "info");
    }
    if (formData.primaryRole === formData.secondaryRole) {
      return fireAlert("خطأ", "لا يمكنك اختيار نفس الدور مرتين", "error");
    }

    try {
      Swal.fire({
        title: "جاري التسجيل...",
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post("http://localhost:5000/api/join", formData);

      localStorage.setItem("token", res.data.token);

      Swal.fire({
        icon: "success",
        title: "تم التسجيل!",
        text: "بالتوفيق يا بطل",
        timer: 2000,
        showConfirmButton: false,
      });

      setTimeout(() => navigate("/waiting"), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "السيرفر لا يستجيب";
      fireAlert("فشل التسجيل", msg, "error");
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <div className="header-section">
          <h1 className="join-title">MVP</h1>
          <span className="join-subtitle">Tournament Registry</span>
        </div>

        <form onSubmit={handleJoin} className="join-form" noValidate>
          <div className="input-group">
            <label className="input-label">In-Game Name</label>
            <input
              type="text"
              placeholder="Ex: Moayad_Saleh"
              className="join-input"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="input-group">
            <label className="input-label">Current Rank</label>
            <select
              className="join-input"
              value={formData.rank}
              onChange={(e) =>
                setFormData({ ...formData, rank: e.target.value })
              }
            >
              <option value="">Choose your rank...</option>
              {ranks.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="roles-grid">
            <div className="input-group">
              <label className="input-label">Main Role</label>
              <select
                className="join-input text-sm"
                value={formData.primaryRole}
                onChange={(e) =>
                  setFormData({ ...formData, primaryRole: e.target.value })
                }
              >
                <option value="">Role 1</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Sub Role</label>
              <select
                className="join-input text-sm"
                value={formData.secondaryRole}
                onChange={(e) =>
                  setFormData({ ...formData, secondaryRole: e.target.value })
                }
              >
                <option value="">Role 2</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="join-button">
            Confirm & Join
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinPage;
