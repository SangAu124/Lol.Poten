import { PotentialAnalysis, RankData, MatchData, ParticipantData } from '@/types'

// Enhanced potential analysis algorithm following the specified approach
export function analyzePotential(
  summonerName: string,
  rankData: RankData | RankData[],
  recentMatches: MatchData[],
  summonerPuuid: string
): PotentialAnalysis {
  // Handle both single rank object and array of ranks
  const soloQueueData = Array.isArray(rankData) 
    ? rankData.find(rank => rank.queueType === 'RANKED_SOLO_5x5')
    : rankData
  
  if (!soloQueueData) {
    return {
      summonerName,
      rank: 'Unranked',
      tier: '',
      lp: 0,
      winRate: 0,
      recentGames: 0,
      potentialScore: 50,
      potentialText: '랭크 게임 데이터가 부족하여 정확한 분석이 어렵습니다',
      strengths: ['랭크 게임 참여 권장'],
      improvements: ['솔로 랭크 게임을 통한 실력 측정 필요'],
      trend: 'stable'
    }
  }

  const winRate = Math.round((soloQueueData.wins / (soloQueueData.wins + soloQueueData.losses)) * 100)
  const recentGames = recentMatches.length

  // Step 2: Comprehensive data analysis
  const performanceMetrics = calculatePerformanceMetrics(recentMatches, summonerPuuid)
  const playStyleAnalysis = analyzePlayStyle(recentMatches, summonerPuuid)
  
  // Step 3: Advanced scoring with weighted algorithm
  const potentialScore = calculateWeightedPotentialScore(soloQueueData, performanceMetrics, playStyleAnalysis)
  const trend = determineTrend(performanceMetrics)
  
  return {
    summonerName,
    rank: soloQueueData.tier,
    tier: soloQueueData.rank,
    lp: soloQueueData.leaguePoints,
    winRate,
    recentGames,
    potentialScore,
    potentialText: generateDynamicOneLiner(potentialScore, trend, performanceMetrics, playStyleAnalysis),
    strengths: identifyAdvancedStrengths(performanceMetrics, playStyleAnalysis, soloQueueData),
    improvements: identifyAdvancedImprovements(performanceMetrics, playStyleAnalysis, soloQueueData),
    trend
  }
}

// Step 2.1: Calculate comprehensive performance metrics
function calculatePerformanceMetrics(matches: MatchData[], summonerPuuid: string) {
  const performances = matches.map(match => {
    const participant = match.info.participants.find(p => p.puuid === summonerPuuid)
    if (!participant) return null

    const gameDurationMinutes = match.info.gameDuration / 60
    
    return {
      win: participant.win,
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      kda: (participant.kills + participant.assists) / Math.max(participant.deaths, 1),
      cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
      csPerMinute: (participant.totalMinionsKilled + participant.neutralMinionsKilled) / gameDurationMinutes,
      visionScore: participant.visionScore,
      visionScorePerMinute: participant.visionScore / gameDurationMinutes,
      damageDealt: participant.totalDamageDealtToChampions,
      damagePerMinute: participant.totalDamageDealtToChampions / gameDurationMinutes,
      goldEarned: participant.goldEarned,
      goldPerMinute: participant.goldEarned / gameDurationMinutes,
      wardsPlaced: participant.wardsPlaced,
      wardsKilled: participant.wardsKilled,
      championName: participant.championName,
      teamPosition: participant.teamPosition,
      gameDuration: match.info.gameDuration,
      // Objective participation
      dragonKills: participant.dragonKills,
      baronKills: participant.baronKills,
      turretKills: participant.turretKills,
      // Advanced metrics
      damageToObjectives: participant.damageDealtToObjectives,
      damageTaken: participant.totalDamageTaken,
      healingDone: participant.totalHeal,
      ccScore: participant.timeCCingOthers
    }
  }).filter(Boolean)

  if (performances.length === 0) {
    return getDefaultMetrics()
  }

  const wins = performances.filter(p => p?.win).length
  const totalGames = performances.length

  return {
    // Basic metrics
    recentWinRate: (wins / totalGames) * 100,
    avgKDA: performances.reduce((sum, p) => sum + (p?.kda || 0), 0) / totalGames,
    avgKills: performances.reduce((sum, p) => sum + (p?.kills || 0), 0) / totalGames,
    avgDeaths: performances.reduce((sum, p) => sum + (p?.deaths || 0), 0) / totalGames,
    avgAssists: performances.reduce((sum, p) => sum + (p?.assists || 0), 0) / totalGames,
    
    // Farm and economy
    avgCSPerMinute: performances.reduce((sum, p) => sum + (p?.csPerMinute || 0), 0) / totalGames,
    avgGoldPerMinute: performances.reduce((sum, p) => sum + (p?.goldPerMinute || 0), 0) / totalGames,
    
    // Vision and map control
    avgVisionScorePerMinute: performances.reduce((sum, p) => sum + (p?.visionScorePerMinute || 0), 0) / totalGames,
    avgWardsPlaced: performances.reduce((sum, p) => sum + (p?.wardsPlaced || 0), 0) / totalGames,
    avgWardsKilled: performances.reduce((sum, p) => sum + (p?.wardsKilled || 0), 0) / totalGames,
    
    // Combat effectiveness
    avgDamagePerMinute: performances.reduce((sum, p) => sum + (p?.damagePerMinute || 0), 0) / totalGames,
    avgDamageTaken: performances.reduce((sum, p) => sum + (p?.damageTaken || 0), 0) / totalGames,
    
    // Objective participation
    objectiveParticipation: (
      performances.reduce((sum, p) => sum + (p?.dragonKills || 0) + (p?.baronKills || 0) + (p?.turretKills || 0), 0) / totalGames
    ),
    
    // Consistency and reliability
    consistency: calculateAdvancedConsistency(performances),
    gameImpact: calculateGameImpact(performances),
    
    // Raw data for further analysis
    performances
  }
}

