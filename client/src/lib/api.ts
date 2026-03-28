import axios from 'axios';
import type {
  Kid, Chore, Reward, ShoppingItem, MealPlan, CalendarEvent, AuthStatus
} from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Kids
export const kidsApi = {
  getAll: () => api.get<Kid[]>('/kids').then(r => r.data),
  getById: (id: number) => api.get<Kid>(`/kids/${id}`).then(r => r.data),
  create: (data: Partial<Kid>) => api.post<Kid>('/kids', data).then(r => r.data),
  update: (id: number, data: Partial<Kid>) => api.put<Kid>(`/kids/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/kids/${id}`).then(r => r.data),
};

// Chores
export const choresApi = {
  getAll: () => api.get<Chore[]>('/chores').then(r => r.data),
  getById: (id: number) => api.get<Chore>(`/chores/${id}`).then(r => r.data),
  create: (data: Partial<Chore>) => api.post<Chore>('/chores', data).then(r => r.data),
  update: (id: number, data: Partial<Chore>) => api.put<Chore>(`/chores/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/chores/${id}`).then(r => r.data),
  complete: (id: number, kidId: number) =>
    api.post(`/chores/${id}/complete`, { kid_id: kidId }).then(r => r.data),
};

// Rewards
export const rewardsApi = {
  getAll: () => api.get<Reward[]>('/rewards').then(r => r.data),
  getById: (id: number) => api.get<Reward>(`/rewards/${id}`).then(r => r.data),
  create: (data: Partial<Reward>) => api.post<Reward>('/rewards', data).then(r => r.data),
  update: (id: number, data: Partial<Reward>) => api.put<Reward>(`/rewards/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/rewards/${id}`).then(r => r.data),
  redeem: (id: number, kidId: number) =>
    api.post(`/rewards/${id}/redeem`, { kid_id: kidId }).then(r => r.data),
  getHistory: () => api.get('/rewards/redemptions/history').then(r => r.data),
};

// Shopping
export const shoppingApi = {
  getAll: (source?: string) =>
    api.get<ShoppingItem[]>('/shopping', { params: source ? { source } : {} }).then(r => r.data),
  create: (data: Partial<ShoppingItem>) => api.post<ShoppingItem>('/shopping', data).then(r => r.data),
  update: (id: number, data: Partial<ShoppingItem>) =>
    api.put<ShoppingItem>(`/shopping/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/shopping/${id}`).then(r => r.data),
  clearCompleted: () => api.delete('/shopping/completed/clear').then(r => r.data),
  syncMicrosoftTodo: () => api.get('/shopping/sync/microsoft-todo').then(r => r.data),
  pushToMicrosoftTodo: (data: { name: string; category?: string }) =>
    api.post('/shopping/sync/microsoft-todo', data).then(r => r.data),
  syncGoogleKeep: () => api.get('/shopping/sync/google-keep').then(r => r.data),
};

// Meals
export const mealsApi = {
  getAll: (startDate?: string, endDate?: string) =>
    api.get<MealPlan[]>('/meals', {
      params: { start_date: startDate, end_date: endDate },
    }).then(r => r.data),
  getToday: () => api.get<MealPlan[]>('/meals/today').then(r => r.data),
  create: (data: Partial<MealPlan>) => api.post<MealPlan>('/meals', data).then(r => r.data),
  update: (id: number, data: Partial<MealPlan>) =>
    api.put<MealPlan>(`/meals/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/meals/${id}`).then(r => r.data),
};

// Calendar
export const calendarApi = {
  getEvents: (params?: { timeMin?: string; timeMax?: string; calendarId?: string }) =>
    api.get<{ events: CalendarEvent[]; connected: boolean; message?: string }>('/calendar/events', { params })
      .then(r => r.data),
  getCalendars: () => api.get('/calendar/calendars').then(r => r.data),
  updateSettings: (data: { google_calendar_id: string }) =>
    api.post('/calendar/settings', data).then(r => r.data),
  createEvent: (data: Partial<CalendarEvent>) =>
    api.post<CalendarEvent>('/calendar/events', data).then(r => r.data),
};

// Auth
export const authApi = {
  getStatus: () => api.get<AuthStatus>('/auth/status').then(r => r.data),
  connectGoogle: () => { window.location.href = '/api/auth/google'; },
  connectMicrosoft: () => { window.location.href = '/api/auth/microsoft'; },
  disconnectGoogle: () => api.post('/auth/disconnect/google').then(r => r.data),
  disconnectMicrosoft: () => api.post('/auth/disconnect/microsoft').then(r => r.data),
};

export default api;
