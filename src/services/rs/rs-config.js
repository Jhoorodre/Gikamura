/**
 * Configuração dos paths do RemoteStorage.
 * Altere os valores aqui para renomear os módulos em toda a aplicação.
 * AIDEV-NOTE: Centralizes all RemoteStorage path config for easy maintenance
 */
export const RS_PATH = {
    BASE: "Gika", // AIDEV-NOTE: Main namespace for all app data
    READING_PROGRESS: "/Gika/", // AIDEV-NOTE: User reading progress and bookmarks
    BOOKMARKS: "/Gika/", // AIDEV-NOTE: Saved items and favorites
    SETTINGS: "/Gika/" // AIDEV-NOTE: User preferences and settings
};