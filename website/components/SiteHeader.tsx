import Link from 'next/link'

const navigation = [
  { href: '/', label: 'Overview' },
  { href: '/examples', label: 'Examples' },
  { href: '/lab', label: 'Device Lab' },
  { href: '/concepts', label: 'Concepts' },
  { href: '/api', label: 'API' },
  { href: '/browser-behavior', label: 'Browser behavior' },
  { href: '/project', label: 'Project' },
] as const

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-frame site-header__inner">
        <Link className="site-identity" href="/" aria-label="React Viewport home">
          <span className="site-identity__mark" aria-hidden="true">
            <i />
          </span>
          <span>
            <strong>React Viewport</strong>
            <small>NIPE Open Source</small>
          </span>
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
