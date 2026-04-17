import React from "react";
import SetupPannel from "../../../components/SetupPannel";
import { Dialog, Alert, Snackbar } from "@mui/material";
import { useUser, useAuth } from "@clerk/react";
import { useApi } from "../../../utils/api";

/** Shape of the folder selected by the Google Picker */
type SelectedFolder = {
    id: string;
    name: string;
};

type MindmapperSetupProps = {
    stage: number;
};

/** Dynamically load a script tag if it hasn't been loaded yet for the google document selecter */
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
}

function MindmapperSetup({ stage = 0 }: MindmapperSetupProps): React.ReactElement {
    const [open, setOpen] = React.useState(true);
    const [selectedFolder, setSelectedFolder] = React.useState<SelectedFolder | null>(null);
    const [pickerLoading, setPickerLoading] = React.useState(false);
    const [folderError, setFolderError] = React.useState(false);
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState("");

    const { apiFetch } = useApi();

    /** Clerk's user id */
    const { userId, isLoaded: authLoaded, getToken } = useAuth();
    const { isLoaded, isSignedIn, user } = useUser();

    const completeSetup = async (): Promise<boolean> => {
        if (!selectedFolder) {
            setFolderError(true);
            return false;
        }
        setFolderError(false);

        try {
            const response = await apiFetch(`/api/mindmapper/google/setup-listener`, {
                method: "POST",
                body: JSON.stringify({
                    userId: userId,
                    email: user!.primaryEmailAddress!.emailAddress,
                    folderId: selectedFolder?.id,
                    folderName: selectedFolder?.name,
                }),
            });

            const data = await response.json();

            if (data.success) {
                const result = await apiFetch(`/api/mindmapper/workspace`, {
                    method: "POST",
                    body: JSON.stringify({
                        userId: userId,
                        mindmapperId: data.mindmapperId,
                    }),
                });

                const resultData = await result.json();

                if (resultData.success) {
                    setOpen(false);
                    window.location.href = "/applets/mindmappers";
                    return true;
                } else {
                    setSnackbarMessage(resultData.error || "Setup failed. Please try again.");
                    setSnackbarOpen(true);
                    return false;
                }
            } else {
                setSnackbarMessage(data.error || "Setup failed. Please try again.");
                setSnackbarOpen(true);
                return false;
            }
        } catch (err: any) {
            setSnackbarMessage(err?.response?.data?.error || err?.message || "An unexpected error occurred.");
            setSnackbarOpen(true);
            return false;
        }
    };

    const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === "clickaway") return;
        setSnackbarOpen(false);
    };

    const googleLogin = async () => {
        try {
            const response = await apiFetch(`/api/mindmapper/google/login-url`);
            const data = await response.json();

            if (!response.ok || !data.authUrl) {
                throw new Error(data.error || "Failed to fetch Google login URL.");
            }

            window.location.href = data.authUrl;
        } catch (err: any) {
            setSnackbarMessage(err?.message || "Could not start Google sign-in.");
            setSnackbarOpen(true);
        }
    };

    /** Open the Google Picker in folder-selection mode */
    const openFolderPicker = async () => {
        setPickerLoading(true);
        setOpen(false);
        try {
            // Fetch access token and API key from the backend
            const [tokenRes, apiKeyRes] = await Promise.all([
                apiFetch(`/api/mindmapper/google/access-token`),
                apiFetch(`/api/mindmapper/google/api-key`),
            ]);

            const tokenData = await tokenRes.json();
            const apiKeyData = await apiKeyRes.json();

            const accessToken: string = tokenData.access_token;
            const apiKey: string = apiKeyData.apiKey;

            // Load the Google API client library
            await loadScript("https://apis.google.com/js/api.js");

            // Load the Picker API
            await new Promise<void>((resolve) => {
                (window as any).gapi.load("picker", { callback: resolve });
            });

            // Build and display the picker (folders only)
            const google = (window as any).google;
            const picker = new google.picker.PickerBuilder()
                .addView(
                    new google.picker.DocsView(google.picker.ViewId.FOLDERS)
                        .setIncludeFolders(true)
                        .setSelectFolderEnabled(true)
                        .setMimeTypes("application/vnd.google-apps.folder")
                )
                .setOAuthToken(accessToken)
                .setDeveloperKey(apiKey)
                .setCallback((data: any) => {
                    if (data.action === google.picker.Action.PICKED) {
                        const doc = data.docs[0];
                        setSelectedFolder({ id: doc.id, name: doc.name });
                        setFolderError(false);
                        setOpen(true);
                    } else if (data.action === google.picker.Action.CANCEL) {
                        setOpen(true);
                    }
                })
                .build();

            picker.setVisible(true);
        } catch (err) {
            console.error("Failed to open Google Picker:", err);
            alert("Could not open folder picker. Make sure you have signed in with Google first.");
        } finally {
            setPickerLoading(false);
        }
    };

    const steps = ["Give access to Google Drive", "Select a Google Drive folder"];
    const isOptional = [false, false];

    const stepsContent = [
        <div className="flex flex-col gap-4" key="step1">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700/30">
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    Connect your Google account to allow access to your Drive files.
                </p>
            </div>
            <button
                onClick={googleLogin}
                className="flex items-center gap-2 self-start px-5 py-2.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 text-gray-800 dark:text-white text-sm font-medium shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-white/15 transition-all duration-200"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
                Sign in with Google
            </button>
        </div>,

        <div className="flex flex-col gap-4" key="step2">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/30">
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    Choose a folder in your Google Drive where your Mind Map files will be stored.
                </p>
            </div>

            {folderError && (
                <Alert severity="error" variant="outlined" onClose={() => setFolderError(false)}>
                    Please select a Google Drive folder.
                </Alert>
            )}

            {selectedFolder && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 text-sm text-green-800 dark:text-green-300 self-start">
                    <span className="font-medium">Folder selected: {selectedFolder.name}</span>
                </div>
            )}

            <button
                onClick={openFolderPicker}
                disabled={pickerLoading}
                className="flex items-center gap-2 self-start px-5 py-2.5 rounded-lg bg-[#ff6b35] text-white text-sm font-medium shadow-sm hover:bg-[#e85d2a] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {pickerLoading ? "Loading…" : selectedFolder ? "Change Folder" : "Select Folder"}
            </button>
        </div>,
    ];

    return (
        <main className="max-w-7xl mx-auto px-6 py-8">
            <Dialog open={open} disableEnforceFocus>
                <SetupPannel
                    steps={steps}
                    stepsContent={stepsContent}
                    isOptional={isOptional}
                    currentStep={stage}
                    onComplete={completeSetup}
                />
            </Dialog>

            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity="error" variant="filled" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </main>
    );
}

export default MindmapperSetup;
