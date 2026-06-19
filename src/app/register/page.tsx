import { redirect } from 'next/navigation'

// Single-admin system: self-registration is disabled.
// Accounts are not created from the login screen.
export default function RegisterPage() {
  redirect('/login')
}