// Step 2.2: Analyze play style and champion preferences
function analyzePlayStyle(matches: MatchData[], summonerPuuid: string) {
  const performances = matches.map(match => {
    const participant = match.info.participants.find(p => p.puuid === summonerPuuid)
    return participant
  }).filter(Boolean)

  if (performances.length === 0) {
    return getDefaultPlayStyle()
  }

  // Champion analysis
  const championStats = new Map()
  const positionStats = new Map()
  
  performances.forEach(p => {
    if (!p) return
    
    // Champion statistics
    if (!championStats.has(p.championName)) {
      championStats.set(p.championName, { games: 0, wins: 0, kda: 0, damage: 0 })
    }
    const champStat = championStats.get(p.championName)
    champStat.games += 1
    champStat.wins += p.win ? 1 : 0
    champStat.kda += (p.kills + p.assists) / Math.max(p.deaths, 1)
    champStat.damage += p.totalDamageDealtToChampions
    
    // Position statistics
    if (!positionStats.has(p.teamPosition)) {
      positionStats.set(p.teamPosition, { games: 0, wins: 0 })
    }
    const posStat = positionStats.get(p.teamPosition)
    posStat.games += 1
    posStat.wins += p.win ? 1 : 0
  })

  // Find most played champion and position
  const mostPlayedChampion = Array.from(championStats.entries())
    .sort((a, b) => b[1].games - a[1].games)[0]
  
  const mostPlayedPosition = Array.from(positionStats.entries())
    .sort((a, b) => b[1].games - a[1].games)[0]

  // Calculate versatility
  const uniqueChampions = championStats.size
  const uniquePositions = positionStats.size
  const versatility = Math.min(100, (uniqueChampions * 10) + (uniquePositions * 15))

  return {
    mostPlayedChampion: mostPlayedChampion ? {
      name: mostPlayedChampion[0],
      games: mostPlayedChampion[1].games,
      winRate: (mostPlayedChampion[1].wins / mostPlayedChampion[1].games) * 100,
      avgKDA: mostPlayedChampion[1].kda / mostPlayedChampion[1].games
    } : null,
    
    mostPlayedPosition: mostPlayedPosition ? {
      position: mostPlayedPosition[0],
      games: mostPlayedPosition[1].games,
      winRate: (mostPlayedPosition[1].wins / mostPlayedPosition[1].games) * 100
    } : null,
    
    championPool: Array.from(championStats.entries()).map(([name, stats]) => ({
      name,
      games: stats.games,
      winRate: (stats.wins / stats.games) * 100,
      avgKDA: stats.kda / stats.games
    })),
    
    positionFlexibility: Array.from(positionStats.entries()).map(([position, stats]) => ({
      position,
      games: stats.games,
      winRate: (stats.wins / stats.games) * 100
    })),
    
    versatility,
    specialization: mostPlayedChampion ? (mostPlayedChampion[1].games / performances.length) * 100 : 0
  }
}

