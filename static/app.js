const { useState, useEffect, useRef, useMemo } = React;

// --- LÓGICA DE ARMAZENAMENTO UNIFICADA ---

const RS_PATH = "Gika";

const remoteStorage = (() => {
  const Model = {
    name: RS_PATH,
    builder: (privateClient) => {
      const SERIES_META = "series";
      const REPLACEMENT_STR = "{SOURCE_SLUG_REPLACEMENT}";
      const SERIES_META_PATH_BASE = "series/";
      const SERIES_META_PATH = `${SERIES_META_PATH_BASE}${REPLACEMENT_STR}`;

      privateClient.declareType(SERIES_META, {
        type: "object",
        properties: {
          slug: { type: "string" },
          coverUrl: { type: "string" },
          source: { type: "string" },
          url: { type: "string" },
          title: { type: "string" },
          timestamp: { type: "number" },
          chapters: { type: "array", default: [] },
          pinned: { type: "boolean", default: false },
        },
        required: [ "slug", "source", "url", "title", "timestamp", "chapters", "pinned" ],
      });

      const HUB_META = "hub";
      const HUB_REPLACEMENT_STR = "{HUB_URL_REPLACEMENT}";
      const HUB_META_PATH_BASE = "hubs/";
      const HUB_META_PATH = `${HUB_META_PATH_BASE}${HUB_REPLACEMENT_STR}`;

      privateClient.declareType(HUB_META, {
        type: "object",
        properties: {
          url: { type: "string" },
          title: { type: "string" },
          iconUrl: { type: "string" },
          timestamp: { type: "number" },
        },
        required: ["url", "title", "timestamp"],
      });

      let slugBuilder = (slug, source) => `${source}-${slug}`;
      let pathBuilder = (path, slug, source) => path.replace(REPLACEMENT_STR, slugBuilder(slug, source));
      let seriesBuilder = (slug, coverUrl, source, url, title, pinned, chapters) => ({
          slug: slug,
          coverUrl: coverUrl || "",
          source: source,
          url: url,
          title: title,
          timestamp: Date.now(),
          chapters: chapters || [],
          pinned: pinned === undefined ? false : pinned,
      });

      let hubPathBuilder = (path, hubUrl) => path.replace(HUB_REPLACEMENT_STR, btoa(hubUrl));
      let hubBuilder = (url, title, iconUrl) => ({ url, title, iconUrl, timestamp: Date.now() });

      return {
        exports: {
          slugBuilder,
          addSeries: (slug, coverUrl, source, url, title, pinned, chapters) => {
            let toStore = seriesBuilder(slug, coverUrl, source, url, title, pinned, chapters);
            return privateClient.storeObject(SERIES_META, pathBuilder(SERIES_META_PATH, slug, source), toStore);
          },
          editSeries: async (slug, coverUrl, source, url, title, pinned, chapters) => {
            let obj = await privateClient.getObject(pathBuilder(SERIES_META_PATH, slug, source));
            if (obj) {
              let toStore = seriesBuilder(
                slug || obj.slug,
                coverUrl || obj.coverUrl,
                source || obj.source,
                url || obj.url,
                title || obj.title,
                pinned !== undefined ? pinned : obj.pinned,
                chapters || obj.chapters
              );
              return privateClient.storeObject(SERIES_META, pathBuilder(SERIES_META_PATH, slug, source), toStore);
            } else {
              console.error("[Remote Storage] Não é possível editar uma série que não existe.");
            }
          },
          getSeries: (slug, source) => privateClient.getObject(pathBuilder(SERIES_META_PATH, slug, source), false),
          removeSeries: (slug, source) => privateClient.remove(pathBuilder(SERIES_META_PATH, slug, source)),
          getAllSeries: () => {
            if (privateClient.storage.connected) {
              return privateClient.getAll(SERIES_META_PATH_BASE, 60000);
            } else {
              return privateClient.getAll(SERIES_META_PATH_BASE);
            }
          },
          addHub: (url, title, iconUrl) => privateClient.storeObject(HUB_META, hubPathBuilder(HUB_META_PATH, url), hubBuilder(url, title, iconUrl)),
          removeHub: (url) => privateClient.remove(hubPathBuilder(HUB_META_PATH, url)),
          getAllHubs: () => privateClient.getAll(HUB_META_PATH_BASE),
        },
      };
    },
  };

  const rs = new RemoteStorage({
    cache: true,
    modules: [Model],
    disableFeatures: ["Dropbox", "GoogleDrive", "IndexedDB"],
  });

  rs.access.claim(RS_PATH, "rw");
  rs.caching.enable(`/${RS_PATH}/`);

  return rs;
})();

