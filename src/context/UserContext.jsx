import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import api from '../services/api';
import { useRemoteStorageContext } from './RemoteStorageContext';

const UserContext = createContext();
export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const { isConnected } = useRemoteStorageContext();
  const [pinnedItems, setPinnedItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [savedHubs, setSavedHubs] = useState([]);

  const refreshUserData = useCallback(() => {
    if (isConnected) {
      api.getAllPinnedSeries().then(setPinnedItems);
      api.getAllUnpinnedSeries().then(setHistoryItems);
      api.getAllHubs().then(setSavedHubs);
    }
  }, [isConnected]);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  return (
    <UserContext.Provider value={{ pinnedItems, historyItems, savedHubs, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
};
