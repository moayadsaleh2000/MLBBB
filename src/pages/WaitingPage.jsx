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

  const addFakePlayers = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/seed`);
      fetchStatus();
    } catch (err) {
      Swal.fire("خطأ", "فشل إضافة البوتات", "error");
    }
  };

  const handleAdminTitleClick = () => {
    const newCount = adminClickCount + 1;
    if (newCount >= 5) {
      setAdminClickCount(0);
      Swal.fire({
        title: "دخول الإدارة",
        input: "password",
        inputPlaceholder: "الرمز السري",
      }).then(({ value: code }) => {
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
      });
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

  const completedTeams = Math.floor(players.length / 5);
  const canStart = players.length >= 10;

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
              المسجلون: {players.length}
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
              <button className="btn-sec" onClick={addFakePlayers}>
                🤖 +5 بوتات
              </button>
            </div>
          ) : (
            <button
              className={`btn-main ${!canStart ? "disabled" : ""}`}
              onClick={() => navigate("/teams")}
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
