import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyRole, sanitizeErrorMessage } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  const auth = await verifyRole(['admin', 'hr_manager'])
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { application_ids, platform } = await req.json()

  if (!application_ids?.length || !platform) {
    return NextResponse.json({ error: 'application_ids and platform required' }, { status: 400 })
  }

  const results: { id: string; status: string; external_id?: string; error?: string }[] = []

  for (const appId of application_ids) {
    // Load full record
    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('*, qualifications:application_qualifications(*), experience:application_experience(*), compensation:application_compensation(*)')
      .eq('id', appId)
      .single()

    if (!app) { results.push({ id: appId, status: 'failed', error: 'Not found' }); continue }

    // Build payload
    const payload = {
      sourceRef:        app.ref_code,
      firstName:        app.first_name,
      lastName:         app.last_name,
      email:            app.email,
      phone:            app.phone,
      nationality:      app.nationality,
      country:          app.country_of_residence,
      jobTitle:         app.experience?.job_title || app.job_title,
      licenceType:      app.qualifications?.licence_type,
      licenceNumber:    app.qualifications?.licence_number,
      typeRatings:      app.qualifications?.type_ratings,
      startDate:        app.compensation?.earliest_start_date,
      salaryExpUSD:     app.compensation?.expected_target_usd,
      paymentPref:      app.compensation?.payment_preference,
    }

    // Log transfer attempt
    const { data: transfer } = await supabaseAdmin
      .from('hr_transfers')
      .insert({ application_id: appId, platform, status: 'in_progress', payload })
      .select().single()

    try {
      let externalId = ''

      switch (platform) {
        case 'bamboohr': externalId = await pushBambooHR(payload); break
        case 'custom':   externalId = await pushWebhook(payload);  break
        default:         externalId = `EXPORT-${Date.now()}`       // csv / workday handled client-side
      }

      // Mark transfer complete
      if (transfer) {
        await supabaseAdmin.from('hr_transfers').update({
          status: 'completed', external_id: externalId, response_code: 200,
          completed_at: new Date().toISOString(),
        }).eq('id', transfer.id)
      }

      // Update application
      await supabaseAdmin.from('applications').update({
        hr_transferred: true, hr_transferred_at: new Date().toISOString(),
        hr_employee_id: externalId, status: 'transferred_to_hr',
      }).eq('id', appId)

      // Pipeline event
      await supabaseAdmin.from('pipeline_events').insert({
        application_id: appId,
        event_type:     'hr_transfer',
        to_status:      'transferred_to_hr',
        note:           `Transferred to ${platform}. External ID: ${externalId}`,
      })

      results.push({ id: appId, status: 'success', external_id: externalId })

    } catch (err) {
      if (transfer) {
        await supabaseAdmin.from('hr_transfers').update({
          status: 'failed', error_message: sanitizeErrorMessage(err), completed_at: new Date().toISOString(),
        }).eq('id', transfer.id)
      }
      results.push({ id: appId, status: 'failed', error: sanitizeErrorMessage(err) })
    }
  }

  return NextResponse.json({ results })
}

async function pushBambooHR(payload: Record<string, any>): Promise<string> {
  const key = process.env.BAMBOOHR_API_KEY
  const sub = process.env.BAMBOOHR_SUBDOMAIN
  if (!key || !sub) throw new Error('BambooHR not configured — add BAMBOOHR_API_KEY and BAMBOOHR_SUBDOMAIN to environment variables')

  const res = await fetch(`https://api.bamboohr.com/api/gateway.php/${sub}/v1/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`${key}:x`).toString('base64'),
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      firstName: payload.firstName,
      lastName:  payload.lastName,
      workEmail: payload.email,
      jobTitle:  payload.jobTitle,
      hireDate:  payload.startDate,
    }),
  })
  if (!res.ok) throw new Error(`BambooHR error ${res.status}: ${await res.text()}`)
  return res.headers.get('Location')?.split('/').pop() || `BHR-${Date.now()}`
}

async function pushWebhook(payload: Record<string, any>): Promise<string> {
  const url = process.env.ZAPIER_WEBHOOK_URL
  if (!url) throw new Error('ZAPIER_WEBHOOK_URL not configured')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Webhook error ${res.status}`)
  return `ZAP-${Date.now()}`
}
