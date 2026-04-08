interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }
  
  export default function ConfirmModal({
    open,
    title = "Confirm Action",
    message,
    onConfirm,
    onCancel,
  }: ConfirmModalProps) {
    if (!open) return null;
  
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
              className="px-4 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition"
            >
              Cancel
            </button>
  
            <button
              onClick={onConfirm}
              className="px-4 py-1.5 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white transition shadow"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }