import { execFileSync } from 'node:child_process'
import process from 'node:process'

// The hosted Vercel builder reserializes its working vercel.json. GitHub CI
// checks the committed formatting; workflow tests still check hosted semantics.
const args = ['node_modules/prettier/bin/prettier.cjs', '--check', '.']
if (process.env.VERCEL === '1') args.push('!vercel.json')
execFileSync(process.execPath, args, { stdio: 'inherit' })
