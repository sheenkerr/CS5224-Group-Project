import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import Navigation from "../../../components/Navigation";
import { useApi } from "../../../utils/api";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloudIcon from "@mui/icons-material/Cloud";

interface Workspace {
  mindmapperId: string;
  name: string;
  createdAt?: string;
}

interface WorkspaceCardProps {
  ws: Workspace;
  index: number;
  onNavigate: (id: string) => void;
  onRename: (id: string, name: string) => Promise<void>;
}

function WorkspaceCard({ ws, index, onNavigate, onRename }: WorkspaceCardProps) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(ws.name);

  const handleRename = async () => {
    if (!nameInput.trim() || nameInput === ws.name) {
      setEditing(false);
      return;
    }
    await onRename(ws.mindmapperId, nameInput.trim());
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-5 hover:border-[#ff6b35]/50 transition cursor-pointer"
      onClick={() => onNavigate(ws.mindmapperId)}
    >
      {editing ? (
        <input
          autoFocus
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === "Enter" && handleRename()}
          onClick={(e) => e.stopPropagation()}
          className="text-lg font-semibold w-full bg-transparent border-b border-[#ff6b35] outline-none text-gray-900 dark:text-white mb-1"
        />
      ) : (
        <h3
          className="text-lg font-semibold text-gray-900 dark:text-white mb-1"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
        >
          {ws.name}
        </h3>
      )}
      <p className="text-xs text-gray-400 mt-1">Double-click name to rename</p>
    </motion.div>
  );
}

function MindmapperWorkspaces(): React.ReactElement {
  const navigate = useNavigate();
  const { apiFetch } = useApi();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && state && state.startsWith("ws-")) {
      const mindmapperId = state.replace("ws-", "");
      navigate(`/applets/mindmappers/${mindmapperId}?code=${code}`);
      return;
    }
    fetchWorkspaces();
  }, [navigate]);

  async function fetchWorkspaces() {
    try {
      const res = await apiFetch("/api/mindmapper/workspaces");
      const data = await res.json();
      if (data.success) {
        setWorkspaces(data.workspaces || []);
      }
    } catch (err) {
      console.error("Failed to fetch workspaces", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRename(mindmapperId: string, name: string) {
    try {
      await apiFetch(`/api/mindmapper/${mindmapperId}/rename`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      // Optimistic update
      setWorkspaces(prev =>
        prev.map(ws => ws.mindmapperId === mindmapperId ? { ...ws, name } : ws)
      );
    } catch (err) {
      console.error("Rename failed", err);
    }
  }

  function handleNewWorkspace() {
    navigate("/applets/mindmappers/setup");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent dark:bg-linear-to-br dark:from-[#0f0f1a] dark:to-[#16213e]">
      <Navigation />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mindmapper Workspaces
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your document knowledge graphs. All workspaces are linked via your Google Drive account.
            </p>
          </div>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewWorkspace}
            sx={{ backgroundColor: "#ff6b35" }}
          >
            New Workspace
          </Button>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : workspaces.length === 0 ? (
          <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-10 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No workspaces yet. Create a workspace by linking a Google Drive folder.
            </p>
            <Button
              variant="contained"
              startIcon={<CloudIcon />}
              onClick={handleNewWorkspace}
              sx={{ backgroundColor: "#ff6b35" }}
            >
              Create your first workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws, index) => (
              <WorkspaceCard
                key={ws.mindmapperId}
                ws={ws}
                index={index}
                onNavigate={(id) => navigate(`/applets/mindmappers/${id}`)}
                onRename={handleRename}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MindmapperWorkspaces;