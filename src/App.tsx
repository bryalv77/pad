import { ThemeProvider } from 'next-themes'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Home from '@/pages/home'
import PadPage from '@/pages/pad'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:id" element={<PadPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
