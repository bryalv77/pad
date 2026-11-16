import { lazy, Suspense, useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Home from '@/pages/home'

const PadPage = lazy(() => import('@/pages/pad'))

const SITE_TITLE = 'Pad — simple shared notepad'

/** Pad pages hold user content, so keep them out of search results and title them usefully. */
function DocumentMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const isPad = pathname !== '/'
    document.title = isPad ? `${decodeURIComponent(pathname.slice(1))} · Pad` : SITE_TITLE

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = isPad ? 'noindex, nofollow' : 'index, follow'
  }, [pathname])

  return null
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <BrowserRouter>
          <DocumentMeta />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/:id" element={<PadPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
