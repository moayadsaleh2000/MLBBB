import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TournamentBracket.css";

export default function TournamentBracket() {
  const navigate = useNavigate();
  const [isAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [matches, setMatches] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const API_BASE_URL = "https://mlbbb-production.up.railway.app";

  // دالة توليد المباريات وحفظها فوراً
  const autoGenerateMatches = async (teamsList) => {
    if (teamsList.length < 2) return;
    let newMatches = [];
    for (let i = 0; i < teamsList.length; i += 2) {
      newMatches.push({
        t1: teamsList[i].teamName,
        t2: teamsList[i + 1]?.teamName || "تأهل تلقائي (Bye)",
        mode: "bracket",
        winner: null,
      });
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/api/matches/generate`, {
        matches: newMatches,
      });
      setMatches(res.data);
    } catch (err) {
      console.error("Auto-gen error");
    }
  };

  const fetchData = useCallback(async () => {
    try {
      // 1. محاولة جلب المباريات أولاً
      const mRes = await axios
        .get(`${API_BASE_URL}/api/matches`)
        .catch(() => ({ data: [] }));

      if (Array.isArray(mRes.data) && mRes.data.length > 0) {
        setMatches(mRes.data);
        setIsLoaded(true);
      } else {
        // 2. إذا لم توجد مباريات، نجلب الفرق ونولد الجدول فوراً
        const tRes = await axios.get(`${API_BASE_URL}/api/generate-teams`);
        const teams = tRes.data?.teams || tRes.data || [];
        if (teams.length >= 2 && isAdmin) {
          await autoGenerateMatches(teams);
        }
        setIsLoaded(true);
      }
    } catch (err) {
      console.error("Fetch Error");
      setTimeout(fetchData, 3000);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!isLoaded) return <div className="loading">جاري تحضير المواجهات...</div>;

  return (
    <div className="tournament-page">
      <div className="header-nav">
        <button onClick={() => navigate("/teams")}>الرجوع</button>
        <h2 className="title">⚔️ مواجهات البطولة ⚔️</h2>
      </div>

      <div className="content-container">
        {matches.length > 0 ? (
          <div className="matches-grid">
            {matches.map((m) => (
              <div key={m._id} className="match-card">
                <div className="match-teams">
                  <div className={`team-box ${m.winner === m.t1 ? "win" : ""}`}>
                    {m.t1}
                  </div>
                  <div className="vs-circle">VS</div>
                  <div className={`team-box ${m.winner === m.t2 ? "win" : ""}`}>
                    {m.t2}
                  </div>
                </div>
                {m.winner && (
                  <div className="winner-label">🏆 الفائز: {m.winner}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-matches-info">بانتظار الفرق لبدء القرعة...</div>
        )}
      </div>
    </div>
  );
}
