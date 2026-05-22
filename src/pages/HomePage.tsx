import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, TrendingUp, Users, Award, Zap, BookOpen, Mic, Edit, Headphones, Target, Star } from 'lucide-react';
import { motion } from 'motion/react';

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Master PTE with AI-Powered Learning
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Get your desired PTE score with personalized practice, instant AI feedback, and comprehensive mock tests
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg font-semibold hover:shadow-2xl transition-all transform hover:scale-105">
                Start Free Trial
                <ArrowRight className="inline-block ml-2 h-5 w-5" />
              </Link>
              <Link to="/pricing" className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-800 transition-all">
                See Pricing
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
          >
            {[
              { icon: Users, value: '50,000+', label: 'Students' },
              { icon: Award, value: '95%', label: 'Success Rate' },
              { icon: Target, value: '10,000+', label: 'Practice Questions' },
              { icon: Star, value: '4.9/5', label: 'Rating' }
            ].map((stat, index) => (
              <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">Why Choose PTE Master?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 text-center mb-16">Everything you need to ace your PTE exam</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Mic,
                title: 'AI Speaking Evaluation',
                description: 'Get instant feedback on pronunciation, fluency, and content with advanced AI analysis'
              },
              {
                icon: Edit,
                title: 'Smart Writing Feedback',
                description: 'Grammar correction, vocabulary suggestions, and automated scoring for essays'
              },
              {
                icon: BookOpen,
                title: 'Comprehensive Practice',
                description: '10,000+ practice questions covering all PTE modules and question types'
              },
              {
                icon: Headphones,
                title: 'Realistic Mock Tests',
                description: 'Full-length practice exams that simulate actual PTE test conditions'
              },
              {
                icon: TrendingUp,
                title: 'Progress Analytics',
                description: 'Track your improvement with detailed analytics and performance insights'
              },
              {
                icon: Zap,
                title: 'Personalized Learning',
                description: 'AI-powered recommendations based on your strengths and weaknesses'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 text-center mb-16">Flexible pricing for every learner</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Basic',
                price: '₹999',
                period: '/month',
                features: ['5 Mock Tests', 'Basic Practice Questions', 'Performance Analytics', 'Email Support'],
                popular: false
              },
              {
                name: 'Premium',
                price: '₹1,999',
                period: '/month',
                features: ['Unlimited Mock Tests', 'All Practice Questions', 'AI Evaluation', 'Advanced Analytics', 'Priority Support', 'Study Materials'],
                popular: true
              },
              {
                name: 'Pro',
                price: '₹2,999',
                period: '/month',
                features: ['Everything in Premium', 'Live Classes', '1-on-1 Coaching', 'Guaranteed Score Improvement', 'Lifetime Access', 'Certificate'],
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 rounded-2xl ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white transform scale-105'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? 'text-gray-200' : 'text-gray-600 dark:text-gray-400'}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className={`h-5 w-5 ${plan.popular ? 'text-white' : 'text-green-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`block text-center px-6 py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:shadow-xl'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl'
                  }`}
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Student Success Stories</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Priya Sharma',
                score: '90/90',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
                text: 'PTE Master helped me achieve my target score in just 2 months! The AI feedback was incredibly accurate.'
              },
              {
                name: 'Rahul Verma',
                score: '88/90',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
                text: 'The mock tests were exactly like the real exam. I felt completely prepared on test day!'
              },
              {
                name: 'Anjali Patel',
                score: '85/90',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali',
                text: 'Best PTE preparation platform! The speaking practice with AI evaluation improved my score by 20 points.'
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img src={testimonial.image} alt={testimonial.name} className="h-12 w-12 rounded-full" />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-blue-600 font-semibold">Score: {testimonial.score}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400">{testimonial.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Achieve Your Dream Score?</h2>
          <p className="text-xl mb-8">Join thousands of successful students today</p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Start Your Free Trial
            <ArrowRight className="inline-block ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
