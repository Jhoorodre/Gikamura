// src/utils/encoding.js
export const encodeUrl = (str) => btoa(str);
export const decodeUrl = (encodedStr) => atob(encodedStr);
