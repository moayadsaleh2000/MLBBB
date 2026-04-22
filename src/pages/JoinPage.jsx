import React, { useState, useEffect } from "react";
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

  // الفحص عند فتح الصفحة: إذا مسجل روح على الـ Waiting
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/waiting");
    }
  }, [navigate]);

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
    if (!formData.name.trim() || formData.name.length < 3)
      return fireAlert("تنبيه", "الاسم قصير!", "warning");
    if (!formData.rank || !formData.primaryRole || !formData.secondaryRole)
      return fireAlert("تنبيه", "أكمل الحقول", "info");
    if (formData.primaryRole === formData.secondaryRole)
      return fireAlert("خطأ", "الدور مكرر", "error");

    try {
      Swal.fire({
        title: "جاري التسجيل...",
        didOpen: () => Swal.showLoading(),
      });
      const res = await axios.post(
        "https://mlbbb-production.up.railway.app/api/join",
        formData,
      );

      // تخزين التوكين بالاسم الموحد "token"
      localStorage.setItem("token", res.data.token);

      Swal.fire({
        icon: "success",
        title: "تم التسجيل!",
        timer: 2000,
        showConfirmButton: false,
      });
      setTimeout(() => navigate("/waiting"), 2000);
    } catch (err) {
      fireAlert(
        "فشل التسجيل",
        err.response?.data?.message || "خطأ سيرفر",
        "error",
      );
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <h1 className="join-title">MVP Tournament</h1>
        <form onSubmit={handleJoin} className="join-form">
          <div className="input-group">
            <label>In-Game Name</label>
            <input
              type="text"
              className="join-input"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="input-group">
            <label>Rank</label>
            <select
              className="join-input"
              value={formData.rank}
              onChange={(e) =>
                setFormData({ ...formData, rank: e.target.value })
              }
            >
              <option value="">Choose Rank...</option>
              {ranks.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="roles-grid">
            <select
              className="join-input"
              value={formData.primaryRole}
              onChange={(e) =>
                setFormData({ ...formData, primaryRole: e.target.value })
              }
            >
              <option value="">Main Role</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              className="join-input"
              value={formData.secondaryRole}
              onChange={(e) =>
                setFormData({ ...formData, secondaryRole: e.target.value })
              }
            >
              <option value="">Sub Role</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
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
