import apiClient from '../apiClient';
import API_CONFIG from '../config';

/**
 * Comment API Service
 */
export const commentService = {
  /**
   * Get comments for a card
   */
  async getCardComments(cardId) {
    return apiClient.get(API_CONFIG.ENDPOINTS.COMMENTS.BY_CARD(cardId));
  },

  /**
   * Create a new comment
   */
  async createComment(commentData) {
    return apiClient.post(API_CONFIG.ENDPOINTS.COMMENTS.BASE, commentData);
  },

  /**
   * Update a comment
   */
  async updateComment(commentId, commentData) {
    return apiClient.put(API_CONFIG.ENDPOINTS.COMMENTS.BY_ID(commentId), commentData);
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId) {
    return apiClient.delete(API_CONFIG.ENDPOINTS.COMMENTS.BY_ID(commentId));
  },
};

export default commentService;
