import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import Logo, { FoxIcon as FoxLogo } from "../components/Logo";

interface ParticlePosition {
    left: number;
    top: number;
    duration: number;
}

interface MousePosition {
    x: number;
    y: number;
}

const SERVICE_ICONS = ["📧", "📱", "💬", "📊", "🎵", "☁️"];
const NAV_ITEMS = ["FEATURES", "PRICING", "ABOUT"];

function LandingPage(): React.ReactElement {
    const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });

    const [particlePositions] = useState<ParticlePosition[]>(function () {
        return Array.from({ length: 20 }, function () {
            return {
                left: Math.random() * 100,
                top: Math.random() * 100,
                duration: 3 + Math.random() * 2,
            };
        });
    });

    useEffect(function () {
        function handleMouseMove(e: MouseEvent): void {
            setMousePos({ x: e.clientX, y: e.clientY });
        }
        window.addEventListener("mousemove", handleMouseMove);
        return function () {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    function getParticleColor(index: number): string {
        const opacity = 0.2 + (index % 3) * 0.1;
        return `rgba(255, ${120 + index * 5}, 0, ${opacity})`;
    }

    function renderParticle(pos: ParticlePosition, index: number): React.ReactElement {
        return (
            <motion.div
                key={index}
                className="absolute w-2 h-2 rounded-full"
                style={{
                    background: getParticleColor(index),
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                }}
                animate={{
                    y: [0, -30, 0],
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: pos.duration,
                    repeat: Infinity,
                    delay: index * 0.2,
                }}
            />
        );
    }

    function renderNavItem(item: string): React.ReactElement {
        return (
            <a
                key={item}
                href="#"
                className="hover:text-[#ff8c00] transition-colors duration-300"
            >
                {item}
            </a>
        );
    }

    function renderServiceIcon(icon: string, index: number): React.ReactElement {
        return (
            <motion.div
                key={index}
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm"
                style={{
                    background: "rgba(255, 255, 255, 0.9)",
                    boxShadow: "0 8px 32px rgba(255, 140, 0, 0.15)",
                }}
                animate={{
                    y: [0, -8, 0],
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: index * 0.3,
                }}
            >
                {icon}
            </motion.div>
        );
    }

    return (
        <div
            className="min-h-screen overflow-hidden relative"
            style={{
                fontFamily: "'Outfit', sans-serif",
                background:
                    "linear-gradient(135deg, #ffffff 0%, #faf8f5 50%, #ffffff 100%)",
            }}
        >
            {/* <motion.div
                className="fixed w-[250px] h-[250px] rounded-full pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle, rgba(255, 140, 0, 0.2) 0%, transparent 70%)",
                    filter: "blur(40px)",
                    left: mousePos.x - 125,
                    top: mousePos.y - 125,
                }}
                animate={{
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            /> */}

            <div className="fixed inset-0 pointer-events-none">
                {particlePositions.map(renderParticle)}
            </div>

            <nav className="relative z-10 flex justify-between items-center px-16 py-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center"
                >
                    <Logo showText variant="dark" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center gap-12"
                >
                    <div
                        className="flex gap-12 text-sm tracking-[0.2em]"
                        style={{ fontFamily: "'Outfit', sans-serif", color: "#666" }}
                    >
                        {NAV_ITEMS.map(renderNavItem)}
                    </div>
                    <div className="flex gap-4">
                        <Link
                            to="/login"
                            className="px-6 py-2 rounded-full font-medium tracking-wide transition-all duration-300 hover:bg-orange-50"
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                color: "#ff8c00",
                                border: "1px solid rgba(255, 140, 0, 0.3)",
                            }}
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="px-6 py-2 rounded-full text-white font-medium tracking-wide transition-all duration-300 hover:shadow-lg hover:scale-105"
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                background: "linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)",
                                boxShadow: "0 4px 20px rgba(255, 140, 0, 0.2)",
                            }}
                        >
                            Register
                        </Link>
                    </div>
                </motion.div>
            </nav>

            <main className="relative z-10 flex flex-col items-center justify-center min-h-[40vh] px-16">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="text-center"
                >
                    <h1
                        className="text-[8rem] leading-[0.9] font-light mb-8"
                        style={{
                            background:
                                "linear-gradient(135deg, #ff8c00 0%, #ff6b00 50%, #ffa500 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Automate
                        <br />
                        Your World
                    </h1>
                    <p
                        className="text-xl font-light tracking-wide max-w-2xl mx-auto mb-12"
                        style={{ fontFamily: "'Outfit', sans-serif", color: "#666" }}
                    >
                        Clever as a fox, easy as drag-and-drop.
                        The complete visual programming environment for productivity prosumers.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="flex gap-6"
                >
                    <Link
                        to="/register"
                        className="px-12 py-4 rounded-full text-white font-medium tracking-wide transition-all duration-300 hover:shadow-2xl hover:scale-105"
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            background: "linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)",
                            boxShadow: "0 10px 40px rgba(255, 140, 0, 0.3)",
                        }}
                    >
                        Start Free
                    </Link>
                    <button
                        className="px-12 py-4 rounded-full font-medium tracking-wide transition-all duration-300 hover:bg-orange-50"
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            color: "#ff8c00",
                            border: "1px solid rgba(255, 140, 0, 0.3)",
                        }}
                    >
                        Watch Demo
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="absolute top-150 flex gap-8"
                >
                    {SERVICE_ICONS.map(renderServiceIcon)}
                </motion.div>
            </main>

            <style>{`
				@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Outfit:wght@300;400;500&display=swap');
			`}</style>
        </div>
    );
}

export default LandingPage;
