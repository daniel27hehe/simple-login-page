'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const resetSchema = z.object({
  password: z.string()
    .min(12, 'Min 12 characters')
    .max(128, 'Max 128 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetValues = z.infer<typeof resetSchema>

export function ResetForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' })
  
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' },
  })

  const watchPassword = form.watch('password')

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

  async function onSubmit(data: ResetValues) {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Password updated successfully')
      router.push('/login')
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm bg-white/90 pb-4">
      <CardHeader className="space-y-3 pb-6 pt-10 text-center">
        <div className="mx-auto w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white mb-2 shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Set a new password</CardTitle>
        <CardDescription className="text-gray-500 max-w-[280px] mx-auto">
          Your new password must be different from your previous password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2 text-left">
            <Label htmlFor="password" className="text-sm font-semibold text-[#1A1A1A]">New Password</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                {...form.register('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
              </button>
            </div>
            
            {watchPassword.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>{passwordStrength.text}</span>
                </div>
                <div className="flex space-x-1 h-1.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 rounded-full ${i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'}`} />
                  ))}
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className={`flex items-center ${watchPassword.length >= 12 ? 'text-green-600' : 'text-gray-500'}`}>
                    {watchPassword.length >= 12 ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <div className="w-4 h-4 rounded-full border border-gray-300 mr-2" />}
                    At least 12 characters
                  </div>
                  <div className={`flex items-center ${/[0-9]/.test(watchPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    {/[0-9]/.test(watchPassword) ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <div className="w-4 h-4 rounded-full border border-gray-300 mr-2" />}
                    Contains a number
                  </div>
                  <div className={`flex items-center ${/[^A-Za-z0-9]/.test(watchPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    {/[^A-Za-z0-9]/.test(watchPassword) ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <div className="w-4 h-4 rounded-full border border-gray-300 mr-2" />}
                    Contains a special character
                  </div>
                </div>
              </div>
            )}
            {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#1A1A1A]">Confirm New Password</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                {...form.register('confirmPassword')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/20 transition-all mt-6" disabled={isLoading || Object.keys(form.formState.errors).length > 0}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
