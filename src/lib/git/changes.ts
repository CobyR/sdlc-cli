import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

export interface FileChange {
  status: 'A' | 'M' | 'D'
  path: string
}

export interface CategorizedChanges {
  [category: string]: {
    added: string[]
    modified: string[]
    deleted: string[]
  }
}

export async function getChangesSinceMain(): Promise<FileChange[]> {
  try {
    const {stdout} = await execAsync('git diff --name-status main...HEAD')
    const changes: FileChange[] = []
    
    for (const line of stdout.trim().split('\n')) {
      if (!line.trim()) continue
      const parts = line.split('\t')
      if (parts.length >= 2) {
        const status = parts[0].charAt(0) as 'A' | 'M' | 'D'
        const path = parts[1]
        changes.push({status, path})
      }
    }
    
    return changes
  } catch {
    return []
  }
}

export function categorizeChanges(changes: FileChange[]): CategorizedChanges {
  const categorized: CategorizedChanges = {}

  for (const change of changes) {
    const category = getCategoryForFile(change.path)
    
    if (!categorized[category]) {
      categorized[category] = {
        added: [],
        modified: [],
        deleted: [],
      }
    }

    if (change.status === 'A') {
      categorized[category].added.push(change.path)
    } else if (change.status === 'M') {
      categorized[category].modified.push(change.path)
    } else if (change.status === 'D') {
      categorized[category].deleted.push(change.path)
    }
  }

  return categorized
}

function getCategoryForFile(filePath: string): string {
  if (filePath.startsWith('src/commands/') || filePath.includes('/commands/')) {
    return 'CLI Commands'
  }
  
  if (filePath.startsWith('src/lib/') || filePath.includes('/lib/')) {
    return 'Library Code'
  }
  
  if (filePath.startsWith('docs/')) {
    return 'Documentation'
  }
  
  if (filePath.includes('test') || filePath.includes('spec')) {
    return 'Tests'
  }
  
  if (filePath.match(/package\.json|tsconfig\.json|\.config\.(js|ts)$/)) {
    return 'Configuration'
  }
  
  if (filePath.includes('version') || filePath.includes('CHANGELOG')) {
    return 'Version Management'
  }
  
  return 'Other Files'
}

