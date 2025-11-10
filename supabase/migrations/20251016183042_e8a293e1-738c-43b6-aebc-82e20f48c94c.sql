-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Create enum types
CREATE TYPE user_role AS ENUM ('customer', 'retailer', 'wholesaler', 'admin');
CREATE TYPE store_type AS ENUM ('retailer', 'wholesaler');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'cod');
CREATE TYPE payment_provider AS ENUM ('stripe', 'razorpay', 'offline');
CREATE TYPE delivery_mode AS ENUM ('delivery', 'pickup', 'offline');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create addresses table
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  pincode TEXT NOT NULL,
  lat NUMERIC(10, 8),
  lng NUMERIC(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type store_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  logo_url TEXT,
  gst_number TEXT,
  address_id UUID REFERENCES addresses(id),
  delivery_radius_km NUMERIC(5, 2) DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images JSONB DEFAULT '[]'::jsonb,
  brand TEXT,
  attributes JSONB DEFAULT '{}'::jsonb,
  created_by_store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  available_from DATE,
  price NUMERIC(12, 2) NOT NULL,
  mrp NUMERIC(12, 2),
  tax_pct NUMERIC(5, 2) DEFAULT 0,
  min_order_qty INTEGER DEFAULT 1,
  max_order_qty INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, product_id)
);

-- Create cart table
CREATE TABLE cart (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, inventory_id)
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(12, 2) NOT NULL,
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(12, 2) DEFAULT 0,
  discount NUMERIC(12, 2) DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  delivery_mode delivery_mode NOT NULL DEFAULT 'delivery',
  delivery_address_id UUID REFERENCES addresses(id),
  notes TEXT,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  product_snapshot JSONB NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  qty INTEGER NOT NULL,
  line_total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider payment_provider NOT NULL,
  provider_ref TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_location ON addresses(lat, lng);
CREATE INDEX idx_stores_owner_id ON stores(owner_id);
CREATE INDEX idx_stores_type ON stores(type);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_inventory_store_id ON inventory(store_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_feedback_product_id ON feedback(product_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for addresses
CREATE POLICY "Users can view own addresses" ON addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON addresses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for stores
CREATE POLICY "Everyone can view active stores" ON stores FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can update their stores" ON stores FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Store owners can insert their stores" ON stores FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- RLS Policies for categories (public read)
CREATE POLICY "Everyone can view categories" ON categories FOR SELECT USING (true);

-- RLS Policies for products (public read)
CREATE POLICY "Everyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Store owners can manage their products" ON products FOR ALL USING (
  created_by_store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
);

-- RLS Policies for inventory
CREATE POLICY "Everyone can view active inventory" ON inventory FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can manage their inventory" ON inventory FOR ALL USING (
  store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
);

-- RLS Policies for cart
CREATE POLICY "Users can view own cart" ON cart FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart" ON cart FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON cart FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for cart_items
CREATE POLICY "Users can manage own cart items" ON cart_items FOR ALL USING (
  cart_id IN (SELECT id FROM cart WHERE user_id = auth.uid())
);

-- RLS Policies for orders
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Store owners can view their store orders" ON orders FOR SELECT USING (
  store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
);
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Store owners can update their orders" ON orders FOR UPDATE USING (
  store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
);

-- RLS Policies for order_items
CREATE POLICY "Users can view order items for their orders" ON order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders WHERE customer_id = auth.uid()
    UNION
    SELECT id FROM orders WHERE store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  )
);

-- RLS Policies for payments
CREATE POLICY "Users can view payments for their orders" ON payments FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);

-- RLS Policies for feedback
CREATE POLICY "Everyone can view published feedback" ON feedback FOR SELECT USING (is_published = true);
CREATE POLICY "Users can create feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own feedback" ON feedback FOR UPDATE USING (auth.uid() = author_id);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON cart FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();