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

        if (file.size > 10 * 1024 * 1024) {
            setUploadError('Arquivo muito grande (máx. 10MB)');
            return;
        }

        setUploadState('validating');
        setUploadError('');

        try {
            const result = await validateJSONFile(file);
            setValidationResult(result);

            if (result.valid) {
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

            if (validationResult.metadata.type === 'hub') {
                const hubData = sanitizedData.hub;
                const fakeUrl = `local://hub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                await addHub(fakeUrl, hubData.title, hubData.icon?.url);
                console.log('Hub adicionado com sucesso:', hubData.title);
            }

            setUploadState('success');
            setTimeout(resetState, 3000);
        } catch (error) {
            setUploadError(`Erro no upload: ${error.message}`);
            setUploadState('error');
        }
    }, [validationResult, isConnected, isManualMode, manualJson, jsonPreview, addHub]);

    const renderValidationResults = () => {
        if (!validationResult) return null;

        return (
            <div className={`upload-section ${validationResult.valid ? 'border-success/30' : 'border-error/30'}`}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    {validationResult.valid ? '✅' : '❌'}
                    Resultado da Validação
                </h3>
                
                {validationResult.valid ? (
                    <div className="space-y-3">
                        <p className="text-success">Arquivo válido!</p>
                        {validationResult.metadata && (
                            <div className="space-y-2 text-sm">
                                <p><strong>Tipo:</strong> {validationResult.metadata.type}</p>
                                <p><strong>Versão:</strong> {validationResult.metadata.version}</p>
                                {validationResult.metadata.title && (
                                    <p><strong>Título:</strong> {validationResult.metadata.title}</p>
                                )}
                                {validationResult.metadata.seriesCount && (
                                    <p><strong>Séries:</strong> {validationResult.metadata.seriesCount}</p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-error">Erro de validação:</p>
                        <p className="text-sm bg-error/10 p-3 rounded border border-error/20">
                            {validationResult.error}
                        </p>
                        {validationResult.errors && validationResult.errors.length > 0 && (
                            <div>
                                <p className="font-medium mb-2">Erros encontrados:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm bg-error/10 p-3 rounded border border-error/20">
                                    {validationResult.errors.slice(0, 10).map((error, index) => (
                                        <li key={index} className="text-error">{error}</li>
                                    ))}
                                    {validationResult.errors.length > 10 && (
                                        <li className="text-error italic">
                                            ... e mais {validationResult.errors.length - 10} erros
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <ProtectedRoute>
            <div className="page-container fade-in">
                <header className="page-header">
                    <span className="page-icon">📤</span>
                    <div>
                        <h1 className="page-title orbitron">Upload de Conteúdo</h1>
                        <p className="text-text-secondary mt-2 text-lg">
                            Faça upload de hub.json ou reader.json válidos
                        </p>
                    </div>
                </header>

                <div className="upload-container">
                    {/* Toggle entre modos */}
                    <div className="upload-tabs">
                        <button
                            onClick={() => {
                                setIsManualMode(false);
                                resetState();
                            }}
                            className={`upload-tab ${!isManualMode ? 'active' : ''}`}
                        >
                            📁 Upload de Arquivo
                        </button>
                        <button
                            onClick={() => {
                                setIsManualMode(true);
                                resetState();
                            }}
                            className={`upload-tab ${isManualMode ? 'active' : ''}`}
                        >
                            📝 Colar JSON
                        </button>
                    </div>

                    {!isManualMode ? (
                        /* Modo Upload de Arquivo */
                        <div className="upload-section">
                            {uploadState === 'validating' ? (
                                <div className="flex flex-col items-center gap-4 py-8">
                                    <Spinner size="lg" />
                                    <p className="text-lg">Validando arquivo...</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="text-6xl opacity-80">📄</div>
                                    <div>
                                        <p className="text-xl font-medium text-text-primary mb-2">
                                            Selecione um arquivo JSON
                                        </p>
                                        <p className="text-text-secondary">
                                            Suporta hub.json e reader.json (máx. 10MB)
                                        </p>
                                    </div>
                                    <div className="border-2 border-dashed border-surface-tertiary rounded-lg p-8 hover:border-accent/50 transition-all duration-300">
                                        <input
                                            type="file"
                                            accept=".json,application/json"
                                            onChange={handleFileUpload}
                                            className="w-full max-w-sm mx-auto p-3 bg-surface border border-surface-tertiary rounded-lg text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-text-inverse hover:file:bg-accent-hover transition-all"
                                            disabled={uploadState === 'validating' || uploadState === 'uploading'}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Modo Manual */
                        <div className="upload-section">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-lg font-medium mb-3 text-text-primary">
                                        Cole o conteúdo JSON aqui:
                                    </label>
                                    <textarea
                                        value={manualJson}
                                        onChange={(e) => setManualJson(e.target.value)}
                                        placeholder='{\n  "hub": {\n    "title": "Meu Hub",\n    "sources": [...]\n  }\n}'
                                        className="w-full min-h-[200px] p-4 bg-surface border border-surface-tertiary rounded-lg font-mono text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                                        disabled={uploadState === 'validating' || uploadState === 'uploading'}
                                    />
                                </div>
                                
                                <Button
                                    onClick={handleManualValidation}
                                    disabled={!manualJson.trim() || uploadState === 'validating'}
                                    className="btn-primary"
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
                        <div className="upload-section mt-6">
                            <h3 className="text-lg font-semibold mb-3">📋 Preview do Conteúdo</h3>
                            <pre className="bg-surface-secondary p-4 rounded-lg text-sm overflow-x-auto border border-surface-tertiary font-mono">
                                <code className="text-text-primary">{jsonPreview}</code>
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
                        <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-lg">
                            <p className="text-error">❌ {uploadError}</p>
                        </div>
                    )}

                    {/* Mensagem de Sucesso */}
                    {uploadState === 'success' && (
                        <div className="mt-4 p-4 bg-success/10 border border-success/30 rounded-lg">
                            <p className="text-success">✅ Upload realizado com sucesso!</p>
                        </div>
                    )}

                    {/* Status da Conexão */}
                    {!isConnected && (
                        <div className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                            <p className="text-warning">
                                ⚠️ Conecte-se ao RemoteStorage para fazer upload de arquivos
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default UploadPage;
