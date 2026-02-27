import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Team endpoints
export const teamAPI = {
  getTeam: () => apiClient.get('/teams'),
};

// Tournaments endpoints
export const tournamentsAPI = {
  getAll: (teamId?: string) => apiClient.get('/tournaments', { params: teamId ? { teamId } : {} }),
  getActive: (teamId?: string) => apiClient.get('/tournaments/active', { params: teamId ? { teamId } : {} }),
  create: (data: any) => apiClient.post('/tournaments', data),
};

// Seasons endpoints
export const seasonsAPI = {
  getAll: (tournamentId: string) => apiClient.get(`/seasons/${tournamentId}`),
  getActive: (tournamentId: string) => apiClient.get(`/seasons/${tournamentId}/active`),
  create: (data: any) => apiClient.post('/seasons', data),
  delete: (id: string) => apiClient.delete(`/seasons/${id}`),
};

// Competitions endpoints
export const competitionsAPI = {
  getAll: (seasonId: string) => apiClient.get(`/competitions/${seasonId}`),
  getActive: (seasonId: string) => apiClient.get(`/competitions/${seasonId}/active`),
  create: (data: any) => apiClient.post('/competitions', data),
  delete: (id: string) => apiClient.delete(`/competitions/${id}`),
  updateFinalTablePhoto: (id: string, photoUrl: string) => 
    apiClient.put(`/competitions/${id}/final-table-photo`, { photoUrl }),
  deleteFinalTablePhoto: (id: string) => 
    apiClient.delete(`/competitions/${id}/final-table-photo`),
};

// Judges endpoints
export const judgesAPI = {
  getAll: () => apiClient.get('/judges'),
  create: (data: any) => apiClient.post('/judges', data),
};

// Players endpoints
export const playersAPI = {
  getAll: (teamId?: string) => apiClient.get('/players', { params: { teamId } }),
  getById: (id: string) => apiClient.get(`/players/${id}`),
  create: (data: any) => apiClient.post('/players', data),
  update: (id: string, data: any) => apiClient.put(`/players/${id}`, data),
  delete: (id: string) => apiClient.delete(`/players/${id}`),
};

// Matches endpoints
export const matchesAPI = {
  getAll: (competitionId?: string, teamId?: string) =>
    apiClient.get('/matches', { params: { competitionId, teamId } }),
  getById: (id: string) => apiClient.get(`/matches/${id}`),
  create: (data: any) => apiClient.post('/matches', data),
  update: (id: string, data: any) => apiClient.put(`/matches/${id}`, data),
  delete: (id: string) => apiClient.delete(`/matches/${id}`),
  deleteAll: (competitionId?: string) =>
    apiClient.delete('/matches', { params: competitionId ? { competitionId } : {} }),
};

// Match Players endpoints
export const matchPlayersAPI = {
  getByMatch: (matchId: string) => apiClient.get(`/match-players/${matchId}`),
  add: (data: any) => apiClient.post('/match-players', data),
  update: (id: string, data: any) => apiClient.put(`/match-players/${id}`, data),
};

// Ratings endpoints
export const ratingsAPI = {
  getByMatchPlayer: (matchPlayerId: string) =>
    apiClient.get(`/ratings/${matchPlayerId}`),
  create: (data: any) => apiClient.post('/ratings', data),
  update: (data: any) => apiClient.post('/ratings', data), // Using upsert
  deleteAll: () => apiClient.delete('/ratings'),
};

// Photos endpoints
export const photosAPI = {
  getByMatch: (matchId: string) => apiClient.get(`/photos/${matchId}`),
  add: (data: any) => apiClient.post('/photos', data),
  upload: (matchId: string, imageBase64: string) =>
    apiClient.post('/photos/upload', { matchId, imageBase64 }),
  delete: (id: string) => apiClient.delete(`/photos/${id}`),
};

// Championships endpoints
export const championshipsAPI = {
  getAll: () => apiClient.get('/championships'),
  getByYear: (year: number) => apiClient.get(`/championships/${year}`),
  create: (data: any) => apiClient.post('/championships', data),
  update: (id: string, data: any) => apiClient.put(`/championships/${id}`, data),
  delete: (id: string) => apiClient.delete(`/championships/${id}`),
};

// Filters endpoints
export const filtersAPI = {
  getOptions: () => apiClient.get('/filters/options'),
};

// Guest Judges endpoints
export const guestJudgesAPI = {
  getByMatch: (matchId: string) => apiClient.get(`/guest-judges/${matchId}`),
  create: (data: { matchId: string; name: string }) => apiClient.post('/guest-judges', data),
  delete: (id: string) => apiClient.delete(`/guest-judges/${id}`),
};

// Guest Ratings endpoints
export const guestRatingsAPI = {
  getByMatchPlayer: (matchPlayerId: string) =>
    apiClient.get(`/guest-ratings/${matchPlayerId}`),
  create: (data: any) => apiClient.post('/guest-ratings', data),
  update: (data: any) => apiClient.post('/guest-ratings', data), // Using upsert
  deleteAll: () => apiClient.delete('/guest-ratings'),
};
