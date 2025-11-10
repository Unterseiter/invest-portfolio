import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__container">
        <div className="footer__content">
          
          {/* Компания */}
          <div className="footer__section">
            <h3 className="footer__title">ООО "Смотри"</h3>
            <p className="footer__text">
              © АО "Финансовые технологии", {currentYear}
            </p>
            <p className="footer__text footer__text--muted">
              Все права не защищены
            </p>
          </div>

          {/* Документы */}
          <div className="footer__section">
            <h3 className="footer__title">Документы</h3>
            <ul className="footer__list">
              <li className="footer__item">
                <Link 
                  to="/license-agreement" 
                  className="footer__link"
                >
                  Лицензионное соглашение
                </Link>
              </li>
              <li className="footer__item">
                <Link 
                  to="/privacy-policy" 
                  className="footer__link"
                >
                  Политика конфиденциальности
                </Link>
              </li>
              <li className="footer__item">
                <Link 
                  to="/risk-disclosure" 
                  className="footer__link"
                >
                  Раскрытие рисков
                </Link>
              </li>
            </ul>
          </div>

          {/* Регуляторная информация */}
          <div className="footer__section">
            <h3 className="footer__title">Информация</h3>
            <div className="footer__text-group">
              <p className="footer__text footer__text--muted">
                Лицензия Банка России № (ее нет)
              </p>
              <p className="footer__text footer__text--muted">
                от неизвестной даты
              </p>
              <p className="footer__text footer__text--muted">
                Не член SRO «Национальная ассоциация участников фондового рынка»
              </p>
            </div>
          </div>

          {/* Контакты */}
          <div className="footer__section">
            <h3 className="footer__title">Контакты</h3>
            <div className="footer__text-group">
              <p className="footer__text footer__text--muted">+7 (000) 000-00-00</p>
              <p className="footer__text footer__text--muted">support@почта.ru</p>
              <p className="footer__text footer__text--muted">ДНР, астродесантиков 228</p>
            </div>
          </div>
        </div>

        {/* Предупреждение о рисках */}
        <div className="footer__warning">
          <p className="footer__warning-text">
            ⚠️ Инвестиции на рынке ценных бумаг связаны с риском. 
            Стоимость активов может увеличиваться и уменьшаться. 
            Результаты инвестиций в прошлом не гарантируют доходности в будущем. 
            Прежде чем начать инвестировать, ознакомьтесь с информацией о рисках.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);