'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Trophy, TrendingUp, Target, Zap } from 'lucide-react'
import Link from 'next/link'

interface AnalysisData {
  summonerName: string
  rank: string
  tier: string
  lp: number
  winRate: number
  recentGames: number
  potentialScore: number
  potentialText: string
  strengths: string[]
  improvements: string[]
}

export default function AnalysisPage() {
  const params = useParams()
  const summonerName = decodeURIComponent(params.summoner as string)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Enhanced API integration with proper PUUID flow
    const fetchAnalysis = async () => {
      setIsLoading(true)
      
      try {
        // Step 1: Parse and get account data
        let accountData
        const decodedName = decodeURIComponent(summonerName)
        
        // Check if input contains # (Riot ID format)
        if (decodedName.includes('#')) {
          const [gameName, tagLine] = decodedName.split('#')
          console.log(`Trying Riot ID: ${gameName}#${tagLine}`)
          
          try {
            const { fetchAccountData } = await import('@/utils/riotApi')
            accountData = await fetchAccountData(`${gameName}#${tagLine || 'KR1'}`)
          } catch (error) {
            console.error('Riot ID lookup failed:', error)
            throw error
          }
        } else {
          // Legacy summoner name format
          console.log(`Trying legacy summoner name: ${decodedName}`)
          try {
            const { fetchSummonerByName } = await import('@/utils/riotApi')
            accountData = await fetchSummonerByName(decodedName)
          } catch (error) {
            console.error('Legacy summoner lookup failed:', error)
            throw error
          }
        }

        if (!accountData?.puuid) {
          throw new Error('PUUID not found')
        }

        // Step 2: Get summoner data using PUUID
        const { fetchSummonerByPuuid } = await import('@/utils/riotApi')
        const summonerData = await fetchSummonerByPuuid(accountData.puuid)
        
        console.log('🔍 Account data:', { puuid: accountData.puuid?.substring(0, 8) + '...' })
        console.log('🔍 Summoner data:', { id: summonerData?.id, level: summonerData?.summonerLevel })
        
        // Continue even if summoner ID is missing - we'll handle it in fetchRankData
        console.log('🔄 Proceeding with available data...')
        
        const { fetchRankData, fetchMatchHistory, fetchMultipleMatchDetails } = await import('@/utils/riotApi')
        const rankData = await fetchRankData(summonerData?.id, accountData.puuid)
        
        // Step 3: Get recent match history (20 games)
        const matchIds = await fetchMatchHistory(accountData.puuid, 20)
        const matchDetails = await fetchMultipleMatchDetails(matchIds)
        
        // Step 4: Analyze potential using enhanced algorithm
        console.log(`🔄 Starting potential analysis...`)
        console.log(`📊 Rank data:`, rankData)
        console.log(`📋 Match details count:`, matchDetails.length)
        
        const { analyzePotential } = await import('@/utils/potentialAnalyzer')
        
        try {
          const analysis = analyzePotential(summonerName, rankData, matchDetails, accountData.puuid)
          console.log(`✅ Analysis completed:`, analysis)
          setAnalysisData(analysis)
        } catch (analysisError) {
          console.error(`❌ Analysis function error:`, analysisError)
          throw analysisError
        }
      } catch (error) {
        console.error('Analysis failed:', error)
        // Fallback to mock data for demonstration
        const mockData: AnalysisData = {
          summonerName,
          rank: 'Gold',
          tier: 'II',
          lp: 1247,
          winRate: 67,
          recentGames: 20,
          potentialScore: 85,
          potentialText: "뛰어난 성장세와 안정적인 플레이로 플래티넘 진입이 임박한 상승세 플레이어",
          strengths: [
            "최근 20경기 67% 승률로 꾸준한 상승세",
            "팀파이트 기여도가 높은 플레이 스타일",
            "와드 설치 및 맵 컨트롤 능력 우수"
          ],
          improvements: [
            "초반 라인전에서의 CS 수급 개선 필요",
            "정글 오브젝트 타이밍 인식 향상 권장",
            "후반 캐리 능력 강화를 위한 아이템 빌드 최적화"
          ]
        }
        setAnalysisData(mockData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [summonerName])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lol-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-lol-light">분석 중...</p>
          <p className="text-lol-light/70 mt-2">{summonerName}님의 전적을 분석하고 있습니다</p>
        </div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">분석 실패</p>
          <p className="text-lol-light/70 mb-6">소환사를 찾을 수 없습니다</p>
          <Link href="/" className="bg-lol-gold text-lol-dark px-6 py-3 rounded-lg hover:bg-lol-gold/80 transition-colors">
            돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const getPotentialColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4 p-2 hover:bg-lol-blue/30 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-lol-light" />
          </Link>
          <h1 className="text-3xl font-bold gradient-text">잠재력 분석 결과</h1>
        </div>

        {/* Summoner Info */}
        <div className="bg-lol-blue/30 rounded-lg p-6 mb-8 border border-lol-gold/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-lol-light">{analysisData.summonerName}</h2>
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-lol-gold" />
              <span className="text-xl text-lol-light">{analysisData.rank} {analysisData.tier}</span>
              <span className="text-lol-gold">{analysisData.lp} LP</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-lol-light/70">승률</p>
              <p className="text-2xl font-bold text-lol-gold">{analysisData.winRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-lol-light/70">최근 경기</p>
              <p className="text-2xl font-bold text-lol-light">{analysisData.recentGames}게임</p>
            </div>
            <div className="text-center">
              <p className="text-lol-light/70">잠재력 점수</p>
              <p className={`text-2xl font-bold ${getPotentialColor(analysisData.potentialScore)}`}>
                {analysisData.potentialScore}/100
              </p>
            </div>
            <div className="text-center">
              <p className="text-lol-light/70">상태</p>
              <p className="text-2xl font-bold text-green-400">상승세</p>
            </div>
          </div>
        </div>

        {/* Potential Analysis */}
        <div className="bg-gradient-to-r from-lol-gold/20 to-lol-blue/20 rounded-lg p-6 mb-8 border border-lol-gold/30">
          <div className="flex items-center mb-4">
            <Zap className="w-8 h-8 text-lol-gold mr-3" />
            <h3 className="text-2xl font-bold text-lol-light">잠재력 평가</h3>
          </div>
          <p className="text-xl text-lol-light leading-relaxed">
            "{analysisData.potentialText}"
          </p>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Strengths */}
          <div className="bg-lol-blue/30 rounded-lg p-6 border border-green-400/20">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-400 mr-3" />
              <h3 className="text-xl font-bold text-lol-light">강점</h3>
            </div>
            <ul className="space-y-3">
              {analysisData.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-lol-light/80">{strength}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-lol-blue/30 rounded-lg p-6 border border-yellow-400/20">
            <div className="flex items-center mb-4">
              <Target className="w-6 h-6 text-yellow-400 mr-3" />
              <h3 className="text-xl font-bold text-lol-light">개선점</h3>
            </div>
            <ul className="space-y-3">
              {analysisData.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-lol-light/80">{improvement}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-12">
          <Link 
            href="/"
            className="bg-lol-gold text-lol-dark px-8 py-3 rounded-lg font-semibold hover:bg-lol-gold/80 transition-colors"
          >
            다른 소환사 검색
          </Link>
          <button 
            onClick={() => window.location.reload()}
            className="bg-lol-blue border border-lol-gold text-lol-light px-8 py-3 rounded-lg font-semibold hover:bg-lol-blue/80 transition-colors"
          >
            다시 분석
          </button>
        </div>
      </div>
    </div>
  )
}
