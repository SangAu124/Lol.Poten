import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lol.Poten - 롤 전적 잠재력 분석',
  description: '리그 오브 레전드 전적을 분석하여 플레이어의 잠재력을 한 줄로 평가하는 웹사이트',
  keywords: ['롤', '리그오브레전드', '전적검색', '잠재력분석', 'LoL', 'League of Legends'],
  authors: [{ name: 'Lol.Poten Team' }],
  openGraph: {
    title: 'Lol.Poten - 롤 전적 잠재력 분석',
    description: '리그 오브 레전드 전적을 분석하여 플레이어의 잠재력을 한 줄로 평가',
    type: 'website',
    locale: 'ko_KR',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gradient-to-br from-lol-dark via-lol-blue to-lol-dark">
        <main className="relative">
          {children}
        </main>
      </body>
    </html>
  )
}
