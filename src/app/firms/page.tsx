// src/app/firms/page.tsx
// force this page to always render dynamically (no SSG/cache)
export const dynamic = 'force-dynamic'
import FirmsTable from './FirmsTable';
import { fetchFirms } from '../lib/googleSheets';

export default async function FirmsPage() {
  const initialFirms = await fetchFirms();

  return (
    <div style={{ maxWidth: 1140, margin: '48px auto 64px', padding: '0 32px 72px' }}>
      <FirmsTable initialFirms={initialFirms} />
    </div>
  );
}
