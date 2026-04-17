import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { ClerkProvider, Show, RedirectToSignIn } from "@clerk/react";
import LandingPage from "./pages/LandingPage";
import Applets from "./pages/Applets";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Mindmapper from "./pages/Applets/Mindmapper/Mindmapper";
import MindmapperWorkspaces from "./pages/Applets/Mindmapper/MindmapperWorkspaces"; // ✅ NEW

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => (
  <>
    <Show when="signed-in">{children}</Show>
    <Show when="signed-out"><RedirectToSignIn /></Show>
  </>
);

/**
 * ClerkProviderWithRouting must be rendered INSIDE <Router> so it can
 * access useNavigate(). Passing routerPush / routerReplace tells the
 * Clerk SDK to use client-side navigation instead of window.location,
 * which prevents the full-page reload that was causing duplicate
 * verification emails.
 */
function ClerkProviderWithRouting({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      afterSignOutUrl={import.meta.env.BASE_URL}
      signInUrl={`${import.meta.env.BASE_URL}login`}
      signUpUrl={`${import.meta.env.BASE_URL}register`}
      signInFallbackRedirectUrl={`${import.meta.env.BASE_URL}dashboard`}
      signUpFallbackRedirectUrl={`${import.meta.env.BASE_URL}dashboard`}
    >
      {children}
    </ClerkProvider>
  );
}

function App(): React.ReactElement {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ClerkProviderWithRouting>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login/*" element={<Login />} />
          <Route path="/register/*" element={<Register />} />
          <Route path="/applets" element={<Applets />} />
          <Route path="/dashboard" element={<Dashboard />} />

          
          <Route
            path="/applets/mindmappers/setup"
            element={
              <ProtectedRoute>
                <Mindmapper isSetup={true} />
              </ProtectedRoute>
            }
          />


          <Route
            path="/applets/mindmappers"
            element={
              <ProtectedRoute>
                <MindmapperWorkspaces />
              </ProtectedRoute>
            }
          />


          <Route
            path="/applets/mindmappers/:mindmapperId"
            element={
              <ProtectedRoute>
                <Mindmapper isSetup={false} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ClerkProviderWithRouting>
    </Router>
  );
}

export default App;
