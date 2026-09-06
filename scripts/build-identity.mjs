import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import process from 'node:process'

export function getBuildIdentity({ env = process.env, cwd = process.cwd() } = {}) {
  const git = (args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  const commit = env.VERCEL_GIT_COMMIT_SHA || env.GITHUB_SHA || git(['rev-parse', 'HEAD'])
  assert.match(commit, /^[a-f0-9]{40}$/, 'Build provenance requires a full Git commit SHA')
  return { commit, builtAt: new Date().toISOString() }
}
