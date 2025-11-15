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
  Users
} from "lucide-react";

const Landing = () => {
  const roles = [
    {
      title: "Customer",
      icon: ShoppingBag,
      description: "Discover products from local stores with transparent pricing",
      features: ["Location-aware shopping", "Real-time stock updates", "Secure payments"],
      gradient: "from-primary to-primary-glow",
    },
    {
      title: "Retailer",
      icon: Store,
      description: "Manage your store, inventory, and connect with wholesalers",
      features: ["Inventory management", "Order tracking", "B2B purchasing"],
      gradient: "from-secondary to-emerald-400",
    },
    {
      title: "Wholesaler",
      icon: Package,
      description: "Supply retailers with tiered pricing and bulk inventory",
      features: ["Bulk catalog", "Tiered pricing", "Retailer network"],
      gradient: "from-accent to-orange-400",
    },
  ];

  const features = [
    {
      icon: MapPin,
      title: "Location-Aware",
      description: "Find stores and products near you with distance-based filtering",
    },
    {
      icon: TrendingUp,
      title: "Smart Recommendations",
      description: "Personalized product suggestions based on your preferences",
    },
    {
      icon: Shield,
      title: "Transparent Pricing",
      description: "See MRP, taxes, and final prices upfront - no surprises",
    },
    {
      icon: Zap,
      title: "Real-Time Stock",
      description: "Live inventory updates with availability dates",
    },
    {
      icon: Users,
      title: "B2B Marketplace",
      description: "Retailers can source directly from wholesalers",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNkZGQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtMTEgOS0yMCAyMC0yMHYyMGgtMjB6TTAgMTRjMC0xMSA5LTIwIDIwLTIwdjIwSDB6TTAgNTRjMC0xMSA5LTIwIDIwLTIwdjIwSDB6TTM2IDU0YzAtMTEgOS0yMCAyMC0yMHYyMGgtMjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        
        <div className="container relative mx-auto px-4 py-20 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-block">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Zap className="h-4 w-4" />
                3-Sided Marketplace
              </span>
            </div>
            
            <h1 className="mb-6 bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-5xl font-bold tracking-tight text-transparent lg:text-7xl">
              Connect. Trade. Grow.
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground lg:text-xl">
              Your all-in-one marketplace connecting customers, retailers, and wholesalers.
              <br />
              Experience seamless local shopping with transparent pricing, real-time inventory, and secure transactions.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-glow shadow-glow">
                <Link to="/auth">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/explore">Explore Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight">A Platform for Everyone</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Whether you're buying, selling, or supplying, our platform is built for you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {roles.map((role, index) => (
              <Card key={index} className="overflow-hidden text-center shadow-lg transition-transform hover:-translate-y-2">
                <div className={`bg-gradient-to-br ${role.gradient} p-8`}>
                  <role.icon className="mx-auto h-16 w-16 text-white" />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 text-2xl font-bold">{role.title}</h3>
                  <p className="mb-4 text-muted-foreground">{role.description}</p>
                  <ul className="space-y-2 text-left">
                    {role.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight">Powerful Features</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need for a modern commerce experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold tracking-tight">Ready to Dive In?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join the marketplace of the future today.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-glow shadow-glow">
              <Link to="/auth">Create Your Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MarketPlace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
