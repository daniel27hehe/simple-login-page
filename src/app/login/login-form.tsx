'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Lock, Mail, Eye, EyeOff, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().default(false).optional(),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [lockoutMsg, setLockoutMsg] = useState('')

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  async function onSubmit(data: LoginValues) {
    setIsLoading(true)
    setLockoutMsg('')
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email.toLowerCase(),
        password: data.password,
      })

      if (error) {
        if (error.message.includes('rate limit')) {
          setLockoutMsg('Too many attempts. Please wait before trying again.')
        } else {
          toast.error(error.message)
        }
        return
      }

      toast.success('Successfully logged in')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm bg-white/90">
      <CardHeader className="space-y-3 pb-6 text-center pt-8">
        <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-2">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Welcome back</CardTitle>
        <CardDescription className="text-gray-500">
          Sign in to continue to AppName.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lockoutMsg && (
          <div className="mb-6 rounded-md bg-red-50/80 p-4 border border-red-200 backdrop-blur-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{lockoutMsg}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2 text-left">
            <Label htmlFor="email" className="text-sm font-semibold text-[#1A1A1A]">Email address</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="andidaniel73x@gmail.com"
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                {...form.register('email')}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="password" className="text-sm font-semibold text-[#1A1A1A]">Password</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                {...form.register('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" {...form.register('remember')} />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600"
              >
                Remember me
              </label>
            </div>
            <Link href="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

      </CardContent>
      <CardFooter className="flex justify-center pb-8 border-t border-gray-100 pt-6 mt-2">
        <p className="text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
