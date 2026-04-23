import {
  HashRouter as Router, // تم التغيير هنا
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import JoinPage from "./pages/JoinPage";
import WaitingPage from "./pages/WaitingPage";
import TeamsPage from "./pages/TeamsPage";
import TournamentBracket from "./pages/TournamentBracket";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JoinPage />} />
        <Route path="/waiting" element={<WaitingPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/bracket" element={<TournamentBracket />} />

        {/* --- هاد السطر هو الجوكر --- */}
        {/* أي حد بروح على bracket-setup أو أي رابط غلط برجع للجدول الصح أو للرئيسية */}
        <Route
          path="/bracket-setup"
          element={<Navigate to="/bracket" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
