import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import LandingPage from "./pages/LandingPage";
import Applets from "./pages/Applets";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Mindmapper from "./pages/Applets/MindmapperSetup";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

function App(): React.ReactElement {
	return (
		<ClerkProvider
			publishableKey={PUBLISHABLE_KEY}
			afterSignOutUrl={import.meta.env.BASE_URL}
			signInUrl={`${import.meta.env.BASE_URL}login`}
			signUpUrl={`${import.meta.env.BASE_URL}register`}
			signInFallbackRedirectUrl={`${import.meta.env.BASE_URL}dashboard`}
			signUpFallbackRedirectUrl={`${import.meta.env.BASE_URL}dashboard`}
		>
			<Router basename={import.meta.env.BASE_URL}>
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/login/*" element={<Login />} />
					<Route path="/register/*" element={<Register />} />
					<Route path="/applets" element={<Applets />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/applets/Mindmappers" element={<Mindmapper />} />
				</Routes>
			</Router>
		</ClerkProvider>
	);
}

export default App;
