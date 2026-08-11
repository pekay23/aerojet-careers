import { Resend } from 'resend'
import { supabaseAdmin } from './supabase-admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, fullName: string, tempPassword: string) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@aerojet-aviation.com'

  try {
    const { data, error } = await resend.emails.send({
      from: `Aerojet Aviation <${fromEmail}>`,
      to: [email],
      subject: 'Welcome to Aerojet Aviation - Your Staff Account is Ready',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #003366; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 24px;">Aerojet Aviation</h1>
          </div>
          <div style="padding: 40px; background-color: white;">
            <h2 style="color: #0f172a; margin-top: 0;">Welcome aboard, ${fullName}!</h2>
            <p style="color: #475569; line-height: 1.6;">We're excited to have you join the Aerojet team. Your staff portal account has been successfully created. You can now access your professional records, manage your information, and stay updated with company news.</p>
            
            <div style="margin: 32px 0; padding: 24px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #00AEEF;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #64748b; text-transform: uppercase;">Temporary Password</p>
              <p style="margin: 0; font-size: 20px; font-weight: 800; color: white; background: #003366; padding: 12px 16px; border-radius: 6px; display: inline-block; letter-spacing: 1px;">${tempPassword}</p>
            </div>

            <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Log In to Portal</a>
            
            <p style="margin-top: 32px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
              Please change your password immediately after your first login. For security, do not share these credentials with anyone.
            </p>
          </div>
          <div style="padding: 24px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b;">
            &copy; ${new Date().getFullYear()} Aerojet Aviation Group. All rights reserved.
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('Failed to send welcome email:', err)
    return { success: false, error: err.message }
  }
}

export async function sendAcknowledgmentEmail(to: string, firstName: string, lastName: string, refCode: string, jobTitle: string) {
  const fromEmail = process.env.EMAIL_FROM || 'recruitment@aerojet-aviation.com'
  const subject = `Application received – ${jobTitle} [${refCode}]`

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #2c3e50; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">Application Received</h2>
      <p>Dear ${firstName} ${lastName},</p>
      <p>
        Thank you for your application to Aerojet Aviation for the role of
        <strong>${jobTitle}</strong>.
      </p>
      <p>
        Your application has been received successfully and is now under review.
      </p>
      <p>
        <strong>Reference Code:</strong> ${refCode}
      </p>
      <p>
        We will contact you should your profile be shortlisted for the next stage.
      </p>
      <p style="margin-top: 24px;">
        Kind regards,<br />
        Aerojet Aviation Careers Team
      </p>
    </div>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: `Aerojet Aviation <${fromEmail}>`,
      to: [to],
      subject,
      html,
    })

    const status = !error ? 'sent' : 'failed'
    const providerId = data?.id || null
    const errMsg = error ? JSON.stringify(error) : null

    // Log to email_logs
    try {
      await supabaseAdmin.from('email_logs').insert({
        to_email: to,
        subject,
        template: 'application_acknowledgement',
        status,
        provider_id: providerId,
        error: errMsg,
      } as any)
    } catch (logErr) {
      console.warn('Logging email failed:', logErr)
    }

    return { success: status === 'sent', error: errMsg }
  } catch (err: any) {
    console.error('Failed to send acknowledgment email:', err)
    return { success: false, error: err.message }
  }
}
