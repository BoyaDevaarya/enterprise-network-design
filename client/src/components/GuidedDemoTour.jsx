import React from 'react';
import { useDemoStore } from '../store/demoStore';
import { ShieldCheck, ArrowRight, X, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GuidedDemoTour() {
  const { isActive, currentStep, nextStep, prevStep, stopTour } = useDemoStore();
  const navigate = useNavigate();

  if (!isActive) return null;

  const steps = [
    {
      title: '1. Access Restriction Demo',
      description: 'Observe how HR members are restricted from accessing the Finance Ledger resource due to Rule #1 isolation.',
      actionLabel: 'Go to Resources',
      onAction: () => navigate('/resources')
    },
    {
      title: '2. Live Policy Matrix 2.0',
      description: 'Navigate to the Policy Matrix where administrators can evaluate cross-department permits and exposure heatmaps.',
      actionLabel: 'View Policy Matrix',
      onAction: () => navigate('/matrix')
    },
    {
      title: '3. Safe-Change & Dynamic ACL Enforcement',
      description: 'When an admin flips a restriction to PERMIT, the multi-factor risk engine triggers preview verification and requires confirmation.',
      actionLabel: 'Open Test Lab',
      onAction: () => navigate('/test-lab')
    },
    {
      title: '4. Instant Server-Sent Events (SSE) Sync',
      description: 'Rule changes and expirations propagate instantly across all active browser sessions with sub-second SSE updates.',
      actionLabel: 'Finish Tour',
      onAction: () => stopTour()
    }
  ];

  const step = steps[currentStep] || steps[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full surface-panel border-blue-600/50 shadow-sm border-blue-500/50 p-5 animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Guided Tour ({currentStep + 1} of {steps.length})</span>
        </div>
        <button onClick={stopTour} className="text-zinc-400 hover:text-zinc-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-sm font-bold text-zinc-100 mb-1">{step.title}</h3>
      <p className="text-xs text-zinc-300 leading-relaxed mb-4">{step.description}</p>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <button
          onClick={stopTour}
          className="text-xs text-zinc-400 hover:text-zinc-200 font-medium"
        >
          Skip Tour
        </button>

        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="px-3 py-1.5 rounded-sm bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700"
            >
              Previous
            </button>
          )}
          <button
            onClick={() => {
              if (step.onAction) step.onAction();
              if (currentStep < steps.length - 1) nextStep();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-blue-600 text-zinc-950 font-bold text-xs hover:bg-blue-500 transition-colors shadow-sm border-blue-500/50"
          >
            <span>{step.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
