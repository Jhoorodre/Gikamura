import RemoteStorage from 'remotestoragejs';
import { declareDataModels } from './models';
import { createStorageAPI } from './api';

export const RS_PATH = "Gika";

const Model = {
    name: RS_PATH,
    builder: (privateClient) => {
        declareDataModels(privateClient);
        return {
            exports: createStorageAPI(privateClient)
        };
    },
};

const remoteStorage = new RemoteStorage({
    cache: true,
    modules: [Model],
    disableFeatures: ["Dropbox", "GoogleDrive", "IndexedDB"],
});

remoteStorage.access.claim(RS_PATH, "rw");
remoteStorage.caching.enable(`/${RS_PATH}/`);

export default remoteStorage;
