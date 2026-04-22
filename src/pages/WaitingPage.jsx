import React, { useState, useEffect, useRef } from "react";
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

  const isAdminRef = useRef(localStorage.getItem("isAdmin") === "true");
  const tokenRef = useRef(localStorage.getItem("mlbb_token"));

  // رابط السيرفر الموحد
  const API_BASE_URL = "https://mlbbb-production.up.railway.app";

  const getPlayerDataFromToken = () => {
    try {
      if (tokenRef.current) {
        return JSON.parse(atob(tokenRef.current.split(".")[1]));
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const fetchStatus = async () => {
    try {
      const [playersRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/players`),
        axios.get(`${API_BASE_URL}/api/settings`),
      ]);

      const latestPlayers = playersRes.data;
      const serverVersion = settingsRes.data.version || 0;
      setPlayers(latestPlayers);

      const playerData = getPlayerDataFromToken();

      if (playerData) {
        const playerVersion = playerData.version || 0;
        const playerName = playerData.name;

        const isDatabaseEmpty = latestPlayers.length === 0;
        const isVersionChanged = playerVersion !== serverVersion;
        const isMyNameDeleted = !latestPlayers.some(
          (p) => p.name === playerName,
        );

        if (isDatabaseEmpty || isVersionChanged || isMyNameDeleted) {
          handleLogoutForcefully();
        }
      }
    } catch (err) {
      console.error("Connection Error");
    }
  };

  const handleLogoutForcefully = () => {
    if (window.statusInterval) clearInterval(window.statusInterval);
    localStorage.clear();
    window.location.href = "/";
  };

  useEffect(() => {
    fetchStatus();
    window.statusInterval = setInterval(fetchStatus, 3000);
    return () => {
      if (window.statusInterval) clearInterval(window.statusInterval);
    };
  }, []);

  const handleAdminTitleClick = async () => {
    const newCount = adminClickCount + 1;
    if (newCount >= 5) {
      setAdminClickCount(0);
      const { value: code } = await Swal.fire({
        title: "دخول الإدارة",
        input: "password",
        inputPlaceholder: "أدخل الرمز السري",
        background: "#0f172a",
        color: "#fff",
        confirmButtonColor: "#3b82f6",
      });
      if (code === "8520085") {
        setIsAdminState(true);
        isAdminRef.current = true;
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

  const handleReset = async () => {
    const confirm = await Swal.fire({
      title: "تصفير البطولة؟",
      text: "سيتم حذف الجميع وطردهم فوراً!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "نعم، تصفير الكل",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.post(`${API_BASE_URL}/api/reset`, {
          secretCode: "8520085",
        });
        handleLogoutForcefully();
      } catch (e) {
        Swal.fire("خطأ", "فشل التصفير", "error");
      }
    }
  };

  const addFakePlayers = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/seed`);
      fetchStatus();
    } catch (err) {
      Swal.fire("خطأ", "فشل الإضافة", "error");
    }
  };

  const deletePlayer = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/player/${id}`);
      fetchStatus();
    } catch (err) {
      Swal.fire("خطأ", "فشل الحذف", "error");
    }
  };

  const startTournament = async () => {
    if (players.length < 10) {
      Swal.fire("عفواً", "نحتاج 10 لاعبين", "warning");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/toggle-reg`, {
        status: false,
      });
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
            <div className="teams-info">{completedTeams} أفرقة جاهزة 🛡️</div>
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
