import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Clock, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SearchHistoryProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchContext?: string; // e.g., 'customer-dashboard', 'wholesaler-marketplace'
  maxHistoryItems?: number;
}

export const SearchHistory = ({
  value,
  onChange,
  placeholder = "Search products...",
  searchContext = "search",
  maxHistoryItems = 10,
}: SearchHistoryProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("SearchHistory - Current user:", user?.id);
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Load search history from Supabase
  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) {
        console.log("No userId, skipping history load");
        return;
      }

      console.log("Loading search history for:", { userId, searchContext });

      const { data, error } = await supabase
        .from("search_history")
        .select("search_query")
        .eq("user_id", userId)
        .eq("search_context", searchContext)
        .order("created_at", { ascending: false })
        .limit(maxHistoryItems);

      if (error) {
        console.error("Failed to load search history:", error);
        return;
      }

      console.log("Loaded search history data:", data);

      if (data) {
        // Get unique search queries
        const uniqueQueries = [...new Set(data.map(item => item.search_query))];
        setHistory(uniqueQueries);
        console.log("Set history state to:", uniqueQueries);
      }
    };

    loadHistory();
  }, [userId, searchContext, maxHistoryItems]);

  // Handle clicks outside to close history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addToHistory = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      console.log("Search term is empty, not saving");
      return;
    }
    
    if (!userId) {
      console.log("No user ID, not saving to history");
      return;
    }

    console.log("Saving search to history:", { searchTerm, userId, searchContext });

    // Insert into Supabase
    const { data, error } = await supabase
      .from("search_history")
      .insert({
        user_id: userId,
        search_query: searchTerm,
        search_context: searchContext,
      })
      .select();

    if (error) {
      console.error("Failed to save search history:", error);
      return;
    }

    console.log("Successfully saved search history:", data);

    // Update local state immediately
    const newHistory = [
      searchTerm,
      ...history.filter((item) => item !== searchTerm),
    ].slice(0, maxHistoryItems);

    setHistory(newHistory);
    console.log("Updated local history:", newHistory);
  };

  const removeFromHistory = async (searchTerm: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!userId) return;

    // Delete from Supabase
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("user_id", userId)
      .eq("search_query", searchTerm)
      .eq("search_context", searchContext);

    if (error) {
      console.error("Failed to remove search history:", error);
      return;
    }

    // Update local state
    const newHistory = history.filter((item) => item !== searchTerm);
    setHistory(newHistory);
  };

  const clearHistory = async () => {
    if (!userId) return;

    // Delete all from Supabase for this context
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("user_id", userId)
      .eq("search_context", searchContext);

    if (error) {
      console.error("Failed to clear search history:", error);
      return;
    }

    setHistory([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Show history dropdown when typing
    if (!showHistory) {
      setShowHistory(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      addToHistory(value.trim());
      setShowHistory(false);
      // Keep the search term in the input
    }
  };

  const handleHistoryItemClick = (searchTerm: string) => {
    onChange(searchTerm);
    addToHistory(searchTerm); // Save when clicking a history item
    setShowHistory(false);
  };

  const handleInputClick = () => {
    setShowHistory(true);
  };

  const filteredHistory = history.filter((item) =>
    item.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onClick={handleInputClick}
        className="pl-10"
      />

      {showHistory && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <div className="p-2">
            {filteredHistory.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Recent Searches
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="h-6 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="space-y-1">
                  {filteredHistory.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleHistoryItemClick(item)}
                      className="flex items-center justify-between px-2 py-2 hover:bg-accent rounded-md cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => removeFromHistory(item, e)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="px-2 py-4 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No search history yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Press Enter after typing to save searches
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
