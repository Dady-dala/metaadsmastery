import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, TrendingUp, Users, Clock, Shield, ArrowDownLeft, ArrowDownRight } from "lucide-react";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
const VideoGrowth = () => {
  return <>
      <SEO title="For SaaS Founders Who Are Tired of Unpredictable Revenue Growth | ContentFarm" description="Add $50K+ in New MRR Every Quarter With Our Done-For-You Video Growth System. We build your entire video conversion funnel from scratch." keywords="saas revenue growth, video growth system, mrr growth, video marketing for saas, predictable revenue" />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                For Founders Who Are Tired of{" "}
                <span className="gradient-text">Unpredictable Revenue Growth</span>
              </h1>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-8">
                Add $50K+ in New MRR Every Quarter With Our Done-For-You Video Growth System
              </p>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">We build your entire video conversion funnel from scratch. </p>
              <Button size="lg" className="text-lg px-10 py-6" onClick={() => window.location.href = 'https://calendly.com/kvit/15-minutes-discovery-call?month=2025-11'}>
                Book Your Free Strategy Call Now <ArrowRight className="ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
              Does This Sound Familiar?
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">You have a world-class product that could genuinely change your customers' businesses. But your revenue growth is a rollercoaster. One month you hit your targets, the next… you're scrambling to explain the dip to your board.</p>
            <p className="text-lg font-semibold mb-4">You've tried everything:</p>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-3">Paid Ads</h3>
                <p className="text-muted-foreground">
                  The cost-per-acquisition is skyrocketing, and you're attracting more free trial abusers than paying customers. Your CAC is climbing faster than your LTV, and your unit economics are broken.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-3">Content Marketing</h3>
                <p className="text-muted-foreground">
                  You're publishing blog posts and hoping for organic traffic, but conversions are anemic. Visitors bounce. Trials expire. Revenue stays flat.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-3">Referral Programs & Partnerships</h3>
                <p className="text-muted-foreground">
                  It's a chaotic, time-sucking nightmare of recruiting, managing, and getting ghosted by partners who promise the world but deliver nothing.
                </p>
              </Card>
            </div>
            <p className="text-lg text-muted-foreground mt-8 leading-relaxed">
              It's not just frustrating; it's <span className="font-bold text-foreground">terrifying</span>. You're burning cash, your growth has stalled, and you have this nagging fear that you're one bad quarter away from having to make some very tough decisions—like layoffs, down rounds, or worse.
            </p>
          </div>
        </section>

        {/* Reality Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-destructive">
              The Brutal Reality: Your Competitors Are Stealing Your Market Share
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              While you're stuck on the content hamster wheel, your competitors are everywhere. They're dominating your target customers' LinkedIn feeds, YouTube searches, and TikTok streams with authentic, high-value video content.
            </p>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              They're building trust, educating the market, and converting your best prospects into paying customers before they even know you exist. Every day you delay your video strategy, you're not just standing still—you're falling further behind. The gap is widening, and it's getting exponentially harder to catch up.
            </p>
            <p className="text-xl font-bold">This isn't a game you can afford to lose.</p>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
              Imagine a New Reality…
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                Imagine opening your Stripe dashboard every Monday to see a steady stream of new subscriptions rolling in. Not a trickle. Not a spike-and-crash. A <span className="font-bold text-foreground">predictable, compounding flow</span> of new MRR that you can count on, month after month.
              </p>
              <p>
                Imagine prospects who have already been educated by your video content, who understand your value proposition, and who sign up for paid plans without needing a sales call. Or if they do book a call, they're already 80% sold and just need final confirmation.
              </p>
              <p>
                Imagine a world where your customer acquisition engine runs on autopilot, where your trial-to-paid conversion rate climbs from 10% to 25%, and where your churn drops because new customers actually understand how to use your product from day one.
              </p>
              <p className="text-xl font-bold text-foreground text-center pt-4">
                Imagine having a predictable, scalable, and profitable revenue growth machine that finally gives you the freedom, confidence, and peace of mind you deserve as a founder.
              </p>
              <p className="text-center font-semibold text-foreground">
                This isn't a fantasy. This is the power of a Done-For-You Video Growth System.
              </p>
            </div>
          </div>
        </section>

        {/* Two Paths Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                We Offer Two Paths to Predictable Video Growth
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Choose the model that fits your business goals and growth stage.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 relative">
              {/* Luxurious Animated Arrows for Each Path */}
              <div className="hidden lg:flex absolute -top-12 left-1/2 -translate-x-1/2 gap-32 z-10">
                <motion.div
                  animate={{ 
                    x: [-5, -10, -5], 
                    y: [0, 8, 0],
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                  }}
                  className="drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                >
                  <ArrowDownLeft 
                    className="w-12 h-12 text-primary" 
                    strokeWidth={2} 
                    style={{
                      filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.6))"
                    }}
                  />
                </motion.div>
                <motion.div
                  animate={{ 
                    x: [5, 10, 5], 
                    y: [0, 8, 0],
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                  }}
                  className="drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                >
                  <ArrowDownRight 
                    className="w-12 h-12 text-primary" 
                    strokeWidth={2}
                    style={{
                      filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.6))"
                    }}
                  />
                </motion.div>
              </div>
              {/* Path 1: Content Machine */}
              <Card className="p-8 border-2 border-primary">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Path 1: Creator-Led</h3>
                  <p className="text-lg font-semibold text-primary">In 30 Days We'll Bring You 50+ Creators Posting Videos About Your Service Fully Done-For-You</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    (You Only Pay for Views, and All New MRR Is Yours)
                  </p>
                </div>

                <div className="space-y-6 mb-8">
                  <div>
                    <h4 className="font-bold text-lg mb-2">The Problem</h4>
                    <p className="text-muted-foreground">
                      Your customer acquisition cost is crushing your margins. $700+ per customer and rising. You're stuck in an endless loop: recruit affiliates → they ghost → recruit again → they produce garbage → repeat. You're burning cash and time with zero return.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-2">The Reality</h4>
                    <p className="text-muted-foreground">
                      Your competitors aren't wasting time vetting affiliates. They've already built 50+ creators posting daily across TikTok, YouTube, and Instagram. They're dominating your market with authentic content that converts 4X better than your paid ads. While you're stuck with underperforming affiliates, they're scaling.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-2">The Solution</h4>
                    <p className="text-muted-foreground">We build you a performance-based video creator team in 30 days. 50+ vetted creators. Daily content across all platforms. You pay $1-3 per 1,000 views (only for results). You keep 100% of customer revenue. Cut your customer acquisition cost by 40-50%. No upfront fees.</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="font-bold">What You Get:</p>
                  {["50+ high-quality video clips per month on autopilot", "Predictable content pipeline across TikTok, YouTube, Instagram, and X", "Pre-vetted, brand-safe creators (90% qualification rate)", "Performance-based pricing: You only pay for views that actually happen", "79% higher conversion rates from creator-led content", "60% increase in qualified leads within 90 days"].map((item, i) => <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>)}
                </div>

                <div className="mb-6">
                  <p className="font-bold mb-2">Perfect For:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• SaaS companies spending $10K+/month on paid ads with rising CAC</li>
                    <li>• Founders tired of managing unreliable affiliate programs</li>
                    <li>• Companies that need authentic social proof and user-generated content at scale</li>
                  </ul>
                </div>

                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={() => window.location.href = 'https://contentfarm.club/creator-led'}
                >
                  Check Our 27 Steps Performance System →
                </Button>
              </Card>

              {/* Path 2: Conversion Video Framework */}
              <Card className="p-8 border-2 border-primary">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Path 2: The Conversion Video Framework™</h3>
                  <p className="text-lg font-semibold text-primary">
                    We Build Your High-Converting Video Funnel From Scratch
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    (You Show Up on Camera 2 Hours/Month. We Handle Everything Else.)
                  </p>
                </div>

                <div className="mb-8">
                  <h4 className="font-bold text-lg mb-4">How It Works: Your 3-Step Path to Predictable MRR Growth</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-primary pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                        <h5 className="font-bold">Strategy & Scripting</h5>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1"><span className="font-semibold">You:</span> Join a 30-minute kickoff call to define your revenue goals and ideal customer.</p>
                      <p className="text-sm text-muted-foreground"><span className="font-semibold">We:</span> Map your entire video conversion funnel, conduct competitor analysis, and write the first month of scripts using our neuroscience-based formulas optimized for conversions.</p>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                        <h5 className="font-bold">Filming</h5>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1"><span className="font-semibold">You:</span> Sit in front of a camera for 2 hours per month. That's it.</p>
                      <p className="text-sm text-muted-foreground"><span className="font-semibold">We:</span> Direct the remote recording session, ensuring you look and sound like a world-class authority.</p>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                        <h5 className="font-bold">Launch & Optimization</h5>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1"><span className="font-semibold">You:</span> Watch the new MRR roll in.</p>
                      <p className="text-sm text-muted-foreground"><span className="font-semibold">We:</span> Handle all editing, production, platform-specific optimization, and A/B testing, turning your 2 hours of raw footage into 20+ high-performing video assets designed to drive sign-ups and reduce churn.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="font-bold">What You Get:</p>
                  {["Product Demo Videos: Turn prospects into customers with demos that showcase your SaaS like never before", "Explainers & Onboarding Videos: Reduce churn by 40% with crystal-clear onboarding that gets users to 'aha!' moments faster", "Webinar & Event Repurposing: Transform one event into 10+ pieces of engaging content that work 24/7 for your business", "YouTube Content Strategy: Build authority and generate leads with YouTube content that ranks on page 1 and converts viewers"].map((item, i) => <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>)}
                </div>

                <div className="mb-6">
                  <p className="font-bold mb-2">Perfect For:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• SaaS founders who want to build personal brand authority</li>
                    <li>• Companies with complex products that need detailed explainer content</li>
                    <li>• Businesses focused on thought leadership and organic growth</li>
                    <li>• Teams that want full control over messaging and brand voice</li>
                  </ul>
                </div>

                <Button 
                  size="lg" 
                  className="w-full" 
                  onClick={() => window.location.href = 'https://contentfarm.club/#services'}
                >
                  Check More →
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Guarantee Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Our "More Revenue or We Work For Free" Guarantee
              </h2>
              <p className="text-xl text-muted-foreground">
                We are so confident in our system that we offer the most powerful guarantee in the industry.
              </p>
            </div>

            <Card className="p-8">
              <p className="text-lg mb-6">
                We will agree on a single, measurable revenue KPI for our engagement. This could be:
              </p>
              <div className="space-y-3 mb-6">
                {["$50K+ in new MRR added per quarter", "A 30% increase in trial-to-paid conversion rate", "A 25% reduction in customer acquisition cost (CAC)", "A 20% increase in customer lifetime value (LTV)"].map((item, i) => <div key={i} className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>)}
              </div>

              <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 mb-6">
                <p className="text-lg font-bold mb-4">If we do not hit that target within 90 days, you have two options:</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg shrink-0">1</div>
                    <p className="text-muted-foreground">You can stop the engagement and receive a <span className="font-bold text-foreground">100% full refund</span> of every penny you've paid. No questions asked.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg shrink-0">2</div>
                    <p className="text-muted-foreground">We will continue to work <span className="font-bold text-foreground">for free</span>, producing and optimizing videos, until we hit your agreed-upon revenue target.</p>
                  </div>
                </div>
              </div>

              <p className="text-xl font-bold text-center">
                The risk is 100% on us. You either get the revenue growth you need, or you get your money back.
              </p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Build Your Predictable Revenue Machine?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We have a limited number of onboarding slots available each month to ensure we deliver exceptional results for every client. <span className="font-bold text-foreground">Currently, we only have 2 slots remaining for this month.</span>
            </p>
            

            <Card className="p-8 mb-8">
              <h3 className="text-2xl font-bold mb-6">On this call, we will:</h3>
              <div className="grid sm:grid-cols-2 gap-6 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Audit your current conversion funnel</p>
                    <p className="text-sm text-muted-foreground">Identify revenue leaks</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Show you the biggest opportunity</p>
                    <p className="text-sm text-muted-foreground">Unlock immediate MRR growth</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Recommend your best path</p>
                    <p className="text-sm text-muted-foreground">Creator-Led or Framework™</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold mb-1">Map your 90-day plan</p>
                    <p className="text-sm text-muted-foreground">With specific revenue projections</p>
                  </div>
                </div>
              </div>
            </Card>

            <Button size="lg" className="text-xl px-12 py-8 h-auto" onClick={() => window.location.href = 'https://calendly.com/kvit/15-minutes-discovery-call?month=2025-11'}>
              Book Your Free Strategy Call Now <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              (Only 2 Slots Left This Month)
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        

        {/* Final Choice Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center">
              You Have Two Choices…
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="p-8 border-2 border-destructive/20">
                <h3 className="text-2xl font-bold mb-4 text-destructive">Option 1: Do Nothing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Continue with the stressful rollercoaster of unpredictable revenue, keep wasting money on tactics that don't work, and watch your competitors pull further and further ahead.
                </p>
              </Card>

              <Card className="p-8 border-2 border-primary">
                <h3 className="text-2xl font-bold mb-4 text-primary">Option 2: Take Action</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Book a risk-free strategy call and let us show you the exact blueprint for building a predictable, scalable video growth machine that adds $50K+ in new MRR every quarter.
                </p>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold mb-8">The choice is yours.</p>
              <Button size="lg" className="text-xl px-12 py-8 h-auto" onClick={() => window.location.href = 'https://calendly.com/kvit/15-minutes-discovery-call?month=2025-11'}>
                Book My Free Strategy Call & Secure My Spot <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4 font-semibold">
                (Only 2 Slots Left This Month)
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>;
};
export default VideoGrowth;