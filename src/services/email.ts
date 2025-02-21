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

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

export interface EmailCampaign {
  id: string;
  name: string;
  template_id: string;
  status: string;
  scheduled_at?: string;
  target_audience: Record<string, unknown>;
}

interface CampaignAnalytics {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_converted: number;
  total_unsubscribed: number;
  total_revenue: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  unsubscribe_rate: number;
  revenue_per_recipient: number;
}

// Template Management
export const createEmailTemplate = async (template: Omit<EmailTemplate, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating email template:', error);
    throw error;
  }
};

export const getEmailTemplate = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching email template:', error);
    throw error;
  }
};

// Campaign Management
export const scheduleCampaign = async (campaign: EmailCampaign) => {
  try {
    if (!campaign.scheduled_for) {
      throw new Error('Scheduled time is required');
    }

    // Get template
    const template = await getEmailTemplate(campaign.template_id);
    if (!template) throw new Error('Template not found');

    // Get target audience
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .match(campaign.target_audience);

    if (contactsError) throw contactsError;

    // Schedule emails for each contact
    const scheduledEmails = contacts.map(async (contact) => {
      try {
        // Replace variables in template
        let content = template.content;
        template.variables.forEach((variable: string) => {
          const value = contact[variable] || '';
          content = content.replace(`{{${variable}}}`, value);
        });

        // Render email
        const html = render(content);

        // Schedule email
        await resend.emails.send({
          from: 'QueerLuxe Travel <hello@queerluxe.travel>',
          to: contact.email,
          subject: template.subject,
          html: html
        });

        // Record analytics
        await supabase.from('campaign_analytics').insert({
          campaign_id: campaign.id,
          recipient_id: contact.id,
          sent_at: new Date().toISOString()
        });

        return true;
      } catch (error) {
        console.error(`Error sending email to ${contact.email}:`, error);
        return false;
      }
    });

    await Promise.all(scheduledEmails);

    // Update campaign status
    const { error: updateError } = await supabase
      .from('email_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaign.id);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error scheduling campaign:', error);
    throw error;
  }
};

// Analytics
export const getCampaignPerformance = async (campaignId: string): Promise<CampaignAnalytics> => {
  try {
    const { data, error } = await supabase
      .from('campaign_analytics')
      .select(`
        count(*) as total_sent,
        count(opened_at) as total_opened,
        count(clicked_at) as total_clicked,
        count(converted_at) as total_converted,
        count(unsubscribed_at) as total_unsubscribed,
        sum(conversion_value) as total_revenue
      `)
      .eq('campaign_id', campaignId)
      .single();

    if (error) throw error;

    const metrics: CampaignAnalytics = {
      ...data,
      open_rate: (data.total_opened / data.total_sent) * 100,
      click_rate: (data.total_clicked / data.total_sent) * 100,
      conversion_rate: (data.total_converted / data.total_sent) * 100,
      unsubscribe_rate: (data.total_unsubscribed / data.total_sent) * 100,
      revenue_per_recipient: data.total_revenue / data.total_sent
    };

    return metrics;
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    throw error;
  }
};