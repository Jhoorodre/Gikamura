// AIDEV-NOTE: Enhanced debug script for RemoteStorage analysis
console.log('🔧 [DEBUG] Enhanced RemoteStorage Data Analysis');

function analyzeRemoteStorageData() {
    try {
        const rs = window.remoteStorage;
        if (!rs) {
            console.log('❌ RemoteStorage não encontrado');
            return;
        }

        console.log('📊 RemoteStorage Status:', {
            connected: rs.connected,
            access: rs.access
        });

        const gika = rs['Gika'];
        if (!gika) {
            console.log('❌ Módulo Gika não encontrado');
            return;
        }

        // Get all data
        gika.getAllSeries().then(allSeries => {
            console.log('\n🗂️ === ANÁLISE COMPLETA DOS DADOS ===');
            console.log('Total de entradas encontradas:', Object.keys(allSeries || {}).length);
            
            const validSeries = [];
            const invalidEntries = [];
            const duplicateGroups = {};

            // Analyze each entry
            for (const [key, data] of Object.entries(allSeries || {})) {
                const analysis = {
                    key,
                    data,
                    issues: []
                };

                // Check key format
                if (key.includes('localhost:3000/') || key.includes('{') || key.includes('}')) {
                    analysis.issues.push('Chave corrompida');
                }

                // Check data type
                if (typeof data !== 'object' || Array.isArray(data) || data === null) {
                    analysis.issues.push('Tipo de dados inválido');
                }

                // Check for boolean values
                if (typeof data === 'boolean') {
                    analysis.issues.push('Valor booleano');
                }

                // Check required fields
                if (data && typeof data === 'object') {
                    if (!data.url) analysis.issues.push('URL ausente');
                    if (!data.title) analysis.issues.push('Título ausente');
                    if (!data.slug) analysis.issues.push('Slug ausente');
                    if (!data.source) analysis.issues.push('Source ausente');
                    
                    // Check for duplicates by title
                    if (data.title) {
                        const normalizedTitle = data.title.toLowerCase().trim();
                        if (!duplicateGroups[normalizedTitle]) {
                            duplicateGroups[normalizedTitle] = [];
                        }
                        duplicateGroups[normalizedTitle].push({key, data});
                    }
                }

                if (analysis.issues.length > 0) {
                    invalidEntries.push(analysis);
                } else {
                    validSeries.push({key, data});
                }
            }

            // Report invalid entries
            console.log('\n❌ === ENTRADAS INVÁLIDAS ===');
            invalidEntries.forEach(entry => {
                console.log(`🚫 Chave: "${entry.key}"`);
                console.log(`   Problemas: ${entry.issues.join(', ')}`);
                console.log(`   Dados:`, entry.data);
                console.log('');
            });

            // Report duplicates
            console.log('\n🔄 === ANÁLISE DE DUPLICATAS ===');
            Object.entries(duplicateGroups).forEach(([title, entries]) => {
                if (entries.length > 1) {
                    console.log(`📑 Título duplicado: "${title}"`);
                    entries.forEach((entry, index) => {
                        console.log(`   ${index + 1}. Chave: "${entry.key}"`);
                        console.log(`      Source: ${entry.data.source}`);
                        console.log(`      URL: ${entry.data.url}`);
                        console.log(`      Pinned: ${entry.data.pinned}`);
                    });
                    console.log('');
                }
            });

            // Report summary
            console.log('\n📈 === RESUMO ===');
            console.log(`✅ Entradas válidas: ${validSeries.length}`);
            console.log(`❌ Entradas inválidas: ${invalidEntries.length}`);
            console.log(`🔄 Títulos com duplicatas: ${Object.values(duplicateGroups).filter(g => g.length > 1).length}`);
            
            const pinnedCount = validSeries.filter(s => s.data.pinned).length;
            const unpinnedCount = validSeries.filter(s => !s.data.pinned).length;
            console.log(`📌 Obras pinadas: ${pinnedCount}`);
            console.log(`📄 Histórico: ${unpinnedCount}`);

            // Log valid pinned works
            console.log('\n📌 === OBRAS PINADAS VÁLIDAS ===');
            validSeries.filter(s => s.data.pinned).forEach((entry, index) => {
                console.log(`${index + 1}. ${entry.data.title}`);
                console.log(`   Source: ${entry.data.source}`);
                console.log(`   Slug: ${entry.data.slug}`);
                console.log(`   Key: ${entry.key}`);
            });

        }).catch(error => {
            console.error('❌ Erro ao analisar dados:', error);
        });

    } catch (error) {
        console.error('❌ Erro no script de debug:', error);
    }
}

// Auto-run analysis
if (window.remoteStorage && window.remoteStorage.connected) {
    analyzeRemoteStorageData();
} else {
    console.log('⏳ Aguardando conexão do RemoteStorage...');
    const checkConnection = setInterval(() => {
        if (window.remoteStorage && window.remoteStorage.connected) {
            clearInterval(checkConnection);
            analyzeRemoteStorageData();
        }
    }, 1000);
}

// Export for manual execution
window.debugRemoteStorage = analyzeRemoteStorageData;
