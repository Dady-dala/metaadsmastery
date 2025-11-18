import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ContactFormDialog from '@/components/ContactFormDialog';

const ModernHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-xl shadow-lg border-b border-border/50' : 'bg-background/90 backdrop-blur-md border-b border-border/30'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="text-2xl font-bold gradient-text">
                Meta Ads Mastery
              </div>
            </div>
            
            {/* CTA Button */}
            <Button 
              onClick={() => setIsDialogOpen(true)}
              size="lg"
              className="cinematic-cta font-semibold"
            >
              Rejoindre la Formation
            </Button>
          </div>
        </div>
      </header>

      <ContactFormDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

export default ModernHeader;