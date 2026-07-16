import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="sb-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sb-modal" role="dialog" aria-modal="true">
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            border: "none",
            color: "#26221B",
            padding: 8,
            cursor: "pointer",
          }}
        >
          <X size={22} />
        </button>
        {title && (
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              marginTop: 0,
              marginBottom: 16,
              paddingRight: 32,
            }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
