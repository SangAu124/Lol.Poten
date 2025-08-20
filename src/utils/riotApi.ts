// Riot API utilities for League of Legends data fetching
// Note: You'll need to get an API key from https://developer.riotgames.com/

const RIOT_API_KEY = process.env.NEXT_PUBLIC_RIOT_API_KEY || ''
const KR_BASE_URL = 'https://kr.api.riotgames.com'
const ASIA_BASE_URL = 'https://asia.api.riotgames.com'

export class RiotApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'RiotApiError'
  }
}

// Step 1: Get Account by RiotID (gameName#tagLine)
export async function fetchAccountByRiotId(gameName: string, tagLine: string = 'KR1') {
  if (!RIOT_API_KEY) {
    throw new RiotApiError('Riot API key is not configured')
  }

  try {
    const response = await fetch(
      `${ASIA_BASE_URL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        throw new RiotApiError('Account not found', 404)
      }
      throw new RiotApiError(`API request failed: ${response.status}`, response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof RiotApiError) {
      throw error
    }
    throw new RiotApiError('Failed to fetch account data')
  }
}

// Legacy method for backward compatibility
export async function fetchSummonerByName(summonerName: string) {
  // Try with default KR1 tag first
  try {
    return await fetchAccountByRiotId(summonerName, 'KR1')
  } catch (error) {
    // If failed, try without tag (old summoner name format)
    if (!RIOT_API_KEY) {
      throw new RiotApiError('Riot API key is not configured')
    }

    try {
      const response = await fetch(
        `${KR_BASE_URL}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new RiotApiError('Summoner not found', 404)
        }
        throw new RiotApiError(`API request failed: ${response.status}`, response.status)
      }

      return await response.json()
    } catch (legacyError) {
      if (legacyError instanceof RiotApiError) {
        throw legacyError
      }
      throw new RiotApiError('Failed to fetch summoner data')
    }
  }
}

// Get summoner data by PUUID
export async function fetchSummonerByPuuid(puuid: string) {
  if (!RIOT_API_KEY) {
    throw new RiotApiError('Riot API key is not configured')
  }

  try {
    const response = await fetch(
      `${KR_BASE_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new RiotApiError(`API request failed: ${response.status}`, response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof RiotApiError) {
      throw error
    }
    throw new RiotApiError('Failed to fetch summoner data by PUUID')
  }
}

export async function fetchRankData(summonerId: string) {
  if (!RIOT_API_KEY) {
    throw new RiotApiError('Riot API key is not configured')
  }

  try {
    const response = await fetch(
      `${KR_BASE_URL}/lol/league/v4/entries/by-summoner/${summonerId}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new RiotApiError(`API request failed: ${response.status}`, response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof RiotApiError) {
      throw error
    }
    throw new RiotApiError('Failed to fetch rank data')
  }
}

// Step 2: Get recent match IDs by PUUID
export async function fetchMatchHistory(puuid: string, count: number = 20) {
  if (!RIOT_API_KEY) {
    throw new RiotApiError('Riot API key is not configured')
  }

  try {
    const response = await fetch(
      `${ASIA_BASE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}&queue=420`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new RiotApiError(`API request failed: ${response.status}`, response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof RiotApiError) {
      throw error
    }
    throw new RiotApiError('Failed to fetch match history')
  }
}

// Step 3: Get detailed match data for each match ID
export async function fetchMatchDetails(matchId: string) {
  if (!RIOT_API_KEY) {
    throw new RiotApiError('Riot API key is not configured')
  }

  try {
    const response = await fetch(
      `${ASIA_BASE_URL}/lol/match/v5/matches/${matchId}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY,
        },
      }
    )

    if (!response.ok) {
      throw new RiotApiError(`API request failed: ${response.status}`, response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof RiotApiError) {
      throw error
    }
    throw new RiotApiError('Failed to fetch match details')
  }
}

// Batch fetch multiple match details
export async function fetchMultipleMatchDetails(matchIds: string[]) {
  const matchPromises = matchIds.map(matchId => fetchMatchDetails(matchId))
  
  try {
    const results = await Promise.allSettled(matchPromises)
    return results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
  } catch (error) {
    throw new RiotApiError('Failed to fetch multiple match details')
  }
}
