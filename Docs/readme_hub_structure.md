# Hub JSON - Estrutura Escalável com GitHub CDN

## 🎯 Visão Geral

Sistema para gerenciar grandes coleções de obras usando repositórios GitHub como CDN, onde cada obra é um JSON individual acessível via URL direta.

**Vantagens:**
- **GitHub como CDN**: Gratuito, rápido, confiável
- **URLs diretas**: Cada obra é um endpoint independente
- **Escalabilidade**: Sem limite de obras
- **Versionamento**: Git nativo para controle de versões
- **Global**: jsdelivr.net para CDN mundial

## 🌐 Arquitetura com URLs Raw

### Estrutura no GitHub
```
seu-repo/
├── hub.json                    # Índice principal
├── mhaw/                      # Pasta de manhwas
│   ├── Torre_dos_Deuses_P1.json
│   ├── Torre_dos_Deuses_P2.json
│   └── ...
├── manga/                     # Pasta de mangás
│   ├── Obra_A.json
│   └── ...
└── api/                       # APIs auxiliares
    ├── search.json
    └── genres.json
```

### URLs de Acesso

**CDN (Recomendado - Cache Global):**
```
https://cdn.jsdelivr.net/gh/usuario/repo@refs/heads/main/hub.json
https://cdn.jsdelivr.net/gh/usuario/repo@refs/heads/main/mhaw/Torre_dos_Deuses_P1.json
```

**Raw GitHub (Direto):**
```
https://raw.githubusercontent.com/usuario/repo/refs/heads/main/hub.json
https://raw.githubusercontent.com/usuario/repo/refs/heads/main/mhaw/Torre_dos_Deuses_P1.json
```

## 📋 Estrutura do Hub.json

### Exemplo Otimizado
```json
{
  "v": "2.1",
  "updated": "2025-06-25",
  "hub": {
    "id": "hub-001",
    "name": "Scan Hub BR",
    "desc": "Grupo de tradução colaborativo",
    "lang": "pt-BR",
    "repo": "https://github.com/usuario/repo"
  },
  "social": [
    {
      "type": "discord",
      "url": "https://discord.gg/...",
      "primary": true
    }
  ],
  "featured": [
    {
      "id": "w001",
      "title": "Torre dos Deuses P1",
      "slug": "torre-p1",
      "cover": "https://files.catbox.moe/y8t3n2.jpg",
      "status": "complete",
      "chapters": 78,
      "rating": 4.8,
      "url": "https://cdn.jsdelivr.net/gh/usuario/repo@main/mhaw/Torre_dos_Deuses_P1.json",
      "priority": 1
    }
  ],
  "api": {
    "all_works": "https://cdn.jsdelivr.net/gh/usuario/repo@main/api/works.json",
    "search": "https://cdn.jsdelivr.net/gh/usuario/repo@main/api/search.json",
    "base_url": "https://cdn.jsdelivr.net/gh/usuario/repo@main/"
  },
  "stats": {
    "total_works": 4,
    "total_chapters": 461,
    "avg_rating": 4.8
  }
}
```

## 📖 Dicionário Completo

### Hub Principal

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `v` | string | ✅ | Versão da estrutura | `"2.1"` |
| `updated` | string | ✅ | Data atualização (YYYY-MM-DD) | `"2025-06-25"` |
| `hub.id` | string | ✅ | ID único do hub | `"hub-001"` |
| `hub.name` | string | ✅ | Nome do grupo | `"Scan Hub BR"` |
| `hub.desc` | string | ✅ | Descrição curta | `"Grupo de tradução"` |
| `hub.lang` | string | ✅ | Idioma (ISO 639-1) | `"pt-BR"` |
| `hub.repo` | string | ❌ | URL do repositório | `"https://github.com/user/repo"` |

### Social
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `social[].type` | string | ❌ | Plataforma: `discord`, `telegram`, `twitter`, `whatsapp` |
| `social[].url` | string | ❌ | URL completa |
| `social[].primary` | boolean | ❌ | Canal principal (padrão: false) |

