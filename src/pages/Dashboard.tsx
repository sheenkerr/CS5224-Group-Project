import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
    TextField,
    InputAdornment,
    Chip,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    Search as SearchIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    Add as AddIcon,
    ArrowForward as ArrowForwardIcon,
    Apps as AppsIcon,
    Speed as SpeedIcon,
    Share as ShareIcon,
    Groups as GroupsIcon,
    Code as CodeIcon,
    Notifications as NotificationsIcon,
    CloudSync as CloudSyncIcon,
} from "@mui/icons-material";
import { renderServiceIcon } from "../utils/icons";
import {
    applets as initialApplets,
    categories,
    type Applet,
} from "../data/applets";
import { useUser, useAuth } from "@clerk/clerk-react";
import Navigation from "../components/Navigation";

const categoryIcons: Record<string, React.ReactNode> = {
    apps: <AppsIcon />,
    speed: <SpeedIcon />,
    share: <ShareIcon />,
    groups: <GroupsIcon />,
    code: <CodeIcon />,
    notifications: <NotificationsIcon />,
    backup: <CloudSyncIcon />,
};

function Dashboard(): React.ReactElement | null {
    const navigate = useNavigate();
    const { user, isLoaded: userLoaded } = useUser();
    const { userId, isLoaded: authLoaded } = useAuth();

    const [favoriteApplets, setFavoriteApplets] = useState<string[]>(["1", "4", "8"]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    const filteredApplets = useMemo(function () {
        return initialApplets.filter(function (applet) {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                applet.name.toLowerCase().includes(searchLower) ||
                applet.description.toLowerCase().includes(searchLower) ||
                applet.tags.some(function (tag) {
                    return tag.toLowerCase().includes(searchLower);
                });

            const matchesCategory =
                selectedCategory === "all" || applet.tags.includes(selectedCategory);

            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory]);

    const favoriteAppletData = useMemo(function () {
        return initialApplets.filter(function (applet) {
            return favoriteApplets.includes(applet.id);
        });
    }, [favoriteApplets]);

    function toggleFavorite(id: string): void {
        setFavoriteApplets(function (prev) {
            if (prev.includes(id)) {
                return prev.filter(function (fid) {
                    return fid !== id;
                });
            }
            return [...prev, id];
        });
    }

    function getCategoryButtonClass(isSelected: boolean): string {
        if (isSelected) {
            return "transition-colors border text-white! border-[#ff6b35]! bg-[#ff6b35]!";
        }
        return "transition-colors border text-gray-500! dark:text-gray-300! border-gray-200! dark:border-white/10! hover:bg-gray-100! dark:hover:bg-white/5!";
    }

    function getFavoriteTooltip(isFavorite: boolean): string {
        if (isFavorite) {
            return "Remove from favorites";
        }
        return "Add to favorites";
    }

    function getFavoriteColor(isFavorite: boolean): string {
        if (isFavorite) {
            return "#ff6b35";
        }
        return "gray";
    }

    function renderFavoriteIcon(isFavorite: boolean): React.ReactElement {
        if (isFavorite) {
            return <StarIcon fontSize="small" />;
        }
        return <StarBorderIcon fontSize="small" />;
    }

    function renderFavoriteAppletCard(applet: Applet, index: number): React.ReactElement {
        return (
            <motion.div
                key={applet.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4 hover:border-[#ff6b35]/50 dark:hover:border-[#ff6b35]/50 transition-colors group shadow-sm dark:shadow-none"
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${applet.trigger.color}20` }}
                        >
                            {renderServiceIcon(applet.trigger.icon, applet.trigger.color)}
                        </div>
                        <ArrowForwardIcon sx={{ color: "#666", fontSize: "1rem" }} />
                        {applet.actions.map(function (action, i) {
                            return (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${action.color}20` }}
                                >
                                    {renderServiceIcon(action.icon, action.color)}
                                </div>
                            );
                        })}
                    </div>
                    <Tooltip title="Remove from favorites">
                        <IconButton
                            size="small"
                            onClick={function () {
                                toggleFavorite(applet.id);
                            }}
                            sx={{ color: "#ff6b35" }}
                        >
                            <StarIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </div>
                <h4 className="text-gray-900 dark:text-white font-medium mb-1 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff6b35] transition-colors">
                    {applet.name}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 transition-colors">
                    {applet.description}
                </p>
            </motion.div>
        );
    }

    function renderEmptyFavorites(): React.ReactElement {
        return (
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-8 text-center transition-colors shadow-sm dark:shadow-none">
                <StarBorderIcon sx={{ fontSize: 48, color: "gray", mb: 2 }} className="dark:text-gray-500" />
                <p className="text-gray-600 dark:text-gray-400 mb-2 transition-colors">No favorites yet</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm transition-colors">
                    Star applets from the discovery section to add them here
                </p>
            </div>
        );
    }

    function renderAppletCard(applet: Applet, index: number): React.ReactElement {
        const isFavorite = favoriteApplets.includes(applet.id);
        return (
            <motion.div
                key={applet.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-[#ff6b35]/50 dark:hover:border-[#ff6b35]/50 transition-colors group shadow-sm dark:shadow-none"
            >
                <div className="p-4" onClick={() => {
                    if (applet.name === "Mindmappers") {
                        navigate(`/applets/${applet.name}/setup`);
                    } else {
                        navigate(`/applets/${applet.name}`);
                    }
                }}>
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${applet.trigger.color}20` }}
                            >
                                {renderServiceIcon(applet.trigger.icon, applet.trigger.color)}
                            </div>

                            <ArrowForwardIcon sx={{ color: "#666", fontSize: "1rem" }} />

                            {applet.actions.map(function (action, i) {
                                return (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${action.color}20` }}
                                    >
                                        {renderServiceIcon(action.icon, action.color)}
                                    </div>
                                );
                            })}
                        </div>

                        <Tooltip title={getFavoriteTooltip(isFavorite)}>
                            <IconButton
                                size="small"
                                onClick={function () {
                                    toggleFavorite(applet.id);
                                }}
                                sx={{ color: getFavoriteColor(isFavorite) }}
                            >
                                {renderFavoriteIcon(isFavorite)}
                            </IconButton>
                        </Tooltip>
                    </div>

                    <h4 className="text-gray-900 dark:text-white font-medium mb-1 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff6b35] transition-colors">
                        {applet.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3 transition-colors">
                        {applet.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-2">
                        {applet.tags.slice(0, 2).map(function (tag) {
                            return (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{
                                        backgroundColor: "rgba(255, 107, 53, 0.1)",
                                        color: "#ff6b35",
                                        fontSize: "0.65rem",
                                        height: "20px",
                                    }}
                                />
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10 transition-colors">
                        <span className="text-xs text-gray-500">
                            {applet.users.toLocaleString()} users
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    function renderEmptyState(): React.ReactElement {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
            >
                <div className="text-5xl mb-4">🔍</div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">
                    No applets found
                </h4>
                <p className="text-gray-600 dark:text-gray-400 transition-colors">
                    Try adjusting your search or category filter
                </p>
            </motion.div>
        );
    }

    function renderLoadingState(): React.ReactElement {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-transparent dark:bg-linear-to-br dark:from-[#0f0f1a] dark:to-[#16213e] transition-colors">
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-gray-900 dark:text-white text-xl"
                >
                    Loading...
                </motion.div>
            </div>
        );
    }

    function getWelcomeName(): string {
        if (user?.firstName) {
            return `, ${user.firstName}`;
        }
        return "";
    }

    if (authLoaded && !userId) {
        navigate("/login");
        return null;
    }

    if (!authLoaded || !userLoaded) {
        return renderLoadingState();
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent dark:bg-linear-to-br dark:from-[#0f0f1a] dark:to-[#16213e] font-sans transition-colors">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
                        Welcome back{getWelcomeName()}!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 transition-colors">
                        Manage your automations and discover new applets
                    </p>
                </motion.div>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <StarIcon sx={{ color: "#ff6b35" }} />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Favorite Applets</h3>
                    </div>

                    {favoriteAppletData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {favoriteAppletData.map(renderFavoriteAppletCard)}
                            </AnimatePresence>
                        </div>
                    ) : renderEmptyFavorites()}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <SearchIcon sx={{ color: "#ff6b35" }} />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Discover Applets</h3>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mb-4"
                    >
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search applets, services, tags..."
                            value={searchQuery}
                            onChange={function (e) {
                                setSearchQuery(e.target.value);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon className="text-gray-400 dark:text-gray-500" />
                                    </InputAdornment>
                                ),
                            }}
                            className="bg-white dark:bg-white/5 text-gray-900 dark:text-gray-200 rounded-xl transition-colors shadow-sm dark:shadow-none"
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "12px",
                                    color: "inherit",
                                    "& fieldset": { borderColor: "var(--tw-border-opacity)" },
                                    "&:hover fieldset": {
                                        borderColor: "var(--tw-border-opacity)",
                                    },
                                    "&.Mui-focused fieldset": { borderColor: "#ff6b35" },
                                },
                            }}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="flex gap-3 mb-6 overflow-x-auto pb-2"
                    >
                        {categories.map(function (category) {
                            return (
                                <Tooltip key={category.id} title={category.name}>
                                    <IconButton
                                        onClick={function () {
                                            setSelectedCategory(category.id);
                                        }}
                                        className={getCategoryButtonClass(selectedCategory === category.id)}
                                    >
                                        {categoryIcons[category.icon]}
                                    </IconButton>
                                </Tooltip>
                            );
                        })}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <AnimatePresence>
                            {filteredApplets.map(renderAppletCard)}
                        </AnimatePresence>
                    </motion.div>

                    {filteredApplets.length === 0 && renderEmptyState()}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-8 text-center transition-colors shadow-sm dark:shadow-none">
                        <div
                            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                            style={{
                                background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                                boxShadow: "0 4px 20px rgba(255, 107, 53, 0.3)",
                            }}
                        >
                            <AddIcon sx={{ color: "white", fontSize: 32 }} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">
                            Create Your Own Applet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto transition-colors">
                            Build custom automation workflows by connecting triggers and actions
                            from your favorite services.
                        </p>
                        <div className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931e] text-white font-medium">
                            Coming Soon
                        </div>
                    </div>
                </motion.section>
            </main>
        </div>
    );
}

export default Dashboard;
