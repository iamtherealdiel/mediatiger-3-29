import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";
import BoutiqueMonetization from "./pages/features/BoutiqueMonetization";
import ChannelManagement from "./pages/features/ChannelManagement";
import DigitalRights from "./pages/features/DigitalRights";
import GlobalDistribution from "./pages/features/GlobalDistribution";
import HomePage from "./pages/HomePage";
import LabelGrowth from "./pages/LabelGrowth";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import PurpleLogin from "./pages/PurpleLogin";
import ShowGrowth from "./pages/ShowGrowth";
import SignUp from "./pages/SignUp";
import Welcome from "./pages/Welcome";
import { setDocumentTitle } from "./utils/titleUtils";

function App() {
  const location = useLocation();

  useEffect(() => {
    // Set document title based on current route
    const pathname = location.pathname;

    // Map routes to page titles
    const routeTitles: Record<string, string> = {
      "/": "Home",
      "/login": "Log In",
      "/signup": "Sign Up",
      "/welcome": "Welcome",
      "/dashboard": "Dashboard",
      "/features/channel-management": "Channel Management",
      "/features/boutique-monetization": "Boutique Monetization",
      "/purple": "Admin Panel",
      "/messages": "Messages",
      "/labelgrowth": "Label Growth",
      "/showgrowth": "Show Growth",
      "/purple-login": "Admin Login",
    };

    // Get the title for the current route or use a default
    const currentTitle = routeTitles[pathname] || "Page Not Found";

    // Set the document title
    setDocumentTitle(currentTitle);
  }, [location]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/features/channel-management"
        element={<ChannelManagement />}
      />
      <Route path="/features/digital-rights" element={<DigitalRights />} />
      <Route
        path="/features/global-distribution"
        element={<GlobalDistribution />}
      />
      <Route
        path="/features/boutique-monetization"
        element={<BoutiqueMonetization />}
      />
      <Route path="/" element={<HomePage />} />
      <Route
        path="/purple"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route path="/purple-login" element={<PurpleLogin />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/labelgrowth" element={<LabelGrowth />} />
      <Route path="/showgrowth" element={<ShowGrowth />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default App;
