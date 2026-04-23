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

  const API_BASE_URL = "https://mlbbb-production.up.railway.app";

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/players`);
      setPlayers(res.data);
    } catch (err) {
      console.error("Connection Error...");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const startTournament = async () => {
    if (players.length < 10) {
      Swal.fire("عفواً", "لازم 10 لاعبين على الأقل", "warning");
      return;
    }
    try {
      Swal.fire({
        title: "جاري توزيع الفرق...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // 1. التوزيع في السيرفر (الحل اللولبي)
      await axios.post(`${API_BASE_URL}/api/shuffle-teams`);
      // 2. قفل التسجيل
      await axios.post(`${API_BASE_URL}/api/toggle-reg`, { status: false });

      Swal.close();
      navigate("/teams"); // الانتقال والبيانات جاهزة
    } catch (err) {
      Swal.fire("خطأ", "فشل التوزيع، تأكد من السيرفر", "error");
    }
  };

  // باقي الدوال (delete, reset, handleAdminTitleClick) تبقى كما هي عندك تماماً
  const deletePlayer = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/player/${id}`);
      fetchStatus();
    } catch (err) {
      Swal.fire("خطأ", "فشل الحذف", "error");
    }
  };

  const handleReset = async () => {
    const confirm = await Swal.fire({
      title: "تصفير البطولة؟",
      text: "سيتم حذف الجميع!",
      icon: "warning",
      showCancelButton: true,
    });
    if (confirm.isConfirmed) {
      try {
        await axios.post(`${API_BASE_URL}/api/reset`, {
          secretCode: "8520085",
        });
        localStorage.clear();
        window.location.href = "/";
      } catch (e) {
        Swal.fire("خطأ", "فشل التصفير", "error");
      }
    }
  };

  const handleAdminTitleClick = () => {
    const newCount = adminClickCount + 1;
    if (newCount >= 5) {
      setAdminClickCount(0);
      Swal.fire({ title: "دخول الإدارة", input: "password" }).then(
        ({ value: code }) => {
          if (code === "8520085") {
            setIsAdminState(true);
            localStorage.setItem("isAdmin", "true");
          }
        },
      );
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
                🚀 توزيع والبدء
              </button>
              <div className="secondary-btns">
                <button
                  className="btn-sec"
                  onClick={async () => {
                    await axios.post(`${API_BASE_URL}/api/seed`);
                    fetchStatus();
                  }}
                >
                  🤖 +5 بوتات
                </button>
                <button className="btn-danger" onClick={handleReset}>
                  🗑️ تصفير
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-main" onClick={() => navigate("/teams")}>
              عرض الفرق
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
export default WaitingPage;
