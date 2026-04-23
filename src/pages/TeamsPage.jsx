import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TeamsPage.css";

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [isAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [loading, setLoading] = useState(true); // إضافة حالة تحميل
  const navigate = useNavigate();

  // الرابط الجديد الخاص بـ Railway
  const API_BASE_URL = "https://mlbbb-production.up.railway.app";

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/generate-teams`);
      const data = res.data.teams || res.data;
      if (Array.isArray(data)) {
        setTeams(data);
      }
    } catch (err) {
      console.error("خطأ في جلب الفرق من السيرفر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    // تحديث تلقائي كل 5 ثوانٍ لمواكبة التغييرات
    const interval = setInterval(fetchTeams, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="teams-wrapper">
      <h1 className="title">⚔️ توزيع الفرق الحالية ⚔️</h1>

      <div className="teams-grid-container">
        {loading && teams.length === 0 ? (
          <div className="no-data">جاري تحميل الفرق...</div>
        ) : teams.length > 0 ? (
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
            <p>بانتظار توزيع الفرق من قبل الإدارة...</p>
          </div>
        )}
      </div>

      <footer className="teams-footer">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/waiting")}
        >
          ↩ رجوع للانتظار
        </button>

        <button className="btn btn-admin" onClick={() => navigate("/bracket")}>
          {isAdmin ? "🏆 إدارة شجرة البطولة" : "🏆 مشاهدة الشجرة والنتائج"}
        </button>
      </footer>
    </div>
  );
};

export default TeamsPage;
