export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean | null
          label: string | null
          lat: number | null
          line1: string
          line2: string | null
          lng: number | null
          pincode: string
          state: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          line1: string
          line2?: string | null
          lng?: number | null
          pincode: string
          state: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          line1?: string
          line2?: string | null
          lng?: number | null
          pincode?: string
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          inventory_id: string
          qty: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          inventory_id: string
          qty?: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          inventory_id?: string
          qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          id: string
          images: Json | null
          is_published: boolean | null
          order_item_id: string | null
          product_id: string
          rating: number
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          is_published?: boolean | null
          order_item_id?: string | null
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          is_published?: boolean | null
          order_item_id?: string | null
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          available_from: string | null
          created_at: string
          delivery_days: number | null
          id: string
          is_active: boolean | null
          max_order_qty: number | null
          min_order_qty: number | null
          mrp: number | null
          price: number
          product_id: string
          retail_price: number | null
          stock_qty: number
          store_id: string
          tax_pct: number | null
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          created_at?: string
          delivery_days?: number | null
          id?: string
          is_active?: boolean | null
          max_order_qty?: number | null
          min_order_qty?: number | null
          mrp?: number | null
          price: number
          product_id: string
          retail_price?: number | null
          stock_qty?: number
          store_id: string
          tax_pct?: number | null
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          created_at?: string
          delivery_days?: number | null
          id?: string
          is_active?: boolean | null
          max_order_qty?: number | null
          min_order_qty?: number | null
          mrp?: number | null
          price?: number
          product_id?: string
          retail_price?: number | null
          stock_qty?: number
          store_id?: string
          tax_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          line_total: number
          order_id: string
          product_snapshot: Json
          qty: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          line_total: number
          order_id: string
          product_snapshot: Json
          qty: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          line_total?: number
          order_id?: string
          product_snapshot?: Json
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          delivery_address_id: string | null
          delivery_date: string | null
          delivery_mode: Database["public"]["Enums"]["delivery_mode"]
          discount: number | null
          id: string
          notes: string | null
          order_number: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          placed_at: string
          shipping_fee: number | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_address_id?: string | null
          delivery_date?: string | null
          delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          discount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string
          shipping_fee?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          tax?: number
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_address_id?: string | null
          delivery_date?: string | null
          delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          discount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string
          shipping_fee?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          order_id: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_ref: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json | null
          brand: string | null
          category_id: string | null
          created_at: string
          created_by_store_id: string | null
          description: string | null
          id: string
          images: Json | null
          name: string
          overall_rating: number | null
          product_rating: number | null
          rating_count: number | null
          sku: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          created_by_store_id?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          name: string
          overall_rating?: number | null
          product_rating?: number | null
          rating_count?: number | null
          sku?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          created_by_store_id?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          name?: string
          overall_rating?: number | null
          product_rating?: number | null
          rating_count?: number | null
          sku?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_store_id_fkey"
            columns: ["created_by_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          buyer_store_id: string
          created_at: string
          id: string
          order_id: string
          seller_store_id: string
          updated_at: string
        }
        Insert: {
          buyer_store_id: string
          created_at?: string
          id?: string
          order_id: string
          seller_store_id: string
          updated_at?: string
        }
        Update: {
          buyer_store_id?: string
          created_at?: string
          id?: string
          order_id?: string
          seller_store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_buyer_store_id_fkey"
            columns: ["buyer_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_seller_store_id_fkey"
            columns: ["seller_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_payment_methods: {
        Row: {
          account_number: string | null
          card_name: string | null
          created_at: string
          expiry_date: string | null
          id: string
          ifsc_code: string | null
          is_default: boolean | null
          label: string
          last_four: string
          payment_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          card_name?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          ifsc_code?: string | null
          is_default?: boolean | null
          label: string
          last_four: string
          payment_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          card_name?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          ifsc_code?: string | null
          is_default?: boolean | null
          label?: string
          last_four?: string
          payment_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address_id: string | null
          created_at: string
          delivery_radius_km: number | null
          description: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          type: Database["public"]["Enums"]["store_type"]
          updated_at: string
          warehouse_address_id: string | null
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          delivery_radius_km?: number | null
          description?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          type: Database["public"]["Enums"]["store_type"]
          updated_at?: string
          warehouse_address_id?: string | null
        }
        Update: {
          address_id?: string | null
          created_at?: string
          delivery_radius_km?: number | null
          description?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          type?: Database["public"]["Enums"]["store_type"]
          updated_at?: string
          warehouse_address_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_warehouse_address_id_fkey"
            columns: ["warehouse_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      get_public_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_product_data: {
        Args: {
          p_brand: string
          p_category_name: string
          p_description: string
          p_discounted_price: number
          p_image_url: string
          p_name: string
          p_overall_rating?: number
          p_product_rating?: number
          p_retail_price: number
          p_store_id?: string
        }
        Returns: string
      }
      store_has_warehouse_location: {
        Args: { store_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "retailer" | "wholesaler" | "admin"
      delivery_mode: "delivery" | "pickup" | "offline"
      order_status:
        | "pending"
        | "confirmed"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_provider: "stripe" | "razorpay" | "offline"
      payment_status: "pending" | "paid" | "failed" | "cod"
      store_type: "retailer" | "wholesaler"
      user_role: "customer" | "retailer" | "wholesaler" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "retailer", "wholesaler", "admin"],
      delivery_mode: ["delivery", "pickup", "offline"],
      order_status: [
        "pending",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_provider: ["stripe", "razorpay", "offline"],
      payment_status: ["pending", "paid", "failed", "cod"],
      store_type: ["retailer", "wholesaler"],
      user_role: ["customer", "retailer", "wholesaler", "admin"],
    },
  },
} as const
