export interface Kid {
  id: number;
  name: string;
  age: number | null;
  avatar: string;
  color: string;
  points: number;
  created_at: string;
  completions_today?: number;
  total_redemptions?: number;
  recentCompletions?: ChoreCompletion[];
  recentRedemptions?: RewardRedemption[];
}

export interface Chore {
  id: number;
  name: string;
  description: string | null;
  points_value: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  assigned_kid_id: number | null;
  active: number;
  created_at: string;
  kid_name?: string;
  kid_avatar?: string;
  kid_color?: string;
  completed_today?: number;
}

export interface ChoreCompletion {
  id: number;
  chore_id: number;
  kid_id: number;
  completed_at: string;
  points_earned: number;
  chore_name?: string;
  kid_name?: string;
}

export interface Reward {
  id: number;
  name: string;
  description: string | null;
  points_cost: number;
  image_emoji: string;
  quantity: number;
  active: number;
  created_at: string;
}

export interface RewardRedemption {
  id: number;
  reward_id: number;
  kid_id: number;
  redeemed_at: string;
  points_spent: number;
  reward_name?: string;
  image_emoji?: string;
  kid_name?: string;
  avatar?: string;
}

export interface ShoppingItem {
  id: number;
  name: string;
  quantity: string;
  category: string;
  completed: number;
  list_source: 'manual' | 'google_keep' | 'microsoft_todo';
  external_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface MealPlan {
  id: number;
  plan_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_name: string;
  notes: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
  isSample?: boolean;
}

export interface CalendarSettings {
  id: number;
  google_calendar_id: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  microsoft_access_token: string | null;
  microsoft_refresh_token: string | null;
  updated_at: string;
}

export interface AppSettings {
  id: number;
  family_name: string;
  timezone: string;
  updated_at: string;
}

export interface AuthStatus {
  google: { connected: boolean };
  microsoft: { connected: boolean };
}

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Bakery',
  'Pantry',
  'Frozen',
  'Beverages',
  'Snacks',
  'Household',
  'Personal Care',
  'General',
];

export const CHORE_FREQUENCIES = ['daily', 'weekly', 'monthly', 'one-time'] as const;

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const KID_AVATARS = [
  '👧', '👦', '🧒', '👶', '🧑', '👩', '👨',
  '🦸‍♀️', '🦸‍♂️', '🧙‍♀️', '🧙‍♂️', '🦄', '🐶', '🐱',
];

export const KID_COLORS = [
  '#4F46E5', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16', '#F97316',
];

export const GOOGLE_COLOR_MAP: Record<string, string> = {
  '1': '#7986cb',
  '2': '#33b679',
  '3': '#8e24aa',
  '4': '#e67c73',
  '5': '#f6bf26',
  '6': '#f4511e',
  '7': '#039be5',
  '8': '#616161',
  '9': '#3f51b5',
  '10': '#0b8043',
  '11': '#d50000',
};
