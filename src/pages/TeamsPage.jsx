import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TeamsPage.css";

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [isAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const navigate = useNavigate();

  const fetchTeams = async () => {
    try {
      const res = await axios.get(
        "https://mlbbb-production.up.railway.app/api/generate-teams",
      );
      if (res.data.success) {
        setTeams(res.data.teams);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="teams-wrapper">
      <h1 className="title">الفرق الموزعة ⚔️</h1>
      <div className="teams-grid-container">
        {teams.map((team, idx) => (
          <div key={idx} className="team-card">
            <h2 className="team-name">{team.teamName}</h2>
            <div className="members-list">
              {team.members.map((member, i) => (
                <div key={i} className="player-row">
                  <span>
                    {member.name} - {member.assignedRole}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <footer className="teams-footer">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/waiting")}
        >
          ↩ الرجوع للانتظار
        </button>
        {isAdmin && (
          <button
            className="btn btn-admin"
            onClick={() => navigate("/bracket")}
          >
            🏆 إنشاء الجدول
          </button>
        )}
      </footer>
    </div>
  );
};
export default TeamsPage;
