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

  // تأكد إن الرابط هو رابط الـ API تبعك في Railway
  const API_BASE_URL = "https://mlbbb-production.up.railway.app";

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/players`);
      setPlayers(res.data);
    } catch (err) {
      console.error("Connection Error to Railway...");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // تحديث القائمة كل 3 ثواني
    return () => clearInterval(interval);
  }, []);

  // --- إضافة البوتات (بدون تعليق) ---
  const addFakePlayers = async () => {
    Swal.fire({
      title: "جاري إضافة المحاربين...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await axios.post(`${API_BASE_URL}/api/seed`);
      await fetchStatus(); // تحديث القائمة فوراً بعد الإضافة
      Swal.close();
    } catch (err) {
      console.error("API Error:", err);
      Swal.fire("خطأ", "السيرفر ما استجاب، تأكد إن Railway شغال", "error");
    }
  };

  // --- حذف لاعب ---
  const deletePlayer = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/player/${id}`);
      setPlayers(players.filter((p) => p._id !== id));
    } catch (err) {
      Swal.fire("خطأ", "فشل حذف اللاعب", "error");
    }
  };

  // --- تصفير البطولة ---
  const handleReset = async () => {
    const confirm = await Swal.fire({
      title: "تصفير البطولة؟",
      text: "سيتم حذف الجميع ومسح البيانات!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، تصفير",
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

  // --- تفعيل وضع الأدمن بالضغط 5 مرات على العنوان ---
  const handleAdminTitleClick = async () => {
    const newCount = adminClickCount + 1;
    if (newCount >= 5) {
      setAdminClickCount(0);
      const { value: code } = await Swal.fire({
        title: "دخول الإدارة",
        input: "password",
        inputPlaceholder: "الرمز السري",
      });
      if (code === "8520085") {
        setIsAdminState(true);
        localStorage.setItem("isAdmin", "true");
        Swal.fire({
          icon: "success",
          title: "أهلاً بك يا أدمن",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } else {
      setAdminClickCount(newCount);
    }
  };

  const startTournament = async () => {
    if (players.length < 10) {
      Swal.fire("عفواً", "لازم 10 لاعبين على الأقل للبدء", "warning");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/toggle-reg`, { status: false });
      navigate("/teams");
    } catch (err) {
      Swal.fire("خطأ", "فشل بدء البطولة", "error");
    }
  };

  const totalPlayers = players.length;
  const completedTeams = Math.floor(totalPlayers / 5);
  const canStart = totalPlayers >= 10;

  return (
    <div className="waiting-wrapper">
      <div className="waiting-card">
        <header className="card-header">
          <h1
            className="main-title"
            onClick={handleAdminTitleClick}
            style={{ cursor: "pointer" }}
          >
            MLBB <span className="highlight">ARENA</span>
          </h1>
          <div className="status-container">
            <div className={`status-badge ${canStart ? "ready" : ""}`}>
              المسجلون: {totalPlayers}
            </div>
            <div className="teams-info">{completedTeams} فرق جاهزة 🛡️</div>
          </div>
        </header>

        <div className="players-scroll-area">
          {players.length > 0 ? (
            <div className="players-grid">
              {players.map((player, index) => (
                <div key={player._id} className="player-item">
                  <div className="player-info">
                    <span className="rank-num">#{index + 1}</span>
                    <div className="name-box">
                      <span className="p-name">{player.name}</span>
                      <span className="p-role">{player.primaryRole}</span>
                    </div>
                  </div>
                  {isAdminState && (
                    <button
                      className="delete-icon"
                      onClick={() => deletePlayer(player._id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">بانتظار دخول الأساطير...</div>
          )}
        </div>

        <footer className="action-area">
          {isAdminState ? (
            <div className="admin-controls">
              <button
                className={`btn-main ${!canStart ? "disabled" : ""}`}
                onClick={startTournament}
              >
                🚀 توزيع {completedTeams} فرق والبدء
              </button>
              <div className="secondary-btns">
                <button className="btn-sec" onClick={addFakePlayers}>
                  🤖 +5 بوتات
                </button>
                <button className="btn-danger" onClick={handleReset}>
                  🗑️ تصفير
                </button>
              </div>
            </div>
          ) : (
            <button
              className={`btn-main ${!canStart ? "disabled" : ""}`}
              onClick={() => (canStart ? navigate("/teams") : null)}
            >
              {canStart
                ? `عرض الفرق (${completedTeams}) ⚔️`
                : `بانتظار اكتمال فريقين (10 لاعبين)`}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default WaitingPage;
