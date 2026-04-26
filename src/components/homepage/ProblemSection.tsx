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
  width: 760px;
  height: 600px;
  margin-top: 50px;
}

.laptop-container .monitor {
  position: absolute;
  border: 8px solid #0d0d11;
  border-radius: 20px 20px 0 0;
  height: 460px;
  background: linear-gradient(160deg, #07070a 0%, #0a0a0f 45%, #0f0f15 100%);
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
  border: 12px solid #0a0a0f;
  background: #0a0a0f;
  border-radius: 16px;
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

  /* IMPORTANT: allow the email list to fit without clipping */
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
  border: 6px solid #0b0b0f;
  border-radius: 0 0 20px 20px;
  height: 140px;
  background: linear-gradient(180deg, #14141a 0%, #0d0d12 45%, #09090d 100%);
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
  top: 12px;
  bottom: 12px;

  margin: 0; /* remove old margins */
  padding: 12px 18px;
  background: linear-gradient(180deg, #14141c 0%, #0c0c12 100%);
  border-radius: 12px;

  display: grid;
  grid-template-columns: repeat(14, 1fr);
  gap: 6px;

  /* tiny lift helps it feel flush with the base plane */
  transform: translateZ(1px);
}

.laptop-container .key {
  height: 20px;
  background: linear-gradient(180deg, #0b0b10 0%, #06060a 100%);
  border-radius: 4px;
}

.laptop-container .key.space {
  grid-column: span 6;
}

.laptop-container .screen-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 12% 15%, rgba(255, 115, 55, 0.08), transparent 50%),
              radial-gradient(circle at 86% 20%, rgba(255, 166, 77, 0.06), transparent 55%),
              radial-gradient(circle at 60% 85%, rgba(249, 115, 22, 0.08), transparent 60%);
}

.laptop-container .kelv-accent {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 1px solid rgba(255, 115, 55, 0.08);
  border-radius: 16px;
}
`;

const ProblemSection: React.FC = () => {
    const [activeEmail, setActiveEmail] = useState(0);
    const [pauseAutoPlay, setPauseAutoPlay] = useState(false);
    const [isOpened, setIsOpened] = useState(false);
    const [showDraftComposer, setShowDraftComposer] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

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
            company: "Stripe",
            subject: "Final loop update",
            preview:
                "Strong fundamentals, but the trade-off story drifted. We needed one crisp decision with a clear cost.",
            body:
                "Hi Evan, thanks for the time today. The panel agreed your systems answer was strong, but the trade-off section drifted. We needed one crisp decision with a clear cost, a reason you chose it, and what you would do differently next time. The story felt polished, but we could not see the pressure point.",
            tag: "Needs focus",
            time: "2:11 PM",
        },
        {
            company: "Notion",
            subject: "Team debrief",
            preview:
                "Great energy. The example stayed safe. We wanted a bolder call you owned end to end.",
            body:
                "Hey Jordan, we loved the energy and clarity in your delivery. The example stayed safe, though. We were hoping for a bolder call you owned end to end, including the risk you took and how you learned when something broke. That is the moment that builds confidence.",
            tag: "Too safe",
            time: "1:52 PM",
        },
        {
            company: "Figma",
            subject: "Decision update",
            preview:
                "Strong craft, but the narrative arc wobbled under follow-ups. We needed tighter stakes.",
            body:
                "Thanks for the conversation. Your craft is strong, but the narrative arc wobbled under follow-up questions. We needed tighter stakes, a clearer pivot moment, and one measurable result that anchored the impact. Without those, the story lost momentum.",
            tag: "No structure",
            time: "1:18 PM",
        },
        {
            company: "Marriott Hotels",
            subject: "Interview follow-up",
            preview:
                "Warm presence, but the example lacked urgency. We needed the moment service went off-track.",
            body:
                "Thanks for the time today. Your presence was warm, but the example lacked urgency. We needed the moment service went off-track, how you prioritized, and what you did to recover. Show us the pressure, the guest impact, and the result.",
            tag: "Low stakes",
            time: "12:30 PM",
        },
        {
            company: "United Airlines",
            subject: "Final interview update",
            preview:
                "Clear results, but the decision logic was fuzzy. We wanted the trade-offs you made.",
            body:
                "We appreciated the conversation. Your results were clear, but the decision logic was fuzzy. We wanted the trade-offs you made, how you weighed safety, cost, and time, and what you would do differently next time.",
            tag: "Missing logic",
            time: "11:05 AM",
        },
        {
            company: "Trader Joe's",
            subject: "Crew update",
            preview:
                "Great communication, but the example lacked stakes. What was on the line?",
            body:
                "Great communication and clear intent. The example lacked stakes. What was on the line, who was impacted, and how did you decide quickly with imperfect information? We were looking for urgency and ownership.",
            tag: "Low stakes",
            time: "10:24 AM",
        },
        {
            company: "Southwest Airlines",
            subject: "Thanks for your time",
            preview:
                "Good tone, but the answer felt rehearsed. We needed the messy middle and what you learned.",
            body:
                "Thanks for your time today. The tone was strong, but the answer felt rehearsed. We wanted the messy middle: what broke, how you fixed it, and what you learned. That is the difference between a story and a signal.",
            tag: "Too polished",
            time: "9:42 AM",
        },
        {
            company: "Costco Wholesale",
            subject: "Interview decision",
            preview:
                "Good outcomes, but we could not see your process. We needed the steps and the trade-offs.",
            body:
                "We appreciated the conversation. The outcomes were good, but we could not see your process. We needed the steps you took, the constraints you faced, and the trade-offs you made to deliver under pressure. Show us how you decided, not just what happened.",
            tag: "Missing steps",
            time: "8:37 AM",
        },
    ];

    useEffect(() => {
        if (pauseAutoPlay) {
            const resumeTimer = setTimeout(() => setPauseAutoPlay(false), 6000);
            return () => clearTimeout(resumeTimer);
        }
    }, [pauseAutoPlay]);

    useEffect(() => {
        if (pauseAutoPlay || isDetailOpen) return;
        const interval = setInterval(() => {
            setActiveEmail((prev) => (prev + 1) % rejectionLetters.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [pauseAutoPlay, isDetailOpen, rejectionLetters.length]);

    return (
        <section className="py-20 lg:py-28 bg-[#030305] relative overflow-hidden">
            {/* Inject laptop styles */}
            <style>{laptopStyles}</style>

            {/* Subtle background elements */}
            {/* background decoration removed */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px]" />

            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="grid lg:grid-cols-[1fr,1.3fr] gap-10 items-start">
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
                            feedback is vague, the patterns are invisible, and you are left guessing
                            what to fix.
                        </p>
                        <p className="text-lg text-gray-400 leading-relaxed max-w-md">
                            Kelv shows you the signals recruiters actually notice, so you can stop
                            guessing and start improving.
                        </p>
                    </motion.div>

                    {/* Right: CSS Laptop */}
                    <div ref={laptopRef} className="flex justify-center lg:justify-end">
                        <div className={`laptop-container ${isOpened ? "opened" : ""}`}>
                            {/* Monitor/Screen */}
                            <div className="monitor">
                                <div className="monitor-body">
                                    {/* Screen content */}
                                    <div className="monitor-content relative">
                                        <div className="screen-glow" />
                                        <div className="kelv-accent" />

                                        {/* Top app bar */}
                                        <div className="flex items-center gap-4 px-5 py-3 border-b border-white/5 bg-[#0c0c13]">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="block h-0.5 w-4 bg-gray-500" />
                                                    <span className="block h-0.5 w-4 bg-gray-500" />
                                                    <span className="block h-0.5 w-4 bg-gray-500" />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm font-semibold text-white">Kelv</span>
                                                    <span className="text-sm font-semibold text-orange-400">Mail</span>
                                                </div>
                                                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Inbox</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-[#101018] rounded-full px-4 py-2 text-xs text-gray-500 border border-white/5">
                                                    Search mail
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10" />
                                                <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10" />
                                                <div className="h-7 w-7 rounded-full bg-orange-500/15 border border-orange-500/30" />
                                            </div>
                                        </div>

                                        {/* Tabs row */}
                                        <div className="flex items-center gap-4 px-5 py-2 border-b border-white/5 text-xs text-gray-500">
                                            <div className="flex items-center gap-2 border-b-2 border-orange-400 pb-2 text-orange-300">
                                                <span className="h-2 w-2 rounded-full bg-orange-400" />
                                                Primary
                                            </div>
                                            <div className="flex items-center gap-2 pb-2">
                                                <span className="h-2 w-2 rounded-full bg-white/20" />
                                                Updates
                                            </div>
                                            <div className="flex items-center gap-2 pb-2">
                                                <span className="h-2 w-2 rounded-full bg-white/20" />
                                                Social
                                            </div>
                                        </div>

                                        {/* Email content */}
                                        <div className="flex flex-1 min-h-0">
                                            {/* Gmail sidebar */}
                                            <div className="w-[20%] border-r border-white/5 p-3 space-y-3 bg-[#0b0b11]">
                                                <button className="w-full rounded-full border border-orange-500/30 bg-[#101018] px-4 py-2 text-xs font-semibold text-orange-200">
                                                    Compose
                                                </button>
                                                {["Inbox", "Starred", "Sent", "Drafts"].map((label) => (
                                                    <button
                                                        key={label}
                                                        onClick={() => {
                                                            if (label === "Drafts") {
                                                                setShowDraftComposer(true);
                                                            }
                                                        }}
                                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] ${
                                                            label === "Inbox"
                                                                ? "bg-white/5 text-white"
                                                                : "text-gray-500"
                                                        }`}
                                                    >
                                                        <span>{label}</span>
                                                        {label === "Inbox" && <span className="text-[10px] text-gray-400">7</span>}
                                                        {label === "Drafts" && <span className="text-[10px] text-gray-400">1</span>}
                                                    </button>
                                                ))}
                                            </div>

                                            {isDetailOpen ? (
                                                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar min-h-0">
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <button
                                                            onClick={() => setIsDetailOpen(false)}
                                                            className="hover:text-white transition-colors"
                                                        >
                                                            â† Back to inbox
                                                        </button>
                                                        <span>{rejectionLetters[activeEmail].time}</span>
                                                    </div>

                                                    <p className="mt-3 text-xs text-gray-500">
                                                        From {rejectionLetters[activeEmail].company}
                                                    </p>
                                                    <p className="text-lg font-semibold text-white">
                                                        {rejectionLetters[activeEmail].subject}
                                                    </p>

                                                    <div className="flex items-center gap-2 mt-3">
                                                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-gray-400">
                                                            Inbox
                                                        </span>
                                                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-300">
                                                            {rejectionLetters[activeEmail].tag}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 rounded-xl border border-white/10 bg-[#0f0f15] p-4">
                                                        <div className="h-20 rounded-lg bg-gradient-to-r from-white/5 via-orange-500/10 to-transparent flex items-center justify-center text-[11px] text-gray-300 uppercase tracking-[0.3em]">
                                                            Interview update
                                                        </div>
                                                        <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                                                            {rejectionLetters[activeEmail].body}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 min-h-0">
                                                    <div className="h-full overflow-y-auto custom-scrollbar border-l border-white/5">
                                                        {rejectionLetters.map((letter, index) => {
                                                            const isActive = activeEmail === index;
                                                            return (
                                                                <button
                                                                    key={letter.subject}
                                                                onClick={() => {
                                                                    setActiveEmail(index);
                                                                    setPauseAutoPlay(true);
                                                                    setIsDetailOpen(true);
                                                                    setShowDraftComposer(false);
                                                                }}
                                                                    className={`w-full text-left border-b border-white/5 px-5 py-3 transition-colors ${
                                                                        isActive ? "bg-white/5" : "hover:bg-white/5"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-3 w-3 rounded-sm border border-white/20" />
                                                                        <div className="h-3 w-3 rounded-full border border-white/20" />
                                                                        <span className="text-[12px] font-semibold text-white w-[190px] truncate">
                                                                            {letter.company}
                                                                        </span>
                                                                        <span className="text-[12px] text-white/90 font-medium">
                                                                            {letter.subject}
                                                                        </span>
                                                                        <span className="text-[12px] text-gray-500 truncate flex-1">
                                                                            {letter.preview}
                                                                        </span>
                                                                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                                                            {letter.time}
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {showDraftComposer && (
                                                <div className="absolute bottom-4 right-4 w-[260px] rounded-lg border border-white/10 bg-[#0f0f15] shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
                                                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 text-xs text-gray-400">
                                                        <span>New Message</span>
                                                        <button
                                                            className="text-gray-500 hover:text-white transition-colors"
                                                            onClick={() => setShowDraftComposer(false)}
                                                        >
                                                            x
                                                        </button>
                                                    </div>
                                                    <div className="px-3 py-2 text-[11px] text-gray-400 border-b border-white/5">
                                                        To: recruiting@amazon.com
                                                    </div>
                                                    <div className="px-3 py-2 text-[11px] text-gray-500 border-b border-white/5">
                                                        Subject
                                                    </div>
                                                    <div className="px-3 py-3 text-[11px] text-gray-300">
                                                        PLEASE PLEASE PLEASE I NEED THIS J*B PLEASE HIRE ME
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-2 border-t border-white/5">
                                                        <button className="rounded-full bg-orange-500/80 px-3 py-1 text-[10px] font-semibold text-white">
                                                            Send
                                                        </button>
                                                        <span className="text-[10px] text-gray-500">Aa</span>
                                                    </div>
                                                </div>
                                            )}
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
