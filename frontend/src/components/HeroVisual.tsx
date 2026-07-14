import { Key } from 'lucide-react';
import { FloatingCard } from './FloatingCard';
import dashboardMockup from '../assets/dashboard_mockup.jpg';
import resumePreview from '../assets/resume_preview.jpg';

export const HeroVisual = () => {
  return (
    <div className="lg:col-span-7 relative h-[500px] lg:h-[600px] w-full flex items-center justify-center mt-10 lg:mt-0">
      
      {/* Dashboard Mockup - Main Base */}
      <FloatingCard 
        className="relative w-full max-w-2xl z-10 group"
        yOffset={8}
        duration={6}
        delay={0}
      >
        <div className="absolute -inset-4 bg-gradient-to-tr from-secondary/30 to-transparent rounded-[2rem] blur-3xl opacity-40"></div>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/40 aspect-[16/10]">
          <img 
            alt="AI Resume Analysis Dashboard" 
            className="w-full h-full object-cover" 
            src={dashboardMockup}
            width={672}
            height={420}
          />
        </div>
      </FloatingCard>

      {/* Resume Overlay - Floats slightly faster, offset to right */}
      <FloatingCard 
        className="absolute top-[35%] right-0 lg:right-[-5%] translate-y-[-20%] w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px] z-20"
        yOffset={12}
        duration={5}
        delay={0.5}
      >
        <div className="glass-card p-1.5 rounded-2xl shadow-2xl border border-white/60">
          <div className="rounded-xl overflow-hidden border border-white aspect-[3/4]">
            <img 
              alt="Professional Resume Preview" 
              className="w-full h-full object-cover object-top" 
              src={resumePreview}
              loading="lazy"
              width={320}
              height={426}
            />
          </div>
        </div>
      </FloatingCard>

      {/* Floating Keywords Card - bottom-left */}
      <FloatingCard 
        className="absolute bottom-6 left-0 lg:left-[-5%] glass-card p-6 rounded-2xl shadow-xl z-30 max-w-[220px] sm:max-w-[240px]"
        yOffset={18}
        duration={4.5}
        delay={1}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="p-2 bg-secondary/10 rounded-full text-secondary">
            <Key className="w-5 h-5" />
          </span>
          <div className="font-label-md text-primary text-sm sm:text-base">Keywords Found</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-surface-container-highest text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">SEO</span>
          <span className="px-3 py-1.5 bg-surface-container-highest text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">Data Strategy</span>
          <span className="px-3 py-1.5 bg-surface-container-highest text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">Python</span>
        </div>
      </FloatingCard>
    </div>
  );
};
