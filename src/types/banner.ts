import type { AtkType, DefType } from './game'

// types/banner.ts
export interface Character {
  id: string
  name: string
  image: string
  class: string
  rarity: number
  atkType: AtkType
  defType: DefType
  isNew?: boolean
  isLimited?: boolean
}

export interface Banner {
  id: string
  startDate: string
  endDate: string
  characters: Character[]
  type: 'New' | 'Rerun' | 'Fes' | 'Collab'
  eventDetails?: string
  rewards?: string[]
  expanded?: boolean
}

export interface BannerFormData {
  startDate: string
  endDate: string
  type: Banner['type']
  characters: Character[]
  eventDetails?: string
  rewards?: string[]
}
