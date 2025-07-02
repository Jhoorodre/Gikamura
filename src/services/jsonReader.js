/**
 * Serviço para leitura e parsing de JSONs (hub.json e reader.json)
 * Implementa validação, cache e tratamento de erros robusto
 */

import { validateHubJSON, validateReaderJSON } from './jsonValidator.js';

/**
 * Classe para gerenciar cache de dados JSON
 */
class JSONCache {
    constructor() {
        this.cache = new Map();
        this.TTL = 5 * 60 * 1000; // 5 minutos
    }

    set(url, data) {
        this.cache.set(url, {
            data,
            timestamp: Date.now()
        });
    }

    get(url) {
        const cached = this.cache.get(url);
        if (!cached) return null;

        const isExpired = Date.now() - cached.timestamp > this.TTL;
        if (isExpired) {
            this.cache.delete(url);
            return null;
        }

        return cached.data;
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

const jsonCache = new JSONCache();

/**
 * Fetch JSON com timeout, retry e múltiplas estratégias para contornar CORS
 */
async function fetchWithRetry(url, options = {}) {
    const {
        timeout = 10000,
        retries = 3,
        retryDelay = 1000
    } = options;

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.log('🌐 [JSONReader] Iniciando fetch robusto para:', url);

    // Estratégias de fetch em ordem de prioridade
    const strategies = [
        {
            name: 'Direto (CORS)',
            fetch: async () => {
                if (isDev) console.log('📡 Estratégia 1: Fetch direto com CORS');
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'omit',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                    }
                });
                return response.ok ? await response.text() : null;
            }
        },
        {
            name: 'Direto (no-cors)',
            fetch: async () => {
                if (isDev) console.log('📡 Estratégia 2: Fetch direto no-cors');
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    credentials: 'omit'
                });
                // no-cors sempre retorna response opaco, tentar ler mesmo assim
                try {
                    return await response.text();
                } catch {
                    return null;
                }
            }
        },
        {
            name: 'Proxy AllOrigins',
            fetch: async () => {
                if (isDev) console.log('📡 Estratégia 3: Proxy AllOrigins');
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'omit'
                });
                if (response.ok) {
                    const proxyData = await response.json();
                    return proxyData.contents;
                }
                return null;
            }
        },
        {
            name: 'Proxy CORS Anywhere',
            fetch: async () => {
                if (isDev) console.log('📡 Estratégia 4: Proxy CORS Anywhere');
                const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'omit'
                });
                return response.ok ? await response.text() : null;
            }
        }
    ];

    let lastError = null;

    // Tentar cada estratégia
    for (const strategy of strategies) {
        if (isDev) console.log(`🎯 Tentando estratégia: ${strategy.name}`);
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                if (isDev) console.log(`📡 Tentativa ${attempt}/${retries} para ${strategy.name}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const text = await strategy.fetch();
                clearTimeout(timeoutId);
                
                if (text && text.trim()) {
                    if (isDev) console.log(`✅ Sucesso com ${strategy.name} (${text.length} caracteres)`);
                    
                    // Verificar se parece com JSON
                    const trimmed = text.trim();
                    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                        if (isDev) console.warn('⚠️ Resposta não parece ser JSON válido:', trimmed.substring(0, 100));
                        continue;
                    }

                    try {
                        const data = JSON.parse(text);
                        if (isDev) console.log(`✅ JSON parseado com sucesso via ${strategy.name}`);
                        return data;
                    } catch (parseError) {
                        if (isDev) console.warn(`⚠️ Erro ao fazer parse do JSON via ${strategy.name}:`, parseError.message);
                        lastError = parseError;
                        continue;
                    }
                }
                
            } catch (error) {
                if (isDev) console.warn(`⚠️ ${strategy.name} tentativa ${attempt} falhou:`, error.message);
                lastError = error;
                
                if (attempt < retries) {
                    const delay = retryDelay * attempt;
                    if (isDev) console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    }

    throw new Error(`Todas as estratégias de fetch falharam. Último erro: ${lastError?.message}`);
}

/**
 * Carrega e valida um arquivo hub.json
 */
export async function loadHubJSON(url) {
    try {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) console.log('🎯 Carregando Hub JSON:', url);

        // Verifica cache primeiro
        const cached = jsonCache.get(url);
        if (cached) {
            if (isDev) console.log('💾 Dados encontrados no cache');
            return cached;
        }

        // Fetch dos dados
        const data = await fetchWithRetry(url);

        // Validação do schema
        if (isDev) console.log('🔍 Validando estrutura do Hub JSON...');
        const validation = validateHubJSON(data);
        
        if (isDev) console.log('📊 Resultado da validação:', validation);
        
        if (!validation.valid) {
            console.error('❌ Erro de validação:', validation.errors);
            if (isDev) {
                console.log('📋 Estrutura recebida:', {
                    hasSchema: !!data.schema,
                    hasMeta: !!data.meta,
                    hasHub: !!data.hub,
                    hasSeries: !!data.series,
                    seriesCount: data.series?.length || 0,
                    firstSeries: data.series?.[0] ? Object.keys(data.series[0]) : null
                });
            }
            throw new Error(`Hub JSON inválido: ${validation.errors.join(', ')}`);
        }

        if (isDev) console.log('✅ Hub JSON válido');

        // Processamento adicional
        const processedData = {
            ...data,
            _metadata: {
                loadedAt: new Date().toISOString(),
                sourceUrl: url,
                seriesCount: data.series?.length || 0,
                cacheStatus: 'fresh'
            }
        };

        // Salva no cache
        jsonCache.set(url, processedData);

        return processedData;

    } catch (error) {
        console.error('❌ Erro ao carregar Hub JSON:', error);
        throw new Error(`Falha ao carregar Hub: ${error.message}`);
    }
}

/**
 * Carrega e valida um arquivo reader.json
 */
export async function loadReaderJSON(url) {
    try {
        console.log('📖 Carregando Reader JSON:', url);

        // Verifica cache primeiro
        const cached = jsonCache.get(url);
        if (cached) {
            console.log('💾 Dados encontrados no cache');
            return cached;
        }

        // Fetch dos dados
        const data = await fetchWithRetry(url);

        // Validação do schema
        console.log('🔍 Validando estrutura do Reader JSON...');
        const validation = validateReaderJSON(data);
        
        if (!validation.valid) {
            throw new Error(`Reader JSON inválido: ${validation.errors.join(', ')}`);
        }

        console.log('✅ Reader JSON válido');

        // Processamento adicional
        const chapters = data.chapters || {};
        const chapterKeys = Object.keys(chapters).sort();
        const totalChapters = chapterKeys.length;
        const lastChapter = chapterKeys[chapterKeys.length - 1];
        const lastUpdated = lastChapter ? chapters[lastChapter].last_updated : null;

        const processedData = {
            ...data,
            _metadata: {
                loadedAt: new Date().toISOString(),
                sourceUrl: url,
                totalChapters,
                lastChapter,
                lastUpdated,
                chapterKeys,
                cacheStatus: 'fresh'
            }
        };

        // Salva no cache
        jsonCache.set(url, processedData);

        return processedData;

    } catch (error) {
        console.error('❌ Erro ao carregar Reader JSON:', error);
        throw new Error(`Falha ao carregar Obra: ${error.message}`);
    }
}

/**
 * Utilitários para manipulação de dados
 */
export const JSONUtils = {
    /**
     * Formata timestamp Unix para data legível
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return 'Data desconhecida';
        
        try {
            const date = new Date(parseInt(timestamp) * 1000);
            return date.toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Data inválida';
        }
    },

    /**
     * Calcula tempo relativo (ex: "há 2 dias")
     */
    getRelativeTime(timestamp) {
        if (!timestamp) return 'Tempo desconhecido';
        
        try {
            const date = new Date(parseInt(timestamp) * 1000);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Hoje';
            if (diffDays === 1) return 'Ontem';
            if (diffDays < 7) return `Há ${diffDays} dias`;
            if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
            if (diffDays < 365) return `Há ${Math.floor(diffDays / 30)} meses`;
            return `Há ${Math.floor(diffDays / 365)} anos`;
        } catch {
            return 'Tempo inválido';
        }
    },

    /**
     * Extrai informações do capítulo
     */
    getChapterInfo(chapterData, chapterKey) {
        if (!chapterData) return null;

        return {
            id: chapterKey,
            title: chapterData.title || `Capítulo ${chapterKey}`,
            volume: chapterData.volume || '',
            lastUpdated: this.formatTimestamp(chapterData.last_updated),
            relativeTime: this.getRelativeTime(chapterData.last_updated),
            pageCount: Object.values(chapterData.groups || {}).flat().length,
            groups: Object.keys(chapterData.groups || {})
        };
    },

    /**
     * Filtra e ordena séries do hub
     */
    filterSeries(series, filters = {}) {
        let filtered = [...series];

        // Filtro por texto
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(s => 
                s.title?.toLowerCase().includes(searchLower) ||
                s.description?.toLowerCase().includes(searchLower) ||
                s.genres?.some(g => g.toLowerCase().includes(searchLower))
            );
        }

        // Filtro por gênero
        if (filters.genres?.length) {
            filtered = filtered.filter(s => 
                s.genres?.some(g => filters.genres.includes(g))
            );
        }

        // Filtro por status
        if (filters.status) {
            filtered = filtered.filter(s => s.status === filters.status);
        }

        // Ordenação
        if (filters.sortBy) {
            filtered.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'title':
                        return a.title?.localeCompare(b.title) || 0;
                    case 'updated':
                        return (b.lastUpdated || 0) - (a.lastUpdated || 0);
                    case 'rating':
                        return (b.rating?.community || 0) - (a.rating?.community || 0);
                    default:
                        return 0;
                }
            });
        }

        return filtered;
    }
};

/**
 * Exporta instância do cache para controle externo
 */
export { jsonCache };

/**
 * Hook para limpar cache quando necessário
 */
export function clearJSONCache() {
    jsonCache.clear();
    console.log('🧹 Cache JSON limpo');
}
