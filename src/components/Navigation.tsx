import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import {
    Dashboard as DashboardIcon,
    Apps as AppsIcon,
    LightMode as LightModeIcon,
    DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import { useUser, UserButton } from "@clerk/react";
import { FoxIcon as FoxLogo } from "./Logo";
import { IconButton } from "@mui/material";
import { useTheme } from "../context/ThemeContext";

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactElement;
}

function Navigation(): React.ReactElement {
    const location = useLocation();
    const { user } = useUser();
    const { theme, toggleTheme } = useTheme();

    const navItems: NavItem[] = [
        { path: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
        { path: "/applets", label: "Applets", icon: <AppsIcon /> },
    ];

    function getNavItemClass(isActive: boolean): string {
        if (isActive) {
            return "relative px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all text-gray-900 dark:text-white";
        }
        return "relative px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5";
    }

    function getIconClass(isActive: boolean): string {
        if (isActive) {
            return "transition-colors text-[#ff6b35]";
        }
        return "transition-colors text-current";
    }

    function renderThemeIcon(): React.ReactElement {
        if (theme === "dark") {
            return <LightModeIcon />;
        }
        return <DarkModeIcon />;
    }

    return (
        <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#0f0f1a]/80 border-b border-gray-200 dark:border-white/10 transition-colors">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/dashboard" className="flex items-center gap-3 group">
                            <FoxLogo />
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-gray-900 dark:text-white tracking-wide group-hover:text-[#ff6b35] transition-colors">
                                    FlowFox
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 tracking-wider uppercase">
                                    Automation Studio
                                </span>
                            </div>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map(function (item) {
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={getNavItemClass(isActive)}
                                    >
                                        <span className={getIconClass(isActive)}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-pill"
                                                className="absolute inset-0 bg-gray-100 dark:bg-white/10 rounded-xl -z-10"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 500,
                                                    damping: 30,
                                                }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <IconButton
                            onClick={toggleTheme}
                            sx={{ color: theme === "dark" ? "white" : "gray" }}
                        >
                            {renderThemeIcon()}
                        </IconButton>
                        {user && (
                            <div className="flex items-center gap-3">
                                <span className="text-gray-700 dark:text-gray-300 text-sm hidden md:block">
                                    {user.fullName || user.username}
                                </span>
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-10 h-10 border-2 border-[#ff6b35]",
                                        },
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;
