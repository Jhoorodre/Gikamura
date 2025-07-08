
const ConfirmModal = ({ 
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  loading = false, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar",
  disabled = false 
}) => {
  if (!open) return null;
  
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button 
            className="btn btn-danger" 
            onClick={onConfirm}
            disabled={disabled || loading}
          >
            {confirmText}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
