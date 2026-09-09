import React, { useMemo } from 'react';
import katex from 'katex';
import { HelpCircle } from 'lucide-react';

interface MathTexProps {
  formula: string;
  block?: boolean;
  className?: string;
  inspectable?: boolean;
  onInspect?: () => void;
  tooltip?: string;
}

export const MathTex: React.FC<MathTexProps> = ({
  formula,
  block = false,
  className = '',
  inspectable = false,
  onInspect,
  tooltip,
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return formula;
    }
  }, [formula, block]);

  if (inspectable && onInspect) {
    return (
      <button
        type="button"
        onClick={onInspect}
        className={`group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-sky-200/80 bg-sky-50/70 hover:bg-sky-100/90 text-navy-900 transition-all cursor-pointer text-left hover:scale-[1.01] active:scale-[0.99] shadow-xs hover:border-sky-300 ${className}`}
        title={tooltip || 'Click to inspect Class-10 mathematical derivation'}
      >
        <span dangerouslySetInnerHTML={{ __html: html }} />
        <HelpCircle className="w-3.5 h-3.5 text-sky-500 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>
    );
  }

  return (
    <span
      className={`inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
