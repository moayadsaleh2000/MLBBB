import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./TournamentBracket.css";

export default function TournamentBracket() {
  const navigate = useNavigate();
  const [isAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [bracket, setBracket] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const createNewBracket = useCallback((teams) => {
    if (!teams || teams.length === 0) return;

    let firstRound = [];
    for (let i = 0; i < teams.length; i += 2) {
      const t1 = teams[i].teamName;
      const t2 = teams[i + 1] ? teams[i + 1].teamName : "باي (تأهل تلقائي)";

      firstRound.push({
        t1: t1,
        t2: t2,
        winner: t2 === "باي (تأهل تلقائي)" ? t1 : null,
      });
    }

    setBracket([firstRound]);
    localStorage.setItem("tourney_bracket", JSON.stringify([firstRound]));
  }, []);

  useEffect(() => {
    const savedBracket = localStorage.getItem("tourney_bracket");
    const liveTeams = JSON.parse(localStorage.getItem("generatedTeams")) || [];

    if (!savedBracket && liveTeams.length > 0) {
      createNewBracket(liveTeams);
    } else if (savedBracket) {
      setBracket(JSON.parse(savedBracket));
    }
    setIsLoaded(true);
  }, [createNewBracket]);

  const handleWin = (rIdx, mIdx, winner) => {
    if (!isAdmin || !winner || winner.includes("باي")) return;

    const newBracket = [...bracket];
    if (newBracket[rIdx][mIdx].winner) return;

    newBracket[rIdx][mIdx].winner = winner;

    const allFinished = newBracket[rIdx].every((m) => m.winner !== null);

    if (allFinished && newBracket[rIdx].length > 1) {
      const winners = newBracket[rIdx].map((m) => m.winner);
      let nextRound = [];
      for (let i = 0; i < winners.length; i += 2) {
        nextRound.push({
          t1: winners[i],
          t2: winners[i + 1] || "باي (تأهل تلقائي)",
          winner: winners[i + 1] ? null : winners[i],
        });
      }
      newBracket.push(nextRound);
    } else if (allFinished && newBracket[rIdx].length === 1) {
      Swal.fire("🏆 البطل هو", winner, "success");
    }

    setBracket(newBracket);
    localStorage.setItem("tourney_bracket", JSON.stringify(newBracket));
  };

  if (!isLoaded) return <div className="loading">جاري التحميل...</div>;

  return (
    <div className="tournament-page">
      <div className="header">
        <button className="btn-back" onClick={() => navigate("/teams")}>
          ↩ رجوع
        </button>
        <h1>شجرة البطولة ⚔️</h1>
      </div>

      <div className="bracket-container">
        {bracket.length > 0 ? (
          bracket.map((round, rIdx) => (
            <div key={rIdx} className="round-col">
              <h3>
                {rIdx === 0
                  ? "الدور الأول"
                  : rIdx === 1
                    ? "نصف النهائي"
                    : "النهائي"}
              </h3>
              {round.map((match, mIdx) => (
                <div key={mIdx} className="match-card">
                  <div
                    className={`team-box ${match.winner === match.t1 ? "winner" : ""}`}
                    onClick={() => handleWin(rIdx, mIdx, match.t1)}
                  >
                    {match.t1}
                  </div>
                  <div className="vs-divider">VS</div>
                  <div
                    className={`team-box ${match.winner === match.t2 ? "winner" : ""}`}
                    onClick={() => handleWin(rIdx, mIdx, match.t2)}
                  >
                    {match.t2}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="no-data">بانتظار إنشاء البطولة...</div>
        )}
      </div>
    </div>
  );
}
