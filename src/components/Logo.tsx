import type { ReactElement } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    variant?: "light" | "dark";
    subtitle?: string;
    linkToHome?: boolean;
    onClick?: () => void;
}

interface FoxIconProps {
    size?: number;
}

function FoxIcon({ size = 40 }: FoxIconProps): ReactElement {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="foxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff9f43" />
                    <stop offset="50%" stopColor="#ff8c00" />
                    <stop offset="100%" stopColor="#e67e22" />
                </linearGradient>
                <linearGradient id="earGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ff8c00" />
                    <stop offset="100%" stopColor="#ffb366" />
                </linearGradient>
                <linearGradient id="muzzleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f5f5f5" />
                </linearGradient>
            </defs>

            {/* Left ear - sharp geometric triangle */}
            <path
                d="M18 40 L32 8 L42 38 Z"
                fill="url(#earGradient)"
            />

            {/* Right ear - sharp geometric triangle */}
            <path
                d="M58 38 L68 8 L82 40 Z"
                fill="url(#earGradient)"
            />

            {/* Left ear inner accent */}
            <path
                d="M26 36 L32 16 L38 35 Z"
                fill="#ffd699"
            />

            {/* Right ear inner accent */}
            <path
                d="M62 35 L68 16 L74 36 Z"
                fill="#ffd699"
            />

            {/* Main face - rounded hexagonal shape */}
            <path
                d="M25 42 
                   Q25 28 50 25 
                   Q75 28 75 42 
                   L75 62 
                   Q75 82 50 85 
                   Q25 82 25 62 
                   Z"
                fill="url(#foxGradient)"
            />

            {/* White muzzle - sleek curved shape */}
            <path
                d="M32 55 
                   Q32 72 50 78 
                   Q68 72 68 55 
                   Q60 68 50 68 
                   Q40 68 32 55 
                   Z"
                fill="url(#muzzleGradient)"
            />

            {/* Left eye - modern almond shape */}
            <path
                d="M34 46 Q38 42 44 46 Q38 50 34 46 Z"
                fill="#1a1a1a"
            />

            {/* Right eye - modern almond shape */}
            <path
                d="M56 46 Q62 42 66 46 Q62 50 56 46 Z"
                fill="#1a1a1a"
            />

            {/* Left eye highlight */}
            <circle cx="36" cy="44" r="1.5" fill="white" />

            {/* Right eye highlight */}
            <circle cx="58" cy="44" r="1.5" fill="white" />

            {/* Nose - rounded triangle */}
            <path
                d="M46 60 Q50 56 54 60 Q54 64 50 66 Q46 64 46 60 Z"
                fill="#1a1a1a"
            />

            {/* Nose highlight */}
            <ellipse cx="50" cy="59" rx="2" ry="1" fill="#4a4a4a" />

            {/* Mouth - subtle smile */}
            <path
                d="M46 70 Q50 74 54 70"
                stroke="#1a1a1a"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
            />

            {/* Whisker dots - left */}
            <circle cx="34" cy="62" r="1" fill="#e0e0e0" />
            <circle cx="32" cy="66" r="1" fill="#e0e0e0" />

            {/* Whisker dots - right */}
            <circle cx="66" cy="62" r="1" fill="#e0e0e0" />
            <circle cx="68" cy="66" r="1" fill="#e0e0e0" />

            {/* Face highlight - subtle sheen */}
            <ellipse
                cx="50"
                cy="38"
                rx="15"
                ry="6"
                fill="white"
                opacity="0.15"
            />
        </svg>
    );
}

function Logo({
    size = 40,
    showText = false,
    className = "",
    variant = "dark",
    subtitle,
    linkToHome = false,
    onClick,
}: LogoProps): ReactElement {
    const textColors = {
        light: {
            primary: "text-white",
            secondary: "text-gray-400",
            brand: "#ff8c00",
        },
        dark: {
            primary: "text-gray-900",
            secondary: "text-gray-500",
            brand: "#ff8c00",
        },
    };

    const colors = textColors[variant];

    const content = (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-3 ${onClick ? "cursor-pointer" : ""} ${className}`}
            onClick={onClick}
        >
            <FoxIcon size={size} />
            {showText && (
                <div>
                    <h1
                        className="text-xl font-bold tracking-wide"
                        style={{ color: colors.brand }}
                    >
                        FlowFox
                    </h1>
                    {subtitle && (
                        <p className={`text-xs ${colors.secondary}`}>{subtitle}</p>
                    )}
                </div>
            )}
        </motion.div>
    );

    if (linkToHome) {
        return <Link to="/">{content}</Link>;
    }

    return content;
}

export default Logo;
export { FoxIcon };
