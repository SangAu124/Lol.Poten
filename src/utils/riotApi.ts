// Riot API utilities for League of Legends data fetching
// Optimized according to Riot API documentation and best practices

const RIOT_API_KEY = process.env.RIOT_API_KEY

// Routing values according to Riot API documentation
const REGIONAL_ROUTING = {
  ASIA: 'https://asia.api.riotgames.com',     // For Account-v1 and Match-v5 APIs
  AMERICAS: 'https://americas.api.riotgames.com',
  EUROPE: 'https://europe.api.riotgames.com'
}

const PLATFORM_ROUTING = {
  KR: 'https://kr.api.riotgames.com',         // For Summoner-v4 and League-v4 APIs
  NA1: 'https://na1.api.riotgames.com',
  EUW1: 'https://euw1.api.riotgames.com',
  EUN1: 'https://eune1.api.riotgames.com',
  JP1: 'https://jp1.api.riotgames.com'
}

class RiotApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'RiotApiError'
  }
}

// Utility function for API requests with proper error handling
async function makeApiRequest(url: string): Promise<any> {
  if (!RIOT_API_KEY) {
    throw new RiotApiError('Riot API key is not configured', 500)
  }

  try {
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
        'User-Agent': 'Lol.Poten/1.0.0 (https://lol-poten.app)','Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new RiotApiError('Resource not found', 404)
      }
      if (response.status === 403) {
        throw new RiotApiError('API key forbidden - check permissions', 403)
      }
      if (response.status === 401) {
        throw new RiotApiError('API key unauthorized - check validity', 401)
      }
      if (response.status === 429) {
        throw new RiotApiError('Rate limit exceeded', 429)
      }
      throw new RiotApiError(`API request failed: ${response.status}`, response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof RiotApiError) {
      throw error
    }
    throw new RiotApiError(`Network error: ${error}`, 500)
  }
}

// STEP 1: Get Account Data by Riot ID (gameName#tagLine)
export async function fetchAccountData(riotId: string) {
  // Parse Riot ID (e.g., "Hide on bush#KR1" -> gameName: "Hide on bush", tagLine: "KR1")
  const [gameName, tagLine] = riotId.split('#')
  
  if (!gameName || !tagLine) {
    throw new Error('Invalid Riot ID format. Expected format: gameName#tagLine')
  }

  // Use correct ACCOUNT-V1 endpoint with proper regional routing
  const url = `${REGIONAL_ROUTING.ASIA}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  console.log(`🔍 Fetching account data for: ${gameName}#${tagLine}`)
  const data = await makeApiRequest(url)
  console.log(`✅ Account found: ${data.gameName}#${data.tagLine} (Level ${data.summonerLevel || 'Unknown'})`)
  
  return data
}

// STEP 2: Get Summoner by PUUID (Recommended per Riot API docs)
export async function fetchSummonerByPuuid(puuid: string) {
  const url = `${PLATFORM_ROUTING.KR}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`
  console.log(`👤 Fetching summoner data...`)
  const data = await makeApiRequest(url)
  
  // According to Riot API docs, SUMMONER-V4 should return 'id' field
  const summonerId = data.id
  if (!summonerId) {
    console.warn(`⚠️ Summoner ID unavailable - API key has limited permissions`)
    console.log(`📋 Summoner Info: Level ${data.summonerLevel} | Icon ${data.profileIconId}`)
  } else {
    console.log(`✅ Summoner Data: Level ${data.summonerLevel} | ID: ${summonerId.substring(0, 8)}...`)
  }

  return {
    ...data,
    id: summonerId
  }
}

