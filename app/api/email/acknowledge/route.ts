import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const to = body?.to
    const firstName = body?.firstName || ''
    const lastName = body?.lastName || ''
    const refCode = body?.refCode || ''
    const jobTitle = body?.jobTitle || 'General Application'

    if (!to) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM

    if (!resendApiKey || !emailFrom) {
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      )
    }

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

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [to],
        subject,
        html,
      }),
    })

    const resendData = await resendResponse.json().catch(() => null)

    const status = resendResponse.ok ? 'sent' : 'failed'
    const providerId =
      resendResponse.ok && resendData && typeof resendData.id === 'string'
        ? resendData.id
        : null

    const errMsg =
      !resendResponse.ok && resendData
        ? JSON.stringify(resendData)
        : null

    // Log to email_logs, but do not fail the endpoint if logging fails
    try {
      await supabaseAdmin.from('email_logs').insert({
        to_email: to,
        subject,
        template: 'application_acknowledgement',
        status,
        provider_id: providerId,
        error: errMsg,
      } as any)
    } catch (logError) {
      console.warn('email_logs insert failed:', logError)
    }

    return NextResponse.json({ success: status === 'sent' })
  } catch (error) {
    console.error('Acknowledge email route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
