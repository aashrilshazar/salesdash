// src/app/firms/page.tsx
// force this page to always render dynamically (no SSG/cache)
export const dynamic = 'force-dynamic'
import FirmsTable from './FirmsTable';
import { fetchFirms } from '../lib/googleSheets';

export default async function FirmsPage() {
  const initialFirms = await fetchFirms();

  return (
    <main style={{ backgroundColor: '#111', minHeight: '100vh', padding: '40px' }}>
      <h1 style={{
        textAlign: 'center',
        fontSize: '48px',
        color: 'white',
        marginBottom: '40px'
      }}>
        Firms
      </h1>

      {/* Pass the raw data into our client component */}
      <FirmsTable initialFirms={initialFirms} />
    </main>
  );
}
