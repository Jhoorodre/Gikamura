import { createRemoteStorage } from "./rs-config";
import { Model } from "./rs-schemas";

// Instancia o RemoteStorage já configurado com o schema
export const remoteStorage = createRemoteStorage([Model]);
