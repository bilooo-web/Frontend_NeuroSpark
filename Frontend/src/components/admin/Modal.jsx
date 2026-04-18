import { X } from "lucide-react";

const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;

  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ad-modal-header">
          <h2>{title}</h2>
          <button className="ad-btn-ghost" onClick={onClose}>
            <X style={{ height: 20, width: 20 }} />
          </button>
        </div>
        <div className="ad-modal-body">{children}</div>
        {footer && <div className="ad-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;