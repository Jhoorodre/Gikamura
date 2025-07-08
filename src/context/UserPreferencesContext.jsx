// AIDEV-NOTE: UserPreferencesContext armazena preferências/configurações do usuário (tema, idioma, etc)
import { createContext, useContext, useState } from 'react';

const UserPreferencesContext = createContext();

export const useUserPreferences = () => useContext(UserPreferencesContext);

export const UserPreferencesProvider = ({ children }) => {
    // Preferências do usuário: idioma, layout, etc
    const [language, setLanguage] = useState('pt-BR');
    // Adicione outras preferências conforme necessário

    const value = {
        language,
        setLanguage,
    };

    return (
        <UserPreferencesContext.Provider value={value}>
            {children}
        </UserPreferencesContext.Provider>
    );
}; 