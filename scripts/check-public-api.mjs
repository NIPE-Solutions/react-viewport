import assert from 'node:assert/strict'
import console from 'node:console'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import ts from 'typescript'

const runtimeExports = ['ViewportProvider', 'useViewport', 'useViewportCssVariables']
const typeExports = [
  'KeyboardState',
  'LayoutViewport',
  'SafeAreaInsets',
  'ViewportCssVariablesOptions',
  'ViewportOrientation',
  'ViewportProviderProps',
  'ViewportState',
  'ViewportSupport',
  'VisualViewportState',
]

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptDirectory, '..')

export function collectDeclarationExports(declaration, declarationPath = 'index.d.ts') {
  const sourceFile = ts.createSourceFile(
    declarationPath,
    declaration,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const declarationExports = { runtime: [], types: [] }

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      assert.ok(
        statement.exportClause !== undefined && ts.isNamedExports(statement.exportClause),
        'The public declaration entry must use named export declarations only',
      )

      for (const element of statement.exportClause.elements) {
        const target = statement.isTypeOnly || element.isTypeOnly ? 'types' : 'runtime'
        declarationExports[target].push(element.name.text)
      }
      continue
    }

    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined
    const isInlineExport = modifiers?.some(
      (modifier) =>
        modifier.kind === ts.SyntaxKind.ExportKeyword ||
        modifier.kind === ts.SyntaxKind.DefaultKeyword,
    )

    assert.equal(
      ts.isExportAssignment(statement) ||
        ts.isNamespaceExportDeclaration(statement) ||
        isInlineExport === true,
      false,
      'The public declaration entry must use named export declarations only',
    )
  }

  declarationExports.runtime.sort()
  declarationExports.types.sort()

  return declarationExports
}

export async function checkPublicApi(root = packageRoot) {
  const declarationPath = resolve(root, 'dist/index.d.ts')
  const declaration = await readFile(declarationPath, 'utf8')
  const declarationExports = collectDeclarationExports(declaration, declarationPath)

  assert.deepEqual(declarationExports.runtime, [...runtimeExports].sort())
  assert.deepEqual(declarationExports.types, [...typeExports].sort())

  const esm = await import(pathToFileURL(resolve(root, 'dist/index.js')).href)
  const require = createRequire(import.meta.url)
  const cjs = require(resolve(root, 'dist/index.cjs'))
  const expectedRuntime = [...runtimeExports].sort()

  assert.deepEqual(Object.keys(esm).sort(), expectedRuntime)
  assert.deepEqual(Object.keys(cjs).sort(), expectedRuntime)

  return {
    runtime: declarationExports.runtime,
    types: declarationExports.types,
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const api = await checkPublicApi()
  console.log(`Public runtime exports (${api.runtime.length}): ${api.runtime.join(', ')}`)
  console.log(`Public type exports (${api.types.length}): ${api.types.join(', ')}`)
}
