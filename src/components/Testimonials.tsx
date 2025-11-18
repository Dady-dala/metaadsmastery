import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star, TrendingUp, DollarSign, Users } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Aminata D.",
      location: "Dakar, Sénégal",
      business: "E-commerce Mode",
      image: "/lovable-uploads/a2a2d847-115a-4fd7-a165-218eed8cec5d.png",
      result: "+340% de ventes en 2 mois",
      investment: "Budget pub: $150/mois",
      revenue: "Revenus générés: $2,800/mois",
      testimonial: "Avant Meta Ads Mastery, je perdais de l'argent à chaque campagne. Maintenant, je génère 8 fois mon investissement pub tous les mois. La méthode WhatsApp Business change tout !",
      metrics: [
        { label: "ROI", value: "800%" },
        { label: "Clients/mois", value: "47" },
        { label: "Coût/client", value: "$3.19" }
      ]
    },
    {
      name: "Ibrahim K.",
      location: "Abidjan, Côte d'Ivoire",
      business: "Formations en ligne",
      image: "/lovable-uploads/8e6de494-14df-45d9-915b-b42bb90e363e.png",
      result: "De 0 à $5,200 en 3 mois",
      investment: "Budget pub: $200/mois",
      revenue: "2 formations vendues/jour",
      testimonial: "J'ai lancé ma première formation en ligne grâce aux compétences apprises. En 3 mois, j'ai généré plus de $5,000 juste avec Facebook Ads et WhatsApp. Sans site web !",
      metrics: [
        { label: "Ventes totales", value: "104" },
        { label: "Prix moyen", value: "$50" },
        { label: "Profit net", value: "$4,100" }
      ]
    },
    {
      name: "Fatou M.",
      location: "Lomé, Togo",
      business: "Freelance Meta Ads",
      image: "/lovable-uploads/6224ec25-cc9d-4c83-a164-7e6c05ed103c.png",
      result: "5 clients en 45 jours",
      investment: "0$ investissement personnel",
      revenue: "Revenus: $1,800/mois",
      testimonial: "J'ai suivi la formation sans rien connaître en pub. 45 jours plus tard, j'avais 5 clients qui me paient entre $250 et $500/mois pour gérer leurs pubs Facebook. Je suis maintenant freelance à temps plein !",
      metrics: [
        { label: "Clients actifs", value: "5" },
        { label: "Tarif moyen", value: "$360/mois" },
        { label: "Temps libre", value: "+60%" }
      ]
    },
    {
      name: "Moussa B.",
      location: "Bamako, Mali",
      business: "Restaurant & Livraison",
      image: "/lovable-uploads/d88109e2-80ae-43d5-8fd6-4b756e9804c8.png",
      result: "+180 commandes/semaine",
      investment: "Budget pub: $80/mois",
      revenue: "CA additionnel: $1,600/mois",
      testimonial: "Mon restaurant tournait au ralenti. Avec les pubs Facebook ciblées sur Bamako et le système WhatsApp pour les commandes, on fait maintenant 25 livraisons par jour. Incroyable !",
      metrics: [
        { label: "Commandes/jour", value: "25+" },
        { label: "Panier moyen", value: "$8.50" },
        { label: "ROI", value: "2000%" }
      ]
    },
    {
      name: "Yacine A.",
      location: "Alger, Algérie",
      business: "Produits beauté",
      image: "/lovable-uploads/b149aa1b-4d2f-46e1-a7d6-b2014c5fa9f0.png",
      result: "3,200 prospects qualifiés",
      investment: "Budget pub: $300/mois",
      revenue: "Ventes: $4,800/mois",
      testimonial: "En tant que revendeur de produits de beauté, Facebook Ads m'a permis de toucher des milliers de clientes. Mon WhatsApp Business ne désemplit plus. Je dois maintenant recruter une assistante !",
      metrics: [
        { label: "Prospects/mois", value: "3,200" },
        { label: "Taux conversion", value: "18%" },
        { label: "Ventes closes", value: "576" }
      ]
    },
    {
      name: "Koffi E.",
      location: "Ouagadougou, Burkina Faso",
      business: "Coaching Business",
      image: "/lovable-uploads/ee7afda4-e453-4149-bb4a-cbc6c4312319.png",
      result: "Premier lancement à $3,400",
      investment: "Budget pub: $120",
      revenue: "34 inscriptions à $100",
      testimonial: "Mon premier lancement de programme de coaching : 34 personnes inscrites grâce à une seule campagne Facebook de $120. Le retour sur investissement est fou. La formation paie pour elle-même 100x.",
      metrics: [
        { label: "ROI campagne", value: "2,833%" },
        { label: "Coût/inscription", value: "$3.53" },
        { label: "Profit net", value: "$3,280" }
      ]
    }
  ];

  return (
    <section className="relative py-20 cinematic-section overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 cinematic-text-shadow">
            Ils Ont Transformé Leur Business
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Des entrepreneurs africains ordinaires qui génèrent maintenant des revenus extraordinaires grâce à Meta Ads
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-gradient-to-br from-black/60 to-black/40 border-primary/20 hover:border-primary/40 transition-all hover:scale-105 duration-300">
              <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-primary/50"
                  />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">{testimonial.name}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">{testimonial.location}</p>
                    <p className="text-primary text-xs sm:text-sm font-semibold">{testimonial.business}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-400 font-bold text-base sm:text-lg">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    {testimonial.result}
                  </div>
                  <div className="text-gray-300 text-xs sm:text-sm">
                    <p><DollarSign className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />{testimonial.investment}</p>
                    <p><Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />{testimonial.revenue}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <p className="text-gray-300 italic leading-relaxed text-sm sm:text-base">
                  "{testimonial.testimonial}"
                </p>

                <div className="grid grid-cols-3 gap-2 pt-3 sm:pt-4 border-t border-primary/20">
                  {testimonial.metrics.map((metric, idx) => (
                    <div key={idx} className="text-center">
                      <p className="text-primary font-bold text-base sm:text-lg">{metric.value}</p>
                      <p className="text-gray-400 text-[10px] sm:text-xs">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-2xl font-bold text-white mb-4">
            📈 Résultats Moyens de Nos Étudiants :
          </p>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-black/40 border border-primary/20 rounded-lg p-6">
              <p className="text-4xl font-bold text-primary mb-2">+287%</p>
              <p className="text-gray-300">ROI Moyen</p>
            </div>
            <div className="bg-black/40 border border-primary/20 rounded-lg p-6">
              <p className="text-4xl font-bold text-green-400 mb-2">$2,840</p>
              <p className="text-gray-300">Revenus/mois</p>
            </div>
            <div className="bg-black/40 border border-primary/20 rounded-lg p-6">
              <p className="text-4xl font-bold text-yellow-400 mb-2">45j</p>
              <p className="text-gray-300">Premiers résultats</p>
            </div>
            <div className="bg-black/40 border border-primary/20 rounded-lg p-6">
              <p className="text-4xl font-bold text-blue-400 mb-2">94%</p>
              <p className="text-gray-300">Satisfaits</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;