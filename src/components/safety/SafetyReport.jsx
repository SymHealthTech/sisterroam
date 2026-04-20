'use client'

import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

const reportTypes = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'safety_concern', label: 'Safety Concern' },
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'scam', label: 'Scam' },
  { value: 'other', label: 'Other' },
]

export default function SafetyReportForm({ reportedUserId }) {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  async function onSubmit(data) {
    const res = await fetch('/api/safety/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, reportedUser: reportedUserId }),
    })
    if (!res.ok) { toast.error('Report failed. Please try again.'); return }
    toast.success('Report submitted. Our team will review it promptly.')
    router.back()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Report type"
        options={reportTypes}
        error={errors.type?.message}
        {...register('type', { required: 'Please select a type' })}
      />
      <Textarea
        label="Describe what happened"
        placeholder="Please provide as much detail as possible..."
        rows={6}
        error={errors.description?.message}
        {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Please provide more detail' } })}
      />
      <Button type="submit" size="full" variant="danger" isLoading={isSubmitting}>
        Submit Report
      </Button>
    </form>
  )
}
