import apiClient from '../apiClient';
import API_CONFIG from '../config';

/**
 * Template API Service
 */
export const templateService = {
  /**
   * Get all templates
   */
  async getAllTemplates() {
    return apiClient.get(API_CONFIG.ENDPOINTS.TEMPLATES.BASE);
  },

  /**
   * Get template by ID
   */
  async getTemplateById(templateId) {
    try {
      return await apiClient.get(API_CONFIG.ENDPOINTS.TEMPLATES.BY_ID(templateId));
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      return {
        ok: false,
        error: error.message,
        message: 'Failed to fetch template. You may not have permission to access this template.',
      };
    }
  },

  /**
   * Get templates by category
   * @param {string} category - Retrospective, Brainstorm, Team building, etc.
   */
  async getTemplatesByCategory(category) {
    return apiClient.get(API_CONFIG.ENDPOINTS.TEMPLATES.BY_CATEGORY(category));
  },

  /**
   * Get templates by language
   * @param {string} language - English, Portuguese, Spanish, French
   */
  async getTemplatesByLanguage(language) {
    return apiClient.get(API_CONFIG.ENDPOINTS.TEMPLATES.BY_LANGUAGE(language));
  },

  /**
   * Get default templates
   */
  async getDefaultTemplates() {
    return apiClient.get(API_CONFIG.ENDPOINTS.TEMPLATES.DEFAULT);
  },

  /**
   * Create a custom template
   */
  async createTemplate(templateData) {
    return apiClient.post(API_CONFIG.ENDPOINTS.TEMPLATES.BASE, templateData);
  },

  /**
   * Update a template
   */
  async updateTemplate(templateId, templateData) {
    return apiClient.put(API_CONFIG.ENDPOINTS.TEMPLATES.BY_ID(templateId), templateData);
  },

  /**
   * Delete a template
   */
  async deleteTemplate(templateId) {
    return apiClient.delete(API_CONFIG.ENDPOINTS.TEMPLATES.BY_ID(templateId));
  },

  /**
   * Increment template usage count
   */
  async incrementUsage(templateId) {
    return apiClient.post(API_CONFIG.ENDPOINTS.TEMPLATES.USE(templateId));
  },

  /**
   * Create board from template
   * This is a helper method that combines multiple API calls
   * @param {number|object} templateIdOrData - Template ID or full template object
   * @param {object} boardData - Board creation data
   */
  async createBoardFromTemplate(templateIdOrData, boardData) {
    try {
      let template;
      
      // If template data is passed directly, use it
      if (typeof templateIdOrData === 'object' && templateIdOrData.columns) {
        template = templateIdOrData;
      } else {
        // Otherwise fetch template by ID
        const templateResponse = await this.getTemplateById(templateIdOrData);
        if (!templateResponse.ok) {
          throw new Error(templateResponse.message || 'Failed to fetch template');
        }
        template = templateResponse.data;
      }

      // Increment usage count (optional - don't fail if this errors)
      if (template.id) {
        await this.incrementUsage(template.id).catch(err => {
          console.warn('Failed to increment template usage:', err);
        });
      }

      // Create board
      const boardResponse = await apiClient.post(API_CONFIG.ENDPOINTS.BOARDS.BASE, {
        ...boardData,
        templateId: template.id || null,
      });

      if (!boardResponse.ok) {
        throw new Error(boardResponse.message || 'Failed to create board');
      }

      const board = boardResponse.data;

      // Create columns from template
      if (template.columns && Array.isArray(template.columns)) {
        for (const column of template.columns) {
          await apiClient.post(API_CONFIG.ENDPOINTS.COLUMNS.BASE, {
            title: column.name || column.title,
            position: column.position,
            boardId: board.id,
          });
        }
      }

      return {
        ok: true,
        data: board,
        template: template,
      };
    } catch (error) {
      console.error('Error creating board from template:', error);
      return {
        ok: false,
        error: error.message,
        message: error.message || 'Failed to create board from template',
      };
    }
  },
};

export default templateService;
