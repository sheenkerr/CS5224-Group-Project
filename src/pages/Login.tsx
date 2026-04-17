import React from "react";
import { SignIn } from "@clerk/react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

function Login(): React.ReactElement {
	return (
		<div
			className="min-h-screen flex flex-col"
			style={{
				fontFamily: "'Outfit', sans-serif",
				background:
					"linear-gradient(135deg, #ffffff 0%, #faf8f5 50%, #ffffff 100%)",
			}}
		>
			<header className="flex items-center justify-between px-16 py-6">
				<Link to="/" className="flex items-center gap-3">
					<Logo showText variant="dark" />
				</Link>
				<div className="flex items-center gap-4">
					<span className="text-gray-500">Don't have an account?</span>
					<Link
						to="/register"
						className="px-6 py-2 rounded-full font-medium transition-all duration-300 hover:bg-orange-50"
						style={{
							color: "#ff8c00",
							border: "1px solid rgba(255, 140, 0, 0.3)",
						}}
					>
						Register
					</Link>
				</div>
			</header>

			<main className="flex-1 flex items-center justify-center px-16">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="w-full max-w-md"
				>
					<SignIn
						appearance={{
							elements: {
								rootBox: "w-full",
								card: "shadow-lg rounded-2xl border border-gray-100",
								socialButtonsBlockButton:
									"w-full rounded-full border border-gray-200 hover:bg-gray-50 transition-colors",
								socialButtonsBlockButtonText: "font-medium",
								dividerLine: "bg-gray-200",
								dividerText: "text-gray-400 text-sm",
								formFieldInput:
									"rounded-lg border-gray-200 focus:border-[#ff8c00] focus:ring-[#ff8c00]",
								formFieldLabel: "text-gray-600 font-medium",
								formButtonPrimary:
									"bg-[#ff8c00] hover:bg-[#ff6b00] rounded-full font-medium transition-colors",
								footerActionLink: "text-[#ff8c00] hover:text-[#ff6b00]",
							},
						}}
						routing="path"
						path="/login"
						signUpUrl="/register"
						fallbackRedirectUrl="/dashboard"
					/>
				</motion.div>
			</main>

			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Outfit:wght@300;400;500&display=swap');
			`}</style>
		</div>
	);
}

export default Login;
