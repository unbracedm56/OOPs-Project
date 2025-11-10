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
                <Link to="/dashboard">Browse Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold lg:text-4xl">Choose Your Role</h2>
          <p className="text-lg text-muted-foreground">
            Whether you're buying, selling, or supplying - we've got you covered
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.title}
                className="group relative overflow-hidden border-2 p-6 transition-all hover:scale-105 hover:shadow-elegant"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-5 transition-opacity group-hover:opacity-10`} />
                
                <div className="relative">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="mb-2 text-2xl font-bold">{role.title}</h3>
                  <p className="mb-4 text-muted-foreground">{role.description}</p>
                  
                  <ul className="space-y-2">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold lg:text-4xl">Why Choose Us</h2>
          <p className="text-lg text-muted-foreground">
            Built for modern commerce with powerful features
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 transition-all hover:shadow-card"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-12 text-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNkZGQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAtMTEgOS0yMCAyMC0yMHYyMGgtMjB6TTAgMTRjMC0xMSA5LTIwIDIwLTIwdjIwSDB6TTAgNTRjMC0xMSA5LTIwIDIwLTIwdjIwSDB6TTM2IDU0YzAtMTEgOS0yMCAyMC0yMHYyMGgtMjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
          
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of customers, retailers, and wholesalers already trading smarter
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-glow shadow-glow">
              <Link to="/auth">Create Account</Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Marketplace. Built with ❤️ for modern commerce.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
