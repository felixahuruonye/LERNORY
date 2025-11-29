import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, BookOpen, Code2, Mic } from "lucide-react";

const PRICING_TIERS = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    priceNaira: 0,
    features: [
      "10 chats per day",
      "5 image generations",
      "2 projects",
      "Basic AI tutor",
      "Study memory",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For serious learners",
    priceNaira: 5000,
    features: [
      "Unlimited chats",
      "50 image generations/month",
      "20 projects",
      "Advanced AI tutor with Gemini",
      "Website generator",
      "CBT practice mode",
      "Voice features",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "For schools & educators",
    priceNaira: 15000,
    features: [
      "Everything in Pro",
      "Unlimited generations",
      "Unlimited projects",
      "Team management (5 users)",
      "Advanced analytics",
      "Custom branding",
      "API access",
      "Dedicated support",
    ],
    popular: false,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState("");

  const handleSubscribe = async (tierId: string) => {
    if (tierId === "free") {
      toast({ title: "Already on Free plan", description: "Free access includes all basic features" });
      return;
    }

    setLoading(tierId);
    try {
      const response = await apiRequest("POST", "/api/payments/initialize", {
        tierId,
        email: user?.email,
      });
      const data = await response.json();
      
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        toast({ title: "Error", description: "Failed to initialize payment", variant: "destructive" });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({ title: "Error", description: "Payment initialization failed", variant: "destructive" });
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-primary/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Simple, Transparent Pricing</h1>
            <p className="text-muted-foreground mt-2">Choose the perfect LEARNORY plan for your learning journey</p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative transition-all border-primary/20 ${tier.popular ? "ring-2 ring-primary scale-105" : ""}`}
              data-testid={`card-pricing-${tier.id}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground" data-testid={`badge-popular-${tier.id}`}>
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {tier.priceNaira === 0 ? "Free" : `₦${tier.priceNaira.toLocaleString()}`}
                    </span>
                    {tier.priceNaira > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loading !== "" && loading !== tier.id}
                  data-testid={`button-subscribe-${tier.id}`}
                >
                  {loading === tier.id ? "Processing..." : tier.id === "free" ? "Current Plan" : "Get Started"}
                </Button>

                <div className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3" data-testid={`feature-${tier.id}-${idx}`}>
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-foreground">Feature Comparison</h2>
          <div className="rounded-lg border border-primary/10 overflow-hidden">
            <div className="grid grid-cols-4 bg-background/50">
              <div className="p-4 font-semibold border-r border-primary/10">Feature</div>
              <div className="p-4 font-semibold border-r border-primary/10">Free</div>
              <div className="p-4 font-semibold border-r border-primary/10">Pro</div>
              <div className="p-4 font-semibold">Premium</div>
            </div>
            {[
              { feature: "AI Chat", free: "✓", pro: "✓", premium: "✓" },
              { feature: "Image Generation", free: "5/month", pro: "50/month", premium: "Unlimited" },
              { feature: "Website Builder", free: "✗", pro: "✓", premium: "✓" },
              { feature: "CBT Practice", free: "✗", pro: "✓", premium: "✓" },
              { feature: "Voice Features", free: "✗", pro: "✓", premium: "✓" },
              { feature: "Team Access", free: "✗", pro: "✗", premium: "✓" },
            ].map((row, idx) => (
              <div key={idx} className="grid grid-cols-4 border-t border-primary/10">
                <div className="p-4 text-sm font-medium border-r border-primary/10">{row.feature}</div>
                <div className="p-4 text-sm border-r border-primary/10">{row.free}</div>
                <div className="p-4 text-sm border-r border-primary/10">{row.pro}</div>
                <div className="p-4 text-sm">{row.premium}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-foreground">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I change my plan anytime?",
                a: "Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all Paystack payment methods including cards, transfers, and mobile money."
              },
              {
                q: "Is there a free trial?",
                a: "Start with our free plan with no credit card required. Upgrade whenever you're ready."
              },
              {
                q: "Do you offer student discounts?",
                a: "Contact our support team at support@learnory.com for special pricing for students and schools."
              },
            ].map((faq, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-primary/10">
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
