import React, { createContext, useContext } from 'react';

const HistoryContext = createContext();

export const useHistory = () => useContext(HistoryContext);

export const HistoryProvider = ({ children }) => {
    const value = {};

    return (
        <HistoryContext.Provider value={value}>
            {children}
        </HistoryContext.Provider>
    );
};
