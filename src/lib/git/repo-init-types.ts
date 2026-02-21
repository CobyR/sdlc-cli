export interface createGitHubRepoAndPushOptions {
  name: string
  visibility: 'public' | 'private'
  remoteName: string
  push: boolean
  cwd?: string
}
