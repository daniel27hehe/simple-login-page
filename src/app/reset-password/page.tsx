import { Metadata } from 'next'
import { ResetForm } from './reset-form'

export const metadata: Metadata = {
  title: 'Set New Password — AppName',
  description: 'Set a new password for your account',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#E0E7FF] blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#C7D2FE] blur-[100px] opacity-60"></div>
      
      <div className="w-full max-w-md z-10 relative">
        <ResetForm />
      </div>
    </main>
  )
}
