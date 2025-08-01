// src/app/test-env/page.tsx
export default function TestEnvPage() {
  // Server-side environment variables
  const serverEnv = {
    hasSpreadsheetId: !!process.env.GOOGLE_SPREADSHEET_ID,
    spreadsheetIdLength: process.env.GOOGLE_SPREADSHEET_ID?.length || 0,
    hasServiceEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    nodeEnv: process.env.NODE_ENV,
    // Test with a standard Next.js env var
    hasNextPublicVar: !!process.env.NEXT_PUBLIC_TEST,
  }

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>Environment Variables Test</h1>
      <pre>{JSON.stringify(serverEnv, null, 2)}</pre>
      
      <h2>Instructions if all values are false:</h2>
      <ol>
        <li>Make sure .env.local exists in your project root</li>
        <li>Stop the dev server (Ctrl+C)</li>
        <li>Run: rm -rf .next</li>
        <li>Run: npm run dev</li>
      </ol>
    </div>
  )
}