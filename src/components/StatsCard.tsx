import { Trophy, Target, TrendingUp, Eye } from 'lucide-react'

interface StatsCardProps {
  rank: string
  tier: string
  lp: number
  winRate: number
  recentGames: number
  trend: 'ascending' | 'stable' | 'descending'
}

export default function StatsCard({ rank, tier, lp, winRate, recentGames, trend }: StatsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'ascending':
        return 'text-green-400'
      case 'descending':
        return 'text-red-400'
      default:
        return 'text-yellow-400'
    }
  }

  const getTrendText = () => {
    switch (trend) {
      case 'ascending':
        return '상승세'
      case 'descending':
        return '하락세'
      default:
        return '안정적'
    }
  }

  return (
    <div className="bg-lol-blue/30 rounded-lg p-6 border border-lol-gold/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-lol-light">랭크 정보</h2>
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-lol-gold" />
          <span className="text-xl text-lol-light">{rank} {tier}</span>
          <span className="text-lol-gold">{lp} LP</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-lol-blue/20 rounded-lg">
          <Target className="w-6 h-6 text-lol-gold mx-auto mb-2" />
          <p className="text-lol-light/70 text-sm">승률</p>
          <p className="text-2xl font-bold text-lol-gold">{winRate}%</p>
        </div>
        
        <div className="text-center p-4 bg-lol-blue/20 rounded-lg">
          <Eye className="w-6 h-6 text-lol-light mx-auto mb-2" />
          <p className="text-lol-light/70 text-sm">최근 경기</p>
          <p className="text-2xl font-bold text-lol-light">{recentGames}게임</p>
        </div>
        
        <div className="text-center p-4 bg-lol-blue/20 rounded-lg">
          <TrendingUp className="w-6 h-6 text-lol-gold mx-auto mb-2" />
          <p className="text-lol-light/70 text-sm">티어</p>
          <p className="text-2xl font-bold text-lol-light">{rank}</p>
        </div>
        
        <div className="text-center p-4 bg-lol-blue/20 rounded-lg">
          <div className="w-6 h-6 mx-auto mb-2">
            <div className={`w-full h-full rounded-full ${
              trend === 'ascending' ? 'bg-green-400' :
              trend === 'descending' ? 'bg-red-400' : 'bg-yellow-400'
            }`} />
          </div>
          <p className="text-lol-light/70 text-sm">상태</p>
          <p className={`text-lg font-bold ${getTrendColor()}`}>{getTrendText()}</p>
        </div>
      </div>
    </div>
  )
}
