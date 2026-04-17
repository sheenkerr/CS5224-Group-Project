import React, { useEffect, useState } from "react";

interface RenameModalProps {
  open: boolean;
  title?: string;
  initialValue: string;
  placeholder?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

export default function RenameModal({
  open,
  title = "Rename workspace",
  initialValue,
  placeholder = "Enter new name",
  onCancel,
  onConfirm,
}: RenameModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-[380px] rounded-xl border border-white/10 bg-white dark:bg-[#111827] shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>

        <input
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm(value.trim());
          }}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#ff6b35]"
        />

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:opacity-80"
          >
            Cancel
          </button>

          <button
            onClick={() => onConfirm(value.trim())}
            className="px-3 py-1.5 text-sm rounded-md bg-[#ff6b35] text-white hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}