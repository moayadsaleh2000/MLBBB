import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./WaitingPage.css";

const WaitingPage = () => {
  const [players, setPlayers] = useState([]);
  const [isAdminState, setIsAdminState] = useState(
    localStorage.getItem("isAdmin") === "true",
  );
  const [adminClickCount, setAdminClickCount] = useState(0);
  const navigate = useNavigate();

  // الرابط الجديد المعتمد على Railway
  const API_BASE_URL = "https://mlbbb-production.up.railway.app";

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/players`);
      setPlayers(res.data);
    } catch (err) {
      console.error("خطأ في الاتصال بالسيرفر...");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const startTournament = async () => {
    // التحقق من العدد المطلوب للبدء (10 لاعبين لتشكيل فريقين)
    if (players.length < 10) {
      Swal.fire("تنبيه", "يجب توفر 10 لاعبين على الأقل للبدء", "warning");
      return;
    }

    try {
      Swal.fire({
        title: "جاري توزيع الفرق...",
        text: "يرجى الانتظار قليلاً",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // 1. طلب توزيع الفرق من السيرفر
      await axios.post(`${API_BASE_URL}/api/shuffle-teams`);

      // 2. إيقاف التسجيل الجديد لضمان استقرار البطولة
      await axios.post(`${API_BASE_URL}/api/toggle-reg`, { status: false });

      Swal.close();
      navigate("/teams");
    } catch (err) {
      Swal.fire("خطأ", "فشل في عملية التوزيع، تأكد من اتصال السيرفر", "error");
    }
  };

  const deletePlayer = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/player/${id}`);
      fetchStatus();
    } catch (err) {
      Swal.fire("خطأ", "لم يتمكن السيرفر من حذف اللاعب", "error");
    }
  };

  const handleReset = async () => {
    const confirm = await Swal.fire({
      title: "تصفير البطولة بالكامل؟",
      text: "هذا الإجراء سيحذف كافة اللاعبين والنتائج ولا يمكن التراجع عنه!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف الكل",
      cancelButtonText: "إلغاء",
      background: "#1e293b",
      color: "#fff",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.post(`${API_BASE_URL}/api/reset`, {
          secretCode: "8520085",
        });
        localStorage.clear();
        window.location.href = "/";
      } catch (e) {
        Swal.fire("خطأ", "فشل تصفير قاعدة البيانات", "error");
      }
    }
  };

  const handleAdminTitleClick = () => {
    const newCount = adminClickCount + 1;
    if (newCount >= 5) {
      setAdminClickCount(0);
      Swal.fire({
        title: "كود الإدارة",
        input: "password",
        background: "#1e293b",
        color: "#fff",
      }).then(({ value: code }) => {
        if (code === "8520085") {
          setIsAdminState(true);
          localStorage.setItem("isAdmin", "true");
          Swal.fire("نجح", "تم تفعيل وضع الإدارة", "success");
        } else if (code) {
          Swal.fire("خطأ", "الكود غير صحيح", "error");
        }
      });
    } else {
      setAdminClickCount(newCount);
    }
  };

  return (
    <div className="waiting-wrapper">
      <div className="waiting-card">
        <header className="card-header">
          <h1 className="main-title" onClick={handleAdminTitleClick}>
            MLBB <span className="highlight">ARENA</span>
          </h1>
          <div className="status-badge">المسجلون: {players.length}</div>
        </header>

        <div className="players-scroll-area">
          <div className="players-grid">
            {players.map((p, i) => (
              <div key={p._id} className="player-item">
                <div className="player-info">
                  <span className="rank-num">#{i + 1}</span>
                  <div className="name-box">
                    <span className="p-name">{p.name}</span>
                    <span className="p-role">{p.primaryRole}</span>
                  </div>
                </div>
                {isAdminState && (
                  <button
                    className="delete-icon"
                    onClick={() => deletePlayer(p._id)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <footer className="action-area">
          {isAdminState ? (
            <div className="admin-controls">
              <button className="btn-main" onClick={startTournament}>
                🚀 توزيع وبدء البطولة
              </button>
              <div className="secondary-btns">
                <button
                  className="btn-sec"
                  onClick={async () => {
                    await axios.post(`${API_BASE_URL}/api/seed`);
                    fetchStatus();
                  }}
                >
                  🤖 إضافة 5 بوتات
                </button>
                <button className="btn-danger" onClick={handleReset}>
                  🗑️ تصفير البيانات
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-main" onClick={() => navigate("/teams")}>
              عرض الفرق الحالية
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default WaitingPage;
