import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Schema Validation with Zod
const SocialPostSchema = z.object({
  platform: z.string(),
  content: z.string(),
  media_urls: z.array(z.string()).optional(),
  scheduled_at: z.string().optional(), // Corrected property name to scheduled_at
  tags: z.array(z.string()).optional(),
  location: z.record(z.unknown()).optional(), // Consider a more specific schema for location
  campaign_id: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published']).optional() // Add status field for scheduling
});

const SocialInteractionSchema = z.object({
  post_id: z.string(),
  type: z.enum(['like', 'share', 'comment']),
  platform_user_id: z.string().optional(),
  platform_username: z.string().optional(),
  content: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type SocialPost = z.infer<typeof SocialPostSchema>;

export interface SocialInteraction {
  post_id: string;
  type: 'like' | 'share' | 'comment';
  platform_user_id?: string;
  platform_username?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

interface SocialAnalytics {
  likes: number;
  shares: number;
  comments: number;
  total_engagement: number;
}

// Social Media Management
export const createSocialPost = async (post: SocialPost) => {
  try {
    const validatedPost = SocialPostSchema.parse(post);
    const { data, error } = await supabase
      .from('social_posts')
      .insert(validatedPost) // Use validatedPost
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating social post:', error);
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.format());    
    } else {
      console.error('Error creating social post:', error);
    }
    throw error;
  }
};

export const scheduleSocialPost = async (post: SocialPost) => {
  try {
    const validatedPost = SocialPostSchema.parse(post);

    if (!validatedPost.scheduled_at) {
      throw new Error('Scheduled time is required for scheduling.');
    }

    // Ensure status is set to 'scheduled'
    validatedPost.status = 'scheduled';

    const { data, error } = await supabase
      .from('social_posts')
      .insert(validatedPost) // Use validatedPost here as well
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error in scheduleSocialPost:', error.format());    
    } else {
      console.error('Error scheduling social post:', error);
    }
    throw error;
  }
};

export const getSocialPostAnalytics = async (postId: string): Promise<SocialAnalytics> => {
  try {
    const { data, error } = await supabase
      .from('social_interactions')
      .select(`
        count(CASE WHEN type = 'like' THEN 1 END) AS likes,
        count(CASE WHEN type = 'share' THEN 1 END) AS shares,
        count(CASE WHEN type = 'comment' THEN 1 END) AS comments,
        count(*) AS total_engagement
      `)
      .eq('post_id', postId)
      .single();

    if (error) throw error;

    const analytics: SocialAnalytics = {
      likes: data?.likes ?? 0,
      shares: data?.shares ?? 0,
      comments: data?.comments ?? 0,
      total_engagement: data?.total_engagement ?? 0,
    };

    return analytics;
  } catch (error) {
    console.error('Error fetching social post analytics:', error);
    throw error;
  }
};

export const trackSocialInteraction = async (interaction: SocialInteraction) => {
  try {
    const validatedInteraction = SocialInteractionSchema.parse(interaction); // Validate interaction data
    const { data, error } = await supabase
      .from('social_interactions')
      .insert(validatedInteraction) // Use validatedInteraction
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error in trackSocialInteraction:', error.format());    
    } else {
      console.error('Error tracking social interaction:', error);
    }
    throw error;
  }
}