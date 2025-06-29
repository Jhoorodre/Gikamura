# Código Responsável pelo Widget RemoteStorage

## 📚 1. Carregamento das Bibliotecas

```html
<!-- Biblioteca principal do RemoteStorage -->
<script src="./static_global/js/remotestorage.min.js"></script>

<!-- Widget de interface (responsável pela interface visual) -->
<script src="./static_global/js/widget.min.js"></script> 

<!-- Configurações customizadas -->
<script src="./static_global/js/remotestorage.js"></script>
```

## 🎨 2. Estilos CSS para Posicionamento

```css
/* Força o widget do RemoteStorage a ficar fixo no canto */
#remotestorage-widget {
    position: fixed !important;
    bottom: 1rem;
    left: 1rem;
    z-index: 9999;
}
```

## ⚡ 3. Inicialização JavaScript

```javascript
// Esta parte do código inicializa o widget
remoteStorage.on('ready', () => {
    const widget = new Widget(remoteStorage);
    widget.attach();
});
```

## 🔍 Como Funciona

### Widget Fechado (Ícone da Nuvem)
- **Arquivo responsável**: `widget.min.js`
- **Função**: `new Widget(remoteStorage)`
- **Posição**: Definida pelo CSS `#remotestorage-widget`

### Widget Aberto (Formulário de Conexão)
- **Disparado**: Quando você clica no ícone da nuvem
- **Conteúdo**: 
  - Campo de input "user@provider.com"
  - Botão "Connect" verde
  - Link "Need help?"
- **Gerado**: Dinamicamente pelo `widget.min.js`

## 📝 Estrutura HTML Gerada pelo Widget

Quando o widget é anexado, ele cria algo similar a isto no DOM:

```html
<div id="remotestorage-widget" class="rs-widget">
    <!-- Estado fechado -->
    <div class="rs-cube">
        <div class="rs-icon"></div>
    </div>
    
    <!-- Estado aberto (quando clicado) -->
    <div class="rs-bubble">
        <div class="rs-bubble-text">Connect your storage</div>
        <input type="text" placeholder="user@provider.com">
        <button class="rs-connect">Connect</button>
        <a href="#" class="rs-help">Need help?</a>
    </div>
</div>
```

## 🎯 Pontos Importantes

1. **O HTML original não contém o widget** - ele é criado dinamicamente
2. **`widget.min.js` gera toda a interface** visual que você vê
3. **O CSS apenas posiciona** o widget no canto inferior esquerdo
4. **`widget.attach()`** é o comando que adiciona o widget ao DOM

## 🔧 Personalização Possível

Se quiser personalizar o widget, você pode:

```css
/* Mover para outro canto */
#remotestorage-widget {
    bottom: 1rem;
    right: 1rem; /* Em vez de left: 1rem */
}

/* Alterar cores do widget */
.rs-widget .rs-connect {
    background-color: #seu-cor !important;
}
```

## ⚠️ Arquivo em Falta

O arquivo `./static_global/js/remotestorage.js` não está visível no HTML fornecido, mas é essencial para:
- Definir esquemas de dados
- Configurar módulos personalizados  
- Implementar `globalHistoryHandler`