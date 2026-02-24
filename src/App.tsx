import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import LandingPage from "./pages/LandingPage";
import Applets from "./pages/Applets";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

function App(): React.ReactElement {
	return (
		<ClerkProvider
			publishableKey={PUBLISHABLE_KEY}
			afterSignOutUrl="/"
			signInUrl="/login"
			signUpUrl="/register"
			signInFallbackRedirectUrl="/dashboard"
			signUpFallbackRedirectUrl="/dashboard"
		>
			<Router>
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/login/*" element={<Login />} />
					<Route path="/register/*" element={<Register />} />
					<Route path="/applets" element={<Applets />} />
					<Route path="/dashboard" element={<Dashboard />} />
				</Routes>
			</Router>
		</ClerkProvider>
	);
}

export default App;
