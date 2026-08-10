import { refreshSession } from '@/lib/refresh-token'

export async function POST() {
  return refreshSession()
}
