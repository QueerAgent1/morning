import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Database } from '../types/supabase' //path to your supabase types

// ... environment variable checks and Supabase client initialization (same as before)


// Schema Validation with Zod - corrected and improved
const SocialPostSchema = z.object({
    platform: z.string(),
    content: z.string(),
    media_urls: z.array(z.string()).optional(),
    scheduled_at: z.string().optional(), // Corrected property name: scheduled_at
    tags: z.array(z.string()).optional(),
    location: z.record(z.unknown()).optional(), // Consider a more specific schema for location if possible
    campaign_id: z.string().optional(),
    status: z.enum(['draft', 'scheduled', 'published']).optional(), // Add a status field
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

export interface SocialInteraction { /* ...same as before... */ }

interface SocialAnalytics { /* ...same as before... */ }


// Social Media Management
export const createSocialPost = async (post: SocialPost) => {/* ...Implementation and error handling remain the same... */};


export const scheduleSocialPost = async (post: SocialPost) => {
    try {
        const validatedPost = SocialPostSchema.parse(post); // Validate with Zod

    if (!validatedPost.scheduled_at) {
      throw new Error('Scheduled time is required');
    }


    //Default the status to scheduled if it's not provided
    const postToInsert = {
            ...validatedPost,
       status: validatedPost.status ?? 'scheduled', // Ensure status is set to scheduled, override if provided in validatedPost
        };


    const { data, error } = await supabase
      .from('social_posts')
      .insert(postToInsert)
      .select()
      .single();

        if (error) {
                console.error("Error scheduling post:", error)
                throw error //rethrow
        }

        return data;


  } catch (error) {
          if (error instanceof z.ZodError) {
                console.error('Zod validation error in scheduleSocialPost:', error.format());    
          } else {
            console.error('Error scheduling social post:', error);
          }
          throw error
    }
};

export const getSocialPostAnalytics = async (postId: string): Promise<SocialAnalytics> => {
  try {

    // Perform aggregation directly in the database (more efficient)
        const { data, error } = await supabase.from('social_interactions')
            .select(`
                count(CASE WHEN type = 'like' THEN 1 END) AS likes,
                count(CASE WHEN type = 'share' THEN 1 END) AS shares,
                count(CASE WHEN type = 'comment' THEN 1 END) AS comments,
                count(*) AS total_engagement
            `)
      .eq('post_id', postId)
      .single();


        if (error) {
            console.error('Error fetching social post analytics:', error);
            throw error; // Re-throw for higher-level handling
        }

     //Validate the data with Zod
        const validatedData = z.object({
            likes: z.number().nullable(),
            shares: z.number().nullable(),
            comments: z.number().nullable(),
            total_engagement: z.number().nullable()
        }).safeParse(data);

        if (!validatedData.success) {
            console.error("Parsing error in social analytics:", validatedData.error);
            throw validatedData.error;
        }

    const analytics: SocialAnalytics = { // Use validated data and provide defaults
      likes: validatedData.data.likes ?? 0,
      shares: validatedData.data.shares ?? 0,
      comments: validatedData.data.comments ?? 0,
      total_engagement: validatedData.data.total_engagement ?? 0
    };


    return analytics;
  } catch (error) {
    console.error('Error getting social post analytics:', error); // More specific error message
    throw error;    // Re-throw the error
  }
};

export const trackSocialInteraction = async (interaction: SocialInteraction) => {/* ...Implementation and error handling remain the same... */};