// STEP 3: Get Rank Data by Summoner ID or extract from match data
export async function fetchRankData(summonerId?: string, puuid?: string) {
  // Try to get summoner ID from PUUID if not available
  if (!summonerId && puuid) {
    console.log(`🔄 Attempting to get summoner ID from PUUID...`)
    try {
      const summonerUrl = `${PLATFORM_ROUTING.KR}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`
      const summonerData = await makeApiRequest(summonerUrl)
      
      // Check if we can extract summoner ID
      summonerId = summonerData.id || summonerData.summonerId || summonerData.encryptedSummonerId
      
      if (summonerId) {
        console.log(`✅ Successfully extracted summoner ID: ${summonerId.substring(0, 8)}...`)
      } else {
        console.warn(`⚠️ Could not extract summoner ID from PUUID response`)
        console.warn(`⚠️ Available fields:`, Object.keys(summonerData))
      }
    } catch (error) {
      console.error(`❌ Failed to get summoner ID from PUUID:`, error)
    }
  }

  // If summoner ID is still not available, try extracting rank from recent matches
  if (!summonerId && puuid) {
    console.log(`🔄 Attempting to extract rank data from recent matches...`)
    return await extractRankFromMatches(puuid)
  }

  if (!summonerId) {
    console.info(`ℹ️ Summoner ID not available - will analyze based on match performance`)
    return null
  }

  try {
    const url = `${PLATFORM_ROUTING.KR}/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`
    console.log(`🏆 Fetching rank data...`)
    const data = await makeApiRequest(url)
    
    if (data.length > 0) {
      // Return the ranked solo/duo data (most relevant for analysis)
      const rankedEntry = data.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5')
      if (rankedEntry) {
        const winRate = Math.round((rankedEntry.wins / (rankedEntry.wins + rankedEntry.losses)) * 100)
        console.log(`🏆 Rank: ${rankedEntry.tier} ${rankedEntry.rank} ${rankedEntry.leaguePoints}LP`)
        console.log(`📊 Season Record: ${rankedEntry.wins}W ${rankedEntry.losses}L (${winRate}%)`)
        return rankedEntry
      }
      
      // If no solo queue, return first available rank
      console.log(`🎯 Using first available rank: ${data[0].tier} ${data[0].rank}`)
      return data[0]
    }
    
    // No ranked data found
    console.log(`📊 Unranked player`)
    return {
      leagueId: 'unranked',
      queueType: 'RANKED_SOLO_5x5',
      tier: 'UNRANKED',
      rank: '',
      summonerId: summonerId,
      summonerName: 'Unknown',
      leaguePoints: 0,
      wins: 0,
      losses: 0,
      veteran: false,
      inactive: false,
      freshBlood: false,
      hotStreak: false
    }
  } catch (error) {
    console.error(`❌ Rank data fetch failed:`, error)
    return null
  }
}

// STEP 4: Get Match History by PUUID
export async function fetchMatchHistory(puuid: string, count: number = 20) {
  // queue=420 is Solo/Duo Ranked, queue=440 is Flex Ranked
  const url = `${REGIONAL_ROUTING.ASIA}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}&queue=420`
  console.log(`📋 Fetching ${count} recent matches...`)
  const matchIds = await makeApiRequest(url)
  console.log(`✅ Found ${matchIds.length} matches`)
  return matchIds
}

// STEP 5: Get Match Details
export async function fetchMatchDetails(matchId: string) {
  const url = `${REGIONAL_ROUTING.ASIA}/lol/match/v5/matches/${encodeURIComponent(matchId)}`
  return await makeApiRequest(url)
}