// Helper functions for default values
function getDefaultMetrics() {
  return {
    recentWinRate: 50,
    avgKDA: 1.0,
    avgKills: 5,
    avgDeaths: 6,
    avgAssists: 8,
    avgCSPerMinute: 5,
    avgGoldPerMinute: 300,
    avgVisionScorePerMinute: 1,
    avgWardsPlaced: 10,
    avgWardsKilled: 2,
    avgDamagePerMinute: 400,
    avgDamageTaken: 15000,
    objectiveParticipation: 1,
    consistency: 50,
    gameImpact: 50,
    performances: []
  }
}

function getDefaultPlayStyle() {
  return {
    mostPlayedChampion: null,
    mostPlayedPosition: null,
    championPool: [],
    positionFlexibility: [],
    versatility: 30,
    specialization: 0
  }
}

// Advanced consistency calculation
function calculateAdvancedConsistency(performances: any[]) {
  if (performances.length < 3) return 50

  const kdas = performances.map(p => p?.kda || 0)
  const damages = performances.map(p => p?.damagePerMinute || 0)
  const visions = performances.map(p => p?.visionScorePerMinute || 0)
  
  const kdaConsistency = calculateMetricConsistency(kdas)
  const damageConsistency = calculateMetricConsistency(damages)
  const visionConsistency = calculateMetricConsistency(visions)
  
  return (kdaConsistency + damageConsistency + visionConsistency) / 3
}

function calculateMetricConsistency(values: number[]) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const standardDeviation = Math.sqrt(variance)
  
  // Lower standard deviation = higher consistency
  return Math.max(0, Math.min(100, 100 - (standardDeviation * 20)))
}

// Calculate overall game impact
function calculateGameImpact(performances: any[]) {
  if (performances.length === 0) return 50
  
  const avgKDA = performances.reduce((sum, p) => sum + (p?.kda || 0), 0) / performances.length
  const avgDamage = performances.reduce((sum, p) => sum + (p?.damagePerMinute || 0), 0) / performances.length
  const avgVision = performances.reduce((sum, p) => sum + (p?.visionScorePerMinute || 0), 0) / performances.length
  const avgObjectives = performances.reduce((sum, p) => sum + ((p?.dragonKills || 0) + (p?.baronKills || 0)), 0) / performances.length
  
  // Weighted impact score
  const impactScore = (avgKDA * 25) + (avgDamage / 20) + (avgVision * 30) + (avgObjectives * 20)
  return Math.min(100, Math.max(0, impactScore))
}

function calculateConsistency(performances: any[]) {
  if (performances.length < 3) return 50

  const kdas = performances.map(p => p?.kda || 0)
  const mean = kdas.reduce((sum, kda) => sum + kda, 0) / kdas.length
  const variance = kdas.reduce((sum, kda) => sum + Math.pow(kda - mean, 2), 0) / kdas.length
  const standardDeviation = Math.sqrt(variance)
  
  // Lower standard deviation = higher consistency
  return Math.max(0, Math.min(100, 100 - (standardDeviation * 20)))
}

