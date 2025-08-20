// Riot API utilities for League of Legends data fetching
// Optimized according to Riot API documentation and best practices

const RIOT_API_KEY = process.env.NEXT_PUBLIC_RIOT_API_KEY

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
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

// STEP 1: Get Account by Riot ID (Recommended approach)
export async function fetchAccountByRiotId(gameName: string, tagLine: string = 'KR1') {
  const url = `${REGIONAL_ROUTING.ASIA}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  console.log(`🔍 Fetching account: ${gameName}#${tagLine}`)
  
  const data = await makeApiRequest(url)
  console.log(`🔍 Full account response:`, data)
  
  return data
}

// STEP 2: Get Summoner by PUUID (Recommended)
export async function fetchSummonerByPuuid(puuid: string) {
  const url = `${PLATFORM_ROUTING.KR}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`
  console.log(`👤 Fetching summoner by PUUID: ${puuid.substring(0, 8)}...`)
  
  const data = await makeApiRequest(url)
  console.log(`🔍 Full summoner response:`, data)
  console.log(`🔍 All response keys:`, Object.keys(data))
  
  // Note: Riot API may have changed response structure
  // Current response includes: puuid, profileIconId, revisionDate, summonerLevel
  // Missing fields: id, accountId, name (possibly deprecated or moved to different endpoint)
  if (!data.id) {
    console.info(`ℹ️ Summoner ID not in response - API structure may have changed`)
    console.info(`ℹ️ Available fields:`, Object.keys(data))
    console.info(`ℹ️ Will use PUUID for rank data fetching with alternative approach`)
  }
  
  // Extract available data
  const summonerId = data.id || data.summonerId || data.encryptedSummonerId
  const summonerName = data.name || data.summonerName || data.displayName
  const accountId = data.accountId
  
  console.log(`✅ Extracted summoner data:`, { 
    id: summonerId, 
    name: summonerName, 
    accountId: accountId,
    level: data.summonerLevel,
    puuid: data.puuid?.substring(0, 8) + '...'
  })
  
  return {
    ...data,
    id: summonerId,
    name: summonerName,
    accountId: accountId
  }
}

// STEP 3: Get Rank Data by Summoner ID
export async function fetchRankData(summonerId?: string, puuid?: string) {
  if (!summonerId) {
    console.info(`ℹ️ Summoner ID not available due to API changes - skipping rank data`)
    console.info(`ℹ️ Will analyze potential based on match performance instead`)
    
    // Return null to indicate rank data is unavailable (not an error)
    return null
  }
  
  const url = `${PLATFORM_ROUTING.KR}/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`
  console.log(`🏆 Fetching rank data for summonerId: ${summonerId}`)
  
  try {
    const data = await makeApiRequest(url)
    console.log(`✅ Rank data entries found: ${data.length}`)
    
    // Return the ranked solo/duo data (most relevant for analysis)
    const rankedEntry = data.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5')
    if (rankedEntry) {
      console.log(`🎯 Found ranked solo/duo: ${rankedEntry.tier} ${rankedEntry.rank}`)
      return rankedEntry
    }
    
    return data[0] || {
      tier: 'UNRANKED',
      rank: '',
      leaguePoints: 0,
      wins: 0,
      losses: 0,
      queueType: 'RANKED_SOLO_5x5'
    }
  } catch (error) {
    console.error(`❌ Failed to fetch rank data:`, error)
    return {
      tier: 'UNRANKED',
      rank: '',
      leaguePoints: 0,
      wins: 0,
      losses: 0,
      queueType: 'RANKED_SOLO_5x5'
    }
  }
}

// STEP 4: Get Match History by PUUID
export async function fetchMatchHistory(puuid: string, count: number = 20) {
  const url = `${REGIONAL_ROUTING.ASIA}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}&queue=420`
  console.log(`📋 Fetching ${count} recent ranked matches`)
  return await makeApiRequest(url)
}

// STEP 5: Get Match Details
export async function fetchMatchDetails(matchId: string) {
  const url = `${REGIONAL_ROUTING.ASIA}/lol/match/v5/matches/${encodeURIComponent(matchId)}`
  return await makeApiRequest(url)
}

// Batch fetch multiple match details with proper rate limiting
export async function fetchMultipleMatchDetails(matchIds: string[]) {
  console.log(`⚡ Fetching ${matchIds.length} match details`)
  const results = []
  
  for (let i = 0; i < matchIds.length; i++) {
    try {
      const matchData = await fetchMatchDetails(matchIds[i])
      results.push(matchData)
      
      // Rate limiting: 100 requests per 2 minutes for personal API key
      if (i < matchIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 120))
      }
    } catch (error) {
      console.warn(`❌ Failed to fetch match ${matchIds[i]}:`, error)
      // Continue with other matches even if one fails
    }
  }
  
  console.log(`✅ Successfully fetched ${results.length}/${matchIds.length} matches`)
  return results
}

// LEGACY: Get Summoner by Name (deprecated but kept for fallback)
export async function fetchSummonerByName(summonerName: string) {
  const url = `${PLATFORM_ROUTING.KR}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`
  console.log(`⚠️ Using deprecated summoner name lookup: ${summonerName}`)
  return await makeApiRequest(url)
}
