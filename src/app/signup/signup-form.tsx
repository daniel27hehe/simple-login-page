'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import { Lock, Mail, Eye, EyeOff, User, Phone, CheckCircle2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const reservedWords = ['admin', 'root', 'superuser', 'system', 'support']

const signupSchema = z.object({
  fullName: z.string()
    .min(2, 'Must be at least 2 characters')
    .max(50, 'Max 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Letters, spaces, hyphens, and apostrophes only'),
  username: z.string()
    .min(3, 'Min 3 characters')
    .max(20, 'Max 20 characters')
    .regex(/^[a-z0-9_.]+$/, 'Lowercase, numbers, underscore, dot only')
    .regex(/^[^0-9_.]/, 'Cannot start with number, underscore, or dot')
    .regex(/^(?!.*\.\.)(?!.*__)/, 'No consecutive dots or underscores')
    .refine(val => !reservedWords.includes(val.toLowerCase()), 'Reserved word'),
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Max 254 characters'),
  phone: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Must be valid E.164 format (e.g. +62812...)'),
  password: z.string()
    .min(12, 'Min 12 characters')
    .max(128, 'Max 128 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
  honeypot: z.string().max(0, 'Bots not allowed').optional(), // honeypot
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.password.toLowerCase() !== data.email.toLowerCase() && data.password.toLowerCase() !== data.username.toLowerCase(), {
  message: "Password cannot match email or username",
  path: ["password"],
})

type SignupValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Real-time states
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' })
  
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange', // Trigger validation on typing
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '+62',
      password: '',
      confirmPassword: '',
      honeypot: '',
    },
  })

  const { watch, setError, clearErrors } = form
  const watchUsername = watch('username')
  const watchEmail = watch('email')
  const watchPassword = watch('password')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Username checking
  useEffect(() => {
    if (!watchUsername || watchUsername.length < 3 || form.formState.errors.username) {
      setUsernameStatus('idle')
      return
    }

    const checkUsername = async () => {
      setUsernameStatus('checking')
      // Note: Assumes a "profiles" table exists and is readable by anon, or use Edge Function
      const { data, error } = await supabase.from('profiles').select('id').eq('username', watchUsername).single()
      if (data) {
        setUsernameStatus('taken')
        setError('username', { type: 'manual', message: 'Username is taken' })
      } else {
        setUsernameStatus('available')
        if (form.formState.errors.username?.type === 'manual') clearErrors('username')
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [watchUsername])

  // Password strength
  useEffect(() => {
    let score = 0
    if (watchPassword.length >= 12) score += 1
    if (/[A-Z]/.test(watchPassword)) score += 1
    if (/[0-9]/.test(watchPassword)) score += 1
    if (/[^A-Za-z0-9]/.test(watchPassword)) score += 1

    let text = 'Weak', color = 'bg-red-500'
    if (score === 2) { text = 'Fair'; color = 'bg-yellow-500' }
    if (score === 3) { text = 'Good'; color = 'bg-blue-500' }
    if (score === 4) { text = 'Strong'; color = 'bg-green-500' }
    
    setPasswordStrength({ score, text, color })
  }, [watchPassword])

  async function onSubmit(data: SignupValues) {
    if (data.honeypot) return // Bot caught

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email.toLowerCase(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            username: data.username,
            phone: data.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Account created! Please check your email to confirm.')
      // Optionally redirect or show success UI
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm bg-white/90">
      <CardHeader className="space-y-3 pb-6 pt-8">
        <CardTitle className="text-3xl font-bold tracking-tight text-[#1A1A1A] text-center">Create your account</CardTitle>
        <CardDescription className="text-gray-500 text-center text-base">
          Start today. No credit card required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Honeypot */}
          <input type="text" {...form.register('honeypot')} className="hidden" tabIndex={-1} autoComplete="off" />

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold text-[#1A1A1A]">Full Name</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <Input id="fullName" placeholder="John Doe" className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" {...form.register('fullName')} />
            </div>
            {form.formState.errors.fullName && <p className="text-xs text-red-500">{form.formState.errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-semibold text-[#1A1A1A]">Username</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 font-medium">@</span>
              </div>
              <Input id="username" placeholder="johndoe123" className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" {...form.register('username')} />
              {usernameStatus === 'checking' && <div className="absolute right-3 top-3 w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />}
              {usernameStatus === 'available' && <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
              {usernameStatus === 'taken' && <XCircle className="absolute right-3 top-2.5 h-5 w-5 text-red-500" />}
            </div>
            {form.formState.errors.username && <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-[#1A1A1A]">Email Address</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input id="email" type="email" placeholder="name@company.com" className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" {...form.register('email')} />
            </div>
            {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-[#1A1A1A]">Phone Number</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <Input id="phone" type="tel" placeholder="+62 812..." className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" {...form.register('phone')} />
            </div>
            {form.formState.errors.phone && <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-[#1A1A1A]">Password</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" {...form.register('password')} />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
              </button>
            </div>
            
            {watchPassword.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Password strength:</span>
                  <span className={`font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>{passwordStrength.text}</span>
                </div>
                <div className="flex space-x-1 h-1.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 rounded-full ${i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'}`} />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center ${watchPassword.length >= 12 ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> 12+ characters
                  </div>
                  <div className={`flex items-center ${/[A-Z]/.test(watchPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Uppercase letter
                  </div>
                  <div className={`flex items-center ${/[0-9]/.test(watchPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Number
                  </div>
                  <div className={`flex items-center ${/[^A-Za-z0-9]/.test(watchPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Special character
                  </div>
                </div>
              </div>
            )}
            {form.formState.errors.password && <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#1A1A1A]">Confirm Password</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" {...form.register('confirmPassword')} />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20 mt-2" disabled={isLoading || Object.keys(form.formState.errors).length > 0}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-500 font-medium">Or</span>
          </div>
        </div>

        <Button type="button" variant="outline" className="w-full h-11 bg-white border-gray-200 text-[#1A1A1A] font-medium hover:bg-gray-50" onClick={handleGoogleSignup}>
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center pb-6 border-t border-gray-100 pt-6 mt-2">
        <p className="text-sm text-gray-500 mb-4">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
        <p className="text-xs text-center text-gray-400 max-w-[280px]">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </CardFooter>
    </Card>
  )
}
