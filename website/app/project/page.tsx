import type { Metadata } from 'next'

import { site } from '../../content/docs'

export const metadata: Metadata = {
  title: 'Project',
  description: 'Contributing, security reporting, and real-device QA policy.',
  alternates: { canonical: '/project' },
}

const repositoryDocument = (path: string) => `${site.repository}/blob/main/${path}`

export default function ProjectPage() {
  return (
    <main id="main-content" tabIndex={-1} className="docs-main">
      <header className="docs-hero site-frame">
        <h1>Project</h1>
        <p>Repository policy is part of the product evidence, not an afterthought.</p>
      </header>
      <article className="site-frame prose browser-prose">
        <section aria-labelledby="source-title">
          <h2 id="source-title">Source and releases</h2>
          <p>
            Browse the <a href={site.repository}>GitHub repository</a>, follow shipped changes in
            the <a href={site.changelog}>changelog</a>, and review the terms in the{' '}
            <a href={site.license}>MIT license</a>.
          </p>
        </section>
        <section aria-labelledby="contributing-title">
          <h2 id="contributing-title">Contributing</h2>
          <p>
            Start with the repository setup, focused tests, and required quality commands in the{' '}
            <a href={repositoryDocument('CONTRIBUTING.md')}>contributing guide</a>. Changes to
            browser behavior need deterministic evidence and an updated browser note when
            appropriate.
          </p>
        </section>
        <section aria-labelledby="security-title">
          <h2 id="security-title">Security</h2>
          <p>
            Report vulnerabilities through the private path documented in the{' '}
            <a href={site.security}>security policy</a>. Do not disclose vulnerability details in a
            public issue.
          </p>
        </section>
        <section aria-labelledby="qa-title">
          <h2 id="qa-title">Real-device QA</h2>
          <p>
            Desktop fixtures are not physical-device results. The{' '}
            <a href={repositoryDocument('docs/REAL_DEVICE_QA.md')}>real-device QA matrix</a> keeps
            iPhone, iPad, Android, installed PWA, WebView, and external-keyboard work marked manual
            pending until a person records exact device evidence.
          </p>
        </section>
      </article>
    </main>
  )
}
