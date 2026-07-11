import { useState } from 'react'
import { ChevronDown, Mail, BookOpen } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const faqs = [
  {
    q: 'How does InkSight grade essays?',
    a: 'You define a rubric with required concepts and point values in Rubric Builder. When you upload student essays and run them through Processing Queue, an AI model reads each essay against your rubric and returns a score, missing concepts, and written feedback.',
  },
  {
    q: 'What happens if the primary AI engine fails?',
    a: 'InkSight automatically retries with a backup AI engine if the primary one times out or hits a rate limit, so grading keeps working without you needing to do anything.',
  },
  {
    q: 'Are student names sent to the AI?',
    a: 'No. Only the essay content and your rubric are sent to the AI for grading. Student names stay in your account and are only shown to you in the app interface.',
  },
  {
    q: 'Can I upload handwritten essays?',
    a: 'Yes. In Ingestion Hub, switch to "Upload Photos" and add clear photos of handwritten essays. The AI can read images directly alongside typed CSV submissions.',
  },
  {
    q: 'Why did a submission fail to grade?',
    a: 'This can happen if an essay photo is unclear, if there\'s a temporary issue with both AI engines, or if the file format isn\'t supported. Check Processing Queue for the status, and try re-uploading if needed.',
  },
  {
    q: 'Can I see results for a specific class section only?',
    a: 'Yes. Analytics Dashboard has a Section filter that lets you narrow results down to a specific section instead of viewing the whole class at once.',
  },
]

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between text-left py-4 gap-4">
        <span className="text-sm font-medium text-gray-800">{faq.q}</span>
        <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-gray-500 pb-4 pr-6 leading-relaxed">{faq.a}</p>}
    </div>
  )
}

export default function HelpSupport() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader eyebrow="Support" title="Help & Support" subtitle="Answers to common questions and ways to reach us." />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-display text-base font-semibold text-gray-900 mb-2">Frequently Asked Questions</h2>
        <div>
          {faqs.map((faq) => <FaqItem key={faq.q} faq={faq} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3.5">
          <div className="bg-ink-cream text-ink-maroon rounded-xl p-2.5 shrink-0">
            <Mail size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Email Support</p>
            <p className="text-xs text-gray-500 mt-1">Have a question we didn't cover? Reach out directly.</p>
            <a href="mailto:maryanngumafelix08@gmail.com" className="text-xs text-ink-maroon font-semibold hover:underline mt-2 inline-block">
              maryanngumafelix08@gmail.com
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3.5">
          <div className="bg-ink-cream text-ink-maroon rounded-xl p-2.5 shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Getting Started Guide</p>
            <p className="text-xs text-gray-500 mt-1">New to InkSight? Learn the full workflow step by step.</p>
            <span className="text-xs text-gray-400 mt-2 inline-block">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}