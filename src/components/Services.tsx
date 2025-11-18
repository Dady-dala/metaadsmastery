import { Target, TrendingUp, Shield, Zap, BookOpen, Award, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import ContactFormDialog from '@/components/ContactFormDialog';

const Services = () => {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  const problems = [
    {
      icon: XCircle,
      problem: "Tu cliques sur 'Booster' sans stratégie et ton argent disparaît sans résultats"
    },
    {
      icon: XCircle,
      problem: "Tes publicités ne génèrent aucune vente, juste des likes inutiles"
    },
    {
      icon: XCircle,
      problem: "Tu ne sais pas comment utiliser WhatsApp Business pour convertir tes prospects en clients"
    },
    {
      icon: XCircle,
      problem: "Tes concurrents dominent Facebook pendant que toi, tu restes invisible"
    },
    {
      icon: XCircle,
      problem: "Tu paies des 'experts' qui ne te donnent aucun résultat concret"
    },
    {
      icon: XCircle,
      problem: "Tu ne sais pas cibler la bonne audience ni optimiser tes campagnes"
    }
  ];

  const learnings = [
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

  const modules = [
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

  const bonuses = [
    {
      icon: Award,
      title: "Templates de Campagnes Prêts à l'Emploi",
      value: "Valeur 15 000 FCFA"
    },
    {
      icon: Award,
      title: "Checklist d'Optimisation Complète",
      value: "Valeur 10 000 FCFA"
    },
    {
      icon: Award,
      title: "Banque de Visuels & Exemples de Pubs",
      value: "Valeur 20 000 FCFA"
    },
    {
      icon: Award,
      title: "Accès au Groupe Privé d'Entraide",
      value: "Inestimable"
    },
    {
      icon: Award,
      title: "Mises à Jour de la Formation à Vie",
      value: "Inclus"
    }
  ];

  const differentiators = [
    {
      icon: Target,
      title: "Adapté au Marché Africain",
      description: "Exemples concrets, cas d'usage locaux, stratégies qui marchent ICI."
    },
    {
      icon: TrendingUp,
      title: "Formation Pratique",
      description: "Pas de blabla théorique. Tu mets les mains dans le cambouis dès la 1ère vidéo."
    },
    {
      icon: Shield,
      title: "Accompagnement Inclus",
      description: "Groupe privé où tu peux poser tes questions et progresser avec d'autres."
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
      <section className="relative py-20 cinematic-section overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 cinematic-text-shadow">
              Ces Problèmes Te Parlent ?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Si tu coches au moins 2 de ces cases, cette formation va changer la donne pour toi.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {problems.map((item, index) => (
              <Card key={index} className="bg-black/40 border-red-500/20 hover:border-red-500/40 transition-all">
                <CardContent className="flex items-start gap-4 p-6">
                  <item.icon className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <p className="text-gray-200 text-lg">{item.problem}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-2xl font-bold text-yellow-400 mb-4">
              ✋ STOP ! Il est temps de passer à l'action.
            </p>
            <p className="text-xl text-gray-300">
              Meta Ads Mastery t'apprend EXACTEMENT comment résoudre tous ces problèmes.
            </p>
          </div>
        </div>
      </section>

      {/* Ce Que Tu Vas Apprendre */}
      <section className="relative py-20 bg-gradient-to-b from-background to-background/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 cinematic-text-shadow">
              Voici Ce Que Tu Vas Maîtriser
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Une formation complète, structurée, et orientée résultats.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {learnings.map((learning, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-black/20 border border-primary/10 hover:border-primary/30 transition-all">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-200 text-lg">{learning}</p>
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
                    <p className="text-gray-300 text-lg">{module.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus */}
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
              <Card key={index} className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50 transition-all">
                <CardHeader>
                  <bonus.icon className="w-12 h-12 text-yellow-400 mb-4" />
                  <CardTitle className="text-lg text-white">{bonus.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-yellow-400 font-bold text-xl">{bonus.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

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
      <section className="relative py-20 cinematic-section overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 cinematic-text-shadow">
            Prêt à Transformer Ton Business Avec Facebook Ads ?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Des milliers d'entrepreneurs africains ont déjà pris leur envol grâce aux Meta Ads. C'est ton tour maintenant.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <div className="text-center">
              <p className="text-gray-400 line-through text-2xl">149 000 FCFA</p>
              <p className="text-yellow-400 text-5xl font-bold">79 000 FCFA</p>
              <p className="text-gray-300 text-sm mt-2">Offre de Lancement Limitée</p>
            </div>
          </div>

          <Button 
            size="lg" 
            className="cinematic-cta text-xl px-12 py-8 font-bold shadow-2xl hover:shadow-glow transition-all duration-500 transform hover:scale-105"
            onClick={() => setIsContactDialogOpen(true)}
          >
            Je Rejoins Meta Ads Mastery Maintenant →
          </Button>

          <div className="mt-8 flex items-center justify-center gap-6 text-gray-300 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Accès Immédiat</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Garantie 30 Jours</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
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