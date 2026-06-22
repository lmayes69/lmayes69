export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';
export type Occasion = 'Casual' | 'Work' | 'Date Night' | 'Formal' | 'Outdoor' | 'Sport' | 'Evening';
export type Concentration = 'Parfum' | 'EDP' | 'EDT' | 'EDC' | 'Body Spray' | 'Unknown';
export type CollectionFilter = 'all' | 'favorites' | Season | Occasion;

export interface NotesPyramid {
  top: string[];
  middle: string[];
  base: string[];
}

export interface ReviewSource {
  name: string;
  url: string;
  summary?: string;
}

export interface Fragrance {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  concentration: Concentration;
  image_url?: string;
  barcode?: string;
  description: string;
  notes: NotesPyramid;
  seasons: Season[];
  occasions: Occasion[];
  preset_tags: string[];
  custom_tags: string[];
  review_sources: ReviewSource[];
  personal_notes: string;
  rating: number;
  quantity_level: number;
  is_inspired_by: boolean;
  inspired_by_original?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIFragranceData {
  name: string;
  brand: string;
  concentration: Concentration;
  description: string;
  notes: NotesPyramid;
  seasons: Season[];
  occasions: Occasion[];
  review_sources: ReviewSource[];
  is_inspired_by: boolean;
  inspired_by_original?: string;
}

export interface TodayRecommendation {
  fragrance: Fragrance;
  reason: string;
  mood_match: number;
}

export type RootTabParamList = {
  index: undefined;
  today: undefined;
  add: undefined;
  settings: undefined;
};
