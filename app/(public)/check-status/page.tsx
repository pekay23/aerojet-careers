import { Metadata } from 'next'
import CheckStatusClient from './CheckStatusClient'

export const metadata: Metadata = {
  title: 'Check Application Status | Aerojet Aviation Careers',
  description: 'Check the status of your Aerojet Aviation job application using your reference code.',
}

export default function CheckStatusPage() {
  return <CheckStatusClient />
}
