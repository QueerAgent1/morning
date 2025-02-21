import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { z } from 'zod';
import ReactDOMServer from 'react-dom/server'; // Import for rendering ReactElement to string
import { Database } from '../types/supabase' // Import your Supabase types


// ... (Environment variable checks and Supabase/Resend initialization - same as before)

// Zod schemas for validation (same as before)  - Ensure you have zod installed: npm install zod, and that your supabase types are in the right location
// ...


export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
export type EmailCampaign = z.infer<typeof EmailCampaignSchema>;
export type CampaignAnalytics = z.infer<typeof CampaignAnalyticsSchema>;


// Template Management (These functions remain the same)
// ...


// Campaign Management
export const scheduleCampaign = async (campaign: EmailCampaign) => { // Type the parameter
    try {
        //VALIDATE:
        const validatedCampaign = EmailCampaignSchema.parse(campaign);

        if (!validatedCampaign.scheduled_at) {
            throw new Error('Scheduled time is required');
        }

        // ... (Get template and target audience - same as before) ...

        // Schedule emails for each contact
        const scheduledEmails = contacts.map(async (contact) => { // Type contact appropriately if possible
            try {
                // ... (Replace variables in template - same as before) ...

        // Render email  - Fixed to render to string:
                const html:string = ReactDOMServer.renderToStaticMarkup(content);

                // Schedule email
            const data = await resend.emails.send({ // Type the response if possible
              from: 'QueerLuxe Travel <hello@queerluxe.travel>',
              to: contact.email,
              subject: template.subject,
              html, // Now a string
            });

            console.log("Resend Email Send Response:", data) //Log the response for debugging



                // Record analytics (same as before)
                // ...

                return {success: true, recipient: contact.email}; // Indicate success with recipient info

            } catch (error) {

                console.error(`Error sending email to ${contact.email}:`, error);
              return {success: false, recipient: contact.email, error: (error as Error).message } // Indicate failure with error message
            }
        });


        const results = await Promise.all(scheduledEmails);
        const failures = results.filter(r => !r.success);


        if (failures.length > 0) {
                console.warn(`${failures.length} emails failed to send. Failures:`, failures);
                // Consider adding logic to retry failed emails or report them to an admin
        }

        // ... (Update campaign status - same as before) ...

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

    try {
      // ... (Supabase query with aggregate functions - same as before) ...

        if (error) {
                console.error('Error fetching campaign performance:', error);
                throw error; // Re-throw the error for higher-level handling
        }


        const validationResult = CampaignAnalyticsSchema.safeParse(data)

        if(!validationResult.success){
            console.error("Error parsing campaign analytics:", validationResult.error)
            throw validationResult.error
        }

        const analytics = validationResult.data

          //Safe to access data here now:


        const metrics: CampaignAnalytics = {
            total_sent: analytics.total_sent,
            total_opened: analytics.total_opened,
            total_clicked: analytics.total_clicked,
            total_converted: analytics.total_converted,
            total_unsubscribed: analytics.total_unsubscribed,
            total_revenue: analytics.total_revenue,

            // Handle division by zero - improved
            open_rate: analytics.total_sent > 0 ? (analytics.total_opened / analytics.total_sent) * 100 : null,
            click_rate: analytics.total_sent > 0 ? (analytics.total_clicked / analytics.total_sent) * 100 : null,
           conversion_rate: analytics.total_sent > 0 ? (analytics.total_converted / analytics.total_sent) * 100 : null,
           unsubscribe_rate: analytics.total_sent > 0 ? (analytics.total_unsubscribed / analytics.total_sent) * 100 : null,
            revenue_per_recipient: analytics.total_sent > 0 ? analytics.total_revenue / analytics.total_sent : null
        };

        return metrics;

    } catch (error) {
        // ...Handle the error appropriately ...
    }
};