const globalHistoryHandler = (() => {
    const SORT_KEY = "timestamp";
    const MAX_VALUES = 20;

    const sortObjectByKey = (obj, key) => {
        return obj ? Object.values(obj).sort((a, b) => b[key] - a[key]) : [];
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
                console.error("[Global History] Erro de sincronização, continuando.");
            }
        }
    };

    const pushSeries = async (slug, coverUrl, source, url, title) => {
        await sync();
        let allCurrentSeries = sortObjectByKey((await remoteStorage[RS_PATH].getAllSeries()) || {}, SORT_KEY);
        let existingSeries = allCurrentSeries.find(e => e.slug === slug && e.source === source);
        allCurrentSeries = allCurrentSeries.filter(e => !e.pinned);

        while (allCurrentSeries.length + (existingSeries ? 0 : 1) > MAX_VALUES) {
            let last = allCurrentSeries.pop();
            await remoteStorage[RS_PATH].removeSeries(last.slug, last.source);
        }

        if (existingSeries) {
            return remoteStorage[RS_PATH].editSeries(slug, coverUrl, source, url, title, existingSeries.pinned, existingSeries.chapters);
        } else {
            return remoteStorage[RS_PATH].addSeries(slug, coverUrl, source, url, title, undefined, undefined);
        }
    };

    const removeSeries = (slug, source) => sync().then(() => remoteStorage[RS_PATH].removeSeries(slug, source));

    const removeAllUnpinnedSeries = async () => {
        let series = await globalHistoryHandler.getAllUnpinnedSeries();
        if (series) series.forEach(srs => removeSeries(srs.slug, srs.source));
    };

    const addChapters = async (slug, source, chapters) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        if (existingSeries) {
            chapters = [...new Set([...chapters, ...existingSeries.chapters])];
            return remoteStorage[RS_PATH].editSeries(slug, undefined, source, undefined, undefined, undefined, chapters);
        } else {
            console.error("[Global History] addChapters - A série não existe.");
        }
    };

    const addChapter = (slug, source, chapter) => addChapters(slug, source, [chapter]);

    const removeChapter = async (slug, source, chapter) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        if (existingSeries) {
            let chapters = existingSeries.chapters.filter(e => e !== chapter);
            return remoteStorage[RS_PATH].editSeries(slug, undefined, source, undefined, undefined, undefined, chapters);
        } else {
            console.error("[Global History] removeChapter - A série não existe.");
        }
    };

    const removeAllChapters = async (slug, source) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        if (existingSeries) {
            return remoteStorage[RS_PATH].editSeries(slug, undefined, source, undefined, undefined, undefined, []);
        } else {
            console.error("[Global History] removeAllChapters - a série não existe.");
        }
    };

    const getReadChapters = async (slug, source) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        return existingSeries ? existingSeries.chapters : (console.error("[Global History] getReadChapters - a série não existe."), undefined);
    };

    const isSeriesPinned = async (slug, source) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        return !!(existingSeries && existingSeries.pinned);
    };

    const pinSeries = async (slug, coverUrl, source, url, title) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        if (existingSeries) {
            return remoteStorage[RS_PATH].editSeries(slug, undefined, source, undefined, undefined, true, undefined);
        } else {
            return remoteStorage[RS_PATH].addSeries(slug, coverUrl, source, url, title, true, undefined);
        }
    };
    
    const unpinSeries = async (slug, source) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        if (existingSeries) {
            return remoteStorage[RS_PATH].editSeries(slug, undefined, source, undefined, undefined, false, undefined);
        } else {
            console.error("[Global History] unpinSeries - a série não existe.");
        }
    };

    const getAllPinnedSeries = async () => sync().then(() => sortObjectByKey((remoteStorage[RS_PATH].getAllSeries()) || {}, SORT_KEY).filter(e => e.pinned));
    const getAllUnpinnedSeries = async () => sync().then(() => sortObjectByKey((remoteStorage[RS_PATH].getAllSeries()) || {}, SORT_KEY).filter(e => !e.pinned));

    const addHub = (url, title, iconUrl) => remoteStorage[RS_PATH].addHub(url, title, iconUrl);
    const removeHub = (url) => remoteStorage[RS_PATH].removeHub(url);
    const getAllHubs = async () => sortObjectByKey(await remoteStorage[RS_PATH].getAllHubs(), "timestamp");

    return { max: MAX_VALUES, pushSeries, removeSeries, removeAllUnpinnedSeries, addChapters, addChapter, removeChapter, removeAllChapters, getReadChapters, isSeriesPinned, pinSeries, unpinSeries, getAllPinnedSeries, getAllUnpinnedSeries, addHub, removeHub, getAllHubs };
})();

