import apiClient from '../apiClient';
import API_CONFIG from '../config';

/**
 * Column API Service
 */
export const columnService = {
  /**
   * Get columns for a board
   */
  async getBoardColumns(boardId) {
    return apiClient.get(API_CONFIG.ENDPOINTS.COLUMNS.BY_BOARD(boardId));
  },

  /**
   * Get column by ID
   */
  async getColumnById(columnId) {
    return apiClient.get(API_CONFIG.ENDPOINTS.COLUMNS.BY_ID(columnId));
  },

  /**
   * Create a new column
   */
  async createColumn(boardId, columnData) {
    return apiClient.post(API_CONFIG.ENDPOINTS.COLUMNS.CREATE(boardId), columnData);
  },

  /**
   * Update a column
   */
  async updateColumn(columnId, columnData) {
    return apiClient.put(API_CONFIG.ENDPOINTS.COLUMNS.BY_ID(columnId), columnData);
  },

  /**
   * Delete a column
   */
  async deleteColumn(columnId) {
    return apiClient.delete(API_CONFIG.ENDPOINTS.COLUMNS.BY_ID(columnId));
  },
};

export default columnService;
