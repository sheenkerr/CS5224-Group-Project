import React from "react";
import axios from "axios";
import SetupPannel from "../../../components/SetupPannel";
import { Dialog } from "@mui/material";
import { useUser } from "@clerk/clerk-react";

/** Shape of the folder selected by the Google Picker */
type SelectedFolder = {
    id: string;
    name: string;
};

type MindmapperSetupProps = {
    stage: number;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8001").replace(/\/$/, "");

/** Dynamically load a script tag if it hasn't been loaded yet */
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
    
    const completeSetup = async () => {
        /** Send the folder ID and the folder name to our backend */
    
        const response = await axios.post(`${API_BASE_URL}/api/mindmapper/google/setup-listener`, {
            folderId: selectedFolder?.id,
            folderName: selectedFolder?.name,
        });

        if (response.data.success) {
            // TODO: Redirect to the mindmapper page not the setup page but this required the database as I need the unique id for the mindmapper setup
            setOpen(false);
        } else {
            // Show an error message
        }
    };

    // const googleLogin = async () => {
    //     const response = await axios.get(`${API_BASE_URL}/api/mindmapper/google/login-url`);
    //     const authUrl = response.data.authUrl;
    //     window.location.href = authUrl;
    // };
    const googleLogin = async () => {
        const response = await axios.get(`${API_BASE_URL}/api/mindmapper/google/login-url`);
        console.log("RESPONSE:", response.data);  
        const authUrl = response.data.authUrl;
        console.log("URL:", authUrl);             
        window.location.href = authUrl;
    };

    /** Open the Google Picker in folder-selection mode */
    const openFolderPicker = async () => {
        setPickerLoading(true);
        setOpen(false);
        try {
            // Fetch access token and API key from the backend
            const [tokenRes, apiKeyRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/mindmapper/google/access-token`),
                axios.get(`${API_BASE_URL}/api/mindmapper/google/api-key`),
            ]);

            const accessToken: string = tokenRes.data.access_token;
            const apiKey: string = apiKeyRes.data.apiKey;

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
        </main>
    );
}

export default MindmapperSetup;