### Featured Works
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `featured[].id` | string | ✅ | ID único (w001, w002...) |
| `featured[].title` | string | ✅ | Título da obra |
| `featured[].slug` | string | ✅ | URL amigável |
| `featured[].cover` | string | ✅ | URL da capa (HTTPS) |
| `featured[].status` | string | ✅ | `ongoing`, `complete`, `hiatus`, `dropped` |
| `featured[].chapters` | number | ✅ | Total de capítulos disponíveis |
| `featured[].rating` | number | ❌ | Nota (0-5) |
| `featured[].url` | string | ✅ | URL do JSON da obra |
| `featured[].priority` | number | ❌ | Ordem de exibição |
| `featured[].latest` | boolean | ❌ | Obra mais recente |

### API Endpoints
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `api.all_works` | string | ❌ | URL lista completa |
| `api.search` | string | ❌ | URL índice busca |
| `api.base_url` | string | ✅ | URL base para construir paths |

## 🚀 Implementação

### 1. Configuração Inicial
```javascript
// Carrega hub principal
const hubUrl = 'https://cdn.jsdelivr.net/gh/usuario/repo@main/hub.json';
const hub = await fetch(hubUrl).then(r => r.json());

// Acessa obras em destaque
const featured = hub.featured;
```

### 2. Carregamento de Obra Individual
```javascript
// URL da obra específica
const workUrl = hub.featured[0].url;
const work = await fetch(workUrl).then(r => r.json());
```

### 3. Lista Completa (Para +100 obras)
```javascript
// Carrega lista paginada
const allWorksUrl = hub.api.all_works;
const works = await fetch(allWorksUrl).then(r => r.json());
```

## 📈 Escalabilidade

### Para 10-50 Obras
- Use apenas `featured[]` no hub.json
- Sem necessidade de API separada

### Para 50-500 Obras
- Hub com featured (top 5)
- API separada: `api/works.json` com paginação

### Para 500+ Obras
- Hub mínimo (só featured)
- API paginada: 50 obras por página
- Índice de busca: `api/search.json`
- Cache agressivo

### Exemplo API Works.json
```json
{
  "page": 1,
  "per_page": 50,
  "total": 1000,
  "total_pages": 20,
  "works": [
    {
      "id": "w001",
      "title": "Torre dos Deuses P1",
      "cover": "https://files.catbox.moe/y8t3n2.jpg",
      "status": "complete",
      "chapters": 78,
      "rating": 4.8,
      "url": "https://cdn.jsdelivr.net/gh/usuario/repo@main/mhaw/Torre_dos_Deuses_P1.json"
    }
  ],
  "next_page": "https://cdn.jsdelivr.net/gh/usuario/repo@main/api/works.json?page=2"
}
```

## ⚡ Performance

### URLs Recomendadas
- **CDN**: `cdn.jsdelivr.net` (cache global, mais rápido)
- **Raw**: `raw.githubusercontent.com` (direto, sem cache)

### Cache Strategy
```javascript
// Cache por 1 hora
const cacheTime = 3600;
fetch(url, {
  headers: {
    'Cache-Control': `max-age=${cacheTime}`
  }
});
```

### Otimizações
- Use jsdelivr para cache global
- Mantenha hub.json < 10KB
- Featured works máximo 5 itens
- Lazy loading para detalhes

## 🔧 Ferramentas

### Validação de URLs
```bash
# Teste se URL funciona
curl -I "https://cdn.jsdelivr.net/gh/usuario/repo@main/hub.json"
```

### Geração Automática
```javascript
// Script para gerar hub.json automaticamente
const generateHub = (works) => {
  return {
    v: "2.1",
    updated: new Date().toISOString().split('T')[0],
    featured: works.slice(0, 5).map(work => ({
      id: work.id,
      title: work.title,
      url: `https://cdn.jsdelivr.net/gh/usuario/repo@main/mhaw/${work.filename}.json`
    }))
  };
};
```

## 🚨 Boas Práticas

### Naming Convention
- IDs: `w001`, `w002`, `w003...`
- Arquivos: `Nome_da_Obra.json` (sem espaços especiais)
- URLs: sempre HTTPS

### Estrutura Mínima
- Hub sempre < 10KB
- Featured máximo 5 obras
- URLs absolutas sempre

### Monitoramento
- Teste URLs regularmente
- Monitor GitHub rate limits
- Backup de dados importantes

### Segurança
- Títulos anonimizados
- Sem dados pessoais
- Disclaimer legal sempre presente