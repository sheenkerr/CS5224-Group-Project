import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
    TextField,
    InputAdornment,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
} from "@mui/material";
import {
    Search as SearchIcon,
    Apps as AppsIcon,
    Add as AddIcon,
    Close as CloseIcon,
    Speed as SpeedIcon,
    Share as ShareIcon,
    Groups as GroupsIcon,
    Code as CodeIcon,
    Notifications as NotificationsIcon,
    CloudSync as CloudSyncIcon,
} from "@mui/icons-material";
import {
    applets as initialApplets,
    services,
    categories,
    type Applet,
} from "../data/applets";
import AppletCard from "../components/AppletCard";
import FlowBuilder from "../components/FlowBuilder";
import Navigation from "../components/Navigation";
import { renderServiceIcon } from "../utils/icons";

interface StatItem {
    label: string;
    value: string | number;
    color: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
    apps: <AppsIcon />,
    speed: <SpeedIcon />,
    share: <ShareIcon />,
    groups: <GroupsIcon />,
    code: <CodeIcon />,
    notifications: <NotificationsIcon />,
    backup: <CloudSyncIcon />,
};

function Applets(): React.ReactElement {
    const navigate = useNavigate();
    const [applets, setApplets] = useState<Applet[]>(initialApplets);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingApplet, setEditingApplet] = useState<Applet | null>(null);

    const filteredApplets = useMemo(function () {
        return applets.filter(function (applet) {
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
    }, [applets, searchQuery, selectedCategory]);

    const toggleApplet = useCallback(function (id: string): void {
        setApplets(function (prev) {
            return prev.map(function (a) {
                if (a.id === id) {
                    return { ...a, enabled: !a.enabled };
                }
                return a;
            });
        });
    }, []);

    const cloneApplet = useCallback(function (applet: Applet): void {
        const newApplet: Applet = {
            ...applet,
            id: `${applet.id}-clone-${Date.now()}`,
            name: `${applet.name} (Copy)`,
            users: 0,
        };
        setApplets(function (prev) {
            return [...prev, newApplet];
        });
    }, []);

    const deleteApplet = useCallback(function (id: string): void {
        setApplets(function (prev) {
            return prev.filter(function (a) {
                return a.id !== id;
            });
        });
    }, []);

    const openBuilder = useCallback(function (applet: Applet): void {
        setEditingApplet(applet);
        setIsBuilderOpen(true);
    }, []);

    const createNewApplet = useCallback(function (): void {
        setEditingApplet(null);
        setIsBuilderOpen(true);
    }, []);

    const saveApplet = useCallback(
        function (applet: Applet): void {
            if (editingApplet) {
                setApplets(function (prev) {
                    return prev.map(function (a) {
                        if (a.id === editingApplet.id) {
                            return applet;
                        }
                        return a;
                    });
                });
            } else {
                setApplets(function (prev) {
                    return [...prev, applet];
                });
            }
            setIsBuilderOpen(false);
            setEditingApplet(null);
        },
        [editingApplet],
    );

    const closeBuilder = useCallback(function (): void {
        setIsBuilderOpen(false);
    }, []);

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

    function getDialogTitle(): string {
        if (editingApplet) {
            return "Edit Applet";
        }
        return "Create New Applet";
    }

    const stats: StatItem[] = [
        { label: "Total Applets", value: applets.length, color: "#ff6b35" },
        {
            label: "Active",
            value: applets.filter(function (a) {
                return a.enabled;
            }).length,
            color: "#10b981",
        },
        {
            label: "Paused",
            value: applets.filter(function (a) {
                return !a.enabled;
            }).length,
            color: "#f59e0b",
        },
        {
            label: "Total Users",
            value: `${(applets.reduce(function (acc, a) {
                return acc + a.users;
            }, 0) / 1000000).toFixed(1)} M`,
            color: "#8b5cf6",
        },
    ];

    function renderStatCard(stat: StatItem): React.ReactElement {
        return (
            <div
                key={stat.label}
                className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/10 transition-colors shadow-sm dark:shadow-none"
            >
                <div className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                    {stat.label}
                </div>
            </div>
        );
    }



    function renderEmptyState(): React.ReactElement {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
            >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">
                    No applets found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
                    Try adjusting your search or create a new applet
                </p>
                <button
                    onClick={createNewApplet}
                    className="px-6 py-3 rounded-xl bg-[#ff6b35] text-white font-medium"
                >
                    Create New Applet
                </button>
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent dark:bg-linear-to-br dark:from-[#0f0f1a] dark:to-[#16213e] font-sans transition-colors">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4 flex-1">
                        <TextField
                            size="small"
                            placeholder="Search applets..."
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
                                width: 300,
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

                        <div className="flex gap-2">
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
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={createNewApplet}
                        className="px-6 py-2.5 rounded-xl text-white font-medium flex items-center gap-2"
                        style={{
                            background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                            boxShadow: "0 4px 20px rgba(255, 107, 53, 0.3)",
                        }}
                    >
                        <AddIcon fontSize="small" />
                        Create Applet
                    </motion.button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-4 gap-4 mb-8"
                >
                    {stats.map(renderStatCard)}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredApplets.map((applet, index) => (
                            <AppletCard
                                key={applet.id}
                                applet={applet}
                                index={index}
                                showControls={true}
                                onToggle={toggleApplet}
                                onEdit={openBuilder}
                                onClone={cloneApplet}
                                onDelete={deleteApplet}
                                onClick={handleAppletClick}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filteredApplets.length === 0 && renderEmptyState()}
            </main>

            <Dialog
                open={isBuilderOpen}
                onClose={closeBuilder}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "16px",
                    },
                    className: "bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 transition-colors",
                }}
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                    className="text-gray-900 dark:text-white transition-colors"
                >
                    <span>{getDialogTitle()}</span>
                    <IconButton
                        onClick={closeBuilder}
                        className="text-gray-500 hover:text-gray-900 dark:text-white dark:hover:text-gray-300"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <FlowBuilder
                        applet={editingApplet}
                        services={services}
                        onSave={saveApplet}
                        onCancel={closeBuilder}
                    />
                </DialogContent>
            </Dialog>

            <style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				.line-clamp-2 {
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}
			`}</style>
        </div>
    );
}

export default Applets;
