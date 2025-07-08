/**
 * Validador JSON robusto para uploads
 * Garante que os arquivos seguem os padrões esperados (hub.json e reader.json)
 * AIDEV-NOTE: Validates hub.json and reader.json structure and fields with detailed schema validation
 */

// AIDEV-NOTE: Schema definitions for comprehensive validation
const HUB_SCHEMA = {
  required: ['schema', 'meta', 'hub', 'series'],
  schema: {
    required: ['version', 'format', 'encoding'],
    properties: {
      version: { type: 'string', pattern: /^\d+\.\d+$/ }, // AIDEV-NOTE: Semantic version format
      format: { type: 'string', enum: ['application/json'] },
      encoding: { type: 'string', enum: ['utf-8'] }
    }
  },
  meta: {
    required: ['version', 'lastUpdated', 'language'],
    properties: {
      version: { type: 'string', pattern: /^\d+\.\d+\.\d+$/ }, // AIDEV-NOTE: Semantic version
      lastUpdated: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ }, // AIDEV-NOTE: ISO date format
      language: { type: 'string', minLength: 2, maxLength: 5 }
    }
  },
  hub: {
    required: ['id', 'title', 'slug'],
    properties: {
      id: { type: 'string', minLength: 1 },
      title: { type: 'string', minLength: 1 },
      slug: { type: 'string', pattern: /^[a-z0-9-]+$/ } // AIDEV-NOTE: URL-safe slug pattern
    }
  },
  series: {
    type: 'array',
    minLength: 1,
    items: {
      required: ['id', 'title', 'slug'],
      properties: {
        id: { type: 'string', minLength: 1 },
        title: { type: 'string', minLength: 1 },
        slug: { type: 'string', pattern: /^[a-z0-9-]+$/ },
        status: { 
          type: 'object',
          properties: {
            // AIDEV-NOTE: Standardized status values for translation and original work
            translation: { type: 'string', enum: ['ongoing', 'completed', 'hiatus', 'cancelled'] },
            original: { type: 'string', enum: ['ongoing', 'completed', 'hiatus', 'cancelled'] }
          }
        }
      }
    }
  }
};

const READER_SCHEMA = {
  required: ['title', 'chapters'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 500 },
    description: { type: 'string' }, // Opcional e sem restrição mínima
    status: { type: 'string' }, // Aceita qualquer string
    cover: { type: 'string' }, // URL opcional sem validação rígida
    author: { type: 'string' }, // Autor opcional
    artist: { type: 'string' }, // Artista opcional
    chapters: { type: 'object', minProperties: 1 }
  },
  chapters: {
    keyPattern: /^.+$/, // Aceita qualquer chave não vazia (001, 002, Cap-1, etc.)
    value: {
      required: ['title', 'groups'],
      properties: {
        title: { type: 'string', minLength: 1 },
        volume: { type: 'string' }, // Volume opcional
        last_updated: { type: 'string' }, // Timestamp opcional
        groups: { type: 'object', minProperties: 1, flexibleStructure: true }
      }
    }
  }
};

/**
 * Utilitários de validação
 */
const validateType = (value, expectedType) => {
  if (expectedType === 'array') return Array.isArray(value);
  if (expectedType === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
  return typeof value === expectedType;
};

const validatePattern = (value, pattern) => {
  if (typeof value !== 'string') return false;
  return pattern.test(value);
};

const validateEnum = (value, enumValues) => {
  return enumValues.includes(value);
};

const validateLength = (value, min, max) => {
  const length = typeof value === 'string' ? value.length : 
                 Array.isArray(value) ? value.length :
                 typeof value === 'object' ? Object.keys(value).length : 0;
  
  if (min !== undefined && length < min) return false;
  if (max !== undefined && length > max) return false;
  return true;
};

/**
 * Valida uma propriedade individual
 */
const validateProperty = (value, schema, path = '') => {
  const errors = [];
  
  // Validação de tipo
  if (schema.type && !validateType(value, schema.type)) {
    errors.push(`${path}: Esperado ${schema.type}, recebido ${typeof value}`);
    return errors; // Se o tipo está errado, não faz sentido continuar
  }
  
  // Validações específicas para string
  if (typeof value === 'string') {
    if (schema.pattern && !validatePattern(value, schema.pattern)) {
      errors.push(`${path}: Formato inválido`);
    }
    
    if (schema.enum && !validateEnum(value, schema.enum)) {
      errors.push(`${path}: Deve ser um de: ${schema.enum.join(', ')}`);
    }
    
    if (schema.minLength && !validateLength(value, schema.minLength)) {
      errors.push(`${path}: Muito curto (mínimo ${schema.minLength} caracteres)`);
    }
    
    if (schema.maxLength && !validateLength(value, undefined, schema.maxLength)) {
      errors.push(`${path}: Muito longo (máximo ${schema.maxLength} caracteres)`);
    }
  }
  
  // Validações para array
  if (Array.isArray(value)) {
    if (schema.minLength && !validateLength(value, schema.minLength)) {
      errors.push(`${path}: Array muito pequeno (mínimo ${schema.minLength} itens)`);
    }
    
    if (schema.items) {
      value.forEach((item, index) => {
        const itemErrors = validateProperty(item, schema.items, `${path}[${index}]`);
        errors.push(...itemErrors);
      });
    }
  }
  
  // Validações para object
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (schema.minProperties && !validateLength(value, schema.minProperties)) {
      errors.push(`${path}: Objeto deve ter pelo menos ${schema.minProperties} propriedades`);
    }
  }
  
  return errors;
};

