/**
 * Team Service
 * API calls for team management
 */
import apiClient from '../apiClient';

const teamService = {
  /**
   * Check if user exists by email
   */
  async checkUser(email) {
    return await apiClient.get(`/api/teams/check-user?email=${encodeURIComponent(email)}`);
  },

  /**
   * Accept team invitation
   */
  async acceptInvite(data) {
    return await apiClient.post('/api/teams/accept-invite', data);
  },
};

export default teamService;
