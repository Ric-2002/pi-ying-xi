import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { RehearsalPage } from "@/pages/RehearsalPage";
import { ReplayPage } from "@/pages/ReplayPage";
import { RoleSelectPage } from "@/pages/RoleSelectPage";
import { SourcesPage } from "@/pages/SourcesPage";
import { StagePage } from "@/pages/StagePage";
import { WorkshopPage } from "@/pages/WorkshopPage";

export default function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/roles" element={<RoleSelectPage />} />
        <Route path="/workshop/:roleId" element={<WorkshopPage />} />
        <Route path="/rehearsal/:roleId" element={<RehearsalPage />} />
        <Route path="/stage/:roleId" element={<StagePage />} />
        <Route path="/replay/:performanceId" element={<ReplayPage />} />
        <Route path="/sources" element={<SourcesPage />} />
      </Routes>
    </Router>
  );
}