// Step 3: Weighted potential scoring algorithm
function calculateWeightedPotentialScore(rankData: RankData, performanceMetrics: any, playStyleAnalysis: any): number {
  let score = 0
  
  // Base rank score (30% weight)
  const tierScores: { [key: string]: number } = {
    'IRON': 15, 'BRONZE': 25, 'SILVER': 35, 'GOLD': 45, 'PLATINUM': 60,
    'DIAMOND': 75, 'MASTER': 85, 'GRANDMASTER': 90, 'CHALLENGER': 95
  }
  const baseScore = tierScores[rankData.tier] || 30
  score += baseScore * 0.3
  
  // KDA performance (25% weight)
  const kdaScore = Math.min(100, performanceMetrics.avgKDA * 25)
  score += kdaScore * 0.25
  
  // CS per minute (15% weight) 
  const csScore = Math.min(100, performanceMetrics.avgCSPerMinute * 12)
  score += csScore * 0.15
  
  // Vision control (15% weight)
  const visionScore = Math.min(100, performanceMetrics.avgVisionScorePerMinute * 40)
  score += visionScore * 0.15
  
  // Win rate adjustment (10% weight)
  const winRateScore = performanceMetrics.recentWinRate
  score += winRateScore * 0.1
  
  // Consistency bonus (5% weight)
  score += performanceMetrics.consistency * 0.05
  
  return Math.round(Math.max(0, Math.min(100, score)))
}

// Dynamic one-liner generation based on performance patterns
function generateDynamicOneLiner(score: number, trend: string, metrics: any, playStyle: any): string {
  const trendTexts = {
    ascending: '상승세',
    stable: '안정적',
    descending: '하락세'
  }
  
  const currentTrend = trendTexts[trend as keyof typeof trendTexts]
  
  // High potential players (80+)
  if (score >= 85) {
    if (metrics.avgKDA > 3.0 && metrics.avgCSPerMinute > 7) {
      return `뛰어난 파밍과 킬 관여로 게임을 주도하는 ${currentTrend} 캐리형 플레이어`
    }
    if (metrics.avgVisionScorePerMinute > 2.5) {
      return `탁월한 시야 관리와 맵 컨트롤로 팀을 이끄는 ${currentTrend} 전략가형 플레이어`
    }
    return `모든 영역에서 뛰어난 실력을 보이는 ${currentTrend} 올라운드 플레이어`
  }
  
  // Good potential players (70-84)
  if (score >= 70) {
    if (metrics.consistency > 75) {
      return `일관성 있는 플레이로 팀에 안정감을 주는 ${currentTrend} 신뢰형 플레이어`
    }
    if (playStyle.versatility > 60) {
      return `다양한 챔피언과 포지션을 소화하는 ${currentTrend} 만능형 플레이어`
    }
    return `꾸준한 성장과 발전 가능성을 보이는 ${currentTrend} 성장형 플레이어`
  }
  
  // Average potential players (55-69)
  if (score >= 55) {
    if (metrics.avgCSPerMinute > 6) {
      return `뛰어난 파밍 능력을 바탕으로 성장하는 ${currentTrend} 농부형 플레이어`
    }
    if (metrics.objectiveParticipation > 2) {
      return `오브젝트 싸움에서 빛을 발하는 ${currentTrend} 한타형 플레이어`
    }
    return `현재 티어에서 ${currentTrend} 플레이를 보이며 발전 중인 플레이어`
  }
  
  // Developing players (40-54)
  if (score >= 40) {
    return `기본기 향상을 통해 한 단계 도약을 준비하는 ${currentTrend} 도전형 플레이어`
  }
  
  // Needs improvement (below 40)
  return `체계적인 연습과 게임 이해도 향상이 필요한 ${currentTrend} 학습형 플레이어`
}

