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

  // فحص التوكن عند التحميل لمنع إعادة التسجيل
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

    // التحقق من المدخلات
    if (!formData.name.trim() || formData.name.length < 3)
      return fireAlert(
        "تنبيه",
        "الاسم يجب أن يكون 3 حروف على الأقل!",
        "warning",
      );
    if (!formData.rank || !formData.primaryRole || !formData.secondaryRole)
      return fireAlert("تنبيه", "يرجى تعبئة جميع الخيارات", "info");
    if (formData.primaryRole === formData.secondaryRole)
      return fireAlert("خطأ", "لا يمكن اختيار نفس الدور مرتين", "error");

    try {
      Swal.fire({
        title: "جاري إرسال البيانات...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // الرابط الخاص بـ Railway
      const res = await axios.post(
        "https://mlbbb-production.up.railway.app/api/join",
        formData,
      );

      // تخزين التوكن
      localStorage.setItem("token", res.data.token);

      Swal.fire({
        icon: "success",
        title: "تم الانضمام للبطولة!",
        text: "بالتوفيق في المنافسة",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => navigate("/waiting"), 1500);
    } catch (err) {
      fireAlert(
        "فشل في التسجيل",
        err.response?.data?.message || "حدث خطأ في الاتصال بالسيرفر",
        "error",
      );
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <h1 className="join-title">
          <span className="mvp-glow">MVP</span> Tournament
        </h1>
        <p className="join-subtitle">سجل بياناتك للانضمام إلى التصفيات</p>

        <form onSubmit={handleJoin} className="join-form">
          <div className="input-group">
            <label>In-Game Name</label>
            <input
              type="text"
              placeholder="أدخل اسمك في اللعبة"
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
              <option value="">اختر رانكك الحالي...</option>
              {ranks.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="roles-grid">
            <div className="input-group">
              <label>الدور الأساسي</label>
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
            </div>

            <div className="input-group">
              <label>الدور الثانوي</label>
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
          </div>

          <button type="submit" className="join-button">
            تأكيد الانضمام
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinPage;
