import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    TextField,
    InputAdornment,
    Chip,
    Switch,
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
    ArrowForward as ArrowForwardIcon,
    Speed as SpeedIcon,
    Share as ShareIcon,
    Groups as GroupsIcon,
    Code as CodeIcon,
    Notifications as NotificationsIcon,
    CloudSync as CloudSyncIcon,
    Edit as EditIcon,
    ContentCopy as CloneIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";
import {
    applets as initialApplets,
    services,
    categories,
    type Applet,
} from "../data/applets";
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

    function renderAppletCard(applet: Applet, index: number): React.ReactElement {
        return (
            <motion.div
                key={applet.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden hover:border-[#ff6b35]/50 dark:hover:border-[#ff6b35]/50 transition-colors group shadow-sm dark:shadow-none"
            >
                <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${applet.trigger.color}20` }}
                            >
                                {renderServiceIcon(applet.trigger.icon, applet.trigger.color, "1.5rem")}
                            </div>

                            <div className="text-gray-400 dark:text-gray-500 transition-colors">
                                <ArrowForwardIcon />
                            </div>

                            {applet.actions.map(function (action, i) {
                                return (
                                    <div
                                        key={i}
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${action.color}20` }}
                                    >
                                        {renderServiceIcon(action.icon, action.color, "1.5rem")}
                                    </div>
                                );
                            })}
                        </div>

                        <Tooltip title={applet.enabled ? "Disable" : "Enable"}>
                            <Switch
                                checked={applet.enabled}
                                onChange={function () {
                                    toggleApplet(applet.id);
                                }}
                                size="small"
                                sx={{
                                    "& .MuiSwitch-switchBase.Mui-checked": {
                                        color: "#10b981",
                                    },
                                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                        backgroundColor: "#10b981",
                                    },
                                }}
                            />
                        </Tooltip>
                    </div>

                    <h3 className="text-gray-900 dark:text-white font-semibold mb-2 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff6b35] transition-colors">
                        {applet.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 transition-colors">
                        {applet.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {applet.tags.slice(0, 3).map(function (tag) {
                            return (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{
                                        backgroundColor: "rgba(255, 107, 53, 0.1)",
                                        color: "#ff6b35",
                                        fontSize: "0.7rem",
                                        height: "24px",
                                    }}
                                />
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10 transition-colors">
                        <span className="text-xs text-gray-500">
                            {applet.users.toLocaleString()} users
                        </span>
                        <div className="flex gap-1">
                            <Tooltip title="Edit">
                                <IconButton
                                    size="small"
                                    onClick={function () {
                                        openBuilder(applet);
                                    }}
                                    sx={{ color: "gray" }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Clone">
                                <IconButton
                                    size="small"
                                    onClick={function () {
                                        cloneApplet(applet);
                                    }}
                                    sx={{ color: "gray" }}
                                >
                                    <CloneIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    onClick={function () {
                                        deleteApplet(applet.id);
                                    }}
                                    sx={{
                                        color: "gray",
                                        "&:hover": { color: "#ef4444" },
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </div>
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
                        {filteredApplets.map(renderAppletCard)}
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
