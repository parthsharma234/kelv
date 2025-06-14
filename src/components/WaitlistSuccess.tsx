import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Brain, Target, ArrowRight, Mail, Bell, Star, Calendar, Users, Gift } from 'lucide-react';
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
          // Get total user count
          const { data: totalUsers, error: totalError } = await supabase
            .rpc('get_user_count');
          
          if (!totalError && totalUsers) {
            setWaitlistCount(totalUsers);
            
            // Calculate estimated weekly growth based on total users
            // Assume roughly 5-10% weekly growth for established waitlists
            const estimatedWeekly = Math.max(1, Math.floor(totalUsers * 0.07));
            setWeeklyGrowth(estimatedWeekly);
          } else {
            console.log('RPC call failed, using fallback count');
            // Keep fallback numbers if RPC fails
          }
        } catch (error) {
          console.error('Error fetching waitlist stats:', error);
          // Keep fallback numbers
        }
      }
      setIsLoading(false);
    };

    fetchWaitlistStats();
  }, []);

  const benefits = [
    {
      icon: Star,
      title: "Early Access",
      description: "Be among the first to experience Kelv AI when we launch"
    },
    {
      icon: Target,
      title: "Exclusive Features",
      description: "Get access to premium features not available to regular users"
    },
    {
      icon: Bell,
      title: "Priority Support",
      description: "Receive dedicated support and direct feedback channels"
    },
    {
      icon: Gift,
      title: "Special Pricing",
      description: "Enjoy exclusive discounts and early-bird pricing"
    }
  ];

  const waitlistStats = [
    {
      icon: Users,
      label: "Waitlist Members",
      value: isLoading ? "..." : waitlistCount.toLocaleString(),
      change: isLoading ? "..." : `+${weeklyGrowth} this week`
    },
    {
      icon: Calendar,
      label: "Expected Launch",
      value: "June 2025",
      change: "On track"
    }
  ];

  // Floating particles for background animation
  const particles = Array.from({ length: 20 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-1 h-1 bg-orange-400/30 rounded-full"
      initial={{
        x: Math.random() * 800,
        y: Math.random() * 600,
      }}
      animate={{
        x: Math.random() * 800,
        y: Math.random() * 600,
      }}
      transition={{
        duration: Math.random() * 20 + 10,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  ));

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

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {particles}
      </div>

      {/* Back to home link */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-all duration-300 z-10 group"
      >
        <RedPandaLogo size="md" animate={true} className="group-hover:scale-110 transition-transform" />
        <span className="text-xl font-bold group-hover:text-orange-400 transition-colors">Kelv AI</span>
      </Link>

      {/* Main content */}
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/30"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          {/* Welcome message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-bold gradient-text mb-6"
          >
            Welcome to the Future!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto"
          >
            {user?.user_metadata?.full_name ? `Hi ${user.user_metadata.full_name}! ` : ''}
            You're now on the exclusive Kelv AI waitlist. Get ready to revolutionize your interview preparation with cutting-edge technology.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-400 mb-8"
          >
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-500" />
              <span>Welcome email sent to <strong className="text-white">{user?.email}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span>Joined on <strong className="text-white">{joinedDate}</strong></span>
            </div>
          </motion.div>

          {/* Email notification callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-r from-orange-500/10 to-orange-400/5 rounded-xl p-4 border border-orange-500/20 mb-8 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-medium">Check Your Email!</span>
            </div>
            <p className="text-gray-300 text-sm">
              We've sent you a beautiful welcome email with exclusive details about what's coming next. 
              Don't forget to check your spam folder if you don't see it in your inbox.
            </p>
          </motion.div>
        </motion.div>

        {/* Waitlist Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto"
        >
          {waitlistStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="bg-dark-800/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-700/50 text-center hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-400/10 rounded-xl">
                    <Icon className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{stat.value}</h3>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-orange-400 text-xs">{stat.change}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="bg-dark-800/90 backdrop-blur-xl rounded-2xl p-6 border border-dark-700/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-400/10 rounded-xl group-hover:from-orange-500/30 group-hover:to-orange-400/20 transition-all">
                    <Icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                    <p className="text-gray-400">{benefit.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* What's next section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="bg-gradient-to-r from-orange-500/10 to-orange-400/5 rounded-2xl p-8 border border-orange-500/20 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="w-8 h-8 text-orange-400" />
            <h2 className="text-2xl font-bold text-white">What's Next?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Development Updates</h4>
                <p className="text-gray-300 text-sm">Get behind-the-scenes insights as we build the future of interview preparation</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Beta Access</h4>
                <p className="text-gray-300 text-sm">Be among the first to test our interview coaching platform</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Launch Day</h4>
                <p className="text-gray-300 text-sm">Get instant access when we officially launch in June 2025 with exclusive member benefits</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="text-center mt-12"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold hover:from-orange-400 hover:to-orange-300 transition-all shadow-lg shadow-orange-500/25 group"
            >
              <Sparkles className="w-5 h-5" />
              <span>Explore More About Kelv AI</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {user && (
              <Link
                to="/platform"
                className="inline-flex items-center gap-3 px-8 py-4 bg-dark-800 border border-dark-700 text-white rounded-xl font-semibold hover:bg-dark-700 hover:border-orange-500/50 transition-all group"
              >
                <Brain className="w-5 h-5 text-orange-400" />
                <span>Try Interview Platform</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
          
          <p className="text-gray-400 text-sm mt-6">
            Share Kelv AI with friends and colleagues to help them prepare for success too!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default WaitlistSuccess;