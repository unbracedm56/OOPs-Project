import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ShoppingBag, 
  Store, 
  Package, 
  TrendingUp, 
  MapPin, 
  Shield,
  Zap,
  Users,
  Bolt,
  Rocket,
  Clock,
  Award,
  ArrowRight
} from "lucide-react";

const Landing = () => {
  const roles = [
    {
      title: "Customer",
      icon: ShoppingBag,
      description: "Experience lightning-fast shopping with instant deals at your fingertips",
      features: ["⚡ Real-time flash deals", "🎯 Location-aware shopping", "💳 Instant secure checkout"],
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      accentColor: "orange",
    },
    {
      title: "Retailer",
      icon: Store,
      description: "Supercharge your business with instant inventory management and B2B connections",
      features: ["⚡ Lightning inventory sync", "📊 Real-time analytics", "🤝 Instant wholesaler connect"],
      gradient: "from-blue-600 via-blue-700 to-indigo-800",
      accentColor: "blue",
    },
    {
      title: "Wholesaler",
      icon: Package,
      description: "Scale at lightning speed with automated bulk operations and instant order processing",
      features: ["⚡ Bulk order automation", "💰 Dynamic pricing tiers", "🌐 Instant network expansion"],
      gradient: "from-orange-500 via-orange-600 to-red-600",
      accentColor: "orange",
    },
  ];

  const features = [
    {
      icon: Bolt,
      title: "Lightning Speed",
      description: "Blazing fast transactions and real-time updates across all operations",
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Rocket,
      title: "Instant Deals",
      description: "Flash deals and limited-time offers that disappear in a blink",
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Clock,
      title: "Real-Time Everything",
      description: "Live inventory, instant notifications, and up-to-the-second pricing",
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Shield,
      title: "Secure & Transparent",
      description: "Fort-Knox security with crystal clear pricing - no hidden surprises",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: MapPin,
      title: "Location Smart",
      description: "Find the nearest deals with GPS-powered distance filtering",
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Award,
      title: "Premium Quality",
      description: "Curated products and verified sellers for peace of mind",
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Animated Lightning Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-400/5 dark:bg-orange-500/3 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Lightning Bolt Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-3">
          <svg className="absolute top-20 left-10 w-32 h-32 text-orange-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
          </svg>
          <svg className="absolute top-40 right-20 w-24 h-24 text-blue-600 animate-pulse delay-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
          </svg>
          <svg className="absolute bottom-40 left-1/3 w-20 h-20 text-orange-400 animate-pulse delay-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
          </svg>
        </div>

        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-5xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-block animate-bounce-slow">
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/50">
                <Zap className="h-5 w-5 animate-pulse" />
                Lightning Deals, Lasting Thrills
                <Bolt className="h-5 w-5 animate-pulse" />
              </span>
            </div>
            
            {/* Main Headline */}
            <h1 className="mb-8 text-6xl md:text-7xl lg:text-8xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 dark:from-orange-400 dark:via-orange-500 dark:to-orange-600 bg-clip-text text-transparent drop-shadow-lg">
                Shop at
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-800 dark:from-blue-500 dark:via-blue-600 dark:to-indigo-700 bg-clip-text text-transparent drop-shadow-lg">
                Lightning Speed
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="mb-12 text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
              Experience the <span className="text-orange-600 dark:text-orange-500 font-bold">thrill</span> of instant shopping.
              <br className="hidden md:block" />
              Connect customers, retailers, and wholesalers in a <span className="text-blue-600 dark:text-blue-500 font-bold">flash</span>!
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300 text-lg px-8 py-6 rounded-full group">
                <Link to="/auth">
                  <Bolt className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  Start Shopping Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 shadow-lg text-lg px-8 py-6 rounded-full group transition-all duration-300">
                <Link to="/dashboard">
                  <Rocket className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                  Explore Flash Deals
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-orange-500" />
                <span>Premium Quality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Lightning Bolts */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse" />
      </section>

      {/* Roles Section */}
      <section className="relative py-24 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 mb-4 text-orange-600 dark:text-orange-500">
              <Bolt className="h-6 w-6" />
              <span className="text-sm font-bold uppercase tracking-wider">Choose Your Path</span>
              <Bolt className="h-6 w-6" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-500 dark:to-indigo-600 bg-clip-text text-transparent">
                Built for Everyone
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Whether you're buying, selling, or supplying—we've got your back
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {roles.map((role, index) => (
              <Card 
                key={index} 
                className="group overflow-hidden border-2 hover:border-orange-500 dark:hover:border-orange-600 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-gradient-to-br from-card to-card/80"
              >
                <div className={`relative bg-gradient-to-br ${role.gradient} p-10 overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-500" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                  <role.icon className="relative mx-auto h-20 w-20 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
                  <Zap className="absolute bottom-4 right-4 h-8 w-8 text-white/30 group-hover:text-white/60 group-hover:rotate-12 transition-all duration-500" />
                </div>
                <div className="p-8">
                  <h3 className="mb-4 text-3xl font-black">{role.title}</h3>
                  <p className="mb-6 text-muted-foreground leading-relaxed">{role.description}</p>
                  <ul className="space-y-3">
                    {role.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 group/item">
                        <span className="text-lg mt-0.5 group-hover/item:scale-125 transition-transform duration-300">{feature.split(' ')[0]}</span>
                        <span className="text-sm font-medium">{feature.split(' ').slice(1).join(' ')}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white group/btn"
                    asChild
                  >
                    <Link to="/auth">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-500">
              <Rocket className="h-6 w-6" />
              <span className="text-sm font-bold uppercase tracking-wider">Why Blitz Bazaar</span>
              <Rocket className="h-6 w-6" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
              <span className="bg-gradient-to-r from-orange-500 to-orange-700 dark:from-orange-400 dark:to-orange-600 bg-clip-text text-transparent">
                Supercharged Features
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need for a lightning-fast commerce experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 hover:border-orange-500/50 dark:hover:border-orange-600/50"
              >
                <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${feature.bgColor} ${feature.color} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-blue-600/10 to-orange-500/10 dark:from-orange-600/5 dark:via-blue-700/5 dark:to-orange-600/5" />
        <div className="container relative mx-auto px-4 text-center">
          <Zap className="h-20 w-20 mx-auto mb-6 text-orange-500 animate-pulse" />
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-blue-600 dark:from-orange-400 dark:via-orange-500 dark:to-blue-500 bg-clip-text text-transparent">
              Ready for the Rush?
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands experiencing the thrill of lightning-fast deals
          </p>
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all duration-300 text-xl px-12 py-8 rounded-full group"
          >
            <Link to="/auth">
              <Bolt className="mr-3 h-6 w-6 group-hover:animate-spin" />
              Create Your Account Now
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-6">
            <img
              src="/logos/blitz-bazaar-landing-light.jpg"
              alt="Blitz Bazaar"
              className="h-12 w-auto object-contain dark:hidden opacity-80"
            />
            <img
              src="/logos/blitz-bazaar-landing-dark.jpg"
              alt="Blitz Bazaar"
              className="h-12 w-auto object-contain hidden dark:block opacity-80"
            />
            <p className="text-center text-muted-foreground">
              &copy; {new Date().getFullYear()} Blitz Bazaar. Lightning deals, lasting thrills.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-orange-500 transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-orange-500 transition-colors">Privacy</Link>
              <Link to="/contact" className="hover:text-orange-500 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
