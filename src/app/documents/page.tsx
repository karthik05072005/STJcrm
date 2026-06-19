import { redirect } from 'next/navigation'

// Document management has been merged into Customer Management.
// Documents are now uploaded and viewed per-customer from the Customers module.
export default function DocumentsPage() {
  redirect('/customers')
}
