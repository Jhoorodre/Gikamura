// Handler de histórico global para RemoteStorage
import { RS_PATH } from "./rs-config";
import { Model } from "./rs-schemas";

export const createGlobalHistoryHandler = (remoteStorage) => {
  const SORT_KEY = "timestamp";
  const MAX_VALUES = 20;

  let sortObjectByKey = (obj, key) => {
    if (!obj) return [];
    let sortable = [];
    for (let k in obj) {
      sortable.push(obj[k]);
    }
    sortable.sort((f, s) => s[key] - f[key]);
    return sortable;
  };

  const sync = async () => {
    let allSeries = await remoteStorage[RS_PATH].getAllSeries();
    for (const [key, value] of Object.entries(allSeries)) {
      try {
        if (!value[SORT_KEY]) {
          let separatorIndex = key.indexOf("-");
          let slug = key.slice(separatorIndex + 1);
          let source = key.slice(0, separatorIndex);
          await remoteStorage[RS_PATH].removeSeries(slug, source);
        }
      } catch (e) {
        console.error("[Global History] Sync error, continuing.");
      }
    }
  };

  // Hub methods
  const addHub = (url, title, iconUrl) => remoteStorage[RS_PATH].addHub(url, title, iconUrl);
  const removeHub = (url) => remoteStorage[RS_PATH].removeHub(url);
  const getAllHubs = async () => sortObjectByKey(await remoteStorage[RS_PATH].getAllHubs(), SORT_KEY);

  return {
    // Series methods
    max: MAX_VALUES,
    // Hub methods
    addHub,
    removeHub,
    getAllHubs,
  };
};
