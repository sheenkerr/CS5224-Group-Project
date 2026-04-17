import { createUserNotification } from "../../utils/notifications";

function getMindmapperLink(mindmapperId: string): string {
  return `/applets/mindmappers/${mindmapperId}`;
}

async function notifyMindmapperEvent(
  userId: string,
  mindmapperId: string,
  title: string,
  message: string,
  type: string
): Promise<void> {
  await createUserNotification({
    userId,
    title,
    message,
    type,
    link: getMindmapperLink(mindmapperId),
  });
}

export async function notifyMindmapperConnected(
  userId: string,
  mindmapperId: string,
  folderName: string
): Promise<void> {
  await notifyMindmapperEvent(
    userId,
    mindmapperId,
    "Mindmapper connected",
    `Flowfox is now watching "${folderName}" for new files.`,
    "MINDMAPPER_CONNECTED"
  );
}

export async function notifyMindmapCreated(
  userId: string,
  mindmapperId: string,
  documentName: string
): Promise<void> {
  await notifyMindmapperEvent(
    userId,
    mindmapperId,
    "Mindmap created",
    `Flowfox generated a mindmap for "${documentName}".`,
    "MINDMAP_CREATED"
  );
}

export async function notifyMindmapsMerged(
  userId: string,
  mindmapperId: string,
  mergedName: string,
  documentCount: number
): Promise<void> {
  const noun = documentCount === 1 ? "document" : "documents";

  await notifyMindmapperEvent(
    userId,
    mindmapperId,
    "Mindmaps merged",
    `Flowfox created "${mergedName}" from ${documentCount} ${noun}.`,
    "MINDMAPS_MERGED"
  );
}

export async function notifyMindmapDeleted(
  userId: string,
  mindmapperId: string,
  documentId: string
): Promise<void> {
  await notifyMindmapperEvent(
    userId,
    mindmapperId,
    "Mindmap deleted",
    `Flowfox removed the mindmap document "${documentId}".`,
    "MINDMAP_DELETED"
  );
}
