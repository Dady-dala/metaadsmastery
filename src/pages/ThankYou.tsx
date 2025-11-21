import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ThankYou = () => {
  const navigate = useNavigate();
  const whatsappGroupUrl = "https://chat.whatsapp.com/G9oQ3mJuK6U8kuJle3qsdt";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <div className="max-w-2xl w-full text-center space-y-8 py-12">
        <div className="flex justify-center">
          <CheckCircle className="w-24 h-24 text-green-500 animate-in zoom-in duration-500" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Félicitations ! 🎉
          </h1>
          <p className="text-xl text-muted-foreground">
            Votre inscription à <span className="font-semibold text-primary">Meta Ads Mastery</span> est confirmée !
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Prochaine Étape : Rejoignez Notre Groupe WhatsApp
          </h2>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              Pour finaliser votre paiement et accéder immédiatement à la formation, rejoignez notre groupe WhatsApp privé.
            </p>
            <p className="font-medium text-foreground">
              Vous y trouverez :
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Les instructions de paiement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Un accès direct à votre formation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Un support dédié pour répondre à vos questions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Une communauté d'entrepreneurs motivés</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <Button
              size="lg"
              className="w-full md:w-auto px-8 py-6 text-lg font-semibold"
              onClick={() => window.open(whatsappGroupUrl, '_blank')}
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Rejoindre le Groupe WhatsApp
            </Button>
          </div>
        </div>

        <div className="pt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
