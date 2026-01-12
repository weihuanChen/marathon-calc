import { createDirectus, readItems, rest, staticToken } from '@directus/sdk';

export interface DirectusPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  published_at: string;
  site_id: number;
  status: 'draft' | 'published' | 'archived';
  post_tags?: Array<{ tags_id: number }>;
  post_recommend?: string[];
  tags?: string[];
  image?: string;
  date_created?: string;
  date_updated?: string;
  view_count?: number;
  unique_view_count?: number;
  last_viewed_at?: string;
}

export interface PostTranslation {
  id: number;
  post_id: string;
  language_code: 'en' | 'zh' | 'fr' | 'es';
  title: string;
  description: string;
  content: string;
  tags?: string[];
  date_created?: string;
  date_updated?: string;
}

export interface DirectusSchema {
  posts: DirectusPost[];
  post_translation: PostTranslation[];
}

const directusUrl = process.env.DIRECTUS_URL || '';
const directusToken = process.env.DIRECTUS_TOKEN || '';

export const SITE_ID = parseInt(process.env.NEXT_PUBLIC_SITE_ID || '0', 10) || 0;

export const directus = createDirectus<DirectusSchema>(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

export const readDirectusItems = readItems;