/**
 * Valida uma seção do objeto com flexibilidade para estruturas dinâmicas
 */
const validateSection = (data, schema, sectionName = '') => {
  const errors = [];
  const section = sectionName ? data[sectionName] : data;
  
  if (!section && sectionName) {
    errors.push(`Seção obrigatória '${sectionName}' não encontrada`);
    return errors;
  }
  
  // Validar propriedades obrigatórias
  if (schema.required) {
    for (const requiredField of schema.required) {
      if (!(requiredField in section)) {
        errors.push(`${sectionName}.${requiredField}: Campo obrigatório não encontrado`);
      }
    }
  }
  
  // Validar propriedades específicas
  if (schema.properties) {
    for (const [property, propertySchema] of Object.entries(schema.properties)) {
      if (section[property] !== undefined) {
        // Para propriedades com flexibleStructure, apenas validar o tipo
        if (propertySchema.flexibleStructure && propertySchema.type === 'object') {
          if (typeof section[property] !== 'object' || section[property] === null || Array.isArray(section[property])) {
            errors.push(`${sectionName}.${property}: Deve ser um objeto`);
          } else if (propertySchema.minProperties) {
            const keys = Object.keys(section[property]);
            if (keys.length < propertySchema.minProperties) {
              errors.push(`${sectionName}.${property}: Deve ter pelo menos ${propertySchema.minProperties} propriedades`);
            }
          }
        } else {
          // Validação normal para outras propriedades
          const propertyErrors = validateProperty(
            section[property], 
            propertySchema, 
            `${sectionName}.${property}`
          );
          errors.push(...propertyErrors);
        }
      }
    }
  }
  
  return errors;
};

/**
 * Valida estrutura de Hub JSON
 */
export const validateHubJSON = (data) => {
  const errors = [];
  
  try {
    // Validação estrutural básica
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['JSON deve ser um objeto válido'] };
    }
    
    // Validar seções principais
    for (const section of HUB_SCHEMA.required) {
      if (!(section in data)) {
        errors.push(`Seção obrigatória '${section}' não encontrada`);
      }
    }
    
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    
    // Validar cada seção
    errors.push(...validateSection(data, HUB_SCHEMA.schema, 'schema'));
    errors.push(...validateSection(data, HUB_SCHEMA.meta, 'meta'));
    errors.push(...validateSection(data, HUB_SCHEMA.hub, 'hub'));
    
    // Validar array de series
    if (Array.isArray(data.series)) {
      if (data.series.length === 0) {
        errors.push('Hub deve conter pelo menos uma série');
      } else {
        data.series.forEach((series, index) => {
          // Validar campos obrigatórios da série
          for (const requiredField of HUB_SCHEMA.series.items.required) {
            if (!(requiredField in series)) {
              errors.push(`series[${index}].${requiredField}: Campo obrigatório não encontrado`);
            }
          }
          
          // Validar propriedades específicas da série
          for (const [property, propertySchema] of Object.entries(HUB_SCHEMA.series.items.properties)) {
            if (series[property] !== undefined) {
              const propertyErrors = validateProperty(
                series[property], 
                propertySchema, 
                `series[${index}].${property}`
              );
              errors.push(...propertyErrors);
            }
          }
        });
      }
    } else {
      errors.push('Campo "series" deve ser um array');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      metadata: {
        type: 'hub',
        seriesCount: data.series?.length || 0,
        title: data.hub?.title || 'Sem título',
        version: data.schema?.version || 'desconhecida'
      }
    };
    
  } catch (error) {
    return {
      valid: false,
      errors: [`Erro interno de validação: ${error.message}`]
    };
  }
};

/**
 * Valida estrutura de Reader JSON
 */
