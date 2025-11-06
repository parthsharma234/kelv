import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  Brain,
  Target,
  Zap,
  Award,
  Activity,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Clock,
  ArrowRight,
  Hash,
  Keyboard
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
  category: 'interviews' | 'navigation' | 'recent';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDynamic: () => void;
  onStartFocused: (type: string) => void;
  onViewInterview: (id: string) => void;
  recentInterviews: any[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onStartDynamic,
  onStartFocused,
  onViewInterview,
  recentInterviews
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusedTypes = [
    { id: 'technical', label: 'Technical Interview', icon: Brain, shortcut: '1' },
    { id: 'behavioral', label: 'Behavioral Interview', icon: MessageSquare, shortcut: '2' },
    { id: 'situational', label: 'Situational Interview', icon: Zap, shortcut: '3' },
    { id: 'leadership', label: 'Leadership Interview', icon: Award, shortcut: '4' },
    { id: 'problemSolving', label: 'Problem Solving Interview', icon: Activity, shortcut: '5' },
    { id: 'communication', label: 'Communication Interview', icon: Sparkles, shortcut: '6' },
  ];

  const commands: Command[] = [
    {
      id: 'dynamic',
      label: 'Start Dynamic Interview',
      description: 'Full-length AI-powered interview session',
      icon: TrendingUp,
      action: () => {
        onStartDynamic();
        onClose();
      },
      shortcut: 'D',
      category: 'interviews'
    },
    ...focusedTypes.map(type => ({
      id: type.id,
      label: `Start ${type.label}`,
      description: 'Quick focused practice session',
      icon: type.icon,
      action: () => {
        onStartFocused(type.id);
        onClose();
      },
      shortcut: type.shortcut,
      category: 'interviews' as const
    })),
    ...recentInterviews.slice(0, 5).map((interview, idx) => ({
      id: `recent-${interview.id}`,
      label: interview.interviewType === 'dynamic' ? 'Dynamic Interview' : `${interview.interviewType} Interview`,
      description: `Completed ${new Date(interview.completedAt).toLocaleDateString()} • Score: ${interview.overallScore}%`,
      icon: Clock,
      action: () => {
        onViewInterview(interview.id);
        onClose();
      },
      category: 'recent' as const
    }))
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? filteredCommands.length - 1 : prev - 1);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'interviews': return 'Start Interview';
      case 'navigation': return 'Navigate';
      case 'recent': return 'Recent Interviews';
      default: return category;
    }
  };

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Command Palette */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-2xl bg-dark-800 border border-dark-700/50 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-dark-700/50">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Search interviews, actions..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                />
                <div className="flex items-center gap-1.5 px-2 py-1 bg-dark-700/50 rounded-lg">
                  <Command className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">K</span>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <p className="text-gray-400">No results found</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {Object.entries(groupedCommands).map(([category, cmds]) => (
                      <div key={category} className="mb-4">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {getCategoryLabel(category)}
                        </div>
                        {cmds.map((cmd, idx) => {
                          const globalIndex = filteredCommands.indexOf(cmd);
                          const isSelected = globalIndex === selectedIndex;
                          const Icon = cmd.icon;

                          return (
                            <motion.button
                              key={cmd.id}
                              onClick={cmd.action}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                                isSelected
                                  ? 'bg-orange-500/10 border-l-2 border-orange-500'
                                  : 'hover:bg-dark-700/30 border-l-2 border-transparent'
                              }`}
                              whileHover={{ x: 4 }}
                              transition={{ type: 'spring', stiffness: 400 }}
                            >
                              <div className={`p-2 rounded-lg ${
                                isSelected ? 'bg-orange-500/20' : 'bg-dark-700/50'
                              }`}>
                                <Icon className={`w-4 h-4 ${
                                  isSelected ? 'text-orange-400' : 'text-gray-400'
                                }`} />
                              </div>

                              <div className="flex-1 text-left">
                                <div className={`font-medium ${
                                  isSelected ? 'text-white' : 'text-gray-300'
                                }`}>
                                  {cmd.label}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {cmd.description}
                                </div>
                              </div>

                              {cmd.shortcut && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-dark-700/50 rounded text-xs text-gray-400 font-mono">
                                  {cmd.shortcut}
                                </div>
                              )}

                              <ArrowRight className={`w-4 h-4 transition-opacity ${
                                isSelected ? 'opacity-100 text-orange-400' : 'opacity-0'
                              }`} />
                            </motion.button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-dark-700/50 bg-dark-900/50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Navigate with arrows</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-xs">Enter</kbd>
                      <span>Select</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-dark-700 rounded text-xs">Esc</kbd>
                    <span>Close</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
