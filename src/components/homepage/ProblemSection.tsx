import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

// CSS styles for the laptop animation (UPDATED: fixes screen clipping + keyboard alignment)
const laptopStyles = `
.laptop-container,
.laptop-container * {
  box-sizing: border-box;
}

.laptop-container {
  position: relative;
  width: 700px;
  height: 520px;
  margin-top: 60px;
}

.laptop-container .monitor {
  position: absolute;
  border: 8px solid #2a2a35;
  border-radius: 16px 16px 0 0;
  height: 380px;
  background: #0a0a0f;
  left: 0;
  right: 0;
  top: 0;
  transform: perspective(1400px) rotateX(-89deg);
  transform-origin: bottom center;
  transition: transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
}

.laptop-container.opened .monitor {
  transform: perspective(1400px) rotateX(4deg) translateY(-5px);
}

.laptop-container .monitor-body {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 12px solid #1a1a22;
  background: #0a0a0f;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  /* IMPORTANT: allow nested flex children to shrink so overflow-y-auto works */
  min-height: 0;
}

.laptop-container .monitor-content {
  opacity: 0;
  transition: opacity 0.5s ease-out 0.8s;

  flex: 1;
  display: flex;
  flex-direction: column;

  /* IMPORTANT: allow the email list to scroll instead of clipping */
  min-height: 0;

  /* Keep rounded corners clean while inner panels scroll */
  overflow: hidden;
}

.laptop-container.opened .monitor-content {
  opacity: 1;
}

/* Optional: a little breathing room so last item never feels "cut off" */
.laptop-container .monitor-content .overflow-y-auto {
  padding-bottom: 8px;
}

.laptop-container .bottom-part {
  position: absolute;
  border: 6px solid #1a1a22;
  border-radius: 0 0 16px 16px;
  height: 160px;
  background: #2a2a35;
  left: 0;
  right: 0;
  bottom: 0;
  transform: perspective(1400px) rotateX(70deg);
  transform-origin: top center;

  /* Needed so the keyboard can be absolutely inset */
  box-sizing: border-box;
}

.laptop-container .keyboard {
  /* UPDATED: align keyboard to base using inset instead of margins */
  position: absolute;
  left: 16px;
  right: 16px;
  top: 14px;
  bottom: 14px;

  margin: 0; /* remove old margins */
  padding: 16px 20px;
  background: #1a1a22;
  border-radius: 10px;

  display: grid;
  grid-template-columns: repeat(14, 1fr);
  gap: 6px;

  /* tiny lift helps it feel flush with the base plane */
  transform: translateZ(1px);
}

.laptop-container .key {
  height: 24px;
  background: #0a0a0f;
  border-radius: 4px;
}

.laptop-container .key.space {
  grid-column: span 6;
}

.laptop-container .camera-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 20px;
  background: #1a1a22;
  border-radius: 0 0 12px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.laptop-container .camera-dot {
  width: 8px;
  height: 8px;
  background: #2a2a35;
  border-radius: 50%;
}
`;

