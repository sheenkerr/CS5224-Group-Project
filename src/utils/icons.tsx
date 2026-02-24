import React from "react";
import {
    Email as EmailIcon,
    Chat as ChatIcon,
    Note as NoteIcon,
    TableView as TableViewIcon,
    CalendarToday as CalendarTodayIcon,
    Folder as FolderIcon,
    Tag as TagIcon,
    MusicNote as MusicNoteIcon,
    Cloud as CloudIcon,
    Checklist as ChecklistIcon,
    Dashboard as DashboardIcon,
    Code as CodeIcon,
    Forum as ForumIcon,
    Send as SendIcon,
    CloudUpload as CloudUploadIcon,
    Settings as SettingsIcon,
} from "@mui/icons-material";

export const serviceIcons: Record<string, React.ElementType> = {
    email: EmailIcon,
    chat: ChatIcon,
    note: NoteIcon,
    table: TableViewIcon,
    calendar: CalendarTodayIcon,
    folder: FolderIcon,
    tag: TagIcon,
    music_note: MusicNoteIcon,
    cloud: CloudIcon,
    checklist: ChecklistIcon,
    dashboard: DashboardIcon,
    code: CodeIcon,
    forum: ForumIcon,
    send: SendIcon,
    cloud_upload: CloudUploadIcon,
};

export function renderServiceIcon(
    iconName: string,
    color: string,
    fontSize: string = "1.25rem"
): React.ReactElement {
    const IconComponent = serviceIcons[iconName] || SettingsIcon;
    return <IconComponent sx={{ color, fontSize }} />;
}
