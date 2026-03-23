import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_7sse958a_ExA9ywcquVqQmBEEZwxvAvJD');

export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Update with your actual domain later
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Method check
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { fullName, email, phone, company, service, message } = req.body;

        // Input validation based on the frontend structure
        if (!fullName || !email || !service || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Simple spam protection
        if (message.trim().length < 10) {
            return res.status(400).json({ error: 'Message is too short. Please provide more details.' });
        }

        // Generate HTML email without reacting/rendering dependencies to keep the API lightweight and functional
        const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>New Inquiry: ${service}</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
        <p><strong>Service Requested:</strong> ${service}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #000; margin: 0; white-space: pre-wrap;">
          ${message}
        </blockquote>
      </div>
    `;

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: process.env.CONTACT_FORM_FROM || 'Bisly Nigeria <onboarding@resend.dev>',
            to: [process.env.CONTACT_FORM_TO || 'info@bislynig.com.ng'],
            subject: `Contact Form Inquiry [${fullName}] - ${service}`,
            html: emailHtml,
        });

        if (error) {
            console.error('Resend Error:', error);
            const errorMessage = typeof error === 'object' ? error.message : String(error);
            return res.status(500).json({ error: errorMessage || 'Failed to send email' });
        }

        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('API Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}