// Advanced strength identification
function identifyAdvancedStrengths(metrics: any, playStyle: any, rankData: RankData): string[] {
  const strengths: string[] = []
  
  // Performance-based strengths
  if (metrics.avgKDA > 2.5) {
    strengths.push(`우수한 KDA ${metrics.avgKDA.toFixed(1)}로 안정적인 플레이 실력`)
  }
  
  if (metrics.avgCSPerMinute > 6.5) {
    strengths.push(`분당 ${metrics.avgCSPerMinute.toFixed(1)} CS의 뛰어난 파밍 능력`)
  }
  
  if (metrics.avgVisionScorePerMinute > 2.0) {
    strengths.push(`분당 ${metrics.avgVisionScorePerMinute.toFixed(1)} 시야 점수의 탁월한 맵 컨트롤`)
  }
  
  if (metrics.recentWinRate > 65) {
    strengths.push(`최근 ${metrics.recentWinRate.toFixed(0)}% 승률로 강력한 상승 모멘텀`)
  }
  
  if (metrics.consistency > 75) {
    strengths.push('일관성 있는 퍼포먼스로 팀에 안정감 제공')
  }
  
  if (metrics.objectiveParticipation > 2.5) {
    strengths.push('드래곤, 바론 등 주요 오브젝트 싸움에서 높은 기여도')
  }
  
  // Play style-based strengths
  if (playStyle.versatility > 70) {
    strengths.push(`${playStyle.championPool.length}개 챔피언으로 높은 챔피언 숙련도`)
  }
  
  if (playStyle.mostPlayedChampion && playStyle.mostPlayedChampion.winRate > 70) {
    strengths.push(`주력 챔피언 ${playStyle.mostPlayedChampion.name}에서 ${playStyle.mostPlayedChampion.winRate.toFixed(0)}% 승률`)
  }
  
  // Rank-based strengths
  const winRate = (rankData.wins / (rankData.wins + rankData.losses)) * 100
  if (winRate > 60) {
    strengths.push(`랭크 게임 ${winRate.toFixed(0)}% 승률로 꾸준한 티어 상승`)
  }
  
  if (strengths.length === 0) {
    strengths.push('게임에 대한 열정과 지속적인 참여 의지')
  }
  
  return strengths.slice(0, 4) // 최대 4개까지
}

// Advanced improvement identification
function identifyAdvancedImprovements(metrics: any, playStyle: any, rankData: RankData): string[] {
  const improvements: string[] = []
  
  // Performance-based improvements
  if (metrics.avgKDA < 1.8) {
    improvements.push('데스 줄이기와 안전한 포지셔닝 연습으로 생존력 향상')
  }
  
  if (metrics.avgCSPerMinute < 5.5) {
    improvements.push(`분당 CS를 ${(metrics.avgCSPerMinute + 1).toFixed(1)}개 이상으로 향상시켜 골드 효율성 개선`)
  }
  
  if (metrics.avgVisionScorePerMinute < 1.5) {
    improvements.push('와드 설치 및 시야 관리 능력 강화로 맵 컨트롤 향상')
  }
  
  if (metrics.consistency < 60) {
    improvements.push('일관성 있는 플레이를 위한 주력 챔피언 숙련도 집중 향상')
  }
  
  if (metrics.objectiveParticipation < 1.5) {
    improvements.push('드래곤, 바론 타이밍 인식 향상으로 오브젝트 관여율 증대')
  }
  
  if (metrics.avgDamagePerMinute < 400) {
    improvements.push('딜량 향상을 위한 아이템 빌드 최적화와 교전 참여도 증가')
  }
  
  // Play style-based improvements
  if (playStyle.versatility < 40) {
    improvements.push('다양한 챔피언 학습으로 픽밴 단계에서의 유연성 확보')
  }
  
  if (playStyle.specialization < 30) {
    improvements.push('주력 챔피언 선정 후 집중적인 숙련도 향상')
  }
  
  // Rank-based improvements
  const winRate = (rankData.wins / (rankData.wins + rankData.losses)) * 100
  if (winRate < 55) {
    improvements.push('게임 이해도 향상과 메타 챔피언 학습으로 승률 개선')
  }
  
  if (improvements.length === 0) {
    improvements.push('현재 실력 유지를 위한 꾸준한 연습과 메타 적응')
  }
  
  return improvements.slice(0, 4) // 최대 4개까지
}

