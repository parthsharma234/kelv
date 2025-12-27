import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Brain, ArrowRight, Mail, Calendar, Users, Star, Bell, Gift, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import RedPandaLogo from './RedPandaLogo';

const WaitlistSuccess: React.FC = () => {
  const { user } = useAuth();
  const [waitlistCount, setWaitlistCount] = useState<number>(2847); // Fallback number
  const [weeklyGrowth, setWeeklyGrowth] = useState<number>(156); // Fallback number
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWaitlistStats = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data: totalUsers, error: totalError } = await supabase
            .rpc('get_user_count');

          if (!totalError && totalUsers) {
            setWaitlistCount(totalUsers);
            const estimatedWeekly = Math.max(1, Math.floor(totalUsers * 0.07));
            setWeeklyGrowth(estimatedWeekly);
          }
        } catch (error) {
          console.error('Error fetching waitlist stats:', error);
        }
      }
      setIsLoading(false);
    };

    fetchWaitlistStats();
  }, []);

  const joinedDate = user?.user_metadata?.waitlist_joined_at
    ? new Date(user.user_metadata.waitlist_joined_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Recently';

  const benefits = [
    {
      icon: Star,
      title: 'Early access',
      description: 'Get the product before the public launch and help shape it.'
    },
    {
      icon: Target,
      title: 'Role packs',
      description: 'Role-specific drills and interviewer patterns as they ship.'
    },
    {
      icon: Bell,
      title: 'Priority updates',
      description: 'Cohort invitations and product notes delivered directly.'
    },
    {
      icon: Gift,
      title: 'Founders pricing',
      description: 'Launch pricing and perks reserved for the waitlist.'
    }
  ];

  const waitlistStats = [
    {
      icon: Users,
      label: 'Waitlist members',
      value: isLoading ? '...' : waitlistCount.toLocaleString(),
      change: isLoading ? '...' : `+${weeklyGrowth} this week`
    },
    {
      icon: Calendar,
      label: 'Beta launch',
      value: 'January, 2026',
      change: 'Cohorts open in waves'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030305] text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 stripe-gradient-mesh opacity-40" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-[-10%] right-[-5%] w-[520px] h-[520px] bg-orange-500/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[520px] h-[520px] bg-orange-400/10 rounded-full blur-[160px]" />

      <div className="relative z-10">
        <header className="flex items-center justify-between px-6 lg:px-16 py-6">
          <Link to="/" className="flex items-center gap-3">
            <RedPandaLogo size="md" animate={true} />
            <span className="text-xl font-semibold tracking-tight text-white">Kelv AI</span>
          </Link>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
          >
            Back to home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <main className="max-w-6xl mx-auto px-6 lg:px-12 pb-16">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-gray-400">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Waitlist confirmed
              </div>

              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-semibold text-white">You're on the list.</h1>
                  <p className="text-gray-400 text-lg mt-2">
                    {user?.user_metadata?.full_name ? `Hi ${user.user_metadata.full_name}, ` : ''}
                    your spot is secured. We'll invite cohorts in waves so the experience stays personal.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  Joined on <span className="text-white font-semibold">{joinedDate}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                  <Users className="h-4 w-4 text-orange-400" />
                  Community growing weekly
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0b0b11]/80 p-7">
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="h-6 w-6 text-orange-400" />
                  <h2 className="text-xl font-semibold text-white">What happens next</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      title: 'Build notes',
                      description: 'Short monthly updates with what shipped and what is next.'
                    },
                    {
                      title: 'Invite window',
                      description: 'We open cohorts in waves for a focused onboarding.'
                    },
                    {
                      title: 'Beta access',
                      description: 'Hands-on access plus feedback channels with the team.'
                    }
                  ].map((step, index) => (
                    <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-orange-300/80">Step {index + 1}</p>
                      <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 text-sm text-gray-400">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-3xl border border-white/10 bg-[#0b0b11]/90 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Your status</h2>
              <div className="space-y-4">
                {waitlistStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{stat.label}</p>
                          <p className="text-2xl font-semibold text-white">{stat.value}</p>
                        </div>
                      </div>
                      <div className="text-xs text-orange-300/90">{stat.change}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Cohort readiness</p>
                <div className="mt-4 h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[35%] bg-gradient-to-r from-orange-500 to-orange-300" />
                </div>
                <p className="mt-3 text-xs text-gray-400">We are prepping onboarding flow and interview packs.</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start"
          >
            <div className="rounded-3xl border border-white/10 bg-[#0b0b11]/80 p-7">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Included with your invite</p>
              <div className="mt-6 space-y-5">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.title} className="flex items-start gap-4">
                      <div className="h-9 w-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-orange-400" />
                      </div>
                      <div className="flex-1 border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                        <p className="text-base font-semibold text-white">{benefit.title}</p>
                        <p className="mt-1 text-sm text-gray-400">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <p className="text-sm text-gray-400">Ready when your invite lands</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Keep the momentum going.</h3>
              <p className="mt-3 text-sm text-gray-400">
                Explore the product story or jump back into the platform if you are already set up.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center justify-between gap-3 px-6 py-3 rounded-full bg-orange-500 text-white font-semibold shadow-lg shadow-orange-500/25 hover:bg-orange-400 transition"
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Explore Kelv AI
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {user && (
                  <Link
                    to="/platform"
                    className="inline-flex items-center justify-between gap-3 px-6 py-3 rounded-full border border-white/10 bg-white/5 text-white font-semibold hover:border-white/20 transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Brain className="h-4 w-4 text-orange-400" />
                      Try Interview Platform
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          <div className="mt-10 text-center text-sm text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4 text-orange-400" />
              <span>Questions? Reach us at</span>
              <a
                href="mailto:team@kelvai.com"
                className="text-orange-300 hover:text-orange-200 transition-colors font-medium"
              >
                team@kelvai.com
              </a>
            </div>
            <p className="mt-2 text-xs text-gray-500">(c) 2026 Kelv AI. All rights reserved.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WaitlistSuccess;
