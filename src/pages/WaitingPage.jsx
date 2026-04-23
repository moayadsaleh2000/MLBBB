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

  // الرابط الأساسي للسيرفر
  const API_BASE_URL = "https://mlbbb-production.up.railway.app";

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/players`);
      setPlayers(res.data);
    } catch (err) {
      console.error("خطأ في الاتصال بالسيرفر...");
    }
  };

  // جلب البيانات فوراً عند التحميل وعند كل رفرش
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const addFakePlayers = async () => {
    Swal.fire({
      title: "جاري استدعاء البوتات...",
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
      Swal.fire("خطأ", "السيرفر لا يستجيب", "error");
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
          title: "أهلاً يا أدمن",
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
      Swal.fire("تنبيه", "لازم 10 لاعبين على الأقل", "warning");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/toggle-reg`, { status: false });
      navigate("/teams");
    } catch (err) {
      Swal.fire("خطأ", "فشل البدء", "error");
    }
  };

  const completedTeams = Math.floor(players.length / 5);
  const canStart = players.length >= 10;

  return (
    <div className="waiting-wrapper">
      <div className="waiting-card">
        <h1 className="main-title" onClick={handleAdminTitleClick}>
          MLBB <span className="highlight">ARENA</span>
        </h1>
        <div className="status-badge">
          المسجلون: {players.length} | فرق جاهزة: {completedTeams}
        </div>

        <div className="players-list">
          {players.map((p, i) => (
            <div key={p._id} className="player-item">
              <span>
                #{i + 1} {p.name} ({p.primaryRole})
              </span>
              {isAdminState && (
                <button onClick={() => deletePlayer(p._id)}>×</button>
              )}
            </div>
          ))}
        </div>

        <div className="actions">
          {isAdminState ? (
            <>
              <button
                className={`btn-start ${!canStart ? "disabled" : ""}`}
                onClick={startTournament}
              >
                🚀 توزيع الفرق والبدء
              </button>
              <button className="btn-bot" onClick={addFakePlayers}>
                🤖 +5 بوتات
              </button>
            </>
          ) : (
            <button className="btn-view" onClick={() => navigate("/teams")}>
              عرض الفرق الجاهزة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default WaitingPage;
