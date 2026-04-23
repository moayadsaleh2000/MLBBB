import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TeamsPage.css";

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [isAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const navigate = useNavigate();

  const API_URL = "https://mlbbb-production.up.railway.app/api";

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_URL}/generate-teams`);
      if (res.data.success && res.data.teams) {
        setTeams(res.data.teams);
      }
    } catch (err) {
      console.error("خطأ في جلب الفرق");
    }
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 5000);
    return () => clearInterval(interval);
  }, []);

  // المنطق الجديد للزر
  const handleBracketNavigation = () => {
    if (isAdmin) {
      // إذا أدمن: امسح القديم وخزن الفرق الحالية للبدء من جديد
      localStorage.removeItem("tourney_bracket");
      localStorage.setItem("generatedTeams", JSON.stringify(teams));
    }
    // في كل الحالات (أدمن أو لاعب) ننتقل لصفحة الشجرة
    navigate("/bracket");
  };

  return (
    <div className="teams-wrapper">
      <h1 className="title">⚔️ توزيع الفرق الحالية ⚔️</h1>

      <div className="teams-grid-container">
        {teams.length > 0 ? (
          teams.map((team, idx) => (
            <div key={idx} className="team-card">
              <h2 className="team-name">{team.teamName}</h2>
              <div className="members-list">
                {team.members.map((member, i) => (
                  <div key={i} className="player-row">
                    <span className="p-name">{member.name}</span>
                    <span className="role-tag">{member.assignedRole}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-data">
            <p>بانتظار توزيع الفرق من المسؤول...</p>
          </div>
        )}
      </div>

      <footer className="teams-footer">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/waiting")}
        >
          ↩ رجوع
        </button>

        <button className="btn btn-admin" onClick={handleBracketNavigation}>
          {isAdmin ? "🏆 إنشاء وشغل الشجرة" : "🏆 مشاهدة النتائج"}
        </button>
      </footer>
    </div>
  );
};

export default TeamsPage;
