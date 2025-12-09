import React from 'react';

function AboutSettings() {
    const appVersion = '1.0.0';
    const releaseDate = 'Декабрь 2024';
    
    return (
        <div className="setting-group">
            <h3 className="setting-group__title">Информация о приложении</h3>
            
            <div className="setting-options">
                <div className="setting-option" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <strong style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                            Финансовый менеджер
                        </strong>
                        <span className="option-text">
                            Приложение для управления личными финансами и отслеживания расходов
                        </span>
                    </div>
                    
                    <div style={{ width: '100%' }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            marginBottom: 'var(--spacing-xs)',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            <span>Версия:</span>
                            <span style={{ color: 'var(--color-accent)', fontWeight: 'var(--font-weight-semibold)' }}>
                                {appVersion}
                            </span>
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            marginBottom: 'var(--spacing-xs)',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            <span>Дата выпуска:</span>
                            <span>{releaseDate}</span>
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            <span>Разработчик:</span>
                            <span>FinManager Team</span>
                        </div>
                    </div>
                </div>
                
                <div className="setting-option" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <strong style={{ display: 'block', marginBottom: 'var(--spacing-sm)' }}>
                        Контакты и поддержка
                    </strong>
                    
                    <div style={{ width: '100%' }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            marginBottom: 'var(--spacing-xs)',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            <span>Поддержка:</span>
                            <a 
                                href="mailto:support@finmanager.app"
                                style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
                            >
                                support@finmanager.app
                            </a>
                        </div>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            <span>Официальный сайт:</span>
                            <a 
                                href="https://finmanager.app"
                                style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                finmanager.app
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style={{ 
                marginTop: 'var(--spacing-xl)', 
                paddingTop: 'var(--spacing-lg)',
                borderTop: '1px solid var(--border-tertiary)'
            }}>
                <h4 style={{ 
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 'var(--spacing-md)'
                }}>
                    Лицензионное соглашение
                </h4>
                <p style={{ 
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-tertiary)',
                    lineHeight: 1.5
                }}>
                    © 2024 FinManager Team. Все права защищены. 
                    Данное программное обеспечение предоставляется «как есть» без каких-либо гарантий.
                    Использование приложения означает согласие с условиями использования и политикой конфиденциальности.
                </p>
            </div>
        </div>
    );
}

export default AboutSettings;