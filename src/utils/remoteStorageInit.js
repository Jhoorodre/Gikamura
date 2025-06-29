// src/utils/remoteStorageInit.js
// Inicialização e configuração do RemoteStorage

import RemoteStorage from 'remotestoragejs';

export const initRemoteStorage = () => {
  // Verificar se RemoteStorage foi importado corretamente e é um construtor
  if (typeof RemoteStorage === 'undefined' || typeof RemoteStorage !== 'function') {
    console.warn('RemoteStorage não está disponível ou não é um construtor válido');
    return null;
  }

  try {
    // Inicializar RemoteStorage usando a variável importada
    const remoteStorage = new RemoteStorage();
    
    // Configurar módulos necessários
    remoteStorage.access.claim('hub-data', 'rw');
    remoteStorage.access.claim('preferences', 'rw');
    
    // Criar cliente para dados do hub
    const hubClient = remoteStorage.scope('/hub-data/');
    const preferencesClient = remoteStorage.scope('/preferences/');
    
    // Métodos para salvar e carregar dados do hub
    const hubStorage = {
      async saveHub(hubData) {
        try {
          const timestamp = new Date().toISOString();
          const dataToSave = {
            ...hubData,
            lastUpdated: timestamp,
            version: '1.0'
          };
          
          await hubClient.storeObject('application/json', 'current-hub.json', dataToSave);
          console.log('Hub salvo com sucesso:', timestamp);
          return true;
        } catch (error) {
          console.error('Erro ao salvar hub:', error);
          return false;
        }
      },
      
      async loadHub() {
        try {
          const hubData = await hubClient.getObject('current-hub.json');
          if (hubData) {
            console.log('Hub carregado:', hubData.lastUpdated);
            return hubData;
          }
          return null;
        } catch (error) {
          console.error('Erro ao carregar hub:', error);
          return null;
        }
      },
      
      async savePreferences(preferences) {
        try {
          const timestamp = new Date().toISOString();
          const dataToSave = {
            ...preferences,
            lastUpdated: timestamp
          };
          
          await preferencesClient.storeObject('application/json', 'user-preferences.json', dataToSave);
          console.log('Preferências salvas:', timestamp);
          return true;
        } catch (error) {
          console.error('Erro ao salvar preferências:', error);
          return false;
        }
      },
      
      async loadPreferences() {
        try {
          const preferences = await preferencesClient.getObject('user-preferences.json');
          if (preferences) {
            console.log('Preferências carregadas:', preferences.lastUpdated);
            return preferences;
          }
          return null;
        } catch (error) {
          console.error('Erro ao carregar preferências:', error);
          return null;
        }
      }
    };

    return { remoteStorage, hubStorage };

  } catch (error) {
    console.error('Erro ao inicializar RemoteStorage:', error);
    return null;
  }
};