const purgePreviousCache = () => {
  remoteStorage.caching.reset();
  for (let [key, value] of Object.entries(localStorage)) {
    if (key.startsWith("remotestorage") && value === "undefined") {
      localStorage.removeItem(key);
    }
  }
};

// --- RESTANTE DO SEU CÓDIGO REACT ---
const createParticles = () => {
    const container = document.getElementById('particles-container');
    if (!container || container.childElementCount > 0) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        container.appendChild(particle);
    }
};

const BookOpenIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C12 6.253 11.213 6 10.188 6c-1.25 0-2.475.253-3.375.575C5.75 7.125 5 8.15 5 9.292v11.918c0 .75.5 1.375 1.125 1.375.75 0 1.5-.125 2.25-.375C9.75 21.875 10.875 21.625 12 21.625m0-13C12 6.253 12.787 6 13.812 6c1.25 0 2.475.253 3.375.575C18.25 7.125 19 8.15 19 9.292v11.918c0 .75-.5 1.375-1.125 1.375-.75 0-1.5-.125-2.25-.375C14.25 21.875 13.125 21.625 12 21.625" /></svg>);
const ChevronLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>);
const ChevronRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>);
const ViewColumnsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>);
const DocumentIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
const ArrowUpIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>);
const SortAscendingIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>);
const SortDescendingIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>);
const CloudIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const HistoryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

const Spinner = () => (
    <div className="flex flex-col justify-center items-center p-12 min-h-screen">
        <div className="loading-orb mb-4"></div>
        <p className="text-white/70 text-lg">A carregar conteúdo...</p>
    </div>
);

const ErrorMessage = ({ message, onRetry }) => (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="panel-dark border border-red-500/30 text-red-300 px-6 py-4 rounded-2xl relative fade-in text-center" role="alert">
            <div className="flex items-center justify-center mb-4">
                <svg className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <strong className="font-bold">Erro: </strong>
            </div>
            <span>{message}</span>
            {onRetry && <button onClick={onRetry} className="mt-4 bg-red-800/50 text-white px-6 py-2 rounded-xl">Tentar Novamente</button>}
        </div>
    </div>
);

