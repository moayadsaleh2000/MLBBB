import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TournamentBracket.css";

export default function TournamentBracket() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // State Management
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
        setTeams(res.data.teams || res.data || []);
      } catch (err) {
        console.error("Error fetching teams");
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // المنطق الذكي للتحويل بين الشجرة والنقاط
  const { isLeagueMode, activeTeams } = useMemo(() => {
    const allNames = teams.map((t) => t.teamName);
    const r1Winners = Object.keys(winners)
      .filter((k) => k.startsWith("r1-"))
      .map((k) => winners[k]);
    const totalExpectedR1 = Math.floor(teams.length / 2);

    // 1. إذا كان العدد الأصلي فردي
    if (teams.length > 0 && teams.length % 2 !== 0) {
      return { isLeagueMode: true, activeTeams: allNames };
    }
    // 2. إذا خلصت الجولة الأولى والعدد الناتج فردي (مثل 6 فرق صاروا 3)
    if (
      r1Winners.length === totalExpectedR1 &&
      r1Winners.length > 0 &&
      r1Winners.length % 2 !== 0
    ) {
      return { isLeagueMode: true, activeTeams: r1Winners };
    }

    return { isLeagueMode: false, activeTeams: allNames };
  }, [winners, teams]);

  const leagueMatches = useMemo(() => {
    let m = [];
    for (let i = 0; i < activeTeams.length; i++) {
      for (let j = i + 1; j < activeTeams.length; j++) {
        m.push([activeTeams[i], activeTeams[j]]);
      }
    }
    return m;
  }, [activeTeams]);

  const selectWinner = (id, name) => {
    if (!isAdmin || !name) return;
    setHistory((p) => [...p, { type: "winner", data: { ...winners } }]);
    setWinners((p) => ({ ...p, [id]: name }));
  };

  const addPoint = (name) => {
    if (!isAdmin) return;
    setHistory((p) => [...p, { type: "points", data: { ...scores } }]);
    setScores((p) => ({ ...p, [name]: (p[name] || 0) + 3 }));
  };

  const handleFullReset = () => {
    if (!window.confirm("هل تريد تصفير البطولة؟ (سيبقى الأدمن مسجلاً)")) return;
    // مسح بيانات البطولة فقط
    localStorage.removeItem("t_winners");
    localStorage.removeItem("t_scores");
    localStorage.removeItem("t_history");
    setWinners({});
    setScores({});
    setHistory([]);
    window.location.reload();
  };

  const handleUndo = () => {
    if (!isAdmin || history.length === 0) return;
    const last = history[history.length - 1];
    if (last.type === "winner") setWinners(last.data);
    else setScores(last.data);
    setHistory((p) => p.slice(0, -1));
  };

  if (loading) return <div className="loader">جاري التحميل...</div>;

  return (
    <div className="tourney-container">
      <header className="tourney-header">
        <button className="btn-back" onClick={() => navigate("/teams")}>
          🔙 العودة
        </button>
        <h1>{isLeagueMode ? "مرحلة النقاط" : "شجرة التصفيات"}</h1>
        {isAdmin && (
          <div className="admin-btns">
            <button className="btn-undo" onClick={handleUndo}>
              ↩ تراجع
            </button>
            <button className="btn-reset" onClick={handleFullReset}>
              🗑 تصفير
            </button>
          </div>
        )}
      </header>

      <main className="tourney-content">
        {isLeagueMode ? (
          <div className="league-layout">
            <div className="league-card">
              <h3>📊 الترتيب</h3>
              <div className="points-list">
                {activeTeams
                  .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
                  .map((name, i) => (
                    <div key={i} className="league-row">
                      <span>{name}</span>
                      <div className="row-left">
                        <span className="pts-tag">{scores[name] || 0} Pts</span>
                        {isAdmin && (
                          <button onClick={() => addPoint(name)}>+</button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="league-card">
              <h3>⚔️ المباريات</h3>
              {leagueMatches.map((m, i) => (
                <div key={i} className="match-simple">
                  {m[0]} <span className="vs">VS</span> {m[1]}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bracket-wrapper">
            {/* الجولة 1 */}
            <div className="bracket-column">
              <h4 className="col-title">الجولة 1</h4>
              <div className="col-content">
                {teams.map(
                  (_, i) =>
                    i % 2 === 0 &&
                    teams[i + 1] && (
                      <div key={i} className="match-pair">
                        <div
                          className={`slot ${winners[`r1-${i}`] === teams[i].teamName ? "won" : ""} ${!isAdmin ? "no-admin" : ""}`}
                          onClick={() =>
                            selectWinner(`r1-${i}`, teams[i].teamName)
                          }
                        >
                          {teams[i].teamName}
                        </div>
                        <div
                          className={`slot ${winners[`r1-${i}`] === teams[i + 1].teamName ? "won" : ""} ${!isAdmin ? "no-admin" : ""}`}
                          onClick={() =>
                            selectWinner(`r1-${i}`, teams[i + 1].teamName)
                          }
                        >
                          {teams[i + 1].teamName}
                        </div>
                      </div>
                    ),
                )}
              </div>
            </div>

            <div className="divider">⮕</div>

            {/* نصف النهائي */}
            <div className="bracket-column">
              <h4 className="col-title">نصف النهائي</h4>
              <div className="col-content">
                {[0, 2].map((i) => (
                  <div key={i} className="match-pair">
                    <div
                      className={`slot ${winners[`r2-${i}`] && winners[`r2-${i}`] === winners[`r1-${i}`] ? "won" : ""} ${!isAdmin || !winners[`r1-${i}`] ? "no-admin" : ""}`}
                      onClick={() =>
                        winners[`r1-${i}`] &&
                        selectWinner(`r2-${i}`, winners[`r1-${i}`])
                      }
                    >
                      {winners[`r1-${i}`] || "..."}
                    </div>
                    <div
                      className={`slot ${winners[`r2-${i}`] && winners[`r2-${i}`] === winners[`r1-${i + 2}`] ? "won" : ""} ${!isAdmin || !winners[`r1-${i + 2}`] ? "no-admin" : ""}`}
                      onClick={() =>
                        winners[`r1-${i + 2}`] &&
                        selectWinner(`r2-${i}`, winners[`r1-${i + 2}`])
                      }
                    >
                      {winners[`r1-${i + 2}`] || "..."}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider">🏆</div>

            {/* البطل */}
            <div className="bracket-column">
              <h4 className="col-title">البطل</h4>
              <div className="col-content center">
                <div
                  className={`winner-podium ${winners["final"] ? "is-active" : ""}`}
                >
                  <div className="trophy-big">🏆</div>
                  {winners["final"] ? (
                    <h2 className="winner-name">{winners["final"]}</h2>
                  ) : (
                    <div className="pick-final">
                      <p>انتظار الحسم</p>
                      {isAdmin && (
                        <div className="final-btns">
                          <button
                            disabled={!winners["r2-0"]}
                            onClick={() =>
                              selectWinner("final", winners["r2-0"])
                            }
                          >
                            {winners["r2-0"] || "?"}
                          </button>
                          <button
                            disabled={!winners["r2-2"]}
                            onClick={() =>
                              selectWinner("final", winners["r2-2"])
                            }
                          >
                            {winners["r2-2"] || "?"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