const ProblemSection: React.FC = () => {
    const [activeEmail, setActiveEmail] = useState(0);
    const [pauseAutoPlay, setPauseAutoPlay] = useState(false);
    const [isOpened, setIsOpened] = useState(false);

    const laptopRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(laptopRef, { once: true, amount: 0.25 });

    useEffect(() => {
        if (isInView) {
            const timer = setTimeout(() => setIsOpened(true), 200);
            return () => clearTimeout(timer);
        }
    }, [isInView]);

    const rejectionLetters = [
        {
            company: "Recruiter DM",
            subject: "Final loop feedback",
            body:
                "Hi Evan — panel agreed your systems answer was strong, but when they pressed you on trade-offs the stories drifted. Let's revisit if timelines align later in Q1.",
            tag: "Needs polish",
        },
        {
            company: "Series B Startup",
            subject: "Debrief",
            body:
                'Hey Jordan, loved chatting. The resume absolutely hits. The stories just stayed in "safe" territory — we were hoping for one bold decision where you carried risk.',
            tag: "Too safe",
        },
        {
            company: "Big Tech Final",
            subject: "Decision",
            body:
                "Hi Ben, no question you know the work. Once the VP pushed for specifics the structure got wobbly and the confidence dipped. Moving forward with another candidate.",
            tag: "Confidence dip",
        },
    ];

    useEffect(() => {
        if (pauseAutoPlay) {
            const resumeTimer = setTimeout(() => setPauseAutoPlay(false), 6000);
            return () => clearTimeout(resumeTimer);
        }
    }, [pauseAutoPlay]);

    useEffect(() => {
        if (pauseAutoPlay) return;
        const interval = setInterval(() => {
            setActiveEmail((prev) => (prev + 1) % rejectionLetters.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [pauseAutoPlay, rejectionLetters.length]);

    const activeLetter = rejectionLetters[activeEmail];

    return (
        <section className="py-20 lg:py-28 bg-[#030305] relative overflow-hidden">
            {/* Inject laptop styles */}
            <style>{laptopStyles}</style>

            {/* Subtle background elements */}
            <div className="absolute inset-0 grid-pattern opacity-30" />
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px]" />

            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="grid lg:grid-cols-[1fr,1.3fr] gap-8 items-start">
                    {/* Left: Copy */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        viewport={{ once: true }}
                        className="space-y-6 pt-12"
                    >
                        <span className="inline-block text-xs uppercase tracking-[0.3em] text-red-400">
                            Sound familiar?
                        </span>
                        <h2 className="text-4xl lg:text-5xl font-semibold text-white leading-tight">
                            This is what rejection{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                                actually sounds like.
                            </span>
                        </h2>
                        <p className="text-lg text-gray-400 leading-relaxed max-w-md">
                            "Good interview, just not a fit." But what does that even mean? The
                            feedback is vague, the patterns are invisible, and you're left guessing
                            what to fix.
                        </p>
                        <p className="text-lg text-gray-400 leading-relaxed max-w-md">
                            Kelv shows you the signals recruiters actually notice—so you can stop
                            guessing and start improving.
                        </p>
                    </motion.div>

                    {/* Right: CSS Laptop */}
                    <div ref={laptopRef} className="flex justify-center lg:justify-end">
                        <div className={`laptop-container ${isOpened ? "opened" : ""}`}>
                            {/* Monitor/Screen */}
                            <div className="monitor">
                                <div className="monitor-body">
                                    {/* Camera notch */}
                                    <div className="camera-notch">
                                        <div className="camera-dot" />
                                    </div>

                                    {/* Screen content */}
                                    <div className="monitor-content">
                                        {/* Browser chrome */}
                                        <div className="flex items-center gap-3 px-5 py-3.5 bg-[#151520] border-b border-white/5">
                                            <div className="flex gap-2">
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f57]" />
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#febc2e]" />
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#28c840]" />
                                            </div>
                                            <div className="flex-1 mx-8">
                                                <div className="bg-[#0a0a0f] rounded-lg px-5 py-2 text-sm text-gray-500 text-center max-w-[220px] mx-auto">
                                                    kelvai.com
                                                </div>
                                            </div>
                                        </div>

                                        {/* Email tabs */}
                                        <div className="flex items-center gap-5 px-5 py-3 border-b border-white/5">
                                            <span className="text-sm text-white font-semibold">Inbox</span>
                                            <span className="text-sm text-red-400">Rejected</span>
                                            <span className="text-sm text-gray-500">Follow-ups</span>
                                        </div>

                                        {/* Email content */}
                                        <div className="flex flex-1 min-h-0">
                                            {/* Email list */}
                                            <div className="w-[42%] border-r border-white/5 p-3 space-y-2 overflow-y-auto">
                                                {rejectionLetters.map((letter, index) => {
                                                    const isActive = activeEmail === index;
                                                    return (
                                                        <button
                                                            key={letter.subject}
                                                            onClick={() => {
                                                                setActiveEmail(index);
                                                                setPauseAutoPlay(true);
                                                            }}
                                                            className={`w-full text-left rounded-xl p-3.5 transition-all ${isActive
                                                                    ? "bg-red-500/15 border border-red-500/30"
                                                                    : "bg-white/5 border border-transparent hover:border-white/10"
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-1.5">
                                                                <span className="text-[11px] text-gray-500">
                                                                    {letter.company}
                                                                </span>
                                                                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                                                                    {letter.tag}
                                                                </span>
                                                            </div>
                                                            <p className="text-[13px] font-medium text-white">
                                                                {letter.subject}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Email detail */}
                                            <div className="flex-1 p-5">
                                                <p className="text-xs text-gray-500 mb-1">{activeLetter.company}</p>
                                                <p className="text-base font-semibold text-white mb-4">
                                                    {activeLetter.subject}
                                                </p>
                                                <p className="text-sm text-gray-400 leading-relaxed mb-5">
                                                    "{activeLetter.body}"
                                                </p>
                                                <div className="flex gap-2 flex-wrap">
                                                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">
                                                        Voice dropped
                                                    </span>
                                                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                                                        No structure
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Keyboard base - no trackpad */}
                            <div className="bottom-part">
                                <div className="keyboard">
                                    {/* Keyboard rows */}
                                    {[...Array(5)].map((_, row) => (
                                        <React.Fragment key={row}>
                                            {row === 4 ? (
                                                // Spacebar row
                                                <>
                                                    <div className="key" />
                                                    <div className="key" />
                                                    <div className="key" />
                                                    <div className="key space" />
                                                    <div className="key" />
                                                    <div className="key" />
                                                    <div className="key" />
                                                    <div className="key" />
                                                </>
                                            ) : (
                                                [...Array(14)].map((_, col) => (
                                                    <div key={`${row}-${col}`} className="key" />
                                                ))
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProblemSection;