const HubHistory = ({ hubs, onSelectHub, onRemoveHub }) => {
    if (!hubs || hubs.length === 0) return null;

    return (
        <div className="panel-solid rounded-2xl p-6 mb-6 fade-in">
            <div className="flex items-center gap-3 mb-4">
                <HistoryIcon />
                <h3 className="text-xl font-bold text-white orbitron">Hubs Salvos</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {hubs.map((hub, index) => (
                    <div key={hub.url} className="hub-item flex items-center justify-between p-3 rounded-lg">
                        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => onSelectHub(hub)}>
                            {hub.iconUrl && (
                                <img src={`https://corsproxy.io/?${encodeURIComponent(hub.iconUrl)}`} alt={hub.title} className="w-8 h-8 rounded-full object-cover bg-gray-800" onError={(e) => { e.target.style.display = 'none'; }} />
                            )}
                            <div className="flex-1">
                                <p className="text-white font-medium truncate">{hub.title}</p>
                                <p className="text-gray-400 text-sm truncate">{hub.url}</p>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveHub(hub.url);
                            }}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remover hub"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HubLoader = ({ onLoadHub, loading, savedHubs, onSelectSavedHub, onRemoveSavedHub }) => {
    const [url, setUrl] = useState("https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/main/hub_tog.json");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) {
            onLoadHub(url.trim());
        }
    };

    return (
        <div className="w-full max-w-2xl">
            <HubHistory 
                hubs={savedHubs}
                onSelectHub={onSelectSavedHub}
                onRemoveHub={onRemoveSavedHub}
            />
            
            <div className="panel-solid rounded-3xl p-8 text-center fade-in">
                <h1 className="text-4xl font-black mb-6 header-title orbitron">Carregar Hub</h1>
                <p className="text-gray-300 mb-8">Insira o URL Json que deseja carregar.</p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="url" 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)} 
                        className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-white" 
                        placeholder="https://exemplo.com/seu_hub.json" 
                        required 
                    />
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="bg-gradient-to-r from-red-800 to-red-600 text-white px-8 py-3 rounded-xl hover:from-red-700 hover:to-red-500 transition-all duration-300 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'A carregar...' : 'Carregar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const SocialLinks = ({ social }) => (
    <div className="mt-6">
        <h4 className="font-bold text-lg text-red-300 mb-3 text-left">Junte-se à nossa comunidade:</h4>
        <div className="flex flex-wrap gap-4">
            {social.platforms.map((platform) => (
                <a key={platform.id} href={platform.url} target="_blank" rel="noopener noreferrer" className="panel-dark px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors flex-grow text-center">{platform.name}</a>
            ))}
        </div>
    </div>
);

const HubHeader = ({ hub, social, onSaveHub, isHubSaved }) => (
    <div className="panel-solid rounded-3xl p-8 mb-16 fade-in">
        <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="relative flex-shrink-0">
                <div className="neon-border rounded-full">
                    <img src={`https://corsproxy.io/?${encodeURIComponent(hub.icon.url)}`} alt={hub.icon.alt} className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-2xl bg-gray-800" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center gap-4 mb-4 justify-center lg:justify-start">
                    <h1 className="text-4xl md:text-5xl font-black header-title orbitron">{hub.title}</h1>
                    <button
                        onClick={onSaveHub}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                            isHubSaved 
                                ? 'bg-green-800/50 text-green-300 hover:bg-green-700/50' 
                                : 'panel-dark text-white hover:bg-white/10'
                        }`}
                        title={isHubSaved ? 'Hub salvo' : 'Salvar hub'}
                    >
                        <CloudIcon />
                    </button>
                </div>
                <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-p:leading-relaxed">
                    <p className="whitespace-pre-wrap">{hub.description}</p>
                    {social && <SocialLinks social={social} />}
                </div>
            </div>
        </div>
    </div>
);

const MangaGrid = ({ series, onSelectManga }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {series.map((manga, index) => (
            <div key={manga.id} onClick={() => onSelectManga(manga)} className="manga-card panel-solid rounded-2xl overflow-hidden cursor-pointer group fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="relative aspect-[3/4] overflow-hidden">
                    <img src={`https://corsproxy.io/?${encodeURIComponent(manga.cover.url)}`} alt={manga.cover.alt} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x600/1f2937/4b5563?text=Capa'; }}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4"><BookOpenIcon /></div>
                    </div>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-red-400 group-hover:to-red-600 group-hover:bg-clip-text transition-all duration-300">{manga.title}</h3>
                    <div className="h-1 bg-gradient-to-r from-red-800 to-red-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </div>
            </div>
        ))}
    </div>
);

