import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, Shield, ShieldCheck, Mail, User as UserIcon, Phone, Calendar, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Dashboard — AppName',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const provider = user.app_metadata?.provider || 'email'
  
  // If OAuth user is missing username or phone, redirect to onboarding
  if (provider === 'google' && (!profile?.username || !profile?.phone)) {
    redirect('/onboarding')
  }

  const fullName = profile?.full_name || user.user_metadata?.full_name || 'User'
  const email = user.email || ''
  const username = profile?.username || user.user_metadata?.username || 'Not set'
  const phone = profile?.phone || user.user_metadata?.phone || 'Not set'
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const initial = fullName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] text-[#1A1A1A] flex flex-col">
      {/* Top Navbar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">AppName</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center text-sm font-medium text-gray-700">
              <span className="mr-3">{email}</span>
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200">
                {initial}
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 pt-12">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl flex items-center justify-center sm:justify-start">
            Hi, {fullName} <span className="ml-3 text-4xl">👋</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 font-medium max-w-2xl">
            You're securely logged into your dashboard. Ready to manage your security settings?
          </p>
        </div>

        {/* Welcome Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl shadow-indigo-900/5 border border-white/60 overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-4">
              <UserIcon className="w-5 h-5 mr-2 text-indigo-500" />
              Account Details
            </h3>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <UserIcon className="w-4 h-4 mr-1.5 text-gray-400" /> Full Name
                </dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{fullName}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="w-4 h-4 mr-1.5 text-gray-400" /> Email Address
                </dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{email}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <span className="text-gray-400 font-bold mr-1.5 ml-0.5">@</span> Username
                </dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{username}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="w-4 h-4 mr-1.5 text-gray-400" /> Phone Number
                </dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{phone}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Key className="w-4 h-4 mr-1.5 text-gray-400" /> Auth Provider
                </dt>
                <dd className="mt-1 text-base font-semibold text-gray-900 capitalize flex items-center">
                  {provider === 'google' ? (
                    <><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Google OAuth</>
                  ) : (
                    <><span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span> Email Password</>
                  )}
                </dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-gray-400" /> Member Since
                </dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{memberSince}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  )
}