export const validateReaderJSON = (data) => {
  const errors = [];
  
  try {
    // Validação estrutural básica
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['JSON deve ser um objeto válido'] };
    }
    
    // Validar campos obrigatórios
    for (const field of READER_SCHEMA.required) {
      if (!(field in data)) {
        errors.push(`Campo obrigatório '${field}' não encontrado`);
      }
    }
    
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    
    // Validar propriedades principais
    for (const [property, schema] of Object.entries(READER_SCHEMA.properties)) {
      if (data[property] !== undefined) {
        const propertyErrors = validateProperty(data[property], schema, property);
        errors.push(...propertyErrors);
      }
    }
    
    // Validar estrutura de capítulos
    if (typeof data.chapters === 'object' && data.chapters !== null) {
      for (const [chapterKey, chapter] of Object.entries(data.chapters)) {
        // Validar que a chave não é vazia
        if (!chapterKey || chapterKey.trim() === '') {
          errors.push(`Capítulo com chave vazia encontrado`);
          continue;
        }
        
        // Validar estrutura básica do capítulo
        if (typeof chapter !== 'object' || chapter === null) {
          errors.push(`chapters.${chapterKey}: Deve ser um objeto`);
          continue;
        }
        
        // Validar campos obrigatórios do capítulo
        if (!chapter.title || typeof chapter.title !== 'string' || chapter.title.trim() === '') {
          errors.push(`chapters.${chapterKey}.title: Título obrigatório e deve ser uma string não vazia`);
        }
        
        if (!chapter.groups || typeof chapter.groups !== 'object' || chapter.groups === null) {
          errors.push(`chapters.${chapterKey}.groups: Grupos obrigatórios e devem ser um objeto`);
        } else {
          // Validar que tem pelo menos um grupo
          const groupKeys = Object.keys(chapter.groups);
          if (groupKeys.length === 0) {
            errors.push(`chapters.${chapterKey}.groups: Deve ter pelo menos um grupo`);
          } else {
            // Validar cada grupo
            for (const [groupName, pages] of Object.entries(chapter.groups)) {
              if (!Array.isArray(pages)) {
                errors.push(`chapters.${chapterKey}.groups.${groupName}: Deve ser um array de páginas`);
              } else if (pages.length === 0) {
                errors.push(`chapters.${chapterKey}.groups.${groupName}: Deve ter pelo menos uma página`);
              } else {
                // Validar que todas as páginas são strings
                pages.forEach((page, index) => {
                  if (typeof page !== 'string') {
                    errors.push(`chapters.${chapterKey}.groups.${groupName}[${index}]: Página deve ser uma string (URL)`);
                  }
                });
              }
            }
          }
        }
        
        // Validar campos opcionais se presentes
        if (chapter.volume !== undefined && typeof chapter.volume !== 'string') {
          errors.push(`chapters.${chapterKey}.volume: Se presente, deve ser uma string`);
        }
        
        if (chapter.last_updated !== undefined && typeof chapter.last_updated !== 'string') {
          errors.push(`chapters.${chapterKey}.last_updated: Se presente, deve ser uma string`);
        }
      }
    }
    
    const chapterCount = data.chapters ? Object.keys(data.chapters).length : 0;
    
    return {
      valid: errors.length === 0,
      errors,
      metadata: {
        type: 'reader',
        title: data.title || 'Sem título',
        chapterCount,
        status: data.status || 'desconhecido',
        hasCover: !!data.cover
      }
    };
    
  } catch (error) {
    return {
      valid: false,
      errors: [`Erro interno de validação: ${error.message}`]
    };
  }
};

/**
 * Detecta automaticamente o tipo de JSON e valida
 */
export const validateJSON = (data) => {
  // Detectar tipo baseado na estrutura
  if (data.hub && data.series) {
    return validateHubJSON(data);
  } else if (data.chapters) {
    return validateReaderJSON(data);
  } else {
    return {
      valid: false,
      errors: ['Formato de JSON não reconhecido. Deve ser um hub.json ou reader.json válido'],
      metadata: { type: 'unknown' }
    };
  }
};

/**
 * Valida um arquivo JSON a partir de string
 */
export const validateJSONString = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    return validateJSON(data);
  } catch (error) {
    return {
      valid: false,
      errors: [`JSON malformado: ${error.message}`],
      metadata: { type: 'invalid' }
    };
  }
};

/**
 * Valida um arquivo a partir de File object
 */
export const validateJSONFile = async (file) => {
  return new Promise((resolve) => {
    // Verificar tipo de arquivo
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      resolve({
        valid: false,
        errors: ['Arquivo deve ser um JSON (.json)'],
        metadata: { type: 'invalid', fileName: file.name }
      });
      return;
    }
    
    // Verificar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      resolve({
        valid: false,
        errors: ['Arquivo muito grande (máximo 10MB)'],
        metadata: { type: 'invalid', fileName: file.name, size: file.size }
      });
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = validateJSONString(e.target.result);
      result.metadata = {
        ...result.metadata,
        fileName: file.name,
        size: file.size,
        lastModified: new Date(file.lastModified)
      };
      resolve(result);
    };
    
    reader.onerror = () => {
      resolve({
        valid: false,
        errors: ['Erro ao ler arquivo'],
        metadata: { type: 'invalid', fileName: file.name }
      });
    };
    
    reader.readAsText(file);
  });
};

/**
 * Utilitário para sanitizar dados antes do upload
 */
export const sanitizeJSONData = (data) => {
  // Remove propriedades perigosas ou desnecessárias
  const sanitized = JSON.parse(JSON.stringify(data)); // Deep clone
  
  // Remove campos que podem ser perigosos
  const removeDangerousFields = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const dangerous = ['__proto__', 'constructor', 'prototype', 'eval', 'function'];
    
    if (Array.isArray(obj)) {
      return obj.map(removeDangerousFields);
    }
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!dangerous.some(d => key.toLowerCase().includes(d))) {
        cleaned[key] = removeDangerousFields(value);
      }
    }
    
    return cleaned;
  };
  
  return removeDangerousFields(sanitized);
};
