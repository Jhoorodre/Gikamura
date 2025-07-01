#!/usr/bin/env node

/**
 * Script para corrigir automaticamente problemas comuns de lint
 * Uso: node scripts/fix-lint-issues.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para encontrar todos os arquivos .jsx e .js no src
function findSourceFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Pula diretórios node_modules, dist, build
            if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
                findSourceFiles(filePath, fileList);
            }
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Função para remover imports não utilizados
function removeUnusedImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Lista de imports comuns para verificar se estão sendo usados
    const commonImports = [
        { name: 'React', regex: /React\./ },
        { name: 'Routes', regex: /<Routes/ },
        { name: 'Route', regex: /<Route/ },
        { name: 'Spinner', regex: /<Spinner/ },
        { name: 'ErrorMessage', regex: /<ErrorMessage/ },
        { name: 'Image', regex: /<Image/ },
        { name: 'Button', regex: /<Button/ },
        { name: 'ItemGrid', regex: /<ItemGrid/ },
        { name: 'HubView', regex: /<HubView/ },
        { name: 'MainContent', regex: /<MainContent/ },
        { name: 'ItemDetailView', regex: /<ItemDetailView/ },
        { name: 'ReaderView', regex: /<ReaderView/ },
        { name: 'RedirectPage', regex: /<RedirectPage/ },
        { name: 'HubLoaderPage', regex: /<HubLoaderPage/ },
        { name: 'HubRouteHandler', regex: /<HubRouteHandler/ },
        { name: 'LibraryPage', regex: /<LibraryPage/ },
        { name: 'ItemGridSkeleton', regex: /<ItemGridSkeleton/ },
        { name: 'HubLoader', regex: /<HubLoader/ },
        { name: 'ItemInfo', regex: /<ItemInfo/ },
        { name: 'EntryList', regex: /<EntryList/ },
        { name: 'HubHeader', regex: /<HubHeader/ },
        { name: 'HistoryIcon', regex: /<HistoryIcon/ },
        { name: 'TrashIcon', regex: /<TrashIcon/ },
        { name: 'ConfirmModal', regex: /<ConfirmModal/ },
        { name: 'HubHistory', regex: /<HubHistory/ },
        { name: 'BookOpenIcon', regex: /<BookOpenIcon/ },
        { name: 'Link', regex: /<Link/ },
        { name: 'Suspense', regex: /<Suspense/ },
        { name: 'BrowserRouter', regex: /<BrowserRouter/ },
        { name: 'QueryClientProvider', regex: /<QueryClientProvider/ },
        { name: 'AppProvider', regex: /<AppProvider/ },
        { name: 'App', regex: /<App/ }
    ];
    
    // Remove imports não utilizados linha por linha
    const lines = content.split('\n');
    const newLines = lines.filter(line => {
        if (line.startsWith('import ')) {
            // Verifica cada import comum
            for (const importItem of commonImports) {
                if (line.includes(importItem.name) && !importItem.regex.test(content)) {
                    console.warn(`Removendo import não utilizado: ${importItem.name} em ${filePath}`);
                    changed = true;
                    return false; // Remove a linha
                }
            }
        }
        return true; // Mantém a linha
    });
    
    if (changed) {
        content = newLines.join('\n');
        // Remove linhas vazias excessivas
        content = content.replace(/\n\n\n+/g, '\n\n');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.warn(`✅ Fixed: ${filePath}`);
        return true;
    }
    
    return false;
}

// Função principal
function main() {
    console.warn('🚀 Iniciando correção automática de imports não utilizados...\n');
    
    const srcDir = path.join(__dirname, '..', 'src');
    
    if (!fs.existsSync(srcDir)) {
        console.error('❌ Diretório src não encontrado!');
        // eslint-disable-next-line no-process-exit
        process.exit(1);
    }
    
    const sourceFiles = findSourceFiles(srcDir);
    let fixedFiles = 0;
    
    console.warn(`📁 Encontrados ${sourceFiles.length} arquivos para verificar...\n`);
    
    sourceFiles.forEach(filePath => {
        if (removeUnusedImports(filePath)) {
            fixedFiles++;
        }
    });
    
    console.warn(`\n✨ Correções concluídas:`);
    console.warn(`   - Arquivos processados: ${sourceFiles.length}`);
    console.warn(`   - Arquivos corrigidos: ${fixedFiles}`);
    
    if (fixedFiles > 0) {
        console.warn('\n🔍 Executando ESLint novamente...');
        try {
            execSync('npm run lint', { stdio: 'inherit' });
        } catch (error) {
            console.warn('\n⚠️  Ainda existem problemas de lint para correção manual.');
        }
    }
    
    console.warn('\n🎉 Script concluído!');
}

// Executa o script
main();
