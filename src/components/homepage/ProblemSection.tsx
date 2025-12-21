import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProblemSection: React.FC = () => {
    const [activeEmail, setActiveEmail] = useState(0);
    const [pauseAutoPlay, setPauseAutoPlay] = useState(false);

    const rejectionLetters = [
        {
            company: "Recruiter DM",
            subject: "Final loop feedback",
            preview: "Panel loved your systems answer, delivery felt rehearsed...",
            body: "Hi Evan — panel agreed your systems answer was strong, but when they pressed you on trade-offs the stories drifted. Let’s revisit if timelines align later in Q1.\n\n— Maya, Talent @ Fluxion",
            status: "Follow up requested",
            timestamp: "10:14 AM",
            tag: "Needs polish",
            insights: ["Voice dipped during follow-up", "Closer lacked numbers"]
        },
        {
            company: "Hiring Manager - Series B Startup",
            subject: "Debrief",
            preview: "Great resume, but the examples stayed safe...",
            body: "Hey Jordan,\n\nLoved chatting. The resume absolutely hits. The stories just stayed in \"safe\" territory—we were hoping for one bold decision where you carried risk. Keep me posted.\n\n— Priya, Head of Eng",
            status: "Paused",
            timestamp: "8:52 AM",
            tag: "Too safe",
            insights: ["Energy faded mid-answer", "No risk/reward proof"]
        },
        {
            company: "Big Tech Final Round",
            subject: "Decision",
            preview: "You clearly know the work, confidence just didn't land...",
            body: "Hi Ben,\n\nNo question you know the work. Once the VP pushed for specifics the structure got wobbly and the confidence dipped. We’re moving forward with another candidate but happy to revisit later this year.\n\n— Google Staffing",
            status: "Regret",
            timestamp: "Yesterday",
            tag: "Confidence dip",
            insights: ["Monotone under pressure", "Story drifted"]
        },
        {
            company: "Referral Follow up",
            subject: "Quick update",
            preview: "Let's revisit once you've had more live practice...",
            body: "Hi Zoe — thanks for hopping on. Referral team suggests we give it ~6 months so you can log more live practice. Ping me as soon as you’ve got a few mock loops under your belt.\n\n— Marcus",
            status: "Circle back",
            timestamp: "Monday",
            tag: "More reps",
            insights: ["Filler spikes", "Rushed ending"]
        }
    ];

    const userQuotes = [
        "You're qualified. You know your stuff. But interviews make you freeze.",
        "You practice with friends, but they're too nice. You need real feedback."
    ];

    const totalLetters = rejectionLetters.length;

    useEffect(() => {
        if (pauseAutoPlay) {
            const resumeTimer = setTimeout(() => setPauseAutoPlay(false), 6000);
            return () => clearTimeout(resumeTimer);
        }
    }, [pauseAutoPlay]);

    useEffect(() => {
        if (pauseAutoPlay) return;
        const interval = setInterval(() => {
            setActiveEmail(prev => (prev + 1) % totalLetters);
        }, 4500);
        return () => clearInterval(interval);
    }, [pauseAutoPlay, totalLetters]);

    const activeLetter = rejectionLetters[activeEmail];

    return (
        <section className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-dark-900 via-dark-900 to-black">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,133,64,0.18),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,94,31,0.12),transparent_60%)]" />
                {[...Array(24)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-px h-16 bg-white/5"
                        style={{
                            left: `${i * 4}%`,
                            top: `${(i % 3) * 30}%`,
                        }}
                        animate={{
                            opacity: [0, 0.4, 0],
                            scaleY: [0.8, 1.1, 0.9],
                            y: [0, 12, 0],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            delay: i * 0.15,
                        }}
                    />
                ))}
            </div>

            <div className="mx-auto px-4 relative z-10 max-w-[120rem]">
                <div className="grid gap-12 2xl:grid-cols-[1.2fr,1.4fr] lg:grid-cols-[1.1fr,1.2fr] items-start">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 bg-dark-800/80 border border-dark-700/70 rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] text-gray-400 ml-auto">
                            <span>Inbox reality</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight ml-auto text-right">
                            Interviews shouldn't feel like roulette.
                        </h2>
                        <div className="max-w-[28rem] ml-auto space-y-4 text-right">
                            {userQuotes.map((quote, index) => (
                                <p key={index} className="text-lg text-gray-400 font-light">
                                    {quote}
                                </p>
                            ))}
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="bg-dark-800/60 border border-dark-700/80 rounded-2xl p-5 space-y-3 ml-auto max-w-md"
                        >
                            <p className="text-sm text-gray-400 leading-relaxed">
                                These rejection blurbs are real. Candidates forward them to us minutes after they land so Kelv can mimic
                                the manager, the follow-ups, and the tone that actually shows up in your inbox.
                            </p>
                            <p className="text-xs text-gray-500">
                                We scrub names when needed, but the language is untouched. Consider this the “before” snapshot of the folks already inside the waitlist.
                            </p>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        viewport={{ once: true }}
                    >
                        <div className="relative max-w-[1600px] w-full mx-auto">
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-6 w-28 rounded-full bg-dark-800/70 blur" />
                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 h-3 w-12 rounded-full bg-dark-700" />
                            <div className="bg-dark-800/70 border border-dark-700 rounded-[40px] p-8 shadow-[0_0_60px_rgba(249,115,22,0.25)]">
                                <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-[0.4em] mb-4">
                                    <span>Inbox · Reality check</span>
                                    <span>{activeLetter.timestamp}</span>
                                </div>
                                <div className="bg-black/30 border border-dark-700 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 text-xs text-gray-500 uppercase tracking-[0.4em]">
                                    <span>Primary</span>
                                    <span className="text-orange-300">Rejected</span>
                                    <span>Follow-ups</span>
                                    <span>Later</span>
                                </div>
                                <div className="flex flex-col xl:flex-row gap-6">
                                    <div className="xl:w-5/12 2xl:w-4/12 space-y-3">
                                        {rejectionLetters.map((letter, index) => {
                                            const isActive = activeEmail === index;
                                            return (
                                                <motion.button
                                                    key={letter.subject}
                                                    type="button"
                                                    layout
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    transition={{ layout: { duration: 0.25, ease: 'easeOut' } }}
                                                    onMouseEnter={() => setPauseAutoPlay(true)}
                                                    onFocus={() => setPauseAutoPlay(true)}
                                                    onClick={() => {
                                                        setActiveEmail(index);
                                                        setPauseAutoPlay(true);
                                                    }}
                                                    className={`w-full text-left rounded-2xl border px-5 py-4 transition-all duration-300 ${isActive ? 'border-orange-500/70 bg-orange-500/15 shadow-lg shadow-orange-500/20' : 'border-dark-700/70 bg-dark-900/60 hover:border-orange-500/40'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-gray-500">
                                                        <span>{letter.company}</span>
                                                        <span className="text-orange-400">{letter.tag}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${isActive ? 'bg-orange-500/20 text-orange-300' : 'bg-dark-700 text-gray-400'}`}>
                                                            {letter.company.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm text-white">{letter.subject}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{letter.preview}</p>
                                                        </div>
                                                        <div className="text-[10px] text-gray-500">{letter.timestamp}</div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex-1 xl:w-7/12 2xl:w-8/12 bg-dark-900/80 border border-dark-700/70 rounded-2xl p-6 md:p-8 backdrop-blur relative overflow-hidden">
                                        <div className="absolute inset-0 pointer-events-none">
                                            {[...Array(12)].map((_, i) => (
                                                <motion.div
                                                    key={`scan-${i}`}
                                                    className="absolute w-32 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
                                                    style={{
                                                        top: `${(i / 12) * 100}%`,
                                                        left: `${(i % 2) * 40}%`
                                                    }}
                                                    animate={{
                                                        opacity: [0, 0.8, 0],
                                                        x: [0, 30, 0]
                                                    }}
                                                    transition={{
                                                        duration: 4 + i * 0.2,
                                                        repeat: Infinity,
                                                        delay: i * 0.1
                                                    }}
                                                />
                                            ))}
                                            {[...Array(25)].map((_, i) => (
                                                <motion.div
                                                    key={`spark-${i}`}
                                                    className="absolute w-1 h-1 rounded-full bg-orange-500/30"
                                                    style={{
                                                        left: `${(i * 17) % 100}%`,
                                                        top: `${(i * 29) % 100}%`
                                                    }}
                                                    animate={{
                                                        opacity: [0, 0.7, 0],
                                                        scale: [0.5, 1.2, 0.5]
                                                    }}
                                                    transition={{
                                                        duration: 3 + (i % 5) * 0.3,
                                                        repeat: Infinity,
                                                        delay: i * 0.12
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeLetter.subject}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.25 }}
                                                className="relative"
                                            >
                                                <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wide mb-2">
                                                    <span>{activeLetter.company}</span>
                                                    <span>{activeLetter.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">{activeLetter.subject}</p>
                                                <p className="text-2xl text-white font-semibold mt-4 leading-snug">
                                                    "{activeLetter.body}"
                                                </p>
                                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="bg-dark-800/80 rounded-xl p-4 border border-dark-700/60">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Signal</p>
                                                        <p className="text-white text-lg font-semibold">{activeLetter.company === "Recruiter DM" ? "Energy" : activeLetter.company === "Hiring Manager - Series B Startup" ? "Story arc" : activeLetter.company === "Big Tech Final Round" ? "Structure" : "Cadence"}</p>
                                                        <p className="text-gray-400 text-sm">
                                                            {activeLetter.company === "Recruiter DM"
                                                                ? "Energy slipped when the hiring manager pushed for specifics."
                                                                : activeLetter.company === "Hiring Manager - Series B Startup"
                                                                    ? "Story arc stayed linear; no risk or conflict before the win."
                                                                    : activeLetter.company === "Big Tech Final Round"
                                                                        ? "Structure unraveled once VP interrupts came in rapid fire."
                                                                        : "Cadence jumped up and down as soon as the third follow-up hit."}
                                                        </p>
                                                    </div>
                                                    <div className="bg-dark-800/80 rounded-xl p-4 border border-dark-700/60">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Next rep</p>
                                                        <p className="text-white text-lg font-semibold">
                                                            {activeLetter.company === "Recruiter DM"
                                                                ? "Interrupt drill"
                                                                : activeLetter.company === "Hiring Manager - Series B Startup"
                                                                    ? "Risk/reward closer"
                                                                    : activeLetter.company === "Big Tech Final Round"
                                                                        ? "VP gauntlet"
                                                                        : "Cadence reset"}
                                                        </p>
                                                        <p className="text-gray-400 text-sm">
                                                            {activeLetter.company === "Recruiter DM"
                                                                ? "Kelv runs you through timed interruptions until the hand-off sounds confident."
                                                                : activeLetter.company === "Hiring Manager - Series B Startup"
                                                                    ? "We rebuild the ending with the bold decision, the stake, and the metric."
                                                                    : activeLetter.company === "Big Tech Final Round"
                                                                        ? "Kelv chains three VP-style digs so you practice staying structured under heat."
                                                                        : "We practice breathing + cadence resets before you answer the third follow-up."}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 flex flex-wrap gap-2">
                                                    {activeLetter.insights.map((insight, index) => (
                                                        <span
                                                            key={index}
                                                            className="text-xs text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full"
                                                        >
                                                            {insight}
                                                        </span>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                            <div className="h-6 rounded-b-[32px] bg-dark-700/80 border border-dark-700 border-t-0" />
                            <div className="w-32 h-2 rounded-full bg-dark-700/70 mx-auto mt-3" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ProblemSection;
