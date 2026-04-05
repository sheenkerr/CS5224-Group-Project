import React from "react";
import Navigation from "../../../components/Navigation";
import MindmapperSetup from "./MindmapperSetup";

type MindmapperProps = {
    isSetup: boolean;
}

function Mindmapper({ isSetup = false }: MindmapperProps): React.ReactElement {

    const [stage, setStage] = React.useState(0);

    React.useEffect(() => {
        const queryString = window.location.search;
        const params = new URLSearchParams(queryString);
        const success = params.get('success');
        if (success == "true") {
            setStage(1);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent dark:bg-linear-to-br dark:from-[#0f0f1a] dark:to-[#16213e] font-sans transition-colors">
            <Navigation />
            <main className="max-w-7xl mx-auto px-6 py-8">
                {isSetup ? <MindmapperSetup stage={stage} /> : <p> Hello </p>}
            </main>
        </div>
    );
}

export default Mindmapper;