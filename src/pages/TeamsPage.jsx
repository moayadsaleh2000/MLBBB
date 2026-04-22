import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TeamsPage.css";

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [isAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const navigate = useNavigate();

  // 1. جلب الفرق (GET) - لجلب البيانات المخزنة مسبقاً في الداتا بيز
  const fetchTeams = async () => {
    try {
      const res = await axios.get(
        "https://mlbbb-production.up.railway.app/api/generate-teams",
      );

      if (res.data.success) {
        setTeams(res.data.teams);
        // حفظ الفرق في الـ LocalStorage لصفحة الـ Bracket
        localStorage.setItem("generatedTeams", JSON.stringify(res.data.teams));
        checkSecurity(res.data.teams);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  // 2. دالة إعادة التشكيل (POST) - للأدمن فقط لعمل خلط جديد وحفظه
  const handleReshuffle = async () => {
    try {
      const res = await axios.post(
        "https://mlbbb-production.up.railway.app/api/shuffle-teams",
      );
      if (res.data.success) {
        setTeams(res.data.teams);
        alert("تم إعادة تشكيل الفرق وحفظها بنجاح! ⚔️");
      }
    } catch (err) {
      console.error("Error reshuffling teams:", err);
      alert("فشل إعادة التشكيل. تأكد من وجود عدد كافٍ من اللاعبين.");
    }
  };

  // فحص إذا كان اللاعب لا يزال موجوداً (للطرد التلقائي في حال تم حذفه)
  const checkSecurity = (allTeams) => {
    if (isAdmin) return;
    const myName = localStorage.getItem("playerName");
    const allPlayersInTeams = allTeams.flatMap((t) =>
      t.members.map((m) => m.name),
    );

    if (allPlayersInTeams.length === 0 || !allPlayersInTeams.includes(myName)) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    fetchTeams();
    // فحص دوري كل 5 ثواني لجلب النسخة الثابتة من السيرفر
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

        {/* زر الأدمن ينادي handleReshuffle (POST) */}
        {isAdmin && (
          <button className="btn btn-warning" onClick={handleReshuffle}>
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
