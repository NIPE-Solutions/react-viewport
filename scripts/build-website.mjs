import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

import { getBuildIdentity } from './build-identity.mjs'

const { commit, builtAt, dirty } = getBuildIdentity()
const version = JSON.parse(readFileSync('package.json', 'utf8')).version
const env = { ...process.env, NEXT_PUBLIC_BUILD_SHA: commit, NEXT_PUBLIC_BUILD_TIME: builtAt }
execFileSync('npm', ['run', 'build:dist'], { stdio: 'inherit', env })
execFileSync(process.execPath, ['node_modules/next/dist/bin/next', 'build', 'website'], {
  stdio: 'inherit',
  env,
})
writeFileSync(
  'website/out/build.json',
  JSON.stringify({ commit, builtAt, version, dirty }, null, 2) + '\n',
)
