import { apiGet, apiPost, apiPut, apiDelete } from './api';

/**
 * Serviço para operações relacionadas a URLs
 */

/**
 * Obtém a lista de URLs do usuário atual
 * @param {Object} options - Opções da requisição
 * @param {boolean} [options.useCache=true] - Se deve usar cache
 * @param {boolean} [options.onlyMine=false] - Se deve retornar apenas URLs do usuário
 * @param {boolean} [options.onlyPublic=false] - Se deve retornar apenas URLs públicas
 * @param {boolean} [options.all=false] - Se deve retornar todas URLs (apenas admin)
 * @returns {Promise<Array>} Lista de URLs
 */
export async function getUrls(options = {}) {
  return apiGet('/urls', options);
}

/**
 * Cria uma nova URL encurtada
 * @param {Object} urlData - Dados da URL
 * @param {string} urlData.longUrl - URL original
 * @param {string} [urlData.alias] - Alias personalizado
 * @param {boolean} [urlData.isPublic=true] - Se a URL é pública
 * @returns {Promise<Object>} Dados da URL criada
 */
export async function createUrl(urlData) {
  return apiPost('/shorten', urlData);
}

/**
 * Obtém detalhes de uma URL pelo código
 * @param {string} urlCode - Código da URL
 * @param {boolean} [stats=false] - Se deve incluir estatísticas
 * @returns {Promise<Object>} Dados da URL
 */
export async function getUrlByCode(urlCode, stats = false) {
  return apiGet(`/check/${urlCode}`, { stats });
}

/**
 * Atualiza uma URL existente
 * @param {Object} urlData - Dados da URL
 * @param {string} urlData.urlCode - Código atual da URL
 * @param {string} [urlData.newCode] - Novo código (alias) para a URL
 * @param {string} [urlData.longUrl] - Nova URL original
 * @param {boolean} [urlData.isPublic] - Nova configuração de visibilidade
 * @returns {Promise<Object>} Dados da URL atualizada
 */
export async function updateUrl(urlData) {
  return apiPut('/urls', urlData);
}

/**
 * Exclui uma URL pelo código
 * @param {string} urlCode - Código da URL a ser excluída
 * @returns {Promise<Object>} Resposta da operação
 */
export async function deleteUrl(urlCode) {
  return apiDelete('/urls', { urlCode });
}

/**
 * Obtém estatísticas de uma URL
 * @param {string} urlCode - Código da URL
 * @returns {Promise<Object>} Estatísticas da URL
 */
export async function getUrlStats(urlCode) {
  return apiGet(`/stats/${urlCode}`);
}

/**
 * Verifica se um alias está disponível
 * @param {string} alias - Alias a ser verificado
 * @returns {Promise<boolean>} Se o alias está disponível
 */
export async function checkAliasAvailability(alias) {
  try {
    const response = await apiGet(`/check-alias/${alias}`);
    return response.available;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do alias:', error);
    return false;
  }
} 