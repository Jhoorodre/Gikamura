
import React from 'react';
import Image from '../common/Image';

const HubHeader = React.memo(({ hub }) => {
    // Adiciona uma guarda de segurança para evitar erros se o hub não for fornecido.
    if (!hub) {
        return null;
    }

    return (
        <div className="hub-header">
            <div className="hub-header-content">
                <div className="hub-icon-container">
                    <Image
                        src={hub.icon?.url}
                        alt={hub.icon?.alt || hub.title}
                        className="hub-icon"
                        errorSrc="https://placehold.co/128x128/1e293b/94a3b8?text=Hub"
                    />
                </div>
                <div className="hub-info">
                    <h1 className="hub-title">{hub.title}</h1>
                    <p className="hub-description">{hub.description}</p>
                </div>
            </div>
        </div>
    );
});

HubHeader.displayName = 'HubHeader';

export default HubHeader;
