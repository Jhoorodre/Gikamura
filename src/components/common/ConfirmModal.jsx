import React from 'react';

const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onConfirm}>Confirmar</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
