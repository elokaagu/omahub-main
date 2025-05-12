
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { useToast } from "@/hooks/use-toast";

interface NewsletterFormProps {
  location?: string;
  className?: string;
}

export function NewsletterForm({ location, className }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;
    
    setLoading(true);
    
    // Simulate API call
    try {
      // In production, this would be an API call to your newsletter service
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      toast({
        title: "Successfully subscribed",
        description: "Thank you for joining our fashion community.",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section 
      className={`w-full py-12 bg-gradient-to-br from-[#d4b285] via-[#e6ceb5] to-[#fde1d3] ${className}`}
    >
      <div className="container px-4 mx-auto text-center max-w-3xl">
        <h2 className="font-source text-3xl md:text-4xl text-white mb-3">
          Join Our Fashion Community
        </h2>
        
        <p className="text-white/90 mx-auto max-w-xl mb-6">
          Get exclusive previews, designer spotlights, and early access to new collections straight to your inbox.
        </p>

        <div className="bg-white/95 rounded-lg shadow-md p-6">
          {success ? (
            <div className="bg-oma-beige/30 p-6 rounded-lg text-center">
              <h3 className="text-xl font-medium text-oma-plum mb-2">
                Thank You for Subscribing
              </h3>
              <p className="text-oma-cocoa/80">
                Watch your inbox for something beautiful coming your way soon.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-left">
                  <h4 className="font-medium text-oma-plum border-b border-oma-gold/30 pb-2 mb-3">
                    What You'll Get
                  </h4>
                  <ul className="space-y-2 text-sm text-oma-cocoa">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-oma-gold mt-2"/>
                      <span>Early access to new collections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-oma-gold mt-2"/>
                      <span>Exclusive designer interviews</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-oma-gold mt-2"/>
                      <span>Special event invitations</span>
                    </li>
                  </ul>
                </div>
                
                <div className="text-left">
                  <h4 className="font-medium text-oma-plum border-b border-oma-gold/30 pb-2 mb-3">
                    Member Benefits
                  </h4>
                  <ul className="space-y-2 text-sm text-oma-cocoa">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-oma-gold mt-2"/>
                      <span>VIP access to sales</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-oma-gold mt-2"/>
                      <span>Trend forecasts & style tips</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-oma-gold mt-2"/>
                      <span>Styling consultation invites</span>
                    </li>
                  </ul>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border-oma-gold/20 focus-visible:ring-oma-plum flex-grow"
                  />
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-[#391c25] hover:bg-[#391c25]/90 text-white"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-t-transparent border-white/80 animate-spin rounded-full"></span>
                        <span>Subscribing...</span>
                      </span>
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-oma-cocoa/70 mt-3">
                  Join our community to discover new designers and collections. No spam—just style.
                  {location && <span className="ml-1">From {location}.</span>}
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
