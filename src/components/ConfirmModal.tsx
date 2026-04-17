import type { ReactElement } from "react";

const confirmButtonClasses = {
  danger: "bg-red-600 hover:bg-red-700",
  primary: "bg-blue-600 hover:bg-blue-700",
};

const cancelButtonClassName =
  "px-4 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition";
const confirmButtonBaseClassName =
  "px-4 py-1.5 text-sm rounded-md text-white transition shadow";

export default function ConfirmModal({
  open,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}): ReactElement | null {
  if (!open) return null;

  const confirmButtonClassName = `${confirmButtonBaseClassName} ${confirmButtonClasses[confirmVariant]}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-[360px] rounded-xl bg-gray-900 border border-gray-700 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-white mb-2">
          {title}
        </h2>

        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className={cancelButtonClassName}
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className={confirmButtonClassName}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
