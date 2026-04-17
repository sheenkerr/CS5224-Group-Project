import { createUserActivity, createUserNotification } from "../../utils/user-events";

function getMindmapperLink(mindmapperId: string): string {
  return `/applets/mindmappers/${mindmapperId}`;
}

async function notifyMindmapperEvent(
  userId: string,
  mindmapperId: string,
  title: string,
  message: string,
  type: string,
  actionType: string,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await Promise.all([
    createUserNotification({
      userId,
      title,
      message,
      type,
      link: getMindmapperLink(mindmapperId),
    }),
    createUserActivity({
      userId,
      actionType,
      entityType: "MINDMAPPER",
      entityId,
      metadata,
    }),
  ]);
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
    "MINDMAPPER_CONNECTED",
    "CONNECTED_DRIVE_FOLDER",
    mindmapperId,
    { folder_name: folderName }
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
    "MINDMAP_CREATED",
    "CREATED_MINDMAP",
    documentName,
    { document_name: documentName, mindmapper_id: mindmapperId }
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
    "MINDMAPS_MERGED",
    "MERGED_MINDMAPS",
    mergedName,
    {
      merged_name: mergedName,
      document_count: documentCount,
      mindmapper_id: mindmapperId,
    }
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
    "MINDMAP_DELETED",
    "DELETED_MINDMAP",
    documentId,
    { document_id: documentId, mindmapper_id: mindmapperId }
  );
}

export async function notifyMindmapExportedToNotion(
  userId: string,
  mindmapperId: string,
  documentName: string,
  pageId: string
): Promise<void> {
  await notifyMindmapperEvent(
    userId,
    mindmapperId,
    "Exported to Notion",
    `Flowfox exported "${documentName}" to Notion.`,
    "MINDMAP_EXPORTED_TO_NOTION",
    "EXPORTED_TO_NOTION",
    pageId,
    {
      document_name: documentName,
      notion_page_id: pageId,
      mindmapper_id: mindmapperId,
    }
  );
}
