import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./TournamentBracket.css";

export default function TournamentBracket() {
  const navigate = useNavigate();
  const [isAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [mode, setMode] = useState(""); // "points" or "bracket"
  const [pointsTable, setPointsTable] = useState([]);
  const [leagueMatches, setLeagueMatches] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedTeams = JSON.parse(localStorage.getItem("generatedTeams")) || [];
    if (savedTeams.length < 2) return;

    if (savedTeams.length === 3) {
      setMode("points");
      setPointsTable(
        savedTeams.map((t) => ({ name: t.teamName, points: 0, wins: 0 })),
      );
      setLeagueMatches([
        {
          id: 1,
          t1: savedTeams[0].teamName,
          t2: savedTeams[1].teamName,
          winner: null,
        },
        {
          id: 2,
          t1: savedTeams[0].teamName,
          t2: savedTeams[2].teamName,
          winner: null,
        },
        {
          id: 3,
          t1: savedTeams[1].teamName,
          t2: savedTeams[2].teamName,
          winner: null,
        },
      ]);
    } else {
      setMode("bracket");
      setupBracket(savedTeams);
    }
  }, []);

  // --- منطق الشجرة (لـ 2 أو 4 فرق وأكثر) ---
  const setupBracket = (savedTeams) => {
    let firstRound = [];
    for (let i = 0; i < savedTeams.length; i += 2) {
      const t1 = savedTeams[i]?.teamName;
      const t2 = savedTeams[i + 1]?.teamName || null; // نظام الـ Bye للفردي
      firstRound.push({ t1, t2, winner: t2 ? null : t1 });
    }
    setRounds([firstRound]);
  };

  const handleBracketWin = (rIdx, mIdx, winner) => {
    if (!isAdmin) return;
    setHistory([
      ...history,
      JSON.stringify({ rounds, pointsTable, leagueMatches }),
    ]);
    const newRounds = [...rounds];
    newRounds[rIdx][mIdx].winner = winner;

    const nextRIdx = rIdx + 1;
    if (!newRounds[nextRIdx]) {
      const size = Math.ceil(newRounds[rIdx].length / 2);
      newRounds[nextRIdx] = Array.from({ length: size }, () => ({
        t1: null,
        t2: null,
        winner: null,
      }));
    }

    const nextMIdx = Math.floor(mIdx / 2);
    if (mIdx % 2 === 0) newRounds[nextRIdx][nextMIdx].t1 = winner;
    else newRounds[nextRIdx][nextMIdx].t2 = winner;
    setRounds(newRounds);
  };

  // --- منطق النقاط (لـ 3 فرق فقط) ---
  const handleLeagueWin = (mId, winnerName) => {
    if (!isAdmin) return;
    setHistory([
      ...history,
      JSON.stringify({ rounds, pointsTable, leagueMatches }),
    ]);

    const newMatches = leagueMatches.map((m) =>
      m.id === mId ? { ...m, winner: winnerName } : m,
    );
    const newTable = pointsTable.map((t) =>
      t.name === winnerName
        ? { ...t, points: t.points + 3, wins: t.wins + 1 }
        : t,
    );

    setLeagueMatches(newMatches);
    setPointsTable(newTable);
    Swal.fire({
      title: `كفو ${winnerName}`,
      icon: "success",
      timer: 700,
      showConfirmButton: false,
    });
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = JSON.parse(history[history.length - 1]);
    setRounds(prev.rounds);
    setPointsTable(prev.pointsTable);
    setLeagueMatches(prev.leagueMatches);
    setHistory(history.slice(0, -1));
  };

  return (
    <div className="tournament-page">
      <div className="header-nav">
        <button className="back-btn" onClick={() => navigate("/teams")}>
          الرجوع
        </button>
        <h1>{mode === "points" ? "دوري النقاط" : "شجرة البطولة"}</h1>
        {isAdmin && (
          <div className="admin-btns">
            <button
              className="undo-btn"
              onClick={undo}
              disabled={history.length === 0}
            >
              تراجع
            </button>
            <button
              className="reset-btn"
              onClick={() => window.location.reload()}
            >
              تصفير
            </button>
          </div>
        )}
      </div>

      {mode === "points" ? (
        /* واجهة الـ 3 فرق */
        <div className="league-content">
          <div className="matches-grid">
            {leagueMatches.map((m) => (
              <div
                key={m.id}
                className={`match-card ${m.winner ? "done" : ""}`}
              >
                <div className="m-teams">
                  <span>{m.t1}</span> <small>VS</small> <span>{m.t2}</span>
                </div>
                {isAdmin && !m.winner && (
                  <div className="m-btns">
                    <button onClick={() => handleLeagueWin(m.id, m.t1)}>
                      فوز {m.t1}
                    </button>
                    <button onClick={() => handleLeagueWin(m.id, m.t2)}>
                      فوز {m.t2}
                    </button>
                  </div>
                )}
                {m.winner && <div className="win-tag">الفائز: {m.winner}</div>}
              </div>
            ))}
          </div>
          <div className="points-board">
            {pointsTable
              .sort((a, b) => b.points - a.points)
              .map((t, i) => (
                <div key={i} className={`board-row ${i === 0 ? "top" : ""}`}>
                  <span>
                    {i + 1}. {t.name} {i === 0 && "🏆"}
                  </span>
                  <span className="pts">{t.points} نقطة</span>
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* واجهة الشجرة لـ 2، 4، 5+ فرق */
        <div className="bracket-area">
          <div className="bracket-wrapper">
            {rounds.map((round, rIdx) => (
              <div key={rIdx} className="round-col">
                <h3>الجولة {rIdx + 1}</h3>
                {round.map((match, mIdx) => (
                  <div key={mIdx} className="m-box">
                    <div
                      className={`t-row ${match.winner === match.t1 ? "win" : ""}`}
                      onClick={() =>
                        match.t1 &&
                        !match.winner &&
                        handleBracketWin(rIdx, mIdx, match.t1)
                      }
                    >
                      {match.t1 || "..."}
                    </div>
                    <div
                      className={`t-row ${match.winner === match.t2 ? "win" : ""} ${!match.t2 && rIdx === 0 ? "bye" : ""}`}
                      onClick={() =>
                        match.t2 &&
                        !match.winner &&
                        handleBracketWin(rIdx, mIdx, match.t2)
                      }
                    >
                      {match.t2
                        ? match.t2
                        : match.t1 && rIdx === 0
                          ? "Bye"
                          : "..."}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
