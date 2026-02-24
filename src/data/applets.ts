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
		name: "Save Gmail attachments to Google Drive",
		description:
			"Automatically save all email attachments to a specified folder in Google Drive for easy access and backup.",
		trigger: services[0],
		actions: [services[5]],
		tags: ["productivity", "backup", "email"],
		enabled: true,
		users: 125000,
	},
	{
		id: "2",
		name: "Create a task in Todoist from starred Gmail",
		description:
			"When you star an email in Gmail, automatically create a task in Todoist so you never forget to follow up.",
		trigger: services[0],
		actions: [services[9]],
		tags: ["productivity", "tasks", "email"],
		enabled: true,
		users: 89000,
	},
	{
		id: "3",
		name: "Post to Slack when a new row is added to Google Sheets",
		description:
			"Keep your team informed by posting a message to a Slack channel whenever new data is added to your spreadsheet.",
		trigger: services[3],
		actions: [services[1]],
		tags: ["team", "notifications", "data"],
		enabled: false,
		users: 67000,
	},
	{
		id: "4",
		name: "Add events from Gmail to Google Calendar",
		description:
			"Automatically extract event details from emails and add them to your Google Calendar.",
		trigger: services[0],
		actions: [services[4]],
		tags: ["productivity", "calendar", "email"],
		enabled: true,
		users: 156000,
	},
	{
		id: "5",
		name: "Tweet your Spotify now playing",
		description:
			"Share what you are listening to on Twitter automatically. Perfect for music lovers and podcast enthusiasts.",
		trigger: services[7],
		actions: [services[6]],
		tags: ["social", "music", "fun"],
		enabled: false,
		users: 45000,
	},
	{
		id: "6",
		name: "Create a Trello card from new Slack messages",
		description:
			"Turn important Slack messages into actionable Trello cards with just a reaction emoji.",
		trigger: services[1],
		actions: [services[10]],
		tags: ["project-management", "team", "tasks"],
		enabled: true,
		users: 34000,
	},
	{
		id: "7",
		name: "Get weather alerts in Discord",
		description:
			"Receive daily weather forecasts and severe weather alerts directly in your Discord server.",
		trigger: services[8],
		actions: [services[12]],
		tags: ["notifications", "weather", "community"],
		enabled: false,
		users: 23000,
	},
	{
		id: "8",
		name: "Backup new GitHub issues to Notion",
		description:
			"Keep track of all GitHub issues by automatically creating a database entry in Notion for each new issue.",
		trigger: services[11],
		actions: [services[2]],
		tags: ["development", "backup", "project-management"],
		enabled: true,
		users: 18000,
	},
	{
		id: "9",
		name: "Send Telegram message for calendar events",
		description:
			"Get notified on Telegram 15 minutes before any Google Calendar event starts.",
		trigger: services[4],
		actions: [services[13]],
		tags: ["notifications", "calendar", "reminders"],
		enabled: true,
		users: 29000,
	},
	{
		id: "10",
		name: "Sync Dropbox files to Google Drive",
		description:
			"Keep your cloud storage in sync by automatically copying new Dropbox files to Google Drive.",
		trigger: services[14],
		actions: [services[5]],
		tags: ["backup", "cloud", "productivity"],
		enabled: false,
		users: 52000,
	},
	{
		id: "11",
		name: "Log Slack messages to Google Sheets",
		description:
			"Archive important conversations by logging specific Slack messages to a Google Sheets spreadsheet.",
		trigger: services[1],
		actions: [services[3]],
		tags: ["team", "data", "archive"],
		enabled: true,
		users: 41000,
	},
	{
		id: "12",
		name: "Create Notion pages from Gmail labels",
		description:
			"Automatically create a Notion page when you apply a specific label to an email in Gmail.",
		trigger: services[0],
		actions: [services[2]],
		tags: ["productivity", "email", "knowledge"],
		enabled: false,
		users: 15000,
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