// Batch fetch multiple match details with proper rate limiting
export async function fetchMultipleMatchDetails(matchIds: string[]) {
  console.log(`⚡ Fetching match details... (0/${matchIds.length})`)
  const results = []
  
  for (let i = 0; i < matchIds.length; i++) {
    try {
      const matchData = await fetchMatchDetails(matchIds[i])
      results.push(matchData)
      
      // Show progress every 5 matches
      if ((i + 1) % 5 === 0 || i === matchIds.length - 1) {
        console.log(`⚡ Progress: ${i + 1}/${matchIds.length} matches fetched`)
      }
      
      // Rate limiting: Very conservative approach for stability (3s per request)
      if (i < matchIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    } catch (error) {
      console.warn(`❌ Failed to fetch match ${i + 1}:`, error)
      // Continue with other matches even if one fails
    }
  }
  
  console.log(`✅ Completed: ${results.length}/${matchIds.length} matches`)
  return results
}

// Helper function to extract rank data from match participants
async function extractRankFromMatches(puuid: string) {
  try {
    console.log(`🔍 Attempting rank estimation from recent matches...`)
    
    // Get recent ranked matches (more matches for better estimation)
    const matchIds = await fetchMatchHistory(puuid, 10)
    if (matchIds.length === 0) {
      return null
    }
    
    // Try to get summoner ID from match data first
    const firstMatch = await fetchMatchDetails(matchIds[0])
    const participant = firstMatch.info.participants.find((p: any) => p.puuid === puuid)
    
    if (participant && participant.summonerId) {
      console.log(`🎯 Found Summoner ID in match data, attempting rank lookup...`)
      try {
        const url = `${PLATFORM_ROUTING.KR}/lol/league/v4/entries/by-summoner/${encodeURIComponent(participant.summonerId)}`
        const rankData = await makeApiRequest(url)
        
        if (rankData && rankData.length > 0) {
          const soloRank = rankData.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5')
          if (soloRank) {
            const winRate = Math.round((soloRank.wins / (soloRank.wins + soloRank.losses)) * 100)
            console.log(`🏆 REAL RANK: ${soloRank.tier} ${soloRank.rank} ${soloRank.leaguePoints}LP (${winRate}% WR)`)
            return soloRank
          }
        }
      } catch (error) {
        console.log(`⚠️ Rank API unavailable, falling back to estimation...`)
      }
    }
    
    // Fallback to estimation
    const matchesToAnalyze = Math.min(3, matchIds.length)
    const matchDetails = await fetchMultipleMatchDetails(matchIds.slice(0, matchesToAnalyze))
    if (matchDetails.length === 0) {
      return null
    }
    
    // Check if any match has direct tier/rank info
    for (const match of matchDetails) {
      const participant = match.info.participants.find((p: any) => p.puuid === puuid)
      if (participant && participant.tier && participant.rank) {
        console.log(`✅ Found embedded rank: ${participant.tier} ${participant.rank}`)
        return {
          leagueId: 'extracted-from-match',
          queueType: 'RANKED_SOLO_5x5',
          tier: participant.tier,
          rank: participant.rank,
          summonerId: participant.summonerId || 'unknown',
          summonerName: participant.summonerName || 'Unknown',
          leaguePoints: participant.leaguePoints || 0,
          wins: 0,
          losses: 0,
          veteran: false,
          inactive: false,
          freshBlood: false,
          hotStreak: false
        }
      }
    }
    
    // Enhanced rank estimation using multiple matches
    console.log(`📈 Estimating rank from ${matchDetails.length} matches...`)
    
    const playerStats = []
    let totalPlayerPerformance = {
      level: 0,
      kda: 0,
      csPerMin: 0,
      visionScore: 0,
      damagePerMin: 0,
      goldPerMin: 0,
      winRate: 0
    }
    
    for (const match of matchDetails) {
      const participant = match.info.participants.find((p: any) => p.puuid === puuid)
      if (!participant) continue
      
      const gameDurationMin = match.info.gameDuration / 60
      const kda = participant.deaths > 0 ? (participant.kills + participant.assists) / participant.deaths : participant.kills + participant.assists
      const csPerMin = (participant.totalMinionsKilled + participant.neutralMinionsKilled) / gameDurationMin
      const damagePerMin = participant.totalDamageDealtToChampions / gameDurationMin
      const goldPerMin = participant.goldEarned / gameDurationMin
      
      totalPlayerPerformance.level += participant.summonerLevel
      totalPlayerPerformance.kda += kda
      totalPlayerPerformance.csPerMin += csPerMin
      totalPlayerPerformance.visionScore += participant.visionScore / gameDurationMin
      totalPlayerPerformance.damagePerMin += damagePerMin
      totalPlayerPerformance.goldPerMin += goldPerMin
      totalPlayerPerformance.winRate += participant.win ? 1 : 0
      
      // Analyze opponent quality (average level and performance)
      const opponentLevels = match.info.participants
        .filter((p: any) => p.puuid !== puuid)
        .map((p: any) => p.summonerLevel)
      const avgOpponentLevel = opponentLevels.reduce((sum: number, level: number) => sum + level, 0) / opponentLevels.length
      
      playerStats.push({
        playerLevel: participant.summonerLevel,
        avgOpponentLevel,
        kda,
        csPerMin,
        damagePerMin,
        goldPerMin,
        visionScorePerMin: participant.visionScore / gameDurationMin,
        win: participant.win
      })
    }
    
    // Calculate averages
    const matchCount = playerStats.length
    const avgStats = {
      level: matchCount > 0 ? totalPlayerPerformance.level / matchCount : 30,
      kda: matchCount > 0 ? totalPlayerPerformance.kda / matchCount : 1.0,
      csPerMin: matchCount > 0 ? totalPlayerPerformance.csPerMin / matchCount : 5.0,
      visionScorePerMin: matchCount > 0 ? totalPlayerPerformance.visionScore / matchCount : 1.0,
      damagePerMin: matchCount > 0 ? totalPlayerPerformance.damagePerMin / matchCount : 400,
      goldPerMin: matchCount > 0 ? totalPlayerPerformance.goldPerMin / matchCount : 300,
      winRate: matchCount > 0 ? (totalPlayerPerformance.winRate / matchCount) * 100 : 50
    }
    
    // Enhanced rank estimation algorithm
    let estimatedTier = 'BRONZE'
    let estimatedRank = 'II'
    let confidence = 'Low'
    
    // Multi-factor rank estimation
    let rankScore = 0
    
    // Level factor (0-20 points)
    if (avgStats.level >= 300) rankScore += 20
    else if (avgStats.level >= 200) rankScore += 15
    else if (avgStats.level >= 150) rankScore += 12
    else if (avgStats.level >= 100) rankScore += 8
    else if (avgStats.level >= 50) rankScore += 5
    
    // KDA factor (0-25 points)
    if (avgStats.kda >= 3.0) rankScore += 25
    else if (avgStats.kda >= 2.5) rankScore += 20
    else if (avgStats.kda >= 2.0) rankScore += 15
    else if (avgStats.kda >= 1.5) rankScore += 10
    else if (avgStats.kda >= 1.0) rankScore += 5
    
    // CS factor (0-20 points)
    if (avgStats.csPerMin >= 8.0) rankScore += 20
    else if (avgStats.csPerMin >= 7.0) rankScore += 15
    else if (avgStats.csPerMin >= 6.0) rankScore += 12
    else if (avgStats.csPerMin >= 5.0) rankScore += 8
    else if (avgStats.csPerMin >= 4.0) rankScore += 4
    
    // Vision factor (0-15 points)
    if (avgStats.visionScorePerMin >= 2.5) rankScore += 15
    else if (avgStats.visionScorePerMin >= 2.0) rankScore += 12
    else if (avgStats.visionScorePerMin >= 1.5) rankScore += 8
    else if (avgStats.visionScorePerMin >= 1.0) rankScore += 5
    
    // Damage factor (0-15 points)
    if (avgStats.damagePerMin >= 800) rankScore += 15
    else if (avgStats.damagePerMin >= 600) rankScore += 12
    else if (avgStats.damagePerMin >= 500) rankScore += 8
    else if (avgStats.damagePerMin >= 400) rankScore += 5
    
    // Win rate factor (0-5 points)
    if (avgStats.winRate >= 70) rankScore += 5
    else if (avgStats.winRate >= 60) rankScore += 3
    else if (avgStats.winRate >= 50) rankScore += 1
    
    // Convert score to rank
    if (rankScore >= 85) {
      estimatedTier = 'DIAMOND'
      estimatedRank = rankScore >= 90 ? 'III' : 'IV'
      confidence = 'High'
    } else if (rankScore >= 70) {
      estimatedTier = 'PLATINUM'
      estimatedRank = rankScore >= 80 ? 'II' : 'III'
      confidence = 'High'
    } else if (rankScore >= 55) {
      estimatedTier = 'GOLD'
      estimatedRank = rankScore >= 65 ? 'I' : rankScore >= 60 ? 'II' : 'III'
      confidence = 'Medium'
    } else if (rankScore >= 35) {
      estimatedTier = 'SILVER'
      estimatedRank = rankScore >= 50 ? 'I' : rankScore >= 45 ? 'II' : rankScore >= 40 ? 'III' : 'IV'
      confidence = 'Medium'
    } else if (rankScore >= 20) {
      estimatedTier = 'BRONZE'
      estimatedRank = rankScore >= 30 ? 'I' : rankScore >= 25 ? 'II' : 'III'
      confidence = 'Low'
    } else {
      estimatedTier = 'IRON'
      estimatedRank = rankScore >= 15 ? 'II' : rankScore >= 10 ? 'III' : 'IV'
      confidence = 'Low'
    }
    
    console.log(`🏆 ESTIMATED RANK: ${estimatedTier} ${estimatedRank} (${confidence} confidence)`)
    console.log(`📈 Based on: ${avgStats.kda.toFixed(1)} KDA | ${avgStats.csPerMin.toFixed(1)} CS/min | ${avgStats.winRate.toFixed(0)}% WR`)
    
    return {
      leagueId: 'estimated-enhanced',
      queueType: 'RANKED_SOLO_5x5',
      tier: estimatedTier,
      rank: estimatedRank,
      summonerId: 'unknown',
      summonerName: playerStats[0] ? matchDetails[0].info.participants.find((p: any) => p.puuid === puuid)?.summonerName || 'Unknown' : 'Unknown',
      leaguePoints: Math.max(0, Math.min(100, (rankScore - 20) * 2)), // Estimate LP based on score
      wins: Math.round((avgStats.winRate || 50) / 10), // Rough estimate, default to 50% if NaN
      losses: Math.round((100 - (avgStats.winRate || 50)) / 10),
      veteran: false,
      inactive: false,
      freshBlood: false,
      hotStreak: avgStats.winRate > 65
    }
    
  } catch (error) {
    console.error(`❌ Rank extraction failed:`, error)
    return null
  }
}

// LEGACY: Get Summoner by Name (deprecated but kept for fallback)
export async function fetchSummonerByName(summonerName: string) {
  const url = `${PLATFORM_ROUTING.KR}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`
  console.log(`⚠️ Using deprecated summoner name lookup: ${summonerName}`)
  return await makeApiRequest(url)
}
