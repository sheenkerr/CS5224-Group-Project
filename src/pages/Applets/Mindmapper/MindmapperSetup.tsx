import React from "react";
import axios from "axios";
import SetupPannel from "../../../components/SetupPannel";
import Navigation from "../../../components/Navigation";
import { Dialog } from "@mui/material";

type MindmapperSetupProps = {
    stage: number;
}

function MindmapperSetup({ stage = 0 }: MindmapperSetupProps): React.ReactElement {

    const [open, setOpen] = React.useState(true);

    const completeSteup = () => {
        setOpen(false);
    };

    const googleLogin = async () => {
        const response = await axios.get("http://localhost:8001/api/mindmapper/google/login-url");
        const authUrl = response.data.authUrl;
        window.location.href = authUrl;
    }

    // Set up content for the setup panel
    const steps = ['Give access to google drive', 'Select a google drive folder'];
    const isOptional = [false, false];
    const stepsContent = [
        <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700/30">
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    Connect your Google account to allow access to your Drive files.
                </p>
            </div>
            <button
                onClick={googleLogin}
                className="flex items-center gap-2 self-start px-5 py-2.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 text-gray-800 dark:text-white text-sm font-medium shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-white/15 transition-all duration-200"
            >
                <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-4 h-4"
                />
                Sign in with Google
            </button>
        </div>,

        <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/30">
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    Choose a folder in your Google Drive where files will be saved or read from.
                </p>
            </div>
            <button
                onClick={() => {/* handle folder select */ }}
                className="flex items-center gap-2 self-start px-5 py-2.5 rounded-lg bg-[#ff6b35] text-white text-sm font-medium shadow-sm hover:bg-[#e85d2a] hover:shadow-[0_4px_12px_rgba(255,107,53,0.3)] transition-all duration-200"
            >
                Select Folder
            </button>
        </div>,
    ];

    return (
        <main className="max-w-7xl mx-auto px-6 py-8">
            <Dialog open={open}>
                <SetupPannel steps={steps} stepsContent={stepsContent} isOptional={isOptional} currentStep={stage} onComplete={completeSteup} />
            </Dialog>
        </main>
    );
}

export default MindmapperSetup;