export interface Service {
	id: string;
	name: string;
	icon: string;
	color: string;
}

export interface Applet {
	id: string;
	name: string;
	description: string;
	trigger: Service;
	actions: Service[];
	tags: string[];
	enabled: boolean;
	users: number;
}

export const services: Service[] = [
	{ id: "gmail", name: "Gmail", icon: "email", color: "#EA4335" },
	{ id: "slack", name: "Slack", icon: "chat", color: "#E01E5A" },
	{ id: "notion", name: "Notion", icon: "note", color: "#9B9A97" },
	{ id: "sheets", name: "Google Sheets", icon: "table", color: "#10B981" },
	{
		id: "calendar",
		name: "Google Calendar",
		icon: "calendar",
		color: "#4285F4",
	},
	{ id: "drive", name: "Google Drive", icon: "folder", color: "#FBBC05" },
	{ id: "twitter", name: "Twitter", icon: "tag", color: "#1DA1F2" },
	{ id: "spotify", name: "Spotify", icon: "music_note", color: "#1DB954" },
	{ id: "weather", name: "Weather", icon: "cloud", color: "#00B4D8" },
	{ id: "todoist", name: "Todoist", icon: "checklist", color: "#E44332" },
	{ id: "trello", name: "Trello", icon: "dashboard", color: "#0079BF" },
	{ id: "github", name: "GitHub", icon: "code", color: "#8B949E" },
	{ id: "discord", name: "Discord", icon: "forum", color: "#5865F2" },
	{ id: "telegram", name: "Telegram", icon: "send", color: "#0088CC" },
	{ id: "dropbox", name: "Dropbox", icon: "cloud_upload", color: "#0061FF" },
];

export const applets: Applet[] = [
	{
		id: "1",
		name: "Mindmappers",
		description:
			"Your own digital world of knowledge",
		trigger: services[6],
		actions: [services[6]],
		tags: ["productivity", "knowledge", "drive"],
		enabled: true,
		users: 125000,
	},
];

export const categories = [
	{ id: "all", name: "All Applets", icon: "apps" },
	{ id: "productivity", name: "Productivity", icon: "speed" },
	{ id: "social", name: "Social Media", icon: "share" },
	{ id: "team", name: "Team Collaboration", icon: "groups" },
	{ id: "development", name: "Development", icon: "code" },
	{ id: "notifications", name: "Notifications", icon: "notifications" },
	{ id: "backup", name: "Backup & Sync", icon: "backup" },
];
