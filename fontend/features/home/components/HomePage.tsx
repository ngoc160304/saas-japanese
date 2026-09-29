import { BenefitsSection } from './BenefitsSection';
import { FeaturedCoursesSection } from './FeaturedCoursesSection';
import { FinalCtaSection } from './FinalCtaSection';
import { HeroSection } from './HeroSection';
import { JlptLevelsSection } from './JlptLevelsSection';
import { MockExamSection } from './MockExamSection';
import { SocialProofSection } from './SocialProofSection';
import { TestimonialsSection } from './TestimonialsSection';

export function HomePage() {
  return (
    <main className="flex-1">
      <HeroSection />
      <SocialProofSection />
      <JlptLevelsSection />
      <BenefitsSection />
      <FeaturedCoursesSection />
      <MockExamSection />
      <TestimonialsSection />
      <FinalCtaSection />
    </main>
  );
}
