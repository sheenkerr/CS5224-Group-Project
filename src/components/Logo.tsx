import type { ReactElement } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

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

function FoxIcon({ size = 70 }: FoxIconProps): ReactElement {
    const { theme } = useTheme();

    if (theme === "dark") {
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    backgroundColor: "#ff8c00",
                    maskImage: "url(/flowfox.png)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    WebkitMaskImage: "url(/flowfox.png)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    display: "block",
                }}
            />
        );
    }

    return (
        <img
            src="/flowfox.png"
            alt="FlowFox"
            width={size}
            height={size}
            style={{ display: "block", objectFit: "contain" }}
        />
    );
}

function Logo({
    size = 70,
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
                        className="text-4xl font-medium tracking-[0.1em]"
                        style={{ color: colors.brand }}
                    >
                        FLOWFOX
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
