import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ImportProducts = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const csvData = [];
      for (let i = 1; i < lines.length && i < 101; i++) { // Limit to 100 products for demo
        const line = lines[i];
        if (!line.trim()) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        csvData.push(row);
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('import-products', {
        body: { csvData }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Import complete",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-8">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Import Products from CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with product data from Flipkart dataset
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Expected columns: product_name, brand, description, product_category_tree, 
                image, retail_price, discounted_price, product_rating, overall_rating
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
                disabled={loading}
              />
              <label htmlFor="csv-upload">
                <Button asChild disabled={loading}>
                  <span>
                    {loading ? "Importing..." : "Select CSV File"}
                  </span>
                </Button>
              </label>
            </div>

            {results && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Import Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">{results.message}</p>
                  {results.results && results.results.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-semibold">Sample Results:</p>
                      {results.results.slice(0, 5).map((result: any, index: number) => (
                        <div
                          key={index}
                          className={`text-xs p-2 rounded ${
                            result.success ? 'bg-green-500/10' : 'bg-red-500/10'
                          }`}
                        >
                          {result.success ? '✓' : '✗'} {result.product}
                          {result.error && ` - ${result.error}`}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Extract the CSV file from the uploaded ZIP archive</li>
                <li>Click "Select CSV File" and choose the extracted CSV</li>
                <li>The import will process up to 100 products (for demo purposes)</li>
                <li>Products will be imported with categories automatically created</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportProducts;
