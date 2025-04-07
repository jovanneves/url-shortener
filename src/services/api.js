/**
 * Serviço para abstrair as chamadas de API
 * Centraliza o tratamento de erros e formatação de dados
 */

// URL base da API (mesma origem)
const API_BASE_URL = '/api';

/**
 * Faz uma requisição GET para a API
 * @param {string} endpoint - Endpoint da API (sem /api no início)
 * @param {Object} params - Parâmetros da query string
 * @returns {Promise<any>} Dados da resposta
 */
export async function apiGet(endpoint, params = {}) {
  try {
    // Construir query string a partir dos parâmetros
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao fazer GET para ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Faz uma requisição POST para a API
 * @param {string} endpoint - Endpoint da API (sem /api no início)
 * @param {Object} data - Dados a serem enviados no corpo
 * @returns {Promise<any>} Dados da resposta
 */
export async function apiPost(endpoint, data = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao fazer POST para ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Faz uma requisição PUT para a API
 * @param {string} endpoint - Endpoint da API (sem /api no início)
 * @param {Object} data - Dados a serem enviados no corpo
 * @returns {Promise<any>} Dados da resposta
 */
export async function apiPut(endpoint, data = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao fazer PUT para ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Faz uma requisição DELETE para a API
 * @param {string} endpoint - Endpoint da API (sem /api no início)
 * @param {Object} data - Dados a serem enviados no corpo
 * @returns {Promise<any>} Dados da resposta
 */
export async function apiDelete(endpoint, data = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao fazer DELETE para ${endpoint}:`, error);
    throw error;
  }
} 