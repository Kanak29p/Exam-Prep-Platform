import { CheckCircle, Zap, Crown, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const plans = [
  {
    name: 'Free',
    icon: Zap,
    price: '₹0',
    period: '/forever',
    description: 'Perfect for trying out PTE Master',
    features: [
      '5 Mock Tests',
      'Limited Practice Questions',
      'Basic Analytics',
      'Email Support',
      'Community Access',
    ],
    notIncluded: ['AI Evaluation', 'Advanced Analytics', 'Study Materials'],
    color: 'gray',
    popular: false,
  },
  {
    name: 'Basic',
    icon: Zap,
    price: '₹999',
    period: '/month',
    description: 'Great for beginners',
    features: [
      '10 Mock Tests',
      '500+ Practice Questions',
      'Performance Analytics',
      'AI Evaluation (Limited)',
      'Email Support',
      'Study Materials',
    ],
    notIncluded: ['Unlimited Tests', 'Live Classes'],
    color: 'blue',
    popular: false,
  },
  {
    name: 'Premium',
    icon: Crown,
    price: '₹1,999',
    period: '/month',
    description: 'Most popular choice',
    features: [
      'Unlimited Mock Tests',
      '10,000+ Practice Questions',
      'Advanced AI Evaluation',
      'Detailed Analytics',
      'Priority Support',
      'All Study Materials',
      'Progress Tracking',
      'Performance Insights',
    ],
    notIncluded: [],
    color: 'purple',
    popular: true,
  },
  {
    name: 'Pro',
    icon: Rocket,
    price: '₹2,999',
    period: '/month',
    description: 'For serious aspirants',
    features: [
      'Everything in Premium',
      'Live Classes (2/week)',
      '1-on-1 Coaching',
      'Guaranteed Score Improvement',
      'Lifetime Access',
      'Certificate of Completion',
      'Personalized Study Plan',
      'Dedicated Support',
    ],
    notIncluded: [],
    color: 'gradient',
    popular: false,
  },
];

export function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Select the perfect plan for your PTE preparation journey. All plans include a 7-day free trial.
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                plan.popular
                  ? 'transform lg:scale-110 shadow-2xl z-10'
                  : 'shadow-lg hover:scale-105 hover:lg:scale-110 hover:shadow-2xl hover:z-10'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div
                className={`p-8 h-full ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
                style={plan.popular ? { paddingTop: '3rem' } : {}}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  plan.popular ? 'bg-white/20' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                }`}>
                  <plan.icon className={`h-6 w-6 ${plan.popular ? 'text-white' : 'text-white'}`} />
                </div>

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}>
                    {plan.period}
                  </span>
                </div>

                <Link
                  to="/signup"
                  className={`block w-full text-center px-6 py-3 rounded-lg font-semibold mb-6 transition-all ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:shadow-xl'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl'
                  }`}
                >
                  Get Started
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        plan.popular ? 'text-white' : 'text-green-500'
                      }`} />
                      <span className={`text-sm ${plan.popular ? 'text-white/90' : ''}`}>{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 opacity-50">
                      <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        plan.popular ? 'text-white' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm line-through ${plan.popular ? 'text-white/70' : 'text-gray-400'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-16">
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Feature Comparison</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold">Free</th>
                    <th className="px-6 py-4 text-center font-semibold">Basic</th>
                    <th className="px-6 py-4 text-center font-semibold bg-blue-50 dark:bg-blue-900/20">Premium</th>
                    <th className="px-6 py-4 text-center font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[
                    { feature: 'Mock Tests', values: ['5', '10', 'Unlimited', 'Unlimited'] },
                    { feature: 'Practice Questions', values: ['Limited', '500+', '10,000+', '10,000+'] },
                    { feature: 'AI Evaluation', values: ['✗', 'Limited', '✓', '✓'] },
                    { feature: 'Advanced Analytics', values: ['✗', '✗', '✓', '✓'] },
                    { feature: 'Study Materials', values: ['✗', '✓', '✓', '✓'] },
                    { feature: 'Live Classes', values: ['✗', '✗', '✗', '✓'] },
                    { feature: '1-on-1 Coaching', values: ['✗', '✗', '✗', '✓'] },
                    { feature: 'Priority Support', values: ['✗', '✗', '✓', '✓'] },
                  ].map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-medium">{row.feature}</td>
                      {row.values.map((value, i) => (
                        <td key={i} className={`px-6 py-4 text-center ${i === 2 ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                          {value === '✓' ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                          ) : value === '✗' ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <span>{value}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {[
              {
                q: 'Can I switch plans later?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets through Razorpay.',
              },
              {
                q: 'Is there a refund policy?',
                a: 'Yes, we offer a 7-day money-back guarantee if you are not satisfied with our platform.',
              },
              {
                q: 'Do you offer student discounts?',
                a: 'Yes! Students with a valid .edu email get 20% off on all annual plans.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