function calculatePotentialScore(rankData: RankData, performance: any): number {
  let score = 50 // Base score

  // Rank tier bonus
  const tierScores: { [key: string]: number } = {
    'IRON': 10, 'BRONZE': 20, 'SILVER': 30, 'GOLD': 40, 'PLATINUM': 60,
    'DIAMOND': 75, 'MASTER': 85, 'GRANDMASTER': 90, 'CHALLENGER': 95
  }
  score = tierScores[rankData.tier] || 50

  // Win rate adjustment
  const winRate = (rankData.wins / (rankData.wins + rankData.losses)) * 100
  if (winRate > 60) score += 15
  else if (winRate > 55) score += 10
  else if (winRate < 45) score -= 10
  else if (winRate < 40) score -= 15

  // Recent performance adjustment
  if (performance.recentWinRate > 65) score += 10
  else if (performance.recentWinRate < 45) score -= 10

  // KDA adjustment
  if (performance.avgKDA > 2.5) score += 5
  else if (performance.avgKDA < 1.5) score -= 5

  // Consistency bonus
  if (performance.consistency > 70) score += 5

  return Math.max(0, Math.min(100, Math.round(score)))
}

function determineTrend(performance: any): 'ascending' | 'stable' | 'descending' {
  if (performance.recentWinRate > 60 && performance.avgKDA > 2.0) return 'ascending'
  if (performance.recentWinRate < 45 && performance.avgKDA < 1.5) return 'descending'
  return 'stable'
}

function generatePotentialText(score: number, trend: string, tier: string): string {
  const trendTexts = {
    ascending: '상승세',
    stable: '안정적',
    descending: '하락세'
  }

  if (score >= 85) {
    return `뛰어난 실력과 ${trendTexts[trend as keyof typeof trendTexts]} 플레이로 상위 티어 진입 가능성이 높은 잠재력 있는 플레이어`
  } else if (score >= 70) {
    return `${trendTexts[trend as keyof typeof trendTexts]} 플레이와 꾸준한 성장으로 한 단계 상위 티어 도달이 기대되는 플레이어`
  } else if (score >= 55) {
    return `현재 티어에서 ${trendTexts[trend as keyof typeof trendTexts]} 플레이를 보이며 꾸준한 발전 가능성을 가진 플레이어`
  } else if (score >= 40) {
    return `기본기 향상과 게임 이해도 개선을 통해 성장 가능성을 가진 플레이어`
  } else {
    return `체계적인 연습과 기본기 강화를 통해 실력 향상이 필요한 플레이어`
  }
}

function identifyStrengths(performance: any, rankData: RankData): string[] {
  const strengths: string[] = []
  
  const winRate = (rankData.wins / (rankData.wins + rankData.losses)) * 100
  
  if (winRate > 60) {
    strengths.push(`높은 승률 ${Math.round(winRate)}%로 꾸준한 상승세 유지`)
  }
  
  if (performance.avgKDA > 2.5) {
    strengths.push(`우수한 KDA ${performance.avgKDA.toFixed(1)}로 안정적인 플레이`)
  }
  
  if (performance.avgVision > 25) {
    strengths.push('뛰어난 와드 설치 및 시야 관리 능력')
  }
  
  if (performance.consistency > 70) {
    strengths.push('일관성 있는 플레이로 팀에 안정적인 기여')
  }
  
  if (performance.recentWinRate > 65) {
    strengths.push('최근 경기에서 높은 승률로 상승 모멘텀 확보')
  }

  if (strengths.length === 0) {
    strengths.push('게임에 대한 열정과 지속적인 참여')
  }
  
  return strengths
}

function identifyImprovements(performance: any, rankData: RankData): string[] {
  const improvements: string[] = []
  
  if (performance.avgKDA < 1.5) {
    improvements.push('데스 줄이기와 안전한 포지셔닝 연습 필요')
  }
  
  if (performance.avgCS < 120) {
    improvements.push('CS 수급 능력 향상을 통한 골드 효율성 개선')
  }
  
  if (performance.avgVision < 15) {
    improvements.push('와드 설치 및 시야 관리 능력 강화 권장')
  }
  
  if (performance.consistency < 50) {
    improvements.push('일관성 있는 플레이를 위한 챔피언 숙련도 향상')
  }
  
  const winRate = (rankData.wins / (rankData.wins + rankData.losses)) * 100
  if (winRate < 50) {
    improvements.push('게임 이해도 향상과 메타 챔피언 학습')
  }
  
  if (improvements.length === 0) {
    improvements.push('현재 실력 유지를 위한 꾸준한 연습')
  }
  
  return improvements
}
