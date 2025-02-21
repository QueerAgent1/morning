import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { z } from 'zod';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!resendApiKey) {
  throw new Error('Missing Resend API key');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const resend = new Resend(resendApiKey);


// Zod schemas for validation
const EmailTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  content: z.string(),
  variables: z.array(z.string()),
});

const EmailCampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  template_id: z.string(),
  status: z.string(),
  scheduled_at: z.string().optional(),
  target_audience: z.record(z.unknown()) // You might want to define a more specific schema for target_audience
});

const CampaignAnalyticsSchema = z.object({
  total_sent: z.number(),
    total_opened: z.number(),
    total_clicked: z.number(),
    total_converted: z.number(),
    total_unsubscribed: z.number(),
    total_revenue: z.number(),
})



export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
export type EmailCampaign = z.infer<typeof EmailCampaignSchema>;

interface CampaignAnalytics {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_converted: number;
  total_unsubscribed: number;
  total_revenue: number;
  open_rate: number | null; // Allow null for when total_sent is 0
  click_rate: number | null;
  conversion_rate: number | null;
  unsubscribe_rate: number | null;
  revenue_per_recipient: number | null;
}


// Template Management
export const createEmailTemplate = async (template: Omit<EmailTemplate, 'id'>) => { /* ... (Implementation remains the same) ... */ };
export const getEmailTemplate = async (id: string):Promise<EmailTemplate> => { /* ... (Implementation remains the same) ... */ };


// Campaign Management
export const scheduleCampaign = async (campaign: EmailCampaign) => {
    try {
        const validatedCampaign = EmailCampaignSchema.parse(campaign); // Validate campaign data


        if (!validatedCampaign.scheduled_at) {
            throw new Error('Scheduled time is required');
        }

    // ... (Rest of the implementation remains largely the same, using validatedCampaign instead of campaign) ...

    // Example of improved error handling from previous responses:
    const scheduledEmails = contacts.map(async (contact) => {/* ... */});
    const results = await Promise.all(scheduledEmails);
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      // Handle or report failures
    }


  } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Zod validation error in scheduleCampaign:', error.format());    
        } else {        
           console.error('Error scheduling campaign:', error);
        }
        throw error;
    }
};

// Analytics
export const getCampaignPerformance = async (campaignId: string): Promise<CampaignAnalytics> => {
 // ... (Implementation with improved error handling, aggregate query, and zod validation from previous response)
};