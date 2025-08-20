import { Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PotentialCardProps {
  score: number
  text: string
  trend: 'ascending' | 'stable' | 'descending'
}

export default function PotentialCard({ score, text, trend }: PotentialCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'ascending':
        return <TrendingUp className="w-6 h-6 text-green-400" />
      case 'descending':
        return <TrendingDown className="w-6 h-6 text-red-400" />
      default:
        return <Minus className="w-6 h-6 text-yellow-400" />
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
    <div className="bg-gradient-to-r from-lol-gold/20 to-lol-blue/20 rounded-lg p-6 border border-lol-gold/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Zap className="w-8 h-8 text-lol-gold mr-3" />
          <h3 className="text-2xl font-bold text-lol-light">잠재력 평가</h3>
        </div>
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <span className="text-sm text-lol-light/70">{getTrendText()}</span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lol-light/70">잠재력 점수</span>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}/100
          </span>
        </div>
        <div className="w-full bg-lol-blue/30 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ${
              score >= 80 ? 'bg-green-400' : 
              score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      
      <p className="text-lg text-lol-light leading-relaxed">
        "{text}"
      </p>
    </div>
  )
}
