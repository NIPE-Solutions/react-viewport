import { access, rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseRoot(arguments_) {
  const rootIndex = arguments_.indexOf('--root')

  if (rootIndex === -1) return repositoryRoot
  if (!arguments_[rootIndex + 1]) throw new Error('--root requires a path')

  return path.resolve(arguments_[rootIndex + 1])
}

const root = parseRoot(process.argv.slice(2))

if (root === path.parse(root).root) {
  throw new Error('Refusing to clean a filesystem root')
}

await access(path.join(root, 'package.json'))

const generatedPaths = [
  'dist',
  'website/.next',
  'website/out',
  'coverage',
  'playwright-report',
  'test-results',
  'tsconfig.tsbuildinfo',
  'website/tsconfig.tsbuildinfo',
]

await Promise.all(
  generatedPaths.map((generatedPath) =>
    rm(path.join(root, generatedPath), { force: true, recursive: true }),
  ),
)

process.stdout.write(`Removed ${generatedPaths.length} generated output paths.\n`)
