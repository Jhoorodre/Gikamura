import { useState, useCallback } from 'react';
import { validateJSONFile, validateJSONString, sanitizeJSONData } from '../services/jsonValidator';
import { useAppContext } from '../context/AppContext';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const UploadPage = () => {
    const { addHub, isConnected } = useAppContext();
    const [uploadState, setUploadState] = useState('idle'); // idle, validating, uploading, success, error
    const [validationResult, setValidationResult] = useState(null);
    const [jsonPreview, setJsonPreview] = useState('');
    const [uploadError, setUploadError] = useState('');

    // Estado para upload manual de texto
    const [manualJson, setManualJson] = useState('');
    const [isManualMode, setIsManualMode] = useState(false);

    const resetState = () => {
        setUploadState('idle');
        setValidationResult(null);
        setJsonPreview('');
        setUploadError('');
        setManualJson('');
    };

    const handleFileUpload = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadState('validating');
        setUploadError('');

        try {
            const result = await validateJSONFile(file);
            setValidationResult(result);

            if (result.valid) {
                // Ler conteúdo para preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    setJsonPreview(content.substring(0, 1000) + (content.length > 1000 ? '...' : ''));
                };
                reader.readAsText(file);
                setUploadState('validated');
            } else {
                setUploadState('error');
            }
        } catch (error) {
            setUploadError(`Erro ao validar arquivo: ${error.message}`);
            setUploadState('error');
        }
    }, []);

    const handleManualValidation = useCallback(() => {
        if (!manualJson.trim()) {
            setUploadError('Cole o conteúdo JSON primeiro');
            return;
        }

        setUploadState('validating');
        setUploadError('');

        try {
            const result = validateJSONString(manualJson);
            setValidationResult(result);

            if (result.valid) {
                setJsonPreview(manualJson.substring(0, 1000) + (manualJson.length > 1000 ? '...' : ''));
                setUploadState('validated');
            } else {
                setUploadState('error');
            }
        } catch (error) {
            setUploadError(`Erro ao validar JSON: ${error.message}`);
            setUploadState('error');
        }
    }, [manualJson]);

    const handleUpload = useCallback(async () => {
        if (!validationResult?.valid || !isConnected) return;

        setUploadState('uploading');
        setUploadError('');

        try {
            const jsonData = JSON.parse(isManualMode ? manualJson : jsonPreview);
            const sanitizedData = sanitizeJSONData(jsonData);

            // Se for um hub, adiciona à biblioteca
            if (validationResult.metadata.type === 'hub') {
                const hubData = sanitizedData.hub;
                const fakeUrl = `local://hub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                await addHub(fakeUrl, hubData.title, hubData.icon?.url);
                
                console.log('Hub adicionado com sucesso:', hubData.title);
            }

            setUploadState('success');
            
            // Resetar após 3 segundos
            setTimeout(() => {
                resetState();
            }, 3000);

        } catch (error) {
            setUploadError(`Erro no upload: ${error.message}`);
            setUploadState('error');
        }
    }, [validationResult, isConnected, manualJson, jsonPreview, isManualMode, addHub]);

    const renderValidationResults = () => {
        if (!validationResult) return null;

        const { valid, errors, metadata } = validationResult;

        return (
            <div className={`p-4 rounded-lg border ${valid ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                <div className="flex items-center gap-2 mb-3">
                    <span className={valid ? 'text-green-400' : 'text-red-400'}>
                        {valid ? '✅' : '❌'}
                    </span>
                    <h3 className="font-semibold">
                        {valid ? 'Validação Bem-sucedida' : 'Erros de Validação'}
                    </h3>
                </div>

                {metadata && (
                    <div className="mb-3 text-sm text-text-secondary">
                        <p><strong>Tipo:</strong> {metadata.type}</p>
                        {metadata.title && <p><strong>Título:</strong> {metadata.title}</p>}
                        {metadata.seriesCount && <p><strong>Séries:</strong> {metadata.seriesCount}</p>}
                        {metadata.chapterCount && <p><strong>Capítulos:</strong> {metadata.chapterCount}</p>}
                        {metadata.fileName && <p><strong>Arquivo:</strong> {metadata.fileName}</p>}
                    </div>
                )}

                {!valid && errors.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-red-400">Erros encontrados:</p>
                        <ul className="text-sm text-red-300 space-y-1">
                            {errors.slice(0, 10).map((error, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>{error}</span>
                                </li>
                            ))}
                            {errors.length > 10 && (
                                <li className="text-red-400 italic">
                                    ... e mais {errors.length - 10} erros
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <ProtectedRoute>
            <div className="fade-in max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-4xl">📤</span>
                    <div>
                        <h1 className="text-4xl orbitron">Upload de Conteúdo</h1>
                        <p className="text-text-secondary mt-2">
                            Faça upload de hub.json ou reader.json válidos
                        </p>
                    </div>
                </div>

                {/* Toggle entre modos */}
                <div className="flex gap-4 mb-6">
                    <Button
                        onClick={() => {
                            setIsManualMode(false);
                            resetState();
                        }}
                        className={!isManualMode ? 'btn-primary' : 'btn-secondary'}
                    >
                        Upload de Arquivo
                    </Button>
                    <Button
                        onClick={() => {
                            setIsManualMode(true);
                            resetState();
                        }}
                        className={isManualMode ? 'btn-primary' : 'btn-secondary'}
                    >
                        Colar JSON
                    </Button>
                </div>

                {!isManualMode ? (
                    /* Modo Upload de Arquivo */
                    <div className="border-2 border-dashed border-surface-tertiary rounded-lg p-8 text-center hover:border-accent/50 transition-all duration-300">
                        {uploadState === 'validating' ? (
                            <div className="flex flex-col items-center gap-4">
                                <Spinner size="lg" />
                                <p className="text-lg">Validando arquivo...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-6xl">📄</div>
                                <div>
                                    <p className="text-lg font-medium">
                                        Selecione um arquivo JSON
                                    </p>
                                    <p className="text-text-secondary text-sm mt-2">
                                        Suporta hub.json e reader.json (máx. 10MB)
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept=".json,application/json"
                                    onChange={handleFileUpload}
                                    className="form-input max-w-sm mx-auto"
                                    disabled={uploadState === 'validating' || uploadState === 'uploading'}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    /* Modo Manual */
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Cole o conteúdo JSON aqui:
                            </label>
                            <textarea
                                value={manualJson}
                                onChange={(e) => setManualJson(e.target.value)}
                                placeholder="{ ... }"
                                className="form-input min-h-[200px] font-mono text-sm"
                                disabled={uploadState === 'validating' || uploadState === 'uploading'}
                            />
                        </div>
                        
                        <Button
                            onClick={handleManualValidation}
                            disabled={!manualJson.trim() || uploadState === 'validating'}
                            className="btn-secondary"
                        >
                            {uploadState === 'validating' ? (
                                <>
                                    <Spinner size="sm" />
                                    Validando...
                                </>
                            ) : (
                                'Validar JSON'
                            )}
                        </Button>
                    </div>
                )}

                {/* Resultados da Validação */}
                {validationResult && (
                    <div className="mt-6">
                        {renderValidationResults()}
                    </div>
                )}

                {/* Preview do JSON */}
                {jsonPreview && validationResult?.valid && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3">Preview do Conteúdo</h3>
                        <pre className="bg-surface-secondary p-4 rounded-lg text-sm overflow-x-auto border">
                            <code>{jsonPreview}</code>
                        </pre>
                    </div>
                )}

                {/* Botões de Ação */}
                {validationResult?.valid && (
                    <div className="flex gap-4 mt-6">
                        <Button
                            onClick={handleUpload}
                            disabled={uploadState === 'uploading' || !isConnected}
                            className="btn-primary"
                        >
                            {uploadState === 'uploading' ? (
                                <>
                                    <Spinner size="sm" />
                                    Fazendo Upload...
                                </>
                            ) : (
                                'Confirmar Upload'
                            )}
                        </Button>
                        
                        <Button
                            onClick={resetState}
                            className="btn-secondary"
                            disabled={uploadState === 'uploading'}
                        >
                            Cancelar
                        </Button>
                    </div>
                )}

                {/* Mensagens de Erro */}
                {uploadError && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                        <p className="text-red-400">{uploadError}</p>
                    </div>
                )}

                {/* Mensagem de Sucesso */}
                {uploadState === 'success' && (
                    <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded-lg">
                        <p className="text-green-400">✅ Upload realizado com sucesso!</p>
                    </div>
                )}

                {/* Status da Conexão */}
                {!isConnected && (
                    <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                        <p className="text-yellow-400">
                            ⚠️ Conecte-se ao RemoteStorage para fazer upload de arquivos
                        </p>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default UploadPage;