const MangaInfo = ({ mangaData, onBackToHub }) => (
    <div className="panel-solid rounded-3xl p-8 mb-8 fade-in">
        <button onClick={onBackToHub} className="mb-8 panel-dark px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-3"><ChevronLeftIcon /> <span className="font-medium">Voltar à Lista</span></button>
        <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="relative flex-shrink-0"><div className="neon-border rounded-2xl"><img src={`https://corsproxy.io/?${encodeURIComponent(mangaData.cover.url)}`} alt={mangaData.cover.alt} className="w-64 h-auto object-cover rounded-2xl shadow-2xl bg-gray-800" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/256x358/1f2937/4b5563?text=Capa'; }}/></div></div>
            <div className="flex-1 text-white">
                <h1 className="text-5xl font-bold mb-4 header-title orbitron">{mangaData.title}</h1>
                <p className="text-2xl text-red-300 mb-2 font-medium">por {mangaData.author.name}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                    <span className="panel-dark px-3 py-1 rounded-md text-sm font-semibold capitalize">{mangaData.status.translation}</span>
                    <span className="panel-dark px-3 py-1 rounded-md text-sm font-semibold capitalize">{mangaData.type}</span>
                    <span className="panel-dark px-3 py-1 rounded-md text-sm font-semibold">{mangaData.publication.year}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                    {mangaData.genres.map(g => <span key={g} className="bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-xs font-medium capitalize">{g}</span>)}
                </div>
                <div className="prose prose-invert prose-lg max-w-none"><p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{mangaData.description}</p></div>
            </div>
        </div>
    </div>
);

