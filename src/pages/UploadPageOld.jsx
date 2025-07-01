import { useState } from 'react';
import { useRemoteStorageContext } from '../context/RemoteStorageContext';
import Button from '../components/common/Button';
import ProtectedRoute from '../components/common/ProtectedRoute';

const UploadPage = () => {
    const [jsonContent, setJsonContent] = useState('');
    const [validationResult, setValidationResult] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const { isConnected } = useRemoteStorageContext();

    // Valida se é um hub.json válido
    const validateHubJson = (data) => {
        const required = ['schema', 'meta', 'hub', 'series'];
        const hubRequired = ['id', 'title', 'icon'];
        
        for (const field of required) {
            if (!data[field]) return { valid: false, error: `Campo obrigatório '${field}' não encontrado` };
        }
        
        for (const field of hubRequired) {
            if (!data.hub[field]) return { valid: false, error: `Campo obrigatório 'hub.${field}' não encontrado` };
        }
        
        if (!Array.isArray(data.series)) {
            return { valid: false, error: 'Campo "series" deve ser um array' };
        }
        
        return { valid: true, type: 'hub' };
    };

    // Valida se é um reader.json válido
    const validateReaderJson = (data) => {
        const required = ['title', 'author', 'cover', 'chapters'];
        
        for (const field of required) {
            if (!data[field]) return { valid: false, error: `Campo obrigatório '${field}' não encontrado` };
        }
        
        if (typeof data.chapters !== 'object' || Array.isArray(data.chapters)) {
            return { valid: false, error: 'Campo "chapters" deve ser um objeto' };
        }
        
        // Valida pelo menos um capítulo
        const chapterKeys = Object.keys(data.chapters);
        if (chapterKeys.length === 0) {
            return { valid: false, error: 'Pelo menos um capítulo deve ser definido' };
        }
        
        // Valida estrutura de um capítulo
        const firstChapter = data.chapters[chapterKeys[0]];
        if (!firstChapter.title || !firstChapter.groups) {
            return { valid: false, error: 'Capítulos devem ter "title" e "groups"' };
        }
        
        return { valid: true, type: 'reader' };
    };

    // Função principal de validação
    const validateJson = async () => {
        setIsValidating(true);
        setValidationResult(null);
        setUploadSuccess(false);

        try {
            const data = JSON.parse(jsonContent);
            
            // Tenta validar como hub primeiro
            const hubValidation = validateHubJson(data);
            if (hubValidation.valid) {
                setValidationResult({
                    valid: true,
                    type: 'hub',
                    message: 'JSON válido como Hub! ✅',
                    data
                });
                return;
            }
            
            // Tenta validar como reader
            const readerValidation = validateReaderJson(data);
            if (readerValidation.valid) {
                setValidationResult({
                    valid: true,
                    type: 'reader',
                    message: 'JSON válido como Reader! ✅',
                    data
                });
                return;
            }
            
            // Se não é nem hub nem reader
            setValidationResult({
                valid: false,
                message: `Formato inválido. Erros encontrados:\n- Hub: ${hubValidation.error}\n- Reader: ${readerValidation.error}`
            });
            
        } catch (error) {
            setValidationResult({
                valid: false,
                message: `JSON inválido: ${error.message}`
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleUpload = async () => {
        if (!validationResult?.valid || !isConnected) return;
        
        try {
            // Simula upload para Remote Storage
            // Na implementação real, salvaria no Remote Storage
            console.log('Uploading to Remote Storage:', validationResult.data);
            setUploadSuccess(true);
            
            // Reset após sucesso
            setTimeout(() => {
                setJsonContent('');
                setValidationResult(null);
                setUploadSuccess(false);
            }, 3000);
            
        } catch (error) {
            console.error('Erro no upload:', error);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setJsonContent(e.target.result);
        };
        reader.readAsText(file);
    };

    if (!isConnected) {
        return (
            <ProtectedRoute />
        );
    }

    return (
        <div className="fade-in max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
                <span className="text-4xl">📤</span>
                <h1 className="text-4xl orbitron">Upload de Arquivos</h1>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Seção de Upload */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-lg font-semibold mb-4">
                            Carregar Arquivo JSON
                        </label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="w-full p-3 bg-surface-secondary rounded-lg border border-surface-tertiary focus:border-accent transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-semibold mb-4">
                            Ou Cole o Conteúdo JSON
                        </label>
                        <textarea
                            value={jsonContent}
                            onChange={(e) => setJsonContent(e.target.value)}
                            placeholder="Cole aqui o conteúdo do seu arquivo JSON..."
                            className="w-full h-96 p-4 bg-surface-secondary rounded-lg border border-surface-tertiary focus:border-accent transition-colors font-mono text-sm resize-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={validateJson}
                            disabled={!jsonContent.trim() || isValidating}
                            variant="secondary"
                            className="flex-1"
                        >
                            {isValidating ? 'Validando...' : 'Validar JSON'}
                        </Button>
                        
                        {validationResult?.valid && (
                            <Button
                                onClick={handleUpload}
                                variant="primary"
                                className="flex-1"
                            >
                                {uploadSuccess ? 'Sucesso! ✅' : 'Fazer Upload'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Seção de Resultado */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Resultado da Validação</h2>
                    
                    {validationResult && (
                        <div className={`p-4 rounded-lg ${validationResult.valid ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                            <p className="whitespace-pre-line">{validationResult.message}</p>
                            {validationResult.valid && (
                                <div className="mt-3 text-sm text-text-secondary">
                                    Tipo: {validationResult.type === 'hub' ? 'Hub (Lista de Obras)' : 'Reader (Obra Individual)'}
                                </div>
                            )}
                        </div>
                    )}

                    {!validationResult && !isValidating && (
                        <div className="p-4 bg-surface-secondary rounded-lg text-center text-text-secondary">
                            Cole ou carregue um arquivo JSON para validação
                        </div>
                    )}

                    {/* Informações sobre formatos */}
                    <div className="bg-surface-secondary p-4 rounded-lg">
                        <h3 className="font-semibold mb-3">Formatos Aceitos:</h3>
                        <div className="space-y-2 text-sm text-text-secondary">
                            <div>
                                <strong>Hub JSON:</strong> Lista de obras com metadados
                            </div>
                            <div>
                                <strong>Reader JSON:</strong> Obra individual com capítulos
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;
