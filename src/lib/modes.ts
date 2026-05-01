import { ProjectMode } from '@/types/project'

// localized text ProjectMode localized text，localized text
export type { ProjectMode }

export interface ModeConfig {
  id: ProjectMode
  name: string
  description: string
  icon: string
  color: string
  available: boolean
}

export const PROJECT_MODE: ModeConfig = {
  id: 'novel-promotion',
  name: 'localized text',
  description: 'localized text',
  icon: 'N',
  color: 'purple',
  available: true
}

// localized text
export const PROJECT_MODES: ModeConfig[] = [PROJECT_MODE]

export function getModeConfig(mode: ProjectMode): ModeConfig | undefined {
  return mode === 'novel-promotion' ? PROJECT_MODE : undefined
}
