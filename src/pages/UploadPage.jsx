// AIDEV-NOTE: Página Upload minimalista, foco em validação e UX limpa
import { useState, useCallback } from 'react';
import { validateJSONFile, validateJSONString, sanitizeJSONData } from '../services/jsonValidator';
import { useAppContext } from '../context/AppContext';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
// AIDEV-NOTE: css-unified; minimalist-pages integrado ao sistema CSS unificado

const UploadPage = () => {
    const { addHub, isConnected } = useAppContext();
    const [uploadState, setUploadState] = useState('idle'); // idle, validating, uploading, success, error
    const [validationResult, setValidationResult] = useState(null);
    const [jsonPreview, setJsonPreview] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [manualJson, setManualJson] = useState('');
    const [isManualMode, setIsManualMode] = useState(false);

    // AIDEV-NOTE: Reseta o estado do formulário
    const resetState = () => {
        setUploadState('idle');
        setValidationResult(null);
        setJsonPreview('');
        setUploadError('');
        setManualJson('');
    };

    // AIDEV-NOTE: Upload via arquivo
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    // AIDEV-NOTE: Validação de arquivo JSON
    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;
        setUploadState('validating');
        setUploadError('');
        try {
            const result = await validateJSONFile(file);
            setValidationResult(result);
            if (result.valid) {
                const content = await file.text();
                setJsonPreview(content);
                setUploadState('validated');
            } else {
                setUploadState('error');
            }
        } catch (error) {
            setUploadError(`Erro: ${error.message}`);
            setUploadState('error');
        }
    }, []);

    // AIDEV-NOTE: Validação manual de JSON colado
    const handleManualValidation = useCallback(() => {
        if (!manualJson.trim()) return;
        setUploadState('validating');
        setUploadError('');
        try {
            const result = validateJSONString(manualJson);
            setValidationResult(result);
            if (result.valid) {
                setJsonPreview(manualJson);
                setUploadState('validated');
            } else {
                setUploadState('error');
            }
        } catch (error) {
            setUploadError(`Erro: ${error.message}`);
            setUploadState('error');
        }
    }, [manualJson]);

    // AIDEV-NOTE: Upload final após validação
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
    
    return (
        <ProtectedRoute>
            <div className="min-page-container">
                <div className="min-content-wrapper">
                    <div className="min-header">
                        <h1 className="min-title">Upload de Conteúdo</h1>
                        <p className="min-subtitle">Adicione um novo hub.json ou reader.json.</p>
                    </div>
                    <div className="min-tabs">
                        <button onClick={() => { setIsManualMode(false); resetState(); }} className={`min-tab-button ${!isManualMode ? 'active' : ''}`}>
                            📁 Upload de Arquivo
                        </button>
                        <button onClick={() => { setIsManualMode(true); resetState(); }} className={`min-tab-button ${isManualMode ? 'active' : ''}`}>
                            📝 Colar JSON
                        </button>
                    </div>
                    <div className="min-upload-content">
                        {!isManualMode ? (
                            <div className="min-dropzone">
                                <input type="file" id="file-upload" className="min-dropzone-input" onChange={handleFileChange} accept=".json,application/json" />
                                <label htmlFor="file-upload" className="min-dropzone-label">
                                    <span className="min-dropzone-icon">📤</span>
                                    <p>Arraste e solte o arquivo aqui, ou clique para selecionar.</p>
                                    <small>Apenas arquivos .json são permitidos.</small>
                                </label>
                            </div>
                        ) : (
                            <div className="min-manual-input">
                                <textarea
                                    value={manualJson}
                                    onChange={(e) => setManualJson(e.target.value)}
                                    placeholder="Cole o conteúdo JSON aqui..."
                                    className="min-textarea"
                                />
                                <Button onClick={handleManualValidation} className="min-button mt-4" disabled={!manualJson.trim() || uploadState === 'validating'}>
                                    Validar JSON
                                </Button>
                            </div>
                        )}
                    </div>
                    {validationResult && (
                       <div className={`min-validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
                           <h4>Resultado da Validação</h4>
                           {validationResult.valid ? (
                               <p>✅ JSON válido!</p>
                           ) : (
                               <p>❌ Erro: {validationResult.errors.join(', ')}</p>
                           )}
                       </div>
                    )}
                    {uploadState === 'validated' && (
                        <div className="min-upload-actions">
                            <Button onClick={handleUpload} className="min-button" disabled={uploadState === 'uploading'}>
                                {uploadState === 'uploading' ? 'Enviando...' : 'Confirmar Upload'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default UploadPage;
