import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const MAX_PRODUCT_NAME = 255;
const MAX_DESCRIPTION = 5000;
const MAX_BRAND = 100;
const MAX_CATEGORY = 100;
const MAX_IMAGE_URL = 500;
const MAX_ARRAY_SIZE = 1000;

function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  // Remove HTML tags and script content
  return str.replace(/<[^>]*>/g, '').trim();
}

function validateProduct(row: any): { valid: boolean; error?: string } {
  // Validate product name
  const name = sanitizeString(row.product_name || row.name);
  if (!name || name.length === 0) {
    return { valid: false, error: 'Product name is required' };
  }
  if (name.length > MAX_PRODUCT_NAME) {
    return { valid: false, error: `Product name exceeds ${MAX_PRODUCT_NAME} characters` };
  }

  // Validate description
  const description = sanitizeString(row.description || '');
  if (description.length > MAX_DESCRIPTION) {
    return { valid: false, error: `Description exceeds ${MAX_DESCRIPTION} characters` };
  }

  // Validate brand
  const brand = sanitizeString(row.brand || '');
  if (brand.length > MAX_BRAND) {
    return { valid: false, error: `Brand exceeds ${MAX_BRAND} characters` };
  }

  // Validate prices
  const retailPrice = parseFloat(row.retail_price);
  const discountedPrice = parseFloat(row.discounted_price || row.retail_price);
  
  if (isNaN(retailPrice) || retailPrice < 0) {
    return { valid: false, error: 'Invalid retail price' };
  }
  if (isNaN(discountedPrice) || discountedPrice < 0) {
    return { valid: false, error: 'Invalid discounted price' };
  }
  if (discountedPrice > retailPrice) {
    return { valid: false, error: 'Discounted price cannot exceed retail price' };
  }

  // Validate ratings
  if (row.product_rating !== null && row.product_rating !== undefined) {
    const rating = parseFloat(row.product_rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      return { valid: false, error: 'Product rating must be between 0 and 5' };
    }
  }

  if (row.overall_rating !== null && row.overall_rating !== undefined) {
    const rating = parseFloat(row.overall_rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      return { valid: false, error: 'Overall rating must be between 0 and 5' };
    }
  }

  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has retailer or wholesaler role using the secure function
    const { data: hasRetailerRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'retailer'
    });
    
    const { data: hasWholesalerRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'wholesaler'
    });

    if (!hasRetailerRole && !hasWholesalerRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Only retailers and wholesalers can import products' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { csvData } = await req.json();
    
    if (!csvData || !Array.isArray(csvData)) {
      throw new Error('Invalid CSV data format');
    }

    // Prevent DoS by limiting array size
    if (csvData.length > MAX_ARRAY_SIZE) {
      return new Response(
        JSON.stringify({ error: `Too many products. Maximum ${MAX_ARRAY_SIZE} allowed per import.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's store (must use service role client for this)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: store } = await serviceClient
      .from('stores')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!store) {
      return new Response(
        JSON.stringify({ error: 'No store found for your account' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each row from CSV
    for (const row of csvData) {
      try {
        // Validate the product data
        const validation = validateProduct(row);
        if (!validation.valid) {
          errorCount++;
          results.push({ 
            success: false, 
            product: row.product_name || row.name, 
            error: validation.error 
          });
          continue;
        }

        // Sanitize inputs
        const productName = sanitizeString(row.product_name || row.name);
        const brand = sanitizeString(row.brand || '');
        const description = sanitizeString(row.description || '');
        const categoryName = sanitizeString(extractMainCategory(row.product_category_tree || row.category));

        // Call the import_product_data function with sanitized data
        const { data, error } = await serviceClient.rpc('import_product_data', {
          p_name: productName,
          p_brand: brand,
          p_description: description,
          p_category_name: categoryName,
          p_image_url: row.image || '',
          p_retail_price: parseFloat(row.retail_price) || 0,
          p_discounted_price: parseFloat(row.discounted_price) || parseFloat(row.retail_price) || 0,
          p_product_rating: row.product_rating ? parseFloat(row.product_rating) : null,
          p_overall_rating: row.overall_rating ? parseFloat(row.overall_rating) : null,
          p_store_id: store.id
        });

        if (error) {
          console.error('Error importing product:', error);
          errorCount++;
          results.push({ success: false, product: row.product_name, error: error.message });
        } else {
          successCount++;
          results.push({ success: true, product: row.product_name, id: data });
        }
      } catch (err) {
        console.error('Error processing row:', err);
        errorCount++;
        results.push({ success: false, product: row.product_name, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Imported ${successCount} products successfully, ${errorCount} failed`,
        results: results.slice(0, 10) // Return first 10 for debugging
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Helper function to extract main category from category tree
// e.g., "Electronics >> Mobiles & Accessories" -> "Electronics"
function extractMainCategory(categoryTree: string): string {
  if (!categoryTree) return 'Uncategorized';
  
  // Remove JSON formatting if present
  let category = categoryTree;
  if (category.startsWith('[')) {
    try {
      const parsed = JSON.parse(category);
      category = parsed[0] || category;
    } catch {
      // Keep original if parsing fails
    }
  }
  
  // Extract first part before >>
  const parts = category.split('>>');
  return parts[0].trim();
}
