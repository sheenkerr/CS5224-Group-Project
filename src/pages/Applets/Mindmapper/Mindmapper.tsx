import React from "react";
import axios from "axios";
import SetupPannel from "../../../components/SetupPannel";
import Navigation from "../../../components/Navigation";
import MindmapperSetup from "./MindmapperSetup";
import { Button, Dialog } from "@mui/material";

type MindmapperProps = {
    isSetup: boolean;
}

function Mindmapper({ isSetup = false }: MindmapperProps): React.ReactElement {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent dark:bg-linear-to-br dark:from-[#0f0f1a] dark:to-[#16213e] font-sans transition-colors">
            <Navigation />
            <main className="max-w-7xl mx-auto px-6 py-8">
                {isSetup ? <MindmapperSetup /> : <div> Hello </div>}
            </main>
        </div>
    );
}

export default Mindmapper;