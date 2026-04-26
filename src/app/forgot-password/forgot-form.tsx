'use client'

import { useState } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotValues = z.infer<typeof forgotSchema>

export function ForgotForm() {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: ForgotValues) {
    setIsLoading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("If that email exists, we've sent a reset link.")
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm bg-white/90 pb-4">
      <CardHeader className="space-y-3 pb-6 pt-10 text-center">
        <div className="mx-auto w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center text-indigo-600 mb-2">
          <RefreshCw className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Forgot your password?</CardTitle>
        <CardDescription className="text-gray-500 max-w-xs mx-auto">
          Enter your email and we'll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2 text-left">
            <Label htmlFor="email" className="text-sm font-semibold text-[#1A1A1A]">Email Address</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                {...form.register('email')}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20 transition-all mt-4" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center pt-2">
        <Link href="/login" className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  )
}
