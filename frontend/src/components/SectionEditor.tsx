import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare 
} from 'lucide-react';

interface SectionEditorProps {
  sectionKey: string;
  title: string;
  subtitle: string;
  content: string;
  badgeColor?: string;
  badgeText?: string;
  onChange: (newContent: string) => void;
  onResynthesize: (instruction: string) => Promise<void>;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  sectionKey,
  title,
  subtitle,
  content,
  badgeColor = 'bg-slate-700 text-slate-300',
  badgeText,
  onChange,
  onResynthesize,
}) => {
  const [isEditingInstruction, setIsEditingInstruction] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isResynthesizing, setIsResynthesizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleResynthesizeClick = async () => {
    setIsResynthesizing(true);
    try {
      await onResynthesize(customPrompt);
      setIsEditingInstruction(false);
      setCustomPrompt('');
    } finally {
      setIsResynthesizing(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm transition hover:border-slate-600/80">
      {/* Card Header */}
      <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm text-slate-100">{title}</span>
          {badgeText && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/5 ${badgeColor}`}>
              {badgeText}
            </span>
          )}
          <span className="text-xs text-slate-400 hidden sm:inline">&bull; {subtitle}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsEditingInstruction(!isEditingInstruction)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition border ${
              isEditingInstruction
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 border-slate-600/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Re-craft</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-700"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* AI Prompt Drawer */}
      {isEditingInstruction && (
        <div className="p-3 bg-indigo-950/30 border-b border-indigo-500/20 flex flex-col sm:flex-row items-center gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-indigo-300 text-xs w-full sm:w-auto shrink-0 font-medium">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Instruction:</span>
          </div>
          <input
            type="text"
            placeholder="e.g. 'Make it more concise', 'Highlight the auth security milestone', 'Add risk score'"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full text-xs bg-slate-900/80 border border-indigo-500/30 rounded-md px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            onKeyDown={(e) => e.key === 'Enter' && handleResynthesizeClick()}
          />
          <button
            onClick={handleResynthesizeClick}
            disabled={isResynthesizing}
            className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
          >
            {isResynthesizing ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isResynthesizing ? 'Synthesizing...' : 'Regenerate Section'}</span>
          </button>
        </div>
      )}

      {/* Card Content Textarea */}
      {!isCollapsed && (
        <div className="p-3">
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            className="w-full bg-slate-900/70 border border-slate-700/50 rounded-lg p-3 text-xs md:text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y transition"
            placeholder={`Enter or edit markdown for ${title}...`}
          />
        </div>
      )}
    </div>
  );
};
