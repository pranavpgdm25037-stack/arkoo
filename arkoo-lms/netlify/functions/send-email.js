import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { id, name, email } = JSON.parse(event.body);

    if (!id || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing lead id or email' }) };
    }

    // Initialize Supabase service role client (admin privileges)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Send the email using Resend
    // NOTE: In production, ensure the from email matches a domain verified in Resend.
    const applicationUrl = `${event.headers.origin || 'http://localhost:5173'}/apply?id=${id}`;
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Arkoo LMS <onboarding@resend.dev>', 
      to: [email],
      subject: 'Next steps for your project inquiry',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0f172a;">Hello ${name || 'there'},</h2>
          <p style="color: #333; line-height: 1.6;">
            Thank you for reaching out to us about your project! To help us prepare an accurate proposal, we need a few more details.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${applicationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Complete Project Application
            </a>
          </div>
          <p style="color: #666; font-size: 0.9em; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you have any questions, feel free to reply to this email.
          </p>
        </div>
      `
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email' }) };
    }

    // Update Supabase status to form_pending
    const { error: dbError } = await supabase
      .from('leads')
      .update({ status: 'form_pending' })
      .eq('id', id);

    if (dbError) {
      console.error('Supabase update error:', dbError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update lead status' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully', data: emailData }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
