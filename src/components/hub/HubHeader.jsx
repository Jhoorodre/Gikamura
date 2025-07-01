
import React from 'react';
import Image from '../common/Image';

const HubHeader = React.memo(({ hub }) => {
    // Adiciona uma guarda de segurança para evitar erros se o hub não for fornecido.
    if (!hub) {
        return null;
    }

    return (
        <div className="flex items-center gap-8 p-8 mb-16 card">
            <Image
                // Usa o encadeamento opcional para acessar as propriedades de forma segura.
                src={hub.icon?.url}
                alt={hub.icon?.alt || hub.title}
                className="w-32 h-32 rounded-full object-cover"
                style={{ border: '4px solid var(--color-primary-hover)'}}
                errorSrc="https://placehold.co/128x128/1e293b/94a3b8?text=Icon"
            />
            <div>
                <h1 className="orbitron">{hub.title}</h1>
                <p className="mt-2">{hub.description}</p>
            </div>
        </div>
    );
});

HubHeader.displayName = 'HubHeader';

export default HubHeader;
