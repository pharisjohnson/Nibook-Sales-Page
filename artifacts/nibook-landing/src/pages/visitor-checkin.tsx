import { useState, useEffect } from 'react'
import { useSearch } from 'wouter'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'

const STEPS = ['name', 'contact', 'host', 'purpose', 'consent', 'confirm'] as const
type Step = typeof STEPS[number]

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? ''

async function checkInVisitor(data: {
  full_name: string
  email: string
  phone: string
  company: string
  host_id: string
  purpose: string
  consent_marketing: boolean
  consent_data_sharing: boolean
}): Promise<{ badgeNumber: string }> {
  const res = await fetch(`${BASE_URL}/api/visitors/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Check-in failed')
  }
  return res.json()
}

export default function VisitorCheckIn() {
  const search = useSearch()
  const params = new URLSearchParams(search)
  const token = params.get('token')

  const [step, setStep] = useState<Step>('name')
  const [hosts, setHosts] = useState<Array<{ id: string; business_name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    host_id: '',
    purpose: '',
    consent_marketing: false,
    consent_data_sharing: false,
  })
  const [result, setResult] = useState<{ badgeNumber: string; hostName: string } | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, business_name')
      .not('business_name', 'is', null)
      .then(({ data }) => {
        if (data) setHosts(data as Array<{ id: string; business_name: string }>)
      })

    if (token) {
      supabase
        .from('appointments')
        .select('*')
        .eq('pre_reg_token', token)
        .single()
        .then(({ data }) => {
          if (data) {
            setFormData(prev => ({
              ...prev,
              full_name: (data as Record<string, string>).visitor_name ?? prev.full_name,
              email: (data as Record<string, string>).visitor_email ?? prev.email,
              phone: (data as Record<string, string>).visitor_phone ?? prev.phone,
              host_id: (data as Record<string, string>).host_id ?? prev.host_id,
            }))
          }
        })
    }
  }, [token])

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const currentStepIndex = STEPS.indexOf(step)

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1])
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1])
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { badgeNumber } = await checkInVisitor(formData)
      const host = hosts.find(h => h.id === formData.host_id)
      setResult({
        badgeNumber,
        hostName: host?.business_name ?? 'your host',
      })
      setStep('confirm')
    } catch (error) {
      console.error(error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white text-center">What's your name?</h2>
            <Input
              value={formData.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              placeholder="Full Name"
              className="h-16 text-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              autoFocus
            />
            <Button
              onClick={handleNext}
              disabled={!formData.full_name}
              className="w-full h-16 text-xl bg-blue-500 hover:bg-blue-600"
            >
              Continue <ArrowRight className="ml-2" />
            </Button>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white text-center">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-white text-lg mb-2 block">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="email@example.com"
                  className="h-16 text-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <Label className="text-white text-lg mb-2 block">Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="h-16 text-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <Label className="text-white text-lg mb-2 block">Company (Optional)</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Your Company"
                  className="h-16 text-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 h-16 text-xl border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!formData.email}
                className="flex-1 h-16 text-xl bg-blue-500 hover:bg-blue-600"
              >
                Continue <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'host':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white text-center">Who are you visiting?</h2>
            <Select value={formData.host_id} onValueChange={(value) => updateField('host_id', value)}>
              <SelectTrigger className="h-16 text-xl bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select a host" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20">
                {hosts.map((host) => (
                  <SelectItem
                    key={host.id}
                    value={host.id}
                    className="text-white text-lg focus:bg-white/10 focus:text-white"
                  >
                    {host.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 h-16 text-xl border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!formData.host_id}
                className="flex-1 h-16 text-xl bg-blue-500 hover:bg-blue-600"
              >
                Continue <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'purpose':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white text-center">Purpose of Visit</h2>
            <Select value={formData.purpose} onValueChange={(value) => updateField('purpose', value)}>
              <SelectTrigger className="h-16 text-xl bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20">
                <SelectItem value="meeting" className="text-white text-lg">Business Meeting</SelectItem>
                <SelectItem value="interview" className="text-white text-lg">Interview</SelectItem>
                <SelectItem value="delivery" className="text-white text-lg">Delivery</SelectItem>
                <SelectItem value="maintenance" className="text-white text-lg">Maintenance</SelectItem>
                <SelectItem value="personal" className="text-white text-lg">Personal Visit</SelectItem>
                <SelectItem value="other" className="text-white text-lg">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 h-16 text-xl border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!formData.purpose}
                className="flex-1 h-16 text-xl bg-blue-500 hover:bg-blue-600"
              >
                Continue <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'consent':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white text-center">Consent</h2>
            <p className="text-slate-300 text-center text-lg">Please review and select your preferences</p>
            <div className="space-y-4 bg-white/5 p-6 rounded-xl">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={formData.consent_marketing}
                  onCheckedChange={(checked) => updateField('consent_marketing', checked === true)}
                  className="mt-1 border-white/40 data-[state=checked]:bg-blue-500"
                />
                <Label htmlFor="marketing" className="text-white text-lg leading-relaxed cursor-pointer">
                  I consent to receive marketing communications (optional)
                </Label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="data_sharing"
                  checked={formData.consent_data_sharing}
                  onCheckedChange={(checked) => updateField('consent_data_sharing', checked === true)}
                  className="mt-1 border-white/40 data-[state=checked]:bg-blue-500"
                />
                <Label htmlFor="data_sharing" className="text-white text-lg leading-relaxed cursor-pointer">
                  I consent to sharing my data with relevant parties (optional)
                </Label>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 h-16 text-xl border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-16 text-xl bg-green-500 hover:bg-green-600"
              >
                {loading ? (
                  <><Loader2 className="mr-2 animate-spin" /> Checking in...</>
                ) : (
                  <>Complete Check-In <Check className="ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-6 text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Welcome!</h2>
            {result && (
              <>
                <p className="text-slate-300 text-xl">
                  You're checked in to see <span className="text-white font-semibold">{result.hostName}</span>.
                </p>
                <div className="bg-white/10 rounded-xl p-6">
                  <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Your Badge Number</p>
                  <p className="text-5xl font-bold text-white">{result.badgeNumber}</p>
                </div>
              </>
            )}
            <p className="text-slate-400">Please wait to be greeted. Thank you!</p>
          </div>
        )
    }
  }

  const stepLabels = ['Name', 'Contact', 'Host', 'Purpose', 'Consent', 'Done']
  const visibleSteps = STEPS.slice(0, -1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {step !== 'confirm' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {visibleSteps.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      i < currentStepIndex
                        ? 'bg-green-500 text-white'
                        : i === currentStepIndex
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {i < currentStepIndex ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < visibleSteps.length - 1 && (
                    <div
                      className={`h-0.5 w-8 mx-1 transition-colors ${
                        i < currentStepIndex ? 'bg-green-500' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-center text-sm">
              Step {currentStepIndex + 1} of {visibleSteps.length} — {stepLabels[currentStepIndex]}
            </p>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
