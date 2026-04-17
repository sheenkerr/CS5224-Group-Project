import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
    TextField,
    InputAdornment,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    Search as SearchIcon,
    StarBorder as StarBorderIcon,
    Add as AddIcon,
    Apps as AppsIcon,
    Speed as SpeedIcon,
    Share as ShareIcon,
    Groups as GroupsIcon,
    Code as CodeIcon,
    Notifications as NotificationsIcon,
    CloudSync as CloudSyncIcon,
} from "@mui/icons-material";
import {
    applets as initialApplets,
    categories,
    type Applet,
} from "../data/applets";
import { useUser, useAuth } from "@clerk/react";
import AppletCard from "../components/AppletCard";
import Navigation from "../components/Navigation";
import { getApiBaseUrl } from "../utils/apiBaseUrl";

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
    const { userId, isLoaded: authLoaded, getToken } = useAuth();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [activities, setActivities] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);

    React.useEffect(() => {
        async function fetchUserData() {
            if (!userId) return;
            try {
                const token = await getToken();
                const baseUrl = getApiBaseUrl();

                const [actRes, notRes] = await Promise.all([
                    fetch(`${baseUrl}/api/user/activities`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch(`${baseUrl}/api/user/notifications`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if (actRes.ok) setActivities(await actRes.json());
                if (notRes.ok) setNotifications(await notRes.json());
            } catch (err) {
                console.error("Failed to fetch user data:", err);
            }
        }
        fetchUserData();
    }, [userId, getToken]);

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

    function getAppletRoute(applet: Applet): string {
        if (applet.name === "Mindmappers") {
            return `/applets/mindmappers`;
        }
        return `/applets/${applet.name}`;
    }

    function handleAppletClick(applet: Applet): void {
        navigate(getAppletRoute(applet));
    }

    function getCategoryButtonClass(isSelected: boolean): string {
        if (isSelected) {
            return "transition-colors border text-white! border-[#ff6b35]! bg-[#ff6b35]!";
        }
        return "transition-colors border text-gray-500! dark:text-gray-300! border-gray-200! dark:border-white/10! hover:bg-gray-100! dark:hover:bg-white/5!";
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

    React.useEffect(() => {
        if (authLoaded && !userId) {
            navigate("/login");
        }
    }, [authLoaded, userId, navigate]);

    if (!authLoaded || !userLoaded) {
        return renderLoadingState();
    }

    if (authLoaded && !userId) {
        return null; // Return nothing while redirecting
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
                            {filteredApplets.map((applet, index) => (
                                <AppletCard
                                    key={applet.id}
                                    applet={applet}
                                    index={index}
                                    onClick={handleAppletClick}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {filteredApplets.length === 0 && renderEmptyState()}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                    <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none transition-colors">
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-white/10 pb-4">
                            <NotificationsIcon sx={{ color: "#ff6b35" }} />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Notifications</h3>
                        </div>
                        {notifications.length > 0 ? (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {notifications.map((notif: any) => (
                                    <div key={notif._id} className="group p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-transparent hover:border-[#ff6b35]/20 transition-all cursor-pointer">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-[#ff6b35] transition-colors">{notif.title}</h4>
                                            {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#ff6b35]"></span>}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{notif.message}</p>
                                        <span className="text-xs text-gray-500">{new Date(notif.created_at).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">No new notifications</div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none transition-colors">
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-white/10 pb-4">
                            <CodeIcon sx={{ color: "#ff6b35" }} />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">Recent Activity</h3>
                        </div>
                        {activities.length > 0 ? (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {activities.map((act: any) => (
                                    <div key={act._id} className="flex gap-4 items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-[#ff6b35]/10 flex items-center justify-center shrink-0 mt-1">
                                            <StarBorderIcon sx={{ fontSize: 16, color: "#ff6b35" }} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-900 dark:text-white mb-1">
                                                <span className="font-medium text-[#ff6b35]">{act.action_type?.replace(/_/g, " ") || 'Unknown'}</span> {act.entity_type} {act.metadata?.title || act.metadata?.new_name || act.metadata?.old_name || act.entity_id}
                                            </p>
                                            <span className="text-xs text-gray-500">{new Date(act.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">No recent activity</div>
                        )}
                    </div>
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
