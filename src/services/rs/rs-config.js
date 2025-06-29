import RemoteStorage from "remotestoragejs";

const RS_PATH = "Gika";

export const createRemoteStorage = (modules) => {
  const remoteStorage = new RemoteStorage({
    cache: true,
    modules,
    disableFeatures: ["Dropbox", "GoogleDrive", "IndexedDB"],
  });
  remoteStorage.access.claim(RS_PATH, "rw");
  remoteStorage.caching.enable(`/${RS_PATH}/`);
  return remoteStorage;
};

export { RS_PATH };
