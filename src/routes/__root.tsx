import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Menu } from 'lucide-react'
import { useState } from 'react'

import { BottomSheet } from '../components/BottomSheet'
import { ThemedSonner } from '../components/ThemedSonner'
import { ThemeProvider } from '../components/ThemeProvider'
import { ThemeToggle } from '../components/ThemeToggle'
import { ToastProvider } from '../components/ToastProvider'
import appCss from '../styles.css?url'

// Reads the saved theme + system preference and sets the dark class on <html>
// before React hydrates, preventing a light/dark flash on first paint.
const noFlashScript = `(function(){try{var t=localStorage.getItem('jejak-uang.theme')||localStorage.getItem('money-tracker.theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Jejak Uang' },
    ],
    links: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'stylesheet', href: appCss },
    ],
    scripts: [{ children: noFlashScript }],
  }),
  shellComponent: RootDocument,
})

type NavPath = '/' | '/entries' | '/import' | '/accounts'

const NAV: { to: NavPath; label: string }[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/entries', label: 'Entries' },
  { to: '/import', label: 'Import' },
  { to: '/accounts', label: 'Accounts' },
]

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <ThemedSonner />
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </ThemeProvider>
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

function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      {/* Wide-screen: fixed vertical sidebar on the left */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white lg:px-4 lg:py-6 dark:lg:border-slate-800 dark:lg:bg-slate-900">
        <div className="flex items-center justify-between gap-2 px-1">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight"
          >
            💰 Jejak Uang
          </Link>
          <ThemeToggle />
        </div>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <SideNavLink key={item.to} to={item.to}>
              {item.label}
            </SideNavLink>
          ))}
        </nav>
      </aside>

      {/* Small-screen: top bar with hamburger */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5 lg:hidden dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="text-base font-semibold tracking-tight">
          💰 Jejak Uang
        </Link>
        <ThemeToggle />
      </header>

      {/* Main content — offset by the sidebar on wide screens */}
      <div className="lg:pl-60">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>

      {/* Small-screen: bottom-sheet navigation */}
      <BottomSheet
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Navigate"
      >
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <SideNavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileNavOpen(false)}
            >
              {item.label}
            </SideNavLink>
          ))}
        </nav>
      </BottomSheet>
    </>
  )
}

function SideNavLink({
  to,
  children,
  onClick,
}: {
  to: NavPath
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === '/' }}
      onClick={onClick}
      // Inactive: subtle bg highlight on hover, text colour stays put — this
      // is the fix for the light-mode bug where hovering the active link made
      // the title invisible (active had bg-slate-900 + text-white, base had
      // hover:text-slate-900, so on hover text became slate-900 on slate-900).
      className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      activeProps={{
        className:
          'block rounded-md px-3 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600',
      }}
    >
      {children}
    </Link>
  )
}
