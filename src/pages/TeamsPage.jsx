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
      // --- التعديل هنا: استخدام رابط Railway بدلاً من localhost ---
      const res = await axios.get(
        "https://mlbbb-production.up.railway.app/api/generate-teams",
      );

      if (res.data.success) {
        setTeams(res.data.teams);

        // حفظ الفرق في الـ LocalStorage عشان صفحة الـ Bracket تقرأهم
        localStorage.setItem("generatedTeams", JSON.stringify(res.data.teams));

        checkSecurity(res.data.teams);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  // فحص إذا كان اللاعب لا يزال موجوداً (للطرد التلقائي)
  const checkSecurity = (allTeams) => {
    if (isAdmin) return;
    const myName = localStorage.getItem("playerName");
    const allPlayersInTeams = allTeams.flatMap((t) =>
      t.members.map((m) => m.name),
    );

    // إذا الفرق فاضية (تصفير) أو اسمي مش بينهم (حذف)
    if (allPlayersInTeams.length === 0 || !allPlayersInTeams.includes(myName)) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.clear(); // تصفير كل شيء عند الطرد
    navigate("/");
  };

  useEffect(() => {
    fetchTeams();
    // فحص دوري كل 5 ثواني للتحديث التلقائي
    const interval = setInterval(fetchTeams, 5000);
    return () => clearInterval(interval);
  }, []);

  const getEmoji = (role) => {
    const emojis = {
      Jungle: "⚔️",
      "Gold Lane": "💰",
      "EXP Lane": "🛡️",
      "Mid Lane": "🧙",
      Roam: "👣",
    };
    return emojis[role] || "👤";
  };

  return (
    <div className="teams-wrapper">
      <h1 className="title">⚔️ توزيع الفرق والمسارات ⚔️</h1>

      <div className="teams-grid-container">
        {teams.length > 0 ? (
          teams.map((team, idx) => (
            <div key={idx} className="team-card">
              <h2 className="team-name">{team.teamName}</h2>
              <table className="players-table">
                <thead>
                  <tr>
                    <th>اللاعب</th>
                    <th>المسار</th>
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((p, pIdx) => (
                    <tr key={pIdx}>
                      <td className="p-name">{p.name}</td>
                      <td className="p-role">
                        {getEmoji(p.assignedRole)} {p.assignedRole}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <div className="empty-loading">
            <p>بانتظار توزيع الفرق...</p>
            <div className="spinner"></div>
          </div>
        )}
      </div>

      <footer className="teams-footer">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/waiting")}
        >
          ↩️ عودة
        </button>

        {isAdmin && (
          <button className="btn btn-warning" onClick={fetchTeams}>
            🔄 إعادة التشكيل
          </button>
        )}

        <button
          className={isAdmin ? "btn btn-admin" : "btn btn-primary"}
          onClick={() => navigate("/bracket")}
        >
          {isAdmin ? "🏆 إنشاء وإدارة الجدول" : "📅 عرض الجدول"}
        </button>
      </footer>
    </div>
  );
};

export default TeamsPage;
