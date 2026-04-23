import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TeamsPage.css";

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const navigate = useNavigate();

  const API_URL = "https://mlbbb-production.up.railway.app/api";

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_URL}/generate-teams`);
      if (res.data.success) {
        setTeams(res.data.teams);
        // تخزين الفرق للـ Bracket
        localStorage.setItem("generatedTeams", JSON.stringify(res.data.teams));
      }
    } catch (err) {
      console.error("فشل جلب الفرق");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams(); // جلب الفرق فوراً عند الرفرش
    const interval = setInterval(fetchTeams, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGoToBracket = () => {
    if (isAdmin) {
      localStorage.removeItem("tourney_bracket");
    }
    navigate("/bracket");
  };

  if (loading && teams.length === 0)
    return <div className="loader">جاري استرجاع الفرق...</div>;

  return (
    <div className="teams-page">
      <header className="header">
        <button onClick={() => navigate("/waiting")}>↩ عودة</button>
        <h1>الفرق الموزعة ⚔️</h1>
      </header>

      <div className="teams-grid">
        {teams.length > 0 ? (
          teams.map((team, idx) => (
            <div key={idx} className="team-card">
              <h2>{team.teamName}</h2>
              {team.members.map((p, i) => (
                <div key={i} className="member">
                  {p.name} - {p.assignedRole}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="no-data">بانتظار توزيع الفرق من الإدارة...</div>
        )}
      </div>

      <footer className="footer">
        <button className="btn-bracket" onClick={handleGoToBracket}>
          {isAdmin ? "🏆 إنشاء جدول البطولة" : "📅 عرض الجدول"}
        </button>
      </footer>
    </div>
  );
};
export default TeamsPage;
