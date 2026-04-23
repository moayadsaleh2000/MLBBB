import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function TournamentBracket() {
  const navigate = useNavigate();
  const [isAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [bracket, setBracket] = useState([]);

  const createNewBracket = useCallback((teams) => {
    console.log("Building new bracket for:", teams.length, "teams");
    let firstRound = [];
    // توزيع الفرق 2 بـ 2 بدقة
    for (let i = 0; i < teams.length; i += 2) {
      firstRound.push({
        t1: teams[i].teamName,
        t2: teams[i + 1] ? teams[i + 1].teamName : "باي",
        winner: teams[i + 1] ? null : teams[i].teamName,
      });
    }
    setBracket([firstRound]);
    localStorage.setItem("tourney_bracket", JSON.stringify([firstRound]));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("tourney_bracket");
    const liveTeams = JSON.parse(localStorage.getItem("generatedTeams")) || [];

    if (!saved && liveTeams.length > 0) {
      createNewBracket(liveTeams);
    } else if (saved) {
      setBracket(JSON.parse(saved));
    }
  }, [createNewBracket]);

  return (
    <div className="bracket-page">
      <button onClick={() => navigate("/teams")}>الرجوع للفرق</button>
      <div className="bracket-draw">
        {bracket.map((round, rIdx) => (
          <div key={rIdx} className="round">
            {round.map((match, mIdx) => (
              <div key={mIdx} className="match">
                <div>{match.t1}</div>
                <span>VS</span>
                <div>{match.t2}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
