import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Money Tracker' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <header className="mb-8 flex items-center justify-between">
            <Link to="/" className="text-xl font-semibold tracking-tight">
              💰 Money Tracker
            </Link>
            <nav className="flex gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200">
              <NavLink to="/">Dashboard</NavLink>
              <NavLink to="/entries">Entries</NavLink>
            </nav>
          </header>
          <main>{children}</main>
        </div>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function NavLink({
  to,
  children,
}: {
  to: '/' | '/entries'
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === '/' }}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      activeProps={{
        className:
          'rounded-md px-3 py-1.5 text-sm font-medium bg-slate-900 text-white',
      }}
    >
      {children}
    </Link>
  )
}
