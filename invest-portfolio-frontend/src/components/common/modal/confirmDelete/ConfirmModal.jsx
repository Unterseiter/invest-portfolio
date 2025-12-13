// ConfirmModal.jsx
import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-button modal-button--cancel" 
            onClick={onClose}
          >
            Отмена
          </button>
          <button 
            className="modal-button modal-button--confirm" 
            onClick={onConfirm}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;