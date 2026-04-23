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

  const getPlayerDataFromToken = (currentToken) => {
    try {
      if (currentToken) {
        return JSON.parse(atob(currentToken.split(".")[1]));
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const fetchStatus = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) return;

      const [playersRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/players`),
        axios.get(`${API_BASE_URL}/api/settings`),
      ]);

      setPlayers(playersRes.data);
      const serverVersion = settingsRes.data.version || 0;
      const playerData = getPlayerDataFromToken(currentToken);

      if (playerData && playerData.version !== serverVersion) {
        handleLogoutForcefully();
      }
    } catch (err) {
      console.error("Connection Error...");
    }
  };

  const handleLogoutForcefully = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    // منع التحميل العشوائي
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // --- حذف لاعب (سريع جداً) ---
  const deletePlayer = async (id) => {
    // حذف فوري من الشاشة قبل السيرفر
    const originalPlayers = [...players];
    setPlayers(players.filter((p) => p._id !== id));

    try {
      await axios.delete(`${API_BASE_URL}/api/player/${id}`);
    } catch (err) {
      setPlayers(originalPlayers); // ترجيع اللاعب لو فشل السيرفر
      Swal.fire("خطأ", "لم يتم الحذف من السيرفر", "error");
    }
  };

  // --- إضافة بوتات مع لودينج خفيف ---
  const addFakePlayers = async () => {
    Swal.fire({
      title: "جاري إضافة البوتات...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await axios.post(`${API_BASE_URL}/api/seed`);
      await fetchStatus();
      Swal.close();
    } catch (err) {
      Swal.fire("خطأ", "فشل إضافة البوتات", "error");
    }
  };

  // --- تصفير شامل للمتصفح والسيرفر ---
  const handleReset = async () => {
    const confirm = await Swal.fire({
      title: "تصفير البطولة؟",
      text: "سيتم حذف الجميع ومسح بيانات جهازك بالكامل!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "نعم، تصفير شامل",
      cancelButtonText: "إلغاء",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.post(`${API_BASE_URL}/api/reset`, {
          secretCode: "8520085",
        });
        localStorage.clear(); // مسح شامل للـ LocalStorage
        window.location.href = "/";
      } catch (e) {
        Swal.fire("خطأ", "فشل التصفير", "error");
      }
    }
  };

  const handleAdminTitleClick = async () => {
    const newCount = adminClickCount + 1;
    if (newCount >= 5) {
      setAdminClickCount(0);
      const { value: code } = await Swal.fire({
        title: "دخول الإدارة",
        input: "password",
        inputPlaceholder: "الرمز السري",
        background: "#0f172a",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
      });
      if (code === "8520085") {
        setIsAdminState(true);
        localStorage.setItem("isAdmin", "true");
        Swal.fire({
          icon: "success",
          title: "وضع الأدمن نشط",
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
      Swal.fire("عفواً", "نحتاج 10 لاعبين", "warning");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/toggle-reg`, { status: false });
      navigate("/teams");
    } catch (err) {
      Swal.fire("خطأ", "فشل البدء", "error");
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
                <div
                  key={player._id}
                  className={`player-item ${index < completedTeams * 5 ? "in-team" : ""}`}
                >
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
            <div className="empty-state">بانتظار دخول المحاربين...</div>
          )}
        </div>

        <footer className="action-area">
          {isAdminState ? (
            <div className="admin-controls">
              <button
                className={`btn-main ${!canStart ? "disabled" : "pulse"}`}
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
