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
      if (res.data.success) {
        setTeams(res.data.teams);
      }
    } catch (err) {
      console.error("API Error");
    }
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="teams-wrapper">
      <h1 className="title">⚔️ توزيع الفرق ⚔️</h1>
      <div className="teams-grid-container">
        {teams.length > 0 ? (
          teams.map((team, idx) => (
            <div key={idx} className="team-card">
              <h2 className="team-name">{team.teamName}</h2>
              <div className="members-list">
                {team.members.map((p, pIdx) => (
                  <div key={pIdx} className="player-row">
                    <span className="p-name">{p.name}</span>
                    <span className="role-tag">{p.assignedRole}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-data">بانتظار توزيع الفرق...</div>
        )}
      </div>
      <footer className="teams-footer">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/waiting")}
        >
          ↩ عودة
        </button>
        {isAdmin && (
          <button
            className="btn btn-admin"
            onClick={() => navigate("/bracket")}
          >
            🏆 الجدول
          </button>
        )}
      </footer>
    </div>
  );
};

export default TeamsPage;
