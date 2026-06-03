export interface ShopDetailProduct {
  id: string;
  name: string;
  description: string;
  price: string | number;
  originalPrice?: string | number | null;
  images: string[];
  inStock: boolean;
  category: string;
  createdAt: string;
}

export interface ShopDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  trustScore: number;
  rating: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    preferredName: string | null;
    username: string | null;
    profileImage: string | null;
    isVerified: boolean;
  };
  products: ShopDetailProduct[];
}

export interface ShopOrderProduct {
  id: string;
  name: string;
  image: string;
  price: string;
  shopName?: string;
}

export function formatShopPrice(price: string | number): string {
  const numeric =
    typeof price === "number" ? price : parseFloat(String(price).replace(/[^0-9.]/g, ""));

  if (Number.isNaN(numeric)) return String(price);
  return `৳${numeric.toLocaleString("en-BD")}`;
}

export function parseShopPrice(price: string | number): number {
  if (typeof price === "number") return price;
  return parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0;
}

export function getProductImage(product: Pick<ShopDetailProduct, "images">): string {
  return product.images[0] ?? "/city_background.png";
}

export function getShopImage(shop: { user: { profileImage: string | null } }): string {
  return shop.user.profileImage ?? "/city_background.png";
}

export function toOrderProduct(
  product: ShopDetailProduct,
  shopName: string
): ShopOrderProduct {
  return {
    id: product.id,
    name: product.name,
    image: getProductImage(product),
    price: formatShopPrice(product.price),
    shopName,
  };
}

export function getShopOwnerName(shop: ShopDetail): string {
  return shop.user.preferredName || shop.user.name || shop.user.username || "Shop Owner";
}
