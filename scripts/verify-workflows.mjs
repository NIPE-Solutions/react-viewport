// The release contract deliberately accepts only plain mappings and scalar step
// commands. YAML aliases, duplicate keys and unsupported executable extensions
// fail closed instead of bypassing checks through textual matches.
function releaseFields(source) {
  const fields = new Map()
  const stack = []
  const indices = new Map()
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue
    const match = /^( *)(- )?([A-Za-z][\w-]*):(?: (.*))?$/.exec(line.trimEnd())
    if (!match) throw new Error('Unsupported release workflow syntax')
    let indent = match[1].length
    if (indent % 2) throw new Error('Invalid workflow indentation')
    while (stack.length && stack.at(-1).indent >= indent) stack.pop()
    if (indent !== (stack.length ? stack.at(-1).indent + 2 : 0))
      throw new Error('Invalid workflow nesting')
    let parent = stack.at(-1)?.path
    if (match[2]) {
      if (parent !== 'jobs.stage.steps') throw new Error('Only release steps may be lists')
      const index = indices.get(parent) ?? 0
      indices.set(parent, index + 1)
      parent = `${parent}[${index}]`
      stack.push({ indent, path: parent })
      indent += 2
    }
    const path = parent ? `${parent}.${match[3]}` : match[3]
    if (fields.has(path)) throw new Error(`Duplicate workflow key: ${path}`)
    const value = match[4] ?? null
    if (value !== null && /(^|\s)[&*][\w-]+/.test(value))
      throw new Error('Workflow aliases are not allowed')
    fields.set(path, value)
    if (value === null) stack.push({ indent, path })
  }
  return fields
}

export function validateReleaseWorkflow(source) {
  let fields
  try {
    fields = releaseFields(source)
  } catch (error) {
    return [error.message]
  }
  const expected = new Map(
    Object.entries({
      name: 'Stage stable package',
      on: null,
      'on.workflow_dispatch': null,
      env: null,
      'env.NPM_CONFIG_USERCONFIG': '/dev/null',
      concurrency: null,
      'concurrency.group': 'npm-stage-react-viewport-stable',
      'concurrency.cancel-in-progress': 'false',
      permissions: null,
      'permissions.contents': 'read',
      jobs: null,
      'jobs.stage': null,
      'jobs.stage.if': "github.ref == 'refs/heads/main'",
      'jobs.stage.environment': 'npm',
      'jobs.stage.runs-on': 'ubuntu-latest',
      'jobs.stage.timeout-minutes': '60',
      'jobs.stage.permissions': null,
      'jobs.stage.permissions.contents': 'read',
      'jobs.stage.permissions.id-token': 'write',
      'jobs.stage.steps': null,
    }),
  )
  const steps = [
    {
      uses: 'actions/checkout@v7',
      with: { ref: '${{ github.sha }}', 'fetch-depth': '0', 'persist-credentials': 'false' },
    },
    {
      uses: 'actions/setup-node@v7',
      with: {
        'node-version': '24',
        'registry-url': 'https://registry.npmjs.org',
        'package-manager-cache': 'false',
      },
    },
    { run: 'npm install --global npm@11.19.0' },
    { run: 'npm ci' },
    { run: 'npm run check' },
    { run: 'npx playwright install --with-deps chromium firefox webkit' },
    { run: 'npm run test:e2e' },
    { run: 'npm run test:website:e2e' },
    { run: 'node scripts/verify-release.mjs --ensure-unpublished' },
    { run: 'node scripts/verify-release.mjs --verify-current-main' },
    { run: 'node scripts/pack-artifact.mjs' },
    {
      run: 'REACT_VIEWPORT_PACKAGE_TARBALL=./artifacts/nipe-solutions-react-viewport-1.0.0.tgz npm run test:package',
    },
    { run: 'node scripts/pack-artifact.mjs --verify-retained' },
    {
      uses: 'actions/upload-artifact@v7',
      with: {
        name: 'npm-react-viewport-1.0.0-${{ github.sha }}',
        path: 'artifacts/',
        'if-no-files-found': 'error',
        'retention-days': '7',
      },
    },
    { run: 'node scripts/pack-artifact.mjs --verify-retained' },
    { run: 'node scripts/verify-release.mjs --ensure-unpublished' },
    { run: 'node scripts/verify-release.mjs --verify-current-main' },
    {
      run: 'npm stage publish ./artifacts/nipe-solutions-react-viewport-1.0.0.tgz --ignore-scripts --provenance --access public --tag latest',
    },
  ]
  for (const [index, step] of steps.entries()) {
    const path = `jobs.stage.steps[${index}]`
    for (const [key, value] of Object.entries(step)) {
      if (key === 'with') {
        expected.set(`${path}.with`, null)
        for (const [option, setting] of Object.entries(value))
          expected.set(`${path}.with.${option}`, setting)
      } else expected.set(`${path}.${key}`, value)
    }
  }
  const issues = []
  for (const [path, value] of expected) {
    if (!fields.has(path) || fields.get(path) !== value)
      issues.push(`Release workflow policy mismatch: ${path}`)
  }
  for (const path of fields.keys())
    if (!expected.has(path)) issues.push(`Unapproved release workflow field: ${path}`)
  return issues
}
