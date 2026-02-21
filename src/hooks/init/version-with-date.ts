import {readFile} from 'fs/promises'
import {join} from 'path'
import type {Hook} from '@oclif/core'
import {ux} from '@oclif/core'
import {CHANGELOG_FILENAME, getReleaseDateForVersion} from '../../lib/changelog/update'

/**
 * Init hook: when the user passes --version (or additionalVersionFlags), print
 * version plus release date from CHANGELOG.md and exit so the default version
 * line is replaced.
 */
const hook: Hook.Init = async function (options) {
  const versionFlags = [
    '--version',
    ...(options.config.pjson?.oclif?.additionalVersionFlags ?? []),
  ]
  const isVersionRequest = options.id !== undefined && versionFlags.includes(options.id)
  if (!isVersionRequest) return

  const {config} = options
  const root = config.root
  let releaseDate: string | null = null
  try {
    const changelogPath = join(root, CHANGELOG_FILENAME)
    const content = await readFile(changelogPath, 'utf-8')
    releaseDate = getReleaseDateForVersion(content, config.version)
  } catch {
    // No CHANGELOG or unreadable; show version only
  }

  const versionPart =
    releaseDate != null
      ? `${config.name}/${config.version} (${releaseDate})`
      : `${config.name}/${config.version}`
  const line = `${versionPart} ${config.platform}-${config.arch} node-${process.version}`
  ux.log(line)
  process.exit(0)
}

export default hook
