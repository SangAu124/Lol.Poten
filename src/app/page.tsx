'use client'

import { useState } from 'react'
import { Search, TrendingUp, Zap, Target } from 'lucide-react'

export default function Home() {
  const [summonerName, setSummonerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!summonerName.trim()) return
    
    setIsLoading(true)
    // TODO: Implement actual API call
    setTimeout(() => {
      setIsLoading(false)
      // Redirect to analysis page
      window.location.href = `/analysis/${encodeURIComponent(summonerName)}`
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 gradient-text">
          Lol.Poten
        </h1>
        <p className="text-xl md:text-2xl text-lol-light/80 mb-8 max-w-2xl">
          리그 오브 레전드 전적을 분석하여<br />
          <span className="text-lol-gold font-semibold">당신의 잠재력을 한 줄로 평가</span>합니다
        </p>
      </div>

      {/* Search Form */}
      <div className="w-full max-w-md mb-16">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="소환사명을 입력하세요"
            value={summonerName}
            onChange={(e) => setSummonerName(e.target.value)}
            className="w-full px-6 py-4 text-lg bg-lol-blue/30 border-2 border-lol-gold/30 rounded-lg 
                     text-lol-light placeholder-lol-light/50 focus:outline-none focus:border-lol-gold 
                     transition-colors duration-300"
          />
          <button
            type="submit"
            disabled={isLoading || !summonerName.trim()}
            className="absolute right-2 top-2 p-2 bg-lol-gold text-lol-dark rounded-md 
                     hover:bg-lol-gold/80 transition-colors duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-lol-dark border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-6 h-6" />
            )}
          </button>
        </form>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <div className="text-center p-6 bg-lol-blue/20 rounded-lg border border-lol-gold/20">
          <TrendingUp className="w-12 h-12 text-lol-gold mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-lol-light">성장 분석</h3>
          <p className="text-lol-light/70">최근 경기 데이터를 바탕으로 실력 향상도를 분석합니다</p>
        </div>
        
        <div className="text-center p-6 bg-lol-blue/20 rounded-lg border border-lol-gold/20">
          <Zap className="w-12 h-12 text-lol-gold mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-lol-light">즉시 평가</h3>
          <p className="text-lol-light/70">복잡한 통계를 간단한 한 줄로 요약하여 제공합니다</p>
        </div>
        
        <div className="text-center p-6 bg-lol-blue/20 rounded-lg border border-lol-gold/20">
          <Target className="w-12 h-12 text-lol-gold mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-lol-light">정확한 분석</h3>
          <p className="text-lol-light/70">다양한 지표를 종합하여 객관적인 잠재력을 평가합니다</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-lol-light/50">
        <p>&copy; 2024 Lol.Poten. All rights reserved.</p>
      </footer>
    </div>
  )
}