const ChapterList = ({ mangaData, onSelectChapter, sortOrder, setSortOrder }) => {
    const chapterKeys = useMemo(() => {
        if (!mangaData?.chapters) return [];
        const keys = Object.keys(mangaData.chapters);
        return keys.sort((a, b) => {
            const numA = parseFloat(a.replace(/[^0-9.]/g, '')) || 0;
            const numB = parseFloat(b.replace(/[^0-9.]/g, '')) || 0;
            return sortOrder === 'asc' ? numA - numB : numB - numA;
        });
    }, [mangaData, sortOrder]);

    return (
        <div className="panel-solid rounded-3xl p-8 fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white orbitron">Capítulos</h2>
                <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="panel-dark px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2">
                    {sortOrder === 'asc' ? <SortAscendingIcon/> : <SortDescendingIcon />}
                    <span>{sortOrder === 'asc' ? 'Mais Antigos' : 'Mais Recentes'}</span>
                </button>
            </div>
            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-2">
                {chapterKeys.map((key, index) => {
                    const chapter = mangaData.chapters[key];
                    return (
                        <div key={key} className="chapter-item" style={{ animationDelay: `${index * 0.05}s` }}>
                            <button onClick={() => onSelectChapter(key)} className={`w-full text-left p-4 rounded-xl transition-all duration-300 text-white panel-dark hover:bg-white/10 hover:transform hover:scale-102`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Cap. {key}: {chapter.title}</span>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const MangaViewer = ({ chapter, page, setPage, onBack, readingMode, setReadingMode, onNextChapter, onPrevChapter, isFirstChapter, isLastChapter }) => {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [activeGroup, setActiveGroup] = useState(Object.keys(chapter.groups || {})[0] || null);
    
    useEffect(() => { setActiveGroup(Object.keys(chapter.groups || {})[0] || null); }, [chapter]);

    const checkScrollTop = () => { if (!showScrollTop && window.pageYOffset > 400) setShowScrollTop(true); else if (showScrollTop && window.pageYOffset <= 400) setShowScrollTop(false); };
    const scrollTop = () => { window.scrollTo({top: 0, behavior: 'smooth'}); };

    useEffect(() => { 
        if (readingMode === 'scrolling') { 
            window.addEventListener('scroll', checkScrollTop); 
            return () => window.removeEventListener('scroll', checkScrollTop); 
        } else { 
            setShowScrollTop(false); 
        } 
    }, [readingMode, showScrollTop]);

    const pages = activeGroup ? chapter.groups[activeGroup] : [];
    const totalPages = pages.length;

    if (!chapter || !activeGroup || pages.length === 0) { return <ErrorMessage message="Capítulo sem páginas ou com dados inválidos." onRetry={onBack} />; }
    if (readingMode === 'paginated' && (page >= totalPages || page < 0)) { setPage(0); return <Spinner />; }

    const goToNextPage = () => { if (page < totalPages - 1) setPage(p => p + 1); };
    const goToPrevPage = () => { if (page > 0) setPage(p => p - 1); };
    
    useEffect(() => { 
        const handleKeyDown = (e) => { 
            if (readingMode === 'paginated') { 
                if (e.key === 'ArrowRight') goToNextPage(); 
                else if (e.key === 'ArrowLeft') goToPrevPage(); 
            } 
        }; 
        window.addEventListener('keydown', handleKeyDown); 
        return () => window.removeEventListener('keydown', handleKeyDown); 
    }, [page, totalPages, readingMode]);

    return (
        <div className="w-full mx-auto mt-8">
            <div className="panel-solid rounded-2xl p-6 mb-8 fade-in">
                <div className="flex justify-between items-center w-full flex-wrap gap-4">
                    <button onClick={onBack} className="panel-dark px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2"><ChevronLeftIcon /><span className="hidden sm:inline">Voltar</span></button>
                    <div className="text-center flex-grow text-white">
                        <h3 className="text-xl md:text-2xl font-bold orbitron mb-1">{chapter.title}</h3>
                        {readingMode === 'paginated' && (<p className="text-red-300">Página {page + 1} de {totalPages}</p>)}
                    </div>
                    <button onClick={() => setReadingMode(readingMode === 'paginated' ? 'scrolling' : 'paginated')} className="panel-dark px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2">
                        {readingMode === 'paginated' ? <ViewColumnsIcon /> : <DocumentIcon />}<span className="hidden sm:inline">{readingMode === 'paginated' ? 'Scroll' : 'Página'}</span>
                    </button>
                </div>
                {Object.keys(chapter.groups || {}).length > 1 && (<div className="mt-4 flex flex-wrap gap-2">{Object.keys(chapter.groups).map((groupKey) => (<button key={groupKey} onClick={() => setActiveGroup(groupKey)} className={`px-4 py-2 rounded-lg transition-all duration-300 ${activeGroup === groupKey ? 'bg-gradient-to-r from-red-800 to-red-600 text-white' : 'panel-dark text-gray-300 hover:bg-white/10'}`}>{groupKey}</button>))}</div>)}
                <div className="mt-4 flex justify-between items-center"><button onClick={onPrevChapter} disabled={isFirstChapter} className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${isFirstChapter ? 'panel-dark text-gray-500 cursor-not-allowed' : 'panel-dark text-white hover:bg-white/10'}`}><ChevronLeftIcon /><span className="hidden sm:inline">Cap. Anterior</span></button><button onClick={onNextChapter} disabled={isLastChapter} className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${isLastChapter ? 'panel-dark text-gray-500 cursor-not-allowed' : 'panel-dark text-white hover:bg-white/10'}`}><span className="hidden sm:inline">Próximo Cap.</span><ChevronRightIcon /></button></div>
            </div>

            {readingMode === 'paginated' ? (
                <div className="p-4 sm:p-8 fade-in">
                    <div className="flex justify-center mb-6"><img src={`https://corsproxy.io/?${encodeURIComponent(pages[page])}`} alt={`Página ${page + 1}`} className="max-w-full h-auto rounded-xl shadow-2xl" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/800x1200/1f2937/4b5563?text=Erro+ao+Carregar'; }}/></div>
                    <div className="flex justify-between items-center"><button onClick={goToPrevPage} disabled={page === 0} className={`px-4 py-3 md:px-8 md:py-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${page === 0 ? 'panel-dark text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-800 to-red-600 text-white hover:from-red-700 hover:to-red-500'}`}><ChevronLeftIcon /><span>Anterior</span></button><span className="text-white font-medium text-lg">{page + 1} / {totalPages}</span><button onClick={goToNextPage} disabled={page === totalPages - 1} className={`px-4 py-3 md:px-8 md:py-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${page === totalPages - 1 ? 'panel-dark text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-800 to-red-600 text-white hover:from-red-700 hover:to-red-500'}`}><span>Próxima</span><ChevronRightIcon /></button></div>
                </div>
            ) : (
                <div className="p-4 sm:p-8 fade-in">
                    <div className="space-y-4">{pages.map((pageUrl, index) => (<div key={index} className="flex justify-center"><img src={`https://corsproxy.io/?${encodeURIComponent(pageUrl)}`} alt={`Página ${index + 1}`} className="max-w-full h-auto rounded-xl shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/800x1200/1f2937/4b5563?text=Erro+ao+Carregar'; }}/></div>))}</div>
                </div>
            )}
            {showScrollTop && (<button onClick={scrollTop} className="fixed bottom-8 right-8 bg-gradient-to-r from-red-800 to-red-600 text-white p-4 rounded-full shadow-2xl hover:from-red-700 hover:to-red-500 transition-all duration-300 z-30"><ArrowUpIcon /></button>)}
        </div>
    );
};

const App = () => {
    const [currentHubData, setHubData] = useState(null);
    const [currentHubUrl, setCurrentHubUrl] = useState('');
    const [savedHubs, setSavedHubs] = useState([]);
    const [selectedMangaData, setSelectedMangaData] = useState(null);
    const [selectedChapterKey, setSelectedChapterKey] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [readingMode, setReadingMode] = useState('paginated');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sortOrder, setSortOrder] = useState('desc');

    const loadSavedHubs = async () => {
        const hubs = await globalHistoryHandler.getAllHubs();
        setSavedHubs(hubs);
    };

    useEffect(() => {
        createParticles();
        loadSavedHubs();
        const widget = new Widget(remoteStorage, {});
        widget.attach("rs-widget-container");
    }, []);

    const isHubSaved = useMemo(() => {
        return savedHubs.some(hub => hub.url === currentHubUrl);
    }, [savedHubs, currentHubUrl]);

    const handleSaveHub = async () => {
        if (!currentHubData || !currentHubUrl) return;

        if (isHubSaved) {
            await globalHistoryHandler.removeHub(currentHubUrl);
        } else {
            await globalHistoryHandler.addHub(currentHubUrl, currentHubData.hub.title, currentHubData.hub.icon.url);
        }
        loadSavedHubs();
    };
    
    const handleRemoveSavedHub = async (url) => {
         if (confirm(`Tem a certeza que quer remover o hub "${savedHubs.find(h => h.url === url).title}"?`)) {
            await globalHistoryHandler.removeHub(url);
            loadSavedHubs();
         }
    }
    
    const handleSelectSavedHub = (hub) => {
        loadHub(hub.url);
    }

    const loadHub = async (url) => {
        try {
            setLoading(true);
            setError(null);
            setCurrentHubUrl(url);
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`Não foi possível carregar o hub (status: ${response.status})`);
            const data = await response.json();
            setHubData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectManga = async (mangaObject) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(mangaObject.data.url)}`);
            if (!response.ok) throw new Error(`Não foi possível carregar os capítulos do mangá (status: ${response.status})`);
            const chaptersData = await response.json();
            
            const completeMangaData = {
                ...mangaObject,
                chapters: chaptersData.chapters
            };
            
            setSelectedMangaData(completeMangaData);
            setSelectedChapterKey(null);
            setCurrentPage(0);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectChapter = (chapterKey) => {
        setSelectedChapterKey(chapterKey);
        setCurrentPage(0);
        window.scrollTo({top: 0, behavior: 'smooth'}); 
    };

    const backToHub = () => {
        setSelectedMangaData(null);
        setSelectedChapterKey(null);
        setCurrentPage(0);
    };
    
    const backToManga = () => {
        setSelectedChapterKey(null);
        setCurrentPage(0);
    };
    
    const resetApp = () => {
         setHubData(null);
         setSelectedMangaData(null);
         setSelectedChapterKey(null);
         setError(null);
         setCurrentHubUrl('');
    }

    const getChapterKeys = () => {
        if (!selectedMangaData?.chapters) return [];
        const keys = Object.keys(selectedMangaData.chapters);
        return keys.sort((a, b) => {
            const numA = parseFloat(a.match(/(\d+(\.\d+)?)/)?.[0]) || 0;
            const numB = parseFloat(b.match(/(\d+(\.\d+)?)/)?.[0]) || 0;
            
            if(numA !== numB) {
                return sortOrder === 'asc' ? numA - numB : numB - numA;
            }
            return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        });
    };

    const navigateChapter = (direction) => {
        const chapterKeys = getChapterKeys();
        const currentIndex = chapterKeys.indexOf(selectedChapterKey);
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        
        if (nextIndex >= 0 && nextIndex < chapterKeys.length) {
            selectChapter(chapterKeys[nextIndex]);
        }
    };

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error} onRetry={resetApp} />;
    
    const chapterKeys = currentHubData ? getChapterKeys() : [];
    const currentChapterIndex = currentHubData ? chapterKeys.indexOf(selectedChapterKey) : -1;

    return (
        <div className="min-h-screen text-white relative">
            <div id="rs-widget-container"></div>
            <div className={`container mx-auto px-4 relative z-10 ${!currentHubData ? 'h-full flex items-center justify-center' : 'py-8'}`}>
                {!currentHubData ? (
                    <HubLoader 
                        onLoadHub={loadHub} 
                        loading={loading} 
                        savedHubs={savedHubs}
                        onSelectSavedHub={handleSelectSavedHub}
                        onRemoveSavedHub={handleRemoveSavedHub}
                    />
                ) : !selectedMangaData ? (
                    <>
                        <div className="text-center mb-16 fade-in">
                             <button onClick={resetApp} className="panel-dark px-4 py-2 rounded-lg text-sm text-red-300 hover:bg-white/10 transition-all">Carregar outro Hub</button>
                        </div>
                        <HubHeader 
                            hub={currentHubData.hub} 
                            social={currentHubData.social}
                            onSaveHub={handleSaveHub}
                            isHubSaved={isHubSaved}
                        />
                        <MangaGrid series={currentHubData.series} onSelectManga={selectManga} />
                    </>
                ) : !selectedChapterKey ? (
                    <>
                        <MangaInfo mangaData={selectedMangaData} onBackToHub={backToHub} />
                        <ChapterList 
                            mangaData={selectedMangaData} 
                            onSelectChapter={selectChapter} 
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                        />
                    </>
                ) : (
                    <MangaViewer 
                        chapter={selectedMangaData.chapters[selectedChapterKey]} 
                        page={currentPage} 
                        setPage={setCurrentPage} 
                        onBack={backToManga}
                        readingMode={readingMode} 
                        setReadingMode={setReadingMode}
                        onNextChapter={() => navigateChapter('next')}
                        onPrevChapter={() => navigateChapter('prev')}
                        isFirstChapter={currentChapterIndex === 0}
                        isLastChapter={chapterKeys.length > 0 && currentChapterIndex === chapterKeys.length - 1}
                    />
                )}
            </div>
        </div>
    );
};

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
