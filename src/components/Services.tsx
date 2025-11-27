import { Target, TrendingUp, Shield, Zap, BookOpen, Award, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import ContactFormDialog from '@/components/ContactFormDialog';
import CountdownTimer from '@/components/CountdownTimer';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const Services = () => {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  // Valeurs par défaut
  const defaultProblems = [
    "Tu cliques sur 'Booster' sans stratégie et ton argent disparaît sans résultats",
    "Tes publicités ne génèrent aucune vente, juste des likes inutiles",
    "Tu n'as pas de site web et tu penses que c'est impossible de vendre en ligne",
    "Tes concurrents dominent Facebook pendant que toi, tu restes invisible",
    "Tu paies des 'experts' qui ne te donnent aucun résultat concret",
    "Tu ne sais pas comment utiliser WhatsApp Business pour convertir tes prospects en clients"
  ];

  const defaultLearnings = [
    "Créer et configurer ton Business Manager de A à Z comme un pro",
    "Mettre en place WhatsApp Business comme tunnel de conversion automatique",
    "Créer des audiences hyper-ciblées qui convertissent réellement",
    "Maîtriser les objectifs de campagne : Notoriété, Trafic, Conversions, Ventes",
    "Rédiger des textes publicitaires qui captent l'attention et vendent",
    "Créer des visuels et vidéos publicitaires qui arrêtent le scroll",
    "Lancer tes premières campagnes rentables même avec un petit budget",
    "Analyser et optimiser tes résultats pour multiplier ton ROI",
    "Utiliser WhatsApp Business pour qualifier et convertir tes prospects automatiquement",
    "Scaler tes campagnes gagnantes sans perdre en rentabilité"
  ];

  const defaultModules = [
    {
      number: "01",
      title: "Fondations Meta Ads",
      description: "Comprendre l'écosystème Facebook Ads, créer ton compte Business Manager, configurer tes premiers paramètres."
    },
    {
      number: "02",
      title: "WhatsApp Business & Tunnels",
      description: "Configuration complète de WhatsApp Business comme tunnel de conversion, automatisation des réponses et qualification des prospects."
    },
    {
      number: "03",
      title: "Audiences & Ciblage",
      description: "Créer des audiences personnalisées, sosies (lookalike) et ciblages détaillés qui convertissent."
    },
    {
      number: "04",
      title: "Création de Campagnes",
      description: "Structure complète : Campagne > Ensemble de publicités > Annonces. Tous les objectifs expliqués."
    },
    {
      number: "05",
      title: "Copywriting & Visuels",
      description: "Rédiger des textes qui vendent, créer des visuels percutants, formats vidéo qui performent."
    },
    {
      number: "06",
      title: "Lancement & Optimisation",
      description: "Lancer ta première campagne, analyser les métriques, optimiser pour maximiser le ROI."
    },
    {
      number: "07",
      title: "WhatsApp Marketing Avancé",
      description: "Stratégies avancées pour convertir tes conversations WhatsApp en ventes, automatisation et suivi client."
    },
    {
      number: "08",
      title: "Scaling & Croissance",
      description: "Multiplier les résultats des campagnes gagnantes, gérer des budgets plus importants."
    }
  ];

  const [problems, setProblems] = useState<Array<string | { title: string; description: string }>>(defaultProblems);
  const [learnings, setLearnings] = useState<Array<string | { title: string; description: string }>>(defaultLearnings);
  const [modules, setModules] = useState<Array<{ number: string; title: string; description: string }>>(defaultModules);
  const [bonuses, setBonuses] = useState<Array<{ title: string; value: string }>>([]);
  const [pricing, setPricing] = useState({
    originalPrice: '',
    discountedPrice: '',
    ctaText: 'Je Rejoins Meta Ads Mastery Maintenant →',
    countdownEndDate: ''
  });

  useEffect(() => {
    const loadContent = async () => {
      try {
        const { data: servicesData } = await supabase
          .from('landing_page_sections')
          .select('*')
          .eq('section_key', 'services')
          .single();

        if (servicesData?.content) {
          const content = servicesData.content as any;
          if (content.problems?.length > 0) setProblems(content.problems);
          if (content.learnings?.length > 0) setLearnings(content.learnings);
          if (content.modules?.length > 0) setModules(content.modules);
        }

        const { data: bonusPricingData } = await supabase
          .from('landing_page_sections')
          .select('*')
          .eq('section_key', 'bonus-pricing')
          .maybeSingle();

        if (bonusPricingData?.content) {
          const content = bonusPricingData.content as any;
          if (content.bonuses?.length > 0) setBonuses(content.bonuses);
          if (content.originalPrice && content.discountedPrice) {
            setPricing({
              originalPrice: content.originalPrice,
              discountedPrice: content.discountedPrice,
              ctaText: pricing.ctaText,
              countdownEndDate: pricing.countdownEndDate
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      }
    };

    loadContent();

    // Setup realtime subscription for bonus-pricing updates
    const channel = supabase
      .channel('bonus-pricing-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'landing_page_sections',
          filter: 'section_key=eq.bonus-pricing'
        },
        (payload) => {
          console.log('Bonus pricing updated:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            if (newData.content) {
              const content = newData.content;
              if (content.bonuses?.length >= 0) setBonuses(content.bonuses);
              if (content.originalPrice !== undefined && content.discountedPrice !== undefined) {
                setPricing(prev => ({
                  ...prev,
                  originalPrice: content.originalPrice,
                  discountedPrice: content.discountedPrice
                }));
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const targetAudience = [
    {
      title: "Entrepreneurs & Commerçants",
      description: "Tu vends des produits/services et tu veux attirer plus de clients"
    },
    {
      title: "Infopreneurs & Formateurs",
      description: "Tu veux vendre tes formations, ebooks ou coaching en ligne"
    },
    {
      title: "Freelances & Graphistes",
      description: "Tu veux proposer la gestion de pubs Facebook à tes clients"
    },
    {
      title: "Marketeurs Digitaux",
      description: "Tu veux ajouter une compétence ultra-demandée à ton CV"
    },
    {
      title: "Débutants Complets",
      description: "Aucune expérience requise, on part de zéro ensemble"
    },
    {
      title: "Étudiants Ambitieux",
      description: "Tu veux maîtriser un skill qui paie vraiment en Afrique"
    }
  ];


  const differentiators = [
    {
      icon: Target,
      title: "Vends Sans Site Web",
      description: "Utilise WhatsApp Business comme tunnel. Pas besoin de site web, de landing page ou de développeur."
    },
    {
      icon: TrendingUp,
      title: "Formation Pratique",
      description: "Pas de blabla théorique. Tu mets les mains dans le cambouis dès la 1ère vidéo."
    },
    {
      icon: Shield,
      title: "Adapté à l'Afrique",
      description: "Exemples concrets, budgets locaux, méthodes qui marchent vraiment ICI."
    },
    {
      icon: Zap,
      title: "Résultats Rapides",
      description: "Tu peux lancer ta première campagne rentable dès la fin du Module 4."
    }
  ];

  return (
    <>
      {/* Problèmes Résolus */}
      <section className="relative py-12 sm:py-16 md:py-20 cinematic-section overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 cinematic-text-shadow px-2">
              Ces Problèmes Te Parlent ?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Si tu coches au moins 2 de ces cases, cette formation va changer la donne pour toi.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {problems.map((problem, index) => (
              <Card key={index} className="bg-black/40 border-red-500/20 hover:border-red-500/40 transition-all">
                <CardContent className="p-4 sm:p-6 space-y-2">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0 mt-1" />
                    <h3 className="text-white text-base sm:text-lg font-semibold">{typeof problem === 'string' ? problem : problem.title}</h3>
                  </div>
                  {typeof problem === 'object' && problem.description && (
                    <div 
                      className="text-gray-300 text-sm sm:text-base ml-9 sm:ml-10"
                      dangerouslySetInnerHTML={{ __html: problem.description }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-10 md:mt-12 px-4">
            <p className="text-xl sm:text-2xl font-bold text-yellow-400 mb-3 sm:mb-4">
              ✋ STOP ! Il est temps de passer à l'action.
            </p>
            <p className="text-base sm:text-lg md:text-xl text-gray-300">
              Meta Ads Mastery t'apprend EXACTEMENT comment résoudre tous ces problèmes.
            </p>
          </div>
        </div>
      </section>

      {/* Ce Que Tu Vas Apprendre */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-background/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 cinematic-text-shadow px-2">
              Voici Ce Que Tu Vas Maîtriser
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Une formation complète, structurée, et orientée résultats.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
            {learnings.map((learning, index) => (
              <div key={index} className="p-3 sm:p-4 rounded-lg bg-black/20 border border-primary/10 hover:border-primary/30 transition-all space-y-2">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 sm:mt-1" />
                  <p className="text-white text-sm sm:text-base font-semibold">{typeof learning === 'string' ? learning : learning.title}</p>
                </div>
                {typeof learning === 'object' && learning.description && (
                  <div 
                    className="text-gray-300 text-sm ml-7 sm:ml-9"
                    dangerouslySetInnerHTML={{ __html: learning.description }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pour Qui ? */}
      <section className="relative py-20 cinematic-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 cinematic-text-shadow">
              Cette Formation Est Faite Pour Toi Si...
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {targetAudience.map((audience, index) => (
              <Card key={index} className="bg-black/40 border-primary/20 hover:border-primary/40 transition-all">
                <CardHeader>
                  <CardTitle className="text-xl text-white">{audience.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 text-base">
                    {audience.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Détaillés */}
      <section className="relative py-20 bg-gradient-to-b from-background to-background/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 cinematic-text-shadow">
              Contenu de la Formation
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              8 modules progressifs pour te transformer en expert Meta Ads.
            </p>
          </div>

          <div className="space-y-6">
            {modules.map((module, index) => (
              <Card key={index} className="bg-gradient-to-r from-black/60 to-black/40 border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="flex items-start gap-6 p-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{module.number}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">{module.title}</h3>
                    <div 
                      className="text-gray-300 text-lg"
                      dangerouslySetInnerHTML={{ __html: module.description }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus */}
      {bonuses.length > 0 && (
        <section className="relative py-20 cinematic-section overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5"></div>
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 cinematic-text-shadow">
                🎁 Bonus Exclusifs Inclus
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Pour maximiser tes chances de succès dès le départ.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bonuses.map((bonus, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50 transition-all h-full">
                    <CardHeader>
                      <Award className="w-12 h-12 text-yellow-400 mb-4" />
                      <CardTitle className="text-lg text-white">{bonus.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-yellow-400 font-bold text-xl">{bonus.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pourquoi Différent */}
      <section className="relative py-20 bg-gradient-to-b from-background to-background/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 cinematic-text-shadow">
              Pourquoi Meta Ads Mastery Est Différent ?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {differentiators.map((diff, index) => (
              <Card key={index} className="bg-black/40 border-primary/20 hover:border-primary/40 transition-all text-center">
                <CardHeader>
                  <diff.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl text-white">{diff.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    {diff.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-12 sm:py-16 md:py-20 cinematic-section overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 cinematic-text-shadow px-2">
            Prêt à Transformer Ton Business Avec Facebook Ads ?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Des milliers d'entrepreneurs africains ont déjà pris leur envol grâce aux Meta Ads. C'est ton tour maintenant.
          </p>
          
          <CountdownTimer originalPrice={pricing.originalPrice} />
          
          {pricing.originalPrice && pricing.discountedPrice && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 sm:mb-12">
              <div className="text-center">
                <p className="text-gray-400 line-through text-xl sm:text-2xl">${pricing.originalPrice}</p>
                <p className="text-yellow-400 text-4xl sm:text-5xl font-bold">${pricing.discountedPrice}</p>
                <p className="text-gray-300 text-xs sm:text-sm mt-2">Offre de Lancement Limitée</p>
              </div>
            </div>
          )}

          <Button 
            size="lg" 
            className="cinematic-cta text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-6 sm:py-7 md:py-8 font-bold shadow-2xl hover:shadow-glow transition-all duration-500 transform hover:scale-105 w-full sm:w-auto"
            onClick={() => setIsContactDialogOpen(true)}
          >
            {pricing.ctaText}
          </Button>

          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-4 sm:gap-6 text-gray-300 flex-wrap px-4">
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
              <span>Accès Immédiat</span>
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
              <span>Garantie 30 Jours</span>
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
              <span>Paiement Sécurisé</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Dialog */}
      <ContactFormDialog isOpen={isContactDialogOpen} onOpenChange={setIsContactDialogOpen} />
    </>
  );
};

export default Services;