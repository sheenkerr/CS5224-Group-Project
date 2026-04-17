import React from "react";
import { motion } from "motion/react";
import { Chip, Switch, IconButton, Tooltip } from "@mui/material";
import {
    ArrowForward as ArrowForwardIcon,
    Edit as EditIcon,
    ContentCopy as CloneIcon,
    Delete as DeleteIcon
} from "@mui/icons-material";
import { type Applet } from "../data/applets";
import { renderServiceIcon } from "../utils/icons";

interface AppletCardProps {
    applet: Applet;
    index?: number;
    onClick?: (applet: Applet) => void;
    showControls?: boolean;
    onToggle?: (id: string) => void;
    onEdit?: (applet: Applet) => void;
    onClone?: (applet: Applet) => void;
    onDelete?: (id: string) => void;
}

export default function AppletCard({
    applet,
    index = 0,
    onClick,
    showControls = false,
    onToggle,
    onEdit,
    onClone,
    onDelete
}: AppletCardProps): React.ReactElement {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * (showControls ? 0.05 : 0.03) }}
            className={`bg-white dark:bg-white/5 ${showControls ? "rounded-2xl" : "rounded-xl"} border border-gray-200 dark:border-white/10 overflow-hidden hover:border-[#ff6b35]/50 dark:hover:border-[#ff6b35]/50 transition-colors group shadow-sm dark:shadow-none ${onClick ? "cursor-pointer select-none" : ""}`}
            onClick={onClick ? () => onClick(applet) : undefined}
        >
            <div className={showControls ? "p-5" : "p-4"}>
                <div className="flex items-start justify-between mb-3">
                    <div className={`flex items-center ${showControls ? "gap-3" : "gap-2"}`}>
                        <div
                            className={`flex items-center justify-center ${showControls ? "w-12 h-12 rounded-xl" : "w-10 h-10 rounded-lg"}`}
                            style={{ backgroundColor: `${applet.trigger.color}20` }}
                        >
                            {renderServiceIcon(applet.trigger.icon, applet.trigger.color, showControls ? "1.5rem" : undefined)}
                        </div>

                        <div className={showControls ? "text-gray-400 dark:text-gray-500 transition-colors" : ""}>
                            <ArrowForwardIcon sx={showControls ? undefined : { color: "#666", fontSize: "1rem" }} />
                        </div>

                        {applet.actions.map(function (action, i) {
                            return (
                                <div
                                    key={i}
                                    className={`flex items-center justify-center ${showControls ? "w-12 h-12 rounded-xl" : "w-10 h-10 rounded-lg"}`}
                                    style={{ backgroundColor: `${action.color}20` }}
                                >
                                    {renderServiceIcon(action.icon, action.color, showControls ? "1.5rem" : undefined)}
                                </div>
                            );
                        })}
                    </div>

                    {showControls && onToggle && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <Tooltip title={applet.enabled ? "Disable" : "Enable"}>
                                <Switch
                                    checked={applet.enabled}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onToggle(applet.id);
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
                    )}
                </div>

                {showControls ? (
                    <h3 className="text-gray-900 dark:text-white font-semibold mb-2 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff6b35] transition-colors">
                        {applet.name}
                    </h3>
                ) : (
                    <h4 className="text-gray-900 dark:text-white font-medium mb-1 group-hover:text-[#ff6b35] dark:group-hover:text-[#ff6b35] transition-colors">
                        {applet.name}
                    </h4>
                )}
                
                <p className={`text-gray-600 dark:text-gray-400 text-sm line-clamp-2 ${showControls ? "mb-4" : "mb-3"} transition-colors`}>
                    {applet.description}
                </p>

                <div className={`flex flex-wrap ${showControls ? "gap-2 mb-4" : "gap-1 mb-2"}`}>
                    {applet.tags.slice(0, showControls ? 3 : 2).map((tag) => (
                        <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{
                                backgroundColor: "rgba(255, 107, 53, 0.1)",
                                color: "#ff6b35",
                                fontSize: showControls ? "0.7rem" : "0.65rem",
                                height: showControls ? "24px" : "20px",
                            }}
                        />
                    ))}
                </div>

                <div className={`flex items-center justify-between ${showControls ? "pt-3" : "pt-2"} border-t border-gray-100 dark:border-white/10 transition-colors`}>
                    <span className="text-xs text-gray-500">
                        {applet.users.toLocaleString()} users
                    </span>
                    {showControls && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            {onEdit && (
                                <Tooltip title="Edit">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(applet);
                                        }}
                                        sx={{ color: "gray" }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {onClone && (
                                <Tooltip title="Clone">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClone(applet);
                                        }}
                                        sx={{ color: "gray" }}
                                    >
                                        <CloneIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {onDelete && (
                                <Tooltip title="Delete">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(applet.id);
                                        }}
                                        sx={{
                                            color: "gray",
                                            "&:hover": { color: "#ef4444" },
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
