import { NextRequest, NextResponse } from 'next/server'
import { fetchAccountData, fetchSummonerByPuuid, fetchRankData, fetchMatchHistory, fetchMultipleMatchDetails, fetchSummonerByName } from '@/utils/riotApi'
import { analyzePotential } from '@/utils/potentialAnalyzer'

export async function POST(request: NextRequest) {
  try {
    // Simple and direct request body parsing
    const requestBody = await request.json()
    const { summonerInput } = requestBody
    
    if (!summonerInput) {
      return NextResponse.json({ error: 'Summoner input is required' }, { status: 400 })
    }

    // Add delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 1: Parse and get account data
    let accountData
    const decodedName = decodeURIComponent(summonerInput)
    
    // Check if input contains # (Riot ID format)
    if (decodedName.includes('#')) {
      const [gameName, tagLine] = decodedName.split('#')
      console.log(`Trying Riot ID: ${gameName}#${tagLine}`)
      
      try {
        accountData = await fetchAccountData(`${gameName}#${tagLine || 'KR1'}`)
      } catch (error) {
        console.error('Riot ID lookup failed:', error)
        throw error
      }
    } else {
      // Legacy summoner name format
      console.log(`Trying legacy summoner name: ${decodedName}`)
      try {
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
    const summonerData = await fetchSummonerByPuuid(accountData.puuid)
    
    console.log('🔍 Account data:', { puuid: accountData.puuid?.substring(0, 8) + '...' })
    console.log('🔍 Summoner data:', { id: summonerData?.id, level: summonerData?.summonerLevel })
    
    // Continue even if summoner ID is missing - we'll handle it in fetchRankData
    console.log('🔄 Proceeding with available data...')
    
    const rankData = await fetchRankData(summonerData?.id, accountData.puuid)
    
    // Step 3: Get recent match history (20 games)
    const matchIds = await fetchMatchHistory(accountData.puuid, 20)
    const matchDetails = await fetchMultipleMatchDetails(matchIds)
    
    // Step 4: Analyze potential using enhanced algorithm
    console.log(`🔄 Starting potential analysis...`)
    console.log(`📊 Rank data:`, rankData)
    console.log(`📋 Match details count:`, matchDetails.length)
    
    const analysis = analyzePotential(summonerInput, rankData, matchDetails, accountData.puuid)
    console.log(`✅ Analysis completed:`, analysis)
    
    return NextResponse.json({ success: true, data: analysis })
    
  } catch (error: unknown) {
    console.error('Analysis API failed:', error)
    
    // Handle different error types safely
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait a moment before trying again.',
          details: 'Too many requests to Riot API. Please try again in a few seconds.'
        }, 
        { status: 429 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
    const errorDetails = error instanceof Error ? error.toString() : String(error)
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      }, 
      { status: 500 }
    )
  }
}