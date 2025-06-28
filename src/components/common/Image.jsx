import React from 'react';
import { CORS_PROXY_URL } from '../../constants';

const Image = ({ src, alt, className, errorSrc }) => {
    const handleError = (e) => {
        if (errorSrc) {
            e.target.onerror = null;
            e.target.src = errorSrc;
        }
    };

    return (
        <img
            src={`${CORS_PROXY_URL}${encodeURIComponent(src)}`}
            alt={alt}
            className={className}
            onError={handleError}
        />
    );
};

export default Image;
