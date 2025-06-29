import { remoteStorage } from "./rs/rs-remotestorage";
import { createGlobalHistoryHandler } from "./rs/rs-history";
import Widget from "remotestorage-widget";

export { remoteStorage };
export const globalHistoryHandler = createGlobalHistoryHandler(remoteStorage);

// Para compatibilidade com window
if (typeof window !== 'undefined') {
  window.remoteStorage = remoteStorage;
  window.globalHistoryHandler = globalHistoryHandler;
}
