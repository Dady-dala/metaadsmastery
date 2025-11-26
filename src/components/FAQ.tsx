import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const FAQ = () => {
  const defaultFaqs = [
    {
      question: "Est-ce que cette formation convient aux débutants complets ?",
      answer: "Absolument ! Meta Ads Mastery est conçu pour partir de zéro. Même si tu n'as jamais créé de publicité de ta vie, tu vas tout comprendre grâce à nos explications claires et nos démonstrations pas à pas. Aucun prérequis technique n'est nécessaire."
    },
    {
      question: "Je n'ai pas de site web, est-ce que je peux quand même vendre ?",
      answer: "OUI, c'est justement tout l'intérêt de notre méthode ! Tu n'as BESOIN d'AUCUN site web. On t'apprend à utiliser WhatsApp Business comme tunnel de vente direct. Tes prospects cliquent sur ta pub, arrivent directement sur ton WhatsApp, tu discutes avec eux et tu vends. Simple, efficace, et pas besoin de payer un développeur ou d'avoir des connaissances techniques !"
    },
    {
      question: "De quel budget ai-je besoin pour pratiquer après la formation ?",
      answer: "Tu peux commencer à tester tes premières campagnes avec aussi peu que $10-20. L'important n'est pas le montant, mais de bien structurer tes campagnes. On t'apprend justement à maximiser chaque dollar investi, même avec un petit budget."
    },
    {
      question: "Combien de temps dure la formation ?",
      answer: "La formation complète contient plus de 8 heures de vidéos réparties sur 8 modules. Tu peux la suivre à ton rythme : certains étudiants finalisent tout en 2 semaines, d'autres préfèrent étaler sur 1 à 2 mois en pratiquant entre chaque module. Tu as un accès À VIE, donc aucune pression."
    },
    {
      question: "Est-ce que je vais recevoir un certificat à la fin ?",
      answer: "Oui ! Une fois que tu auras complété tous les modules, tu recevras un certificat de completion Meta Ads Mastery que tu pourras ajouter à ton CV, ton portfolio ou tes profils professionnels (LinkedIn, etc.)."
    },
    {
      question: "La formation est-elle vraiment adaptée au marché africain ?",
      answer: "Oui, c'est notre force ! Tous les exemples, cas pratiques et stratégies sont pensés pour les entrepreneurs africains. On aborde les problématiques locales : ciblage des audiences africaines, adaptation des budgets, moyens de paiement, types de produits qui marchent ici, etc."
    },
    {
      question: "Que se passe-t-il si je ne suis pas satisfait ?",
      answer: "Tu es protégé par notre garantie satisfait ou remboursé de 30 jours. Si pour quelque raison que ce soit tu estimes que la formation ne te convient pas, tu peux demander un remboursement intégral dans les 30 jours suivant ton achat. Aucune question posée, aucune justification nécessaire."
    },
    {
      question: "Est-ce que j'aurai accès à un support ou une communauté ?",
      answer: "Oui ! Tu rejoins automatiquement notre groupe privé d'entraide sur WhatsApp ou Telegram (selon ta préférence) où tu pourras poser tes questions, partager tes résultats et échanger avec d'autres étudiants et experts. Tu n'es jamais seul dans ton apprentissage."
    },
    {
      question: "Les contenus sont-ils régulièrement mis à jour ?",
      answer: "Absolument ! Facebook met régulièrement à jour sa plateforme publicitaire. Chaque fois qu'il y a des changements importants, on met à jour les vidéos concernées et tu y as accès GRATUITEMENT. Ton accès est valable à vie avec toutes les futures mises à jour incluses."
    },
    {
      question: "Pourquoi WhatsApp Business au lieu du Pixel Facebook ?",
      answer: "WhatsApp Business est beaucoup plus accessible et efficace en Afrique ! La majorité des Africains utilisent déjà WhatsApp au quotidien. En dirigeant tes prospects vers WhatsApp, tu crées une expérience familière, tu peux répondre instantanément, qualifier tes leads en temps réel et convertir plus facilement. Pas besoin de site web compliqué ni de connaissances techniques avancées."
    },
    {
      question: "Vais-je vraiment être capable de gérer des pubs Facebook pour des clients après cette formation ?",
      answer: "OUI ! À la fin de Meta Ads Mastery, tu auras toutes les compétences pour lancer et gérer des campagnes Facebook Ads rentables, que ce soit pour ton propre business ou pour des clients. De nombreux étudiants ont commencé à proposer ce service et facturent entre $100 et $500 par client et par mois. La demande est énorme en Afrique et peu de gens maîtrisent vraiment Meta Ads."
    }
  ];

  const [faqs, setFaqs] = useState(defaultFaqs);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const { data, error } = await supabase
          .from('landing_page_sections')
          .select('*')
          .eq('section_key', 'faq')
          .single();

        if (error || !data?.content) return;

        const content = data.content as any;
        if (content.faqs?.length > 0) setFaqs(content.faqs);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      }
    };

    loadContent();
  }, []);

  return (
    <section className="relative py-20 cinematic-section overflow-hidden">
      <div className="absolute top-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-12 h-12 text-primary" />
            <h2 className="text-4xl md:text-5xl font-extrabold text-white cinematic-text-shadow">
              Questions Fréquentes
            </h2>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Tout ce que tu dois savoir avant de rejoindre Meta Ads Mastery
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-black/40 border border-primary/20 rounded-lg px-6 hover:border-primary/40 transition-all"
            >
              <AccordionTrigger className="text-left text-lg font-semibold text-white hover:text-primary py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-300 text-base leading-relaxed pb-6">
                <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;