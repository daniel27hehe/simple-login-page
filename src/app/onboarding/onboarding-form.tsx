'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Phone, CheckCircle2, XCircle, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const reservedWords = ['admin', 'root', 'superuser', 'system', 'support']

const onboardingSchema = z.object({
  username: z.string()
    .min(3, 'Min 3 characters')
    .max(20, 'Max 20 characters')
    .regex(/^[a-z0-9_.]+$/, 'Lowercase, numbers, underscore, dot only')
    .regex(/^[^0-9_.]/, 'Cannot start with number, underscore, or dot')
    .regex(/^(?!.*\.\.)(?!.*__)/, 'No consecutive dots or underscores')
    .refine(val => !reservedWords.includes(val.toLowerCase()), 'Reserved word'),
  phone: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Must be valid E.164 format (e.g. +62812...)'),
})

type OnboardingValues = z.infer<typeof onboardingSchema>

export function OnboardingForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: { username: '', phone: '+62' },
  })

  const watchUsername = form.watch('username')
  const watchPhone = form.watch('phone') || '+62'
  const countryMatch = watchPhone.match(/^\+(62|1|44|61|81|65|60)/)
  const countryCode = countryMatch ? countryMatch[0] : '+62'
  const localNumber = watchPhone.startsWith(countryCode) ? watchPhone.slice(countryCode.length) : watchPhone.replace(/^\+\d*/, '')

  const supabase = createClient()

  useEffect(() => {
    if (!watchUsername || watchUsername.length < 3 || form.formState.errors.username) {
      setUsernameStatus('idle')
      return
    }

    const checkUsername = async () => {
      setUsernameStatus('checking')
      const { data, error } = await supabase.from('profiles').select('id').eq('username', watchUsername).single()
      if (data) {
        setUsernameStatus('taken')
        form.setError('username', { type: 'manual', message: 'Username is taken' })
      } else {
        setUsernameStatus('available')
        if (form.formState.errors.username?.type === 'manual') form.clearErrors('username')
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [watchUsername, form, supabase])

  async function onSubmit(data: OnboardingValues) {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upsert profile data
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: data.username,
        phone: data.phone,
        full_name: user.user_metadata?.full_name || 'User',
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url,
        updated_at: new Date().toISOString()
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Profile completed successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm bg-white/90 pb-4">
      <CardHeader className="space-y-3 pb-6 pt-10 text-center">
        <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-2">
          <Sparkles className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Almost there!</CardTitle>
        <CardDescription className="text-gray-500 max-w-[280px] mx-auto">
          Please complete your profile to access your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2 text-left">
            <Label htmlFor="username" className="text-sm font-semibold text-[#1A1A1A]">Username</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 font-medium">@</span>
              </div>
              <Input
                id="username"
                placeholder="danielsigma27"
                className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                {...form.register('username')}
              />
              {usernameStatus === 'checking' && <div className="absolute right-3 top-3 w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />}
              {usernameStatus === 'available' && <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
              {usernameStatus === 'taken' && <XCircle className="absolute right-3 top-2.5 h-5 w-5 text-red-500" />}
            </div>
            {form.formState.errors.username && <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>}
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="phone" className="text-sm font-semibold text-[#1A1A1A]">Phone Number</Label>
            <div className="flex space-x-2">
              <Select value={countryCode} onValueChange={(val) => {
                form.setValue('phone', `${val}${localNumber}`, { shouldValidate: true })
              }}>
                <SelectTrigger className="w-[100px] h-11 bg-gray-50/50 border-gray-200 focus:bg-white">
                  <SelectValue placeholder="+62" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+62">🇮🇩 +62</SelectItem>
                  <SelectItem value="+1">🇺🇸 +1</SelectItem>
                  <SelectItem value="+44">🇬🇧 +44</SelectItem>
                  <SelectItem value="+61">🇦🇺 +61</SelectItem>
                  <SelectItem value="+81">🇯🇵 +81</SelectItem>
                  <SelectItem value="+65">🇸🇬 +65</SelectItem>
                  <SelectItem value="+60">🇲🇾 +60</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="812345678" 
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors" 
                  value={localNumber}
                  onChange={(e) => {
                    const numericVal = e.target.value.replace(/\D/g, '')
                    form.setValue('phone', `${countryCode}${numericVal}`, { shouldValidate: true })
                  }}
                  onBlur={() => form.trigger('phone')}
                />
              </div>
            </div>
            {form.formState.errors.phone && <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>}
          </div>

          <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20 transition-all mt-6" disabled={isLoading || Object.keys(form.formState.errors).length > 0}>
            {isLoading ? 'Saving...' : 'Complete Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
