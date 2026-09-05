import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('clean removes generated outputs without touching source files', async (context) => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'react-viewport-clean-test-'))
  context.after(() => rm(temporaryRoot, { force: true, recursive: true }))

  const generatedDirectories = [
    'dist',
    'website/.next',
    'website/out',
    'coverage',
    'playwright-report',
    'test-results',
  ]

  await Promise.all(
    generatedDirectories.map(async (directory) => {
      const outputDirectory = path.join(temporaryRoot, directory)
      await mkdir(outputDirectory, { recursive: true })
      await writeFile(path.join(outputDirectory, 'generated.txt'), 'generated\n')
    }),
  )
  await writeFile(path.join(temporaryRoot, 'tsconfig.tsbuildinfo'), 'generated\n')
  await writeFile(path.join(temporaryRoot, 'website/tsconfig.tsbuildinfo'), 'generated\n')
  await writeFile(path.join(temporaryRoot, 'package.json'), '{"private":true}\n')

  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'clean', '--', '--root', temporaryRoot],
    {
      cwd: path.resolve(import.meta.dirname, '..'),
      encoding: 'utf8',
    },
  )

  assert.equal(result.status, 0, result.stderr || result.stdout)
  await assert.rejects(readFile(path.join(temporaryRoot, 'dist/generated.txt')))
  await assert.rejects(readFile(path.join(temporaryRoot, 'website/.next/generated.txt')))
  await assert.rejects(readFile(path.join(temporaryRoot, 'website/out/generated.txt')))
  await assert.rejects(readFile(path.join(temporaryRoot, 'coverage/generated.txt')))
  await assert.rejects(readFile(path.join(temporaryRoot, 'playwright-report/generated.txt')))
  await assert.rejects(readFile(path.join(temporaryRoot, 'test-results/generated.txt')))
  await assert.rejects(readFile(path.join(temporaryRoot, 'tsconfig.tsbuildinfo')))
  await assert.rejects(readFile(path.join(temporaryRoot, 'website/tsconfig.tsbuildinfo')))
  assert.equal(
    await readFile(path.join(temporaryRoot, 'package.json'), 'utf8'),
    '{"private":true}\n',
  )
})
