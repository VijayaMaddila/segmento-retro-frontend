/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      MAGIC_LOGIN: '/api/auth/magic-login',
      LOGOUT: '/api/auth/logout',
    },

    // Board endpoints
    BOARDS: {
      BASE: '/api/boards',
      BY_ID: (id) => `/api/boards/${id}`,
      BY_USER: (userId) => `/api/boards/user/${userId}`,
      UNASSIGNED: '/api/boards/unassigned',
    },

    // Column endpoints
    COLUMNS: {
      BASE: '/api/board-columns',
      BY_ID: (id) => `/api/board-columns/${id}`,
      BY_BOARD: (boardId) => `/api/board-columns/board/${boardId}`,
    },

    // Card endpoints
    CARDS: {
      BASE: '/api/cards',
      BY_ID: (id) => `/api/cards/${id}`,
      BY_COLUMN: (columnId) => `/api/cards/column/${columnId}`,
    },

    // Vote endpoints
    VOTES: {
      BASE: '/api/votes',
      BY_BOARD: (boardId) => `/api/votes/board/${boardId}`,
      REMAINING: (boardId, userId) => `/api/votes/board/${boardId}/user/${userId}/remaining`,
    },

    // Comment endpoints
    COMMENTS: {
      BASE: '/api/comments',
      BY_ID: (id) => `/api/comments/${id}`,
      BY_CARD: (cardId) => `/api/comments/card/${cardId}`,
    },

    // Team endpoints
    TEAMS: {
      BASE: '/api/teams',
      BY_ID: (id) => `/api/teams/${id}`,
      CREATE: '/api/teams/create',
      INVITE: (teamId) => `/api/teams/${teamId}/invite`,
    },

    // User endpoints
    USERS: {
      BASE: '/api/users',
      BY_ID: (id) => `/api/users/${id}`,
    },

    // Template endpoints
    TEMPLATES: {
      BASE: '/api/templates',
      BY_ID: (id) => `/api/templates/${id}`,
      BY_CATEGORY: (category) => `/api/templates/category/${category}`,
      BY_LANGUAGE: (language) => `/api/templates/language/${language}`,
      DEFAULT: '/api/templates/default',
      USE: (id) => `/api/templates/${id}/use`,
    },
  },
};

export default API_CONFIG;
