# Integração Claude Code + VS Code + Automação

## 1. Conectando Claude Code ao VS Code

Claude Code pode se conectar ao VS Code para automação, geração de código, refatoração e execução de comandos inteligentes diretamente do terminal.

### Como conectar:

1. **Abra o VS Code normalmente no seu projeto.**
2. **No terminal do Ubuntu/WSL, dentro da pasta do projeto, execute:**
   ```bash
   claude --ide
   ```
   - O Claude tentará detectar e conectar ao VS Code aberto.
   - Se houver mais de um VS Code aberto, ele pedirá para escolher.

3. **Após conectar, você pode usar prompts para automação, geração de código, refatoração, etc.**

---

## 2. Integração com o Projeto

- Você pode pedir para o Claude:
  - Gerar arquivos, funções, componentes, testes, etc.
  - Refatorar código existente.
  - Rodar scripts, comandos npm/yarn, lint, build, etc.
  - Automatizar tarefas repetitivas (ex: atualizar dependências, criar documentação, etc).
  - Analisar e sugerir melhorias no código.

**Exemplo:**
```bash
claude "Crie um componente React chamado Card com suporte a tema escuro."
```

---

## 3. Automação

- Use o Claude para automatizar fluxos de trabalho:
  - Geração de código em massa
  - Refatoração de múltiplos arquivos
  - Execução de scripts customizados
  - Geração de documentação automática
  - Testes automatizados

**Exemplo:**
```bash
claude "Refatore todos os arquivos .js para usar arrow functions."
```

---

## 4. Lista de Comandos Claude Code

| Comando | O que faz |
|---------|-----------|
| `claude --help` | Mostra a ajuda e todos os comandos disponíveis |
| `claude <prompt>` | Inicia uma sessão interativa ou executa um prompt direto |
| `claude --print -p <prompt>` | Executa o prompt e imprime a resposta (modo não interativo) |
| `claude --ide` | Conecta automaticamente ao VS Code aberto |
| `claude config` | Gerencia configurações do Claude Code |
| `claude mcp` | Configura e gerencia servidores MCP (Model Context Protocol) |
| `claude doctor` | Diagnostica e verifica a saúde da instalação do Claude Code |
| `claude update` | Verifica e instala atualizações do Claude Code |
| `claude install [target]` | Instala build nativa do Claude Code (stable, latest, versão específica) |
| `claude migrate-installer` | Migra instalação global para local |
| `claude config set -g <chave> <valor>` | Define configuração global (ex: tema, modelo) |
| `claude --model <modelo>` | Usa um modelo específico (ex: sonnet, opus) |
| `claude --output-format <formato>` | Define o formato de saída (text, json, stream-json) |
| `claude --input-format <formato>` | Define o formato de entrada |
| `claude --continue` | Continua a conversa mais recente |
| `claude --resume [sessionId]` | Retoma uma conversa anterior |
| `claude --debug` | Ativa modo debug |
| `claude --allowedTools <tools>` | Permite apenas ferramentas específicas |
| `claude --disallowedTools <tools>` | Bloqueia ferramentas específicas |
| `claude --add-dir <diretórios>` | Permite acesso a diretórios adicionais |
| `claude --dangerously-skip-permissions` | Ignora checagens de permissão (não recomendado para produção) |

---

## 5. Exemplos de Uso

### Gerar código
```bash
claude "Crie um hook React para buscar dados de uma API."
```

### Refatorar projeto
```bash
claude "Refatore todos os componentes para usar styled-components."
```

### Automatizar testes
```bash
claude "Gere testes unitários para todos os serviços em src/services."
```

### Gerar documentação
```bash
claude "Crie um README.md para o projeto explicando a arquitetura."
```

---

## 6. Dicas
- Sempre rode o comando dentro da pasta do projeto para melhor contexto.
- Use `claude --ide` para integração máxima com o VS Code.
- Combine comandos e flags para automação avançada.
- Consulte sempre `claude --help` para ver novidades e opções.

---

**Documentação oficial:** https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview
