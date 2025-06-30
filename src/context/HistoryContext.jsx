import React, { createContext, useContext } from 'react';
import { useHistory as useHistoryHook } from '../hooks/useHistory';

const HistoryContext = createContext();

export const useHistory = () => useContext(HistoryContext);

export const HistoryProvider = ({ children }) => {
    const history = useHistoryHook();
    return (
        <HistoryContext.Provider value={history}>
            {children}
        </HistoryContext.Provider>
    );
};
