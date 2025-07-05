// AIDEV-NOTE: Script de debug para investigar duplicações e problemas nos dados do RemoteStorage
import api from '../src/services/api.js';

const debugRemoteStorage = async () => {
    console.log('🔍 [DEBUG] Iniciando investigação do RemoteStorage...');
    
    try {
        // Obter todos os dados brutos
        const allSeries = await window.remoteStorage['Gika']?.getAllSeries();
        console.log('📊 [DEBUG] Dados brutos do RemoteStorage:', allSeries);
        
        if (allSeries) {
            const seriesArray = Object.values(allSeries);
            console.log(`📊 [DEBUG] Total de séries no storage: ${seriesArray.length}`);
            
            // Verificar duplicações por slug
            const slugCounts = {};
            const urlCounts = {};
            
            seriesArray.forEach(series => {
                const key = `${series.source}:${series.slug}`;
                slugCounts[key] = (slugCounts[key] || 0) + 1;
                
                if (series.url) {
                    urlCounts[series.url] = (urlCounts[series.url] || 0) + 1;
                }
                
                console.log(`📝 [DEBUG] Série: ${series.title}`, {
                    slug: series.slug,
                    source: series.source,
                    pinned: series.pinned,
                    url: series.url,
                    timestamp: series.timestamp
                });
            });
            
            // Reportar duplicações
            console.log('🔍 [DEBUG] Contagem por slug+source:');
            Object.entries(slugCounts).forEach(([key, count]) => {
                if (count > 1) {
                    console.warn(`⚠️ [DEBUG] DUPLICAÇÃO DETECTADA: ${key} aparece ${count} vezes`);
                }
            });
            
            console.log('🔍 [DEBUG] Contagem por URL:');
            Object.entries(urlCounts).forEach(([url, count]) => {
                if (count > 1) {
                    console.warn(`⚠️ [DEBUG] URL DUPLICADA: ${url} aparece ${count} vezes`);
                }
            });
            
            // Verificar dados inválidos
            const invalidSeries = seriesArray.filter(series => 
                !series.url || !series.title || !series.slug || !series.source
            );
            
            if (invalidSeries.length > 0) {
                console.error('❌ [DEBUG] Séries com dados inválidos:', invalidSeries);
            }
            
            // Verificar filtros
            const pinnedSeries = seriesArray.filter(s => s.pinned);
            const unpinnedSeries = seriesArray.filter(s => !s.pinned);
            
            console.log(`📌 [DEBUG] Séries pinadas: ${pinnedSeries.length}`);
            console.log(`📄 [DEBUG] Séries não pinadas: ${unpinnedSeries.length}`);
            
            pinnedSeries.forEach(series => {
                console.log(`⭐ [DEBUG] Pinada: ${series.title} (${series.source}:${series.slug})`);
            });
        }
        
        // Testar os métodos da API
        console.log('🧪 [DEBUG] Testando métodos da API...');
        const apiPinned = await api.getAllPinnedSeries();
        const apiUnpinned = await api.getAllUnpinnedSeries();
        
        console.log(`🧪 [DEBUG] API getAllPinnedSeries retornou: ${apiPinned.length} itens`);
        console.log(`🧪 [DEBUG] API getAllUnpinnedSeries retornou: ${apiUnpinned.length} itens`);
        
    } catch (error) {
        console.error('❌ [DEBUG] Erro durante debug:', error);
    }
};

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(debugRemoteStorage, 3000); // Esperar RemoteStorage carregar
    });
} else {
    setTimeout(debugRemoteStorage, 3000);
}

export default debugRemoteStorage;
