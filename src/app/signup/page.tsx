import { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SignupForm } from './signup-form'
import { PageTransition } from '@/components/page-transition'

export const metadata: Metadata = {
  title: 'Sign Up — AppName',
  description: 'Create a new account',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SignupPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF]">
      {/* Decorative background elements */}
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#E0E7FF] blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#C7D2FE] blur-[100px] opacity-60"></div>
      
      <div className="w-full max-w-lg z-10 relative my-8">
        <PageTransition>
          <SignupForm />
        </PageTransition>
      </div>
    </main>
  )
}
