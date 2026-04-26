import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'
import { PageTransition } from '@/components/page-transition'

export const metadata = {
  title: 'Login — AppName',
}

export default async function LoginPage() {
  const isEnvMissing = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Only initialize supabase if env is present to prevent crashes
  let user = null
  if (!isEnvMissing) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF]">
      {isEnvMissing && (
        <div className="absolute top-0 left-0 w-full bg-red-600 text-white p-4 text-center z-50 font-bold shadow-lg">
          <p className="text-lg">🚨 DATABASE NOT CONNECTED! 🚨</p>
          <p className="text-sm mt-1">Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.</p>
          <p className="text-sm">Please add them in your Vercel Project Settings &gt; Environment Variables, then REDEPLOY the app.</p>
        </div>
      )}
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#E0E7FF] blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#C7D2FE] blur-[100px] opacity-60"></div>
      
      <div className="w-full max-w-md z-10 relative">
        <PageTransition>
          <LoginForm />
        </PageTransition>
      </div>
    </main>
  )
}
