// components/WarningModal/WarningModal.jsx
import React, { useState } from 'react';
import './WarningModal.css';

const WarningModal = ({ 
  onAccept, 
  onReject,
  licenseUrl = "/license-agreement"
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [shake, setShake] = useState(false);

  const handleOutsideClick = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleAccept = () => {
    onAccept(dontShowAgain);
  };

  const handleLicenseClick = (e) => {
    e.preventDefault();
    window.open(licenseUrl, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div 
        className={`warning-modal-content ${shake ? 'shake' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="warning-modal-header">
          <h2 className="warning-title">⚠️ ВНИМАНИЕ!</h2>
        </div>
        
        <div className="warning-modal-body">
          <div className="warning-scrollable-text">
            <p>
              Настоящим сообщаем, что все аналитические материалы, прогнозы и данные, 
              предоставляемые в рамках данного приложения, носят исключительно 
              информационный характер и не являются индивидуальной инвестиционной 
              рекомендацией, предложением о покупке или продаже каких-либо финансовых 
              инструментов, либо приглашением делать оферты.
            </p>
            
            <p>
              Администрация и разработчики приложения не несут ответственности за 
              любые убытки, ущерб или упущенную выгоду, возникшие в результате 
              использования или невозможности использования предоставленной информации 
              для принятия инвестиционных решений. Пользователь осознаёт и соглашается 
              с тем, что любые инвестиционные и торговые решения, принимаемые на основе 
              данных приложения, осуществляются им самостоятельно и под его полную 
              ответственность.
            </p>
            
            <p>
              Продолжая использование приложения, вы подтверждаете, что ознакомились 
              и безоговорочно соглашаетесь с условиями{' '}
              <a 
                href={licenseUrl} 
                onClick={handleLicenseClick}
                className="warning-license-link"
              >
                Пользовательского соглашения (Лицензионного договора)
              </a>
              , а также сведением об отсутствии каких-либо гарантий точности, 
              полноты и своевременности предоставляемых данных. Вы отказываетесь от 
              права предъявлять какие-либо претензии, судебные иски или требования к 
              разработчикам, администраторам и владельцам приложения, связанные с его 
              использованием.
            </p>
            
            <p>
              Также вы соглашаетесь на то, что во время проведения конференции команде, 
              написавшей данное приложение, будет выставлен наивысший балл, либо 
              предоставлена возможность самоэкзамена.
            </p>
          </div>
        </div>
        
        <div className="warning-modal-footer">
          <div className="warning-dont-show-container">
            <label className="warning-checkbox-label">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="warning-checkbox-input"
              />
              <span>Больше не показывать это предупреждение</span>
            </label>
          </div>
          
          <div className="warning-buttons-container">
            <button 
              onClick={onReject}
              className="warning-btn warning-btn-reject"
            >
              Я НЕ согласен
            </button>
            <button 
              onClick={handleAccept}
              className="warning-btn warning-btn-accept"
            >
              Я согласен
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarningModal;