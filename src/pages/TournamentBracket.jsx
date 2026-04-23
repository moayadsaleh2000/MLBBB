import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "./TournamentBracket.css";

export default function TournamentBracket() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [winners, setWinners] = useState(
    () => JSON.parse(localStorage.getItem("t_winners")) || {},
  );
  const [scores, setScores] = useState(
    () => JSON.parse(localStorage.getItem("t_scores")) || {},
  );
  const [history, setHistory] = useState(
    () => JSON.parse(localStorage.getItem("t_history")) || [],
  );

  useEffect(() => {
    localStorage.setItem("t_winners", JSON.stringify(winners));
    localStorage.setItem("t_scores", JSON.stringify(scores));
    localStorage.setItem("t_history", JSON.stringify(history));
  }, [winners, scores, history]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get(
          "https://mlbbb-production.up.railway.app/api/generate-teams",
        );
        setTeams(res.data.teams || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // --- منطق تحديد الفرق النشطة وكشف العدد الفردي ---
  const currentActiveTeams = useMemo(() => {
    if (teams.length === 0) return [];

    // بنشوف مين فاز في الجولة الأولى
    const round1Winners = Object.keys(winners)
      .filter((key) => key.startsWith("r1-"))
      .map((key) => winners[key]);

    // إذا ما في فائزين كافيين (يعني لسه البطولة ببدايتها أو صار تغيير مفاجئ)
    // بنرجع كل الفرق الأصلية عشان ما حدا يختفي
    if (round1Winners.length < Math.floor(teams.length / 2)) {
      return teams.map((t) => t.teamName);
    }

    return round1Winners;
  }, [teams, winners]);

  const isEven =
    currentActiveTeams.length > 0 && currentActiveTeams.length % 2 === 0;

  const selectWinner = (matchId, teamName, nextMatchId) => {
    if (!isAdmin || !teamName) return;
    setHistory((prev) => [...prev, { type: "winner", data: { ...winners } }]);
    setWinners((prev) => ({
      ...prev,
      [matchId]: teamName,
      [nextMatchId]: teamName,
    }));
  };

  const addPoint = (teamName) => {
    if (!isAdmin) return;
    setHistory((prev) => [...prev, { type: "points", data: { ...scores } }]);
    setScores((prev) => ({ ...prev, [teamName]: (prev[teamName] || 0) + 3 }));
  };

  const handleUndo = () => {
    if (!isAdmin || history.length === 0) return;
    const last = history[history.length - 1];
    if (last.type === "winner") setWinners(last.data);
    else setScores(last.data);
    setHistory((prev) => prev.slice(0, -1));
  };

  const leagueMatches = useMemo(() => {
    if (isEven) return [];
    let matches = [];
    const tNames = currentActiveTeams;
    for (let i = 0; i < tNames.length; i++) {
      for (let j = i + 1; j < tNames.length; j++) {
        matches.push({ t1: tNames[i], t2: tNames[j] });
      }
    }
    return matches;
  }, [currentActiveTeams, isEven]);

  if (loading) return <div className="loader">جاري تحميل البطولة...</div>;

  return (
    <div className="tourney-container">
      <header className="tourney-header">
        <button className="btn-back" onClick={() => navigate("/teams")}>
          🔙 العودة
        </button>
        <div className="header-info">
          <h1>{isEven ? "شجرة التصفيات" : "نظام النقاط (دوري العام)"}</h1>
          {isAdmin && <span className="admin-tag">وضع الإدارة مفعّل</span>}
        </div>
        <div className="header-btns">
          {isAdmin && (
            <>
              <button className="btn-undo" onClick={handleUndo}>
                ↩ تراجع
              </button>
              <button
                className="btn-reset"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                🗑 تصفير
              </button>
            </>
          )}
        </div>
      </header>

      <main className="tourney-content">
        {!isEven ? (
          /* --- عرض نظام النقاط --- */
          <div className="league-layout">
            <div className="league-card">
              <h3>مباريات الدوري (الكل ضد الكل)</h3>
              <div className="matches-list">
                {leagueMatches.map((m, i) => (
                  <div key={i} className="league-match-row">
                    <span className="team-n">{m.t1}</span>
                    <div className="vs-actions">
                      {isAdmin && (
                        <button onClick={() => addPoint(m.t1)}>فوز</button>
                      )}
                      <span className="vs-label">VS</span>
                      {isAdmin && (
                        <button onClick={() => addPoint(m.t2)}>فوز</button>
                      )}
                    </div>
                    <span className="team-n">{m.t2}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="league-card">
              <h3>جدول الترتيب</h3>
              <table className="points-table">
                <thead>
                  <tr>
                    <th>الفريق</th>
                    <th>النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {[...currentActiveTeams]
                    .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
                    .map((tName, i) => (
                      <tr
                        key={i}
                        className={i === 0 && scores[tName] > 0 ? "top" : ""}
                      >
                        <td>
                          {tName} {i === 0 && scores[tName] > 0 && "🏆"}
                        </td>
                        <td>{scores[tName] || 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* --- عرض نظام الشجرة --- */
          <div className="bracket-layout">
            <div className="bracket-col">
              <h3>الجولة الأولى</h3>
              {teams.map(
                (_, i) =>
                  i % 2 === 0 &&
                  teams[i + 1] && (
                    <div key={i} className="match-card">
                      <div
                        className={`slot ${winners[`r1-${i}`] === teams[i].teamName ? "win" : ""}`}
                        onClick={() =>
                          selectWinner(
                            `r1-${i}`,
                            teams[i].teamName,
                            i < 2 ? "f1" : "f2",
                          )
                        }
                      >
                        {teams[i].teamName}
                      </div>
                      <div className="vs-line">VS</div>
                      <div
                        className={`slot ${winners[`r1-${i}`] === teams[i + 1].teamName ? "win" : ""}`}
                        onClick={() =>
                          selectWinner(
                            `r1-${i}`,
                            teams[i + 1].teamName,
                            i < 2 ? "f1" : "f2",
                          )
                        }
                      >
                        {teams[i + 1].teamName}
                      </div>
                    </div>
                  ),
              )}
            </div>
            <div className="arrow-icon">⮕</div>
            <div className="bracket-col">
              <h3>النهائي</h3>
              <div className="match-card gold">
                <div
                  className={`slot ${winners["final"] === winners["f1"] && winners["f1"] ? "champ" : ""}`}
                  onClick={() => selectWinner("final", winners["f1"], "done")}
                >
                  {winners["f1"] || "بانتظار فائز"}
                </div>
                <div className="vs-line">VS</div>
                <div
                  className={`slot ${winners["final"] === winners["f2"] && winners["f2"] ? "champ" : ""}`}
                  onClick={() => selectWinner("final", winners["f2"], "done")}
                >
                  {winners["f2"] || "بانتظار فائز"}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
