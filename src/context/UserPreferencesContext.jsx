// AIDEV-NOTE: UserPreferencesContext armazena preferências/configurações do usuário (tema, idioma, etc)
import { createContext, useContext, useState } from 'react';

const UserPreferencesContext = createContext();

export const useUserPreferences = () => useContext(UserPreferencesContext);

export const UserPreferencesProvider = ({ children }) => {
    // Exemplo de preferências: tema, idioma, layout, etc
    const [theme, setTheme] = useState('dark');
    const [language, setLanguage] = useState('pt-BR');
    // Adicione outras preferências conforme necessário

    const value = {
        theme,
        setTheme,
        language,
        setLanguage,
    };

    return (
        <UserPreferencesContext.Provider value={value}>
            {children}
        </UserPreferencesContext.Provider>
    );
}; 