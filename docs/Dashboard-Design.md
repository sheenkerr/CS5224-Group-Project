# FlowFox Dashboard Design Document

## Table of Contents

1. [Summary of Existing Styling Patterns](#1-summary-of-existing-styling-patterns)
2. [Clerk Integration Approach](#2-clerk-integration-approach)
3. [Applet Data Structure](#3-applet-data-structure)
4. [Proposed Dashboard Component Structure](#4-proposed-dashboard-component-structure)
5. [Required Props and State Management](#5-required-props-and-state-management)

---

## 1. Summary of Existing Styling Patterns

### 1.1 Background Colors

The application uses a dark gradient theme that creates depth and visual hierarchy:

```css
/* Background gradient - applied to main containers */
background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);

/* Alternative gradient used in current implementation */
background: linear-gradient(135deg, #ffffff 0%, #faf8f5 50%, #ffffff 100%);
/* Note: Light theme used for login/register, dark theme for dashboard */
```

**Color Palette:**

| Color Role       | Hex Code          | Usage                           |
| ---------------- | ----------------- | ------------------------------- |
| Primary Accent   | `#ff6b35`         | CTAs, highlights, active states |
| Secondary Accent | `#ff8c00`         | Alternative orange (current)    |
| Background Dark  | `#0f0f1a`         | Primary dark background         |
| Background Mid   | `#1a1a2e`         | Secondary dark background       |
| Background Light | `#16213e`         | Tertiary dark background        |
| Surface          | `bg-white/5`      | Card backgrounds                |
| Border           | `border-white/10` | Subtle borders                  |

### 1.2 Card Styling

Cards in the dashboard follow a consistent glassmorphism pattern:

```tsx
// Card component structure
<div className="bg-white/5 border border-white/10 rounded-xl p-6">
	{/* Card content */}
</div>
```

**Card Properties:**

- Background: `bg-white/5` (5% white opacity)
- Border: `border-white/10` (10% white opacity)
- Border radius: `rounded-xl` (12px)
- Padding: `p-6` (24px)
- Hover state: `hover:bg-white/10 transition-all duration-300`

### 1.3 Typography

**Font Family:**

- Primary: `'Inter', sans-serif` (for body text)
- Display: `'Cormorant Garamond', serif` (for headings on landing page)
- Alternative: `'Outfit', sans-serif` (for login/register)

**Text Colors:**

- Headings: `text-white`
- Primary text: `text-gray-100`
- Secondary text: `text-gray-400`
- Muted text: `text-gray-500`

**Font Sizes:**

- Hero: `text-5xl` / `text-6xl`
- Section headings: `text-3xl`
- Card titles: `text-xl`
- Body: `text-base`
- Small/labels: `text-sm`

### 1.4 Components (MUI)

The application uses Material-UI components extensively:

```tsx
// Import statement
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
	DialogActions,
	Button,
	Tabs,
	Tab,
	Slider,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from "@mui/material";
```

**Component Usage:**

| Component                                       | Purpose                     | Example                             |
| ----------------------------------------------- | --------------------------- | ----------------------------------- |
| [`TextField`](flowfox/src/pages/FlowFox.tsx:4)  | Search input, form fields   | `searchQuery` input with SearchIcon |
| [`Chip`](flowfox/src/pages/FlowFox.tsx:6)       | Tags, categories            | Category filters, applet tags       |
| [`Switch`](flowfox/src/pages/FlowFox.tsx:7)     | Toggle applet enabled state | Enable/disable applets              |
| [`IconButton`](flowfox/src/pages/FlowFox.tsx:8) | Actions, navigation         | Edit, delete, clone buttons         |
| [`Dialog`](flowfox/src/pages/FlowFox.tsx:10)    | Modals, confirmations       | Flow builder, delete confirmation   |
| [`Tabs`](flowfox/src/pages/FlowFox.tsx:15)      | Navigation sections         | Category tabs                       |
| [`Select`](flowfox/src/pages/FlowFox.tsx:18)    | Dropdowns                   | Category selection                  |

### 1.5 Animations (motion/react)

The application uses Framer Motion for animations:

```tsx
import { motion, AnimatePresence } from "motion/react";

// Fade-in animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  {/* Content */}
</motion.div>

// Scale animation for cards
<motion.div
  whileHover={{ scale: 1.02 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  {/* Card content */}
</motion.div>

// List animations with AnimatePresence
<AnimatePresence>
  {items.map(item => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {item}
    </motion.div>
  ))}
</AnimatePresence>
```

**Animation Patterns:**

1. **Page transitions:** Fade in with slight Y-axis movement
2. **Card hover:** Scale to 1.02 with spring physics
3. **List items:** Staggered entrance animations
4. **Modal:** Scale and fade in/out

### 1.6 Layout

**Container Configuration:**

```tsx
// Main container
<div className="max-w-7xl mx-auto px-6">
  {/* Content */}
</div>

// Full viewport height
<div className="min-h-screen">
  {/* Content */}
</div>

// Sticky header with backdrop blur
<header className="sticky top-0 backdrop-blur-md bg-white/5 border-b border-white/10">
  {/* Header content */}
</header>
```

**Responsive Breakpoints:**

- Mobile: Default (single column)
- Tablet: `md:` (2 columns)
- Desktop: `lg:` (3-4 columns)
- Large: `xl:` (max-width container)

---

## 2. Clerk Integration Approach

### 2.1 App Provider Setup

Clerk wraps the entire application in [`App.tsx`](flowfox/src/App.tsx:13):

```tsx
import { ClerkProvider } from "@clerk/clerk-react";

// Import your Clerk Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

function App() {
	return (
		<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
			<Router>
				<Routes>
					<Route path="/" element={<Design1 />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/app" element={<FlowFox />} />
				</Routes>
			</Router>
		</ClerkProvider>
	);
}
```

### 2.2 Login Page

The login page at [`Login.tsx`](flowfox/src/pages/Login.tsx:79) uses Clerk's SignIn component:

```tsx
import { SignIn } from "@clerk/clerk-react";

const Login = () => {
	return (
		<SignIn
			appearance={{
				elements: {
					rootBox: "w-full",
					card: "shadow-lg rounded-2xl border border-gray-100",
					socialButtonsBlockButton:
						"w-full rounded-full border border-gray-200 hover:bg-gray-50 transition-colors",
					socialButtonsBlockButtonText: "font-medium",
					dividerLine: "bg-gray-200",
					dividerText: "text-gray-400 text-sm",
					formFieldInput:
						"rounded-lg border-gray-200 focus:border-[#ff8c00] focus:ring-[#ff8c00]",
					formFieldLabel: "text-gray-600 font-medium",
					formButtonPrimary:
						"bg-[#ff8c00] hover:bg-[#ff6b00] rounded-full font-medium transition-colors",
					footerActionLink: "text-[#ff8c00] hover:text-[#ff6b00]",
				},
			}}
			routing="path"
			path="/login"
			signUpUrl="/register"
			redirectUrl="/app"
		/>
	);
};
```

**Configuration:**

- `routing="path"` - Uses URL-based routing
- `path="/login"` - Mounts at /login
- `signUpUrl="/register"` - Link to registration
- `redirectUrl="/app"` - Post-login destination

### 2.3 Register Page

The registration page at [`Register.tsx`](flowfox/src/pages/Register.tsx:79) uses Clerk's SignUp component:

```tsx
import { SignUp } from "@clerk/clerk-react";

const Register = () => {
	return (
		<SignUp
			appearance={{
				elements: {
					rootBox: "w-full",
					card: "shadow-lg rounded-2xl border border-gray-100",
					socialButtonsBlockButton:
						"w-full rounded-full border border-gray-200 hover:bg-gray-50 transition-colors",
					socialButtonsBlockButtonText: "font-medium",
					dividerLine: "bg-gray-200",
					dividerText: "text-gray-400 text-sm",
					formFieldInput:
						"rounded-lg border-gray-200 focus:border-[#ff8c00] focus:ring-[#ff8c00]",
					formFieldLabel: "text-gray-600 font-medium",
					formButtonPrimary:
						"bg-[#ff8c00] hover:bg-[#ff6b00] rounded-full font-medium transition-colors",
					footerActionLink: "text-[#ff8c00] hover:text-[#ff6b00]",
				},
			}}
			routing="path"
			path="/register"
			signInUrl="/login"
			redirectUrl="/app"
		/>
	);
};
```

### 2.4 Custom Appearance Overrides

Clerk components can be customized via the `appearance` prop:

```tsx
const appearance = {
	variables: {
		colorPrimary: "#ff6b35",
		colorTextOnPrimaryBackground: "#ffffff",
		colorBackground: "#1a1a2e",
		colorInputBackground: "#0f0f1a",
		colorInputText: "#ffffff",
		borderRadius: "8px",
		fontFamily: "'Inter', sans-serif",
	},
	elements: {
		rootBox: "clerk-root",
		card: "clerk-card",
		headerTitle: "clerk-title",
		headerSubtitle: "clerk-subtitle",
		socialButtonsBlockButton: "clerk-social-btn",
		formFieldInput: "clerk-input",
		formButtonPrimary: "clerk-submit-btn",
		footerActionLink: "clerk-link",
	},
};
```

### 2.5 Route Protection

The `/app` route serves as the protected post-login destination:

```tsx
// In App.tsx
<Route path="/app" element={<FlowFox />} />;

// FlowFox.tsx should use useAuth hook
import { useAuth } from "@clerk/clerk-react";

const { userId, isLoaded } = useAuth();

if (!isLoaded) {
	return <LoadingSpinner />;
}

if (!userId) {
	return <RedirectToSignIn />;
}

// Render protected dashboard content
```

---

## 3. Applet Data Structure

### 3.1 Service Interface

```typescript
// flowfox/src/data/applets.ts

export interface Service {
	id: string;
	name: string;
	icon: string;
	color: string;
}
```

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (e.g., "gmail", "slack") |
| `name` | `string` | Display name (e.g., "Gmail", "Slack") |
| `icon` | `string` | Material UI icon name |
| `color` | `string` | Hex color code for branding |

### 3.2 Applet Interface

```typescript
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
```

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier |
| `name` | `string` | Applet title |
| `description` | `string` | Detailed description |
| `trigger` | `Service` | The trigger service that starts the flow |
| `actions` | `Service[]` | Array of action services to execute |
| `tags` | `string[]` | Category tags for filtering |
| `enabled` | `boolean` | Active state |
| `users` | `number` | Number of users using this applet |

### 3.3 Services Data

```typescript
export const services: Service[] = [
	{ id: "gmail", name: "Gmail", icon: "email", color: "#EA4335" },
	{ id: "slack", name: "Slack", icon: "chat", color: "#4A154B" },
	{ id: "notion", name: "Notion", icon: "note", color: "#000000" },
	{ id: "sheets", name: "Google Sheets", icon: "table", color: "#34A853" },
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
	{ id: "github", name: "GitHub", icon: "code", color: "#181717" },
	{ id: "discord", name: "Discord", icon: "forum", color: "#5865F2" },
	{ id: "telegram", name: "Telegram", icon: "send", color: "#0088CC" },
	{ id: "dropbox", name: "Dropbox", icon: "cloud_upload", color: "#0061FF" },
];
```

### 3.4 Sample Applets

```typescript
export const applets: Applet[] = [
	{
		id: "1",
		name: "Save Gmail attachments to Google Drive",
		description:
			"Automatically save all email attachments to a specified folder in Google Drive.",
		trigger: services[0], // Gmail
		actions: [services[5]], // Google Drive
		tags: ["productivity", "backup", "email"],
		enabled: true,
		users: 125000,
	},
	{
		id: "2",
		name: "Create a task in Todoist from starred Gmail",
		description:
			"When you star an email in Gmail, automatically create a task in Todoist.",
		trigger: services[0], // Gmail
		actions: [services[9]], // Todoist
		tags: ["productivity", "tasks", "email"],
		enabled: true,
		users: 89000,
	},
	{
		id: "3",
		name: "Post to Slack when a new row is added to Google Sheets",
		description:
			"Keep your team informed by posting to Slack when new data is added.",
		trigger: services[3], // Google Sheets
		actions: [services[1]], // Slack
		tags: ["team", "notifications", "data"],
		enabled: false,
		users: 67000,
	},
	// ... more applets
];
```

### 3.5 Categories

```typescript
export const categories = [
	{ id: "all", name: "All Applets", icon: "apps" },
	{ id: "productivity", name: "Productivity", icon: "speed" },
	{ id: "social", name: "Social Media", icon: "share" },
	{ id: "team", name: "Team Collaboration", icon: "groups" },
	{ id: "development", name: "Development", icon: "code" },
	{ id: "notifications", name: "Notifications", icon: "notifications" },
	{ id: "backup", name: "Backup & Sync", icon: "backup" },
];
```

---

## 4. Proposed Dashboard Component Structure

### 4.1 Component Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.tsx                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ClerkProvider (wraps entire app)            │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │                   Router                            │  │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │   │
│  │  │  │  /      │ │ /login  │ │ /register│ │  /app   │  │  │   │
│  │  │  │Design1  │ │  Login  │ │ Register │ │Dashboard│  │  │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Dashboard (/app)                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Header (Sticky)                                         │   │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐  │   │
│  │  │  Logo + Title   │  │  User Info (useUser)          │  │   │
│  │  │                  │  │  ┌────────┐ ┌─────────────┐  │  │   │
│  │  │                  │  │  │ Avatar │ │ Logout Btn   │  │  │   │
│  │  │                  │  │  └────────┘ └─────────────┘  │  │   │
│  │  └──────────────────┘  └──────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Section 1: Favorite Applets                             │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │   │
│  │  │ Applet  │ │ Applet  │ │ Applet  │  ...              │   │
│  │  │  Card   │ │  Card   │ │  Card   │                   │   │
│  │  └─────────┘ └─────────┘ └─────────┘                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Section 2: Applet Discovery                             │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Search Bar (TextField)                            │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Category Tabs (MUI Tabs)                          │  │   │
│  │  │  [All] [Productivity] [Social] [Team] ...          │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │ Applet  │ │ Applet  │ │ Applet  │ │ Applet  │  ...  │   │
│  │  │  Card   │ │  Card   │ │  Card   │ │  Card   │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Section 3: Create Applet (Placeholder)                 │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  [+ Create New Applet] Button                     │  │   │
│  │  │  (Future: Opens FlowBuilder)                       │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Header Component

```tsx
import { useUser, useAuth } from "@clerk/clerk-react";
import { SignOutButton } from "@clerk/clerk-react";

const DashboardHeader = () => {
	const { user, isLoaded: userLoaded } = useUser();
	const { signOut } = useAuth();

	return (
		<header className="sticky top-0 backdrop-blur-md bg-white/5 border-b border-white/10 px-6 py-4">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				{/* Logo */}
				<div className="flex items-center gap-3">
					<FoxLogo />
					<span className="text-2xl font-light tracking-[0.3em] text-white">
						FLOWFOX
					</span>
				</div>

				{/* User Section */}
				<div className="flex items-center gap-4">
					{userLoaded && user && (
						<>
							<div className="flex items-center gap-3">
								{user.imageUrl && (
									<img
										src={user.imageUrl}
										alt={user.fullName || "User"}
										className="w-10 h-10 rounded-full"
									/>
								)}
								<span className="text-gray-300">{user.fullName}</span>
							</div>
							<button
								onClick={() => signOut()}
								className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
							>
								Sign Out
							</button>
						</>
					)}
				</div>
			</div>
		</header>
	);
};
```

### 4.3 Favorite Applets Section

```tsx
interface FavoriteAppletsProps {
	favoriteApplets: string[];
	applets: Applet[];
	onToggle: (id: string) => void;
	onEdit: (applet: Applet) => void;
	onFavorite: (id: string) => void;
}

const FavoriteAppletsSection: React.FC<FavoriteAppletsProps> = ({
	favoriteApplets,
	applets,
	onToggle,
	onEdit,
	onFavorite,
}) => {
	const favoriteItems = applets.filter((a) => favoriteApplets.includes(a.id));

	return (
		<section className="mb-12">
			<h2 className="text-2xl font-semibold text-white mb-6">
				Favorite Applets
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{favoriteItems.map((applet) => (
					<AppletCard
						key={applet.id}
						applet={applet}
						onToggle={onToggle}
						onEdit={onEdit}
						onFavorite={onFavorite}
						isFavorite={true}
					/>
				))}
				{favoriteItems.length === 0 && (
					<div className="col-span-full text-center py-12 text-gray-400">
						<StarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
						<p>No favorites yet. Star applets to add them here!</p>
					</div>
				)}
			</div>
		</section>
	);
};
```

### 4.4 Applet Discovery Section

```tsx
interface DiscoverySectionProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	selectedCategory: string;
	onCategoryChange: (category: string) => void;
	applets: Applet[];
	favoriteApplets: string[];
	onToggle: (id: string) => void;
	onEdit: (applet: Applet) => void;
	onFavorite: (id: string) => void;
}

const AppletDiscoverySection: React.FC<DiscoverySectionProps> = ({
	searchQuery,
	onSearchChange,
	selectedCategory,
	onCategoryChange,
	applets,
	favoriteApplets,
	onToggle,
	onEdit,
	onFavorite,
}) => {
	// Filter applets
	const filteredApplets = useMemo(() => {
		return applets.filter((applet) => {
			const matchesSearch =
				applet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				applet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				applet.tags.some((tag) =>
					tag.toLowerCase().includes(searchQuery.toLowerCase()),
				);
			const matchesCategory =
				selectedCategory === "all" || applet.tags.includes(selectedCategory);
			return matchesSearch && matchesCategory;
		});
	}, [applets, searchQuery, selectedCategory]);

	return (
		<section className="mb-12">
			<h2 className="text-2xl font-semibold text-white mb-6">
				Discover Applets
			</h2>

			{/* Search Bar */}
			<div className="mb-6">
				<TextField
					fullWidth
					placeholder="Search applets..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon className="text-gray-400" />
							</InputAdornment>
						),
					}}
					className="bg-white/5"
				/>
			</div>

			{/* Category Tabs */}
			<Tabs
				value={selectedCategory}
				onChange={(_, newValue) => onCategoryChange(newValue)}
				className="mb-6"
			>
				{categories.map((category) => (
					<Tab
						key={category.id}
						value={category.id}
						label={category.name}
						className="text-gray-400"
					/>
				))}
			</Tabs>

			{/* Applet Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredApplets.map((applet) => (
					<AppletCard
						key={applet.id}
						applet={applet}
						onToggle={onToggle}
						onEdit={onEdit}
						onFavorite={onFavorite}
						isFavorite={favoriteApplets.includes(applet.id)}
					/>
				))}
			</div>
		</section>
	);
};
```

### 4.5 Create Applet Section (Placeholder)

```tsx
const CreateAppletSection = () => {
	return (
		<section className="mb-12">
			<h2 className="text-2xl font-semibold text-white mb-6">
				Create Your Own
			</h2>
			<div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
				<AddIcon className="w-16 h-16 text-gray-400 mb-4" />
				<h3 className="text-xl font-medium text-white mb-2">
					Build Your Own Applet
				</h3>
				<p className="text-gray-400 mb-6">
					Connect your favorite services and automate your workflow.
				</p>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					className="bg-[#ff6b35] hover:bg-[#ff8c00]"
				>
					Create New Applet
				</Button>
				<p className="text-sm text-gray-500 mt-4">
					* Coming soon - Flow Builder integration
				</p>
			</div>
		</section>
	);
};
```

### 4.6 Complete Dashboard Integration

```tsx
const Dashboard = () => {
	const { userId, isLoaded } = useAuth();
	const { user, isLoaded: userLoaded } = useUser();

	const [favoriteApplets, setFavoriteApplets] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");

	// Redirect if not authenticated
	if (!isLoaded || !userLoaded) {
		return <LoadingSpinner />;
	}

	if (!userId) {
		return <RedirectToSignIn />;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e]">
			<DashboardHeader />

			<main className="max-w-7xl mx-auto px-6 py-8">
				{/* Section 1: Favorites */}
				<FavoriteAppletsSection
					favoriteApplets={favoriteApplets}
					applets={applets}
					onToggle={handleToggle}
					onEdit={handleEdit}
					onFavorite={handleFavorite}
				/>

				{/* Section 2: Discovery */}
				<AppletDiscoverySection
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					selectedCategory={selectedCategory}
					onCategoryChange={setSelectedCategory}
					applets={applets}
					favoriteApplets={favoriteApplets}
					onToggle={handleToggle}
					onEdit={handleEdit}
					onFavorite={handleFavorite}
				/>

				{/* Section 3: Create */}
				<CreateAppletSection />
			</main>
		</div>
	);
};
```

---

## 5. Required Props and State Management

### 5.1 State Variables

```tsx
// Main dashboard state
const [favoriteApplets, setFavoriteApplets] = useState<string[]>([]);
const [searchQuery, setSearchQuery] = useState("");
const [selectedCategory, setSelectedCategory] = useState("all");
const [selectedApplet, setSelectedApplet] = useState<Applet | null>(null);
const [isBuilderOpen, setIsBuilderOpen] = useState(false);
const [editingApplet, setEditingApplet] = useState<Applet | null>(null);
```

| State Variable     | Type             | Purpose                               |
| ------------------ | ---------------- | ------------------------------------- |
| `favoriteApplets`  | `string[]`       | Array of favorited applet IDs         |
| `searchQuery`      | `string`         | Current search text                   |
| `selectedCategory` | `string`         | Active category filter                |
| `selectedApplet`   | `Applet \| null` | Currently selected applet for details |
| `isBuilderOpen`    | `boolean`        | Flow builder modal visibility         |
| `editingApplet`    | `Applet \| null` | Applet being edited                   |

### 5.2 Clerk Hooks

```tsx
import { useUser, useAuth } from "@clerk/clerk-react";

// Authentication state
const { userId, isLoaded, isSignedIn } = useAuth();

// User information
const { user, isLoaded: userLoaded } = useUser();
```

**useAuth Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `userId` | `string \| null` | Current user's ID |
| `isLoaded` | `boolean` | Whether auth state has loaded |
| `isSignedIn` | `boolean` | Whether user is signed in |
| `signOut` | `() => void` | Function to sign out |

**useUser Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Clerk user object |
| `isLoaded` | `boolean` | Whether user has loaded |
| `isEmpty` | `boolean` | Whether user object is empty |

### 5.3 AppletCard Props Interface

```tsx
interface AppletCardProps {
	applet: Applet;
	isFavorite: boolean;
	onToggle: (id: string) => void;
	onEdit: (applet: Applet) => void;
	onFavorite: (id: string) => void;
}

const AppletCard: React.FC<AppletCardProps> = ({
	applet,
	isFavorite,
	onToggle,
	onEdit,
	onFavorite,
}) => {
	return (
		<motion.div
			whileHover={{ scale: 1.02 }}
			className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
		>
			{/* Card Header */}
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					{/* Trigger Service Icon */}
					<div
						className="w-10 h-10 rounded-lg flex items-center justify-center"
						style={{ backgroundColor: applet.trigger.color }}
					>
						<Icon>{applet.trigger.icon}</Icon>
					</div>
					{/* Action Service Icons */}
					<ArrowRightIcon className="text-gray-400" />
					{applet.actions.map((action) => (
						<div
							key={action.id}
							className="w-8 h-8 rounded-lg flex items-center justify-center"
							style={{ backgroundColor: action.color }}
						>
							<Icon>{action.icon}</Icon>
						</div>
					))}
				</div>
				{/* Favorite Button */}
				<IconButton onClick={() => onFavorite(applet.id)}>
					<StarIcon
						className={isFavorite ? "text-yellow-400" : "text-gray-400"}
					/>
				</IconButton>
			</div>

			{/* Card Content */}
			<h3 className="text-lg font-medium text-white mb-2">{applet.name}</h3>
			<p className="text-gray-400 text-sm mb-4">{applet.description}</p>

			{/* Tags */}
			<div className="flex flex-wrap gap-2 mb-4">
				{applet.tags.map((tag) => (
					<Chip
						key={tag}
						label={tag}
						size="small"
						className="bg-white/10 text-gray-300"
					/>
				))}
			</div>

			{/* Card Footer */}
			<div className="flex items-center justify-between pt-4 border-t border-white/10">
				<span className="text-gray-500 text-sm">
					{applet.users.toLocaleString()} users
				</span>
				<div className="flex items-center gap-2">
					<Switch
						checked={applet.enabled}
						onChange={() => onToggle(applet.id)}
						className="text-[#ff6b35]"
					/>
					<IconButton onClick={() => onEdit(applet)}>
						<EditIcon className="text-gray-400" />
					</IconButton>
				</div>
			</div>
		</motion.div>
	);
};
```

### 5.4 State Handlers

```tsx
// Toggle applet enabled state
const toggleApplet = useCallback((id: string) => {
	setApplets((prev) =>
		prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
	);
}, []);

// Toggle favorite status
const toggleFavorite = useCallback((id: string) => {
	setFavoriteApplets((prev) =>
		prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id],
	);
}, []);

// Edit applet
const editApplet = useCallback((applet: Applet) => {
	setEditingApplet(applet);
	setIsBuilderOpen(true);
}, []);

// Filter applets (used in discovery)
const filteredApplets = useMemo(() => {
	return applets.filter((applet) => {
		const matchesSearch =
			applet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			applet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			applet.tags.some((tag) =>
				tag.toLowerCase().includes(searchQuery.toLowerCase()),
			);

		const matchesCategory =
			selectedCategory === "all" || applet.tags.includes(selectedCategory);

		return matchesSearch && matchesCategory;
	});
}, [applets, searchQuery, selectedCategory]);
```

---

## Appendix: Implementation Checklist

- [ ] Set up ClerkProvider in App.tsx
- [ ] Configure Login page with SignIn component
- [ ] Configure Register page with SignUp component
- [ ] Add route protection to /app route
- [ ] Implement DashboardHeader with user info
- [ ] Create FavoriteAppletsSection component
- [ ] Create AppletDiscoverySection component
- [ ] Create CreateAppletSection (placeholder)
- [ ] Implement search and filter functionality
- [ ] Add favorite toggle functionality
- [ ] Style with existing design patterns
- [ ] Add animations with motion/react

---

_Document Version: 1.0_  
_Last Updated: 2026-02-19_
