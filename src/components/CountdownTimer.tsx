import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface Props {
  targetDate?: string;
  originalPrice?: string;
}

const CountdownTimer = ({ targetDate, originalPrice }: Props) => {
  const calculateTimeLeft = (): TimeLeft => {
    let endDate: Date;
    
    if (targetDate) {
      endDate = new Date(targetDate);
    } else {
      // Set countdown to 3 days from now as default
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);
      endDate.setHours(23, 59, 59, 999);
    }
    
    const difference = endDate.getTime() - new Date().getTime();
    
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]); // Add targetDate as dependency to recalculate when it changes

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-black/60 border border-yellow-400/30 rounded-lg p-3 sm:p-4 min-w-[60px] sm:min-w-[80px]">
      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 tabular-nums">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2 uppercase tracking-wider">{label}</div>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-2 border-red-500/50 rounded-xl p-4 sm:p-6 md:p-8 my-6 sm:my-8">
      <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 flex-wrap text-center">
        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 animate-pulse" />
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
          ⏰ L'Offre de Lancement Expire Dans :
        </h3>
      </div>
      
      <div className="flex justify-center gap-2 sm:gap-3 md:gap-6 mb-4 sm:mb-6">
        <TimeUnit value={timeLeft.days} label="Jours" />
        <TimeUnit value={timeLeft.hours} label="Heures" />
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <TimeUnit value={timeLeft.seconds} label="Sec" />
      </div>

      {originalPrice && (
        <div className="text-center px-2">
          <p className="text-red-400 font-bold text-base sm:text-lg">
            🔥 Après expiration, le prix passe à ${originalPrice} !
          </p>
          <p className="text-gray-300 text-xs sm:text-sm mt-2">
            Ne laisse pas passer cette opportunité unique
          </p>
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;