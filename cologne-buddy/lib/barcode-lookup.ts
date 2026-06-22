interface ProductLookupResult {
  name: string;
  brand: string;
  imageUrl?: string;
}

export async function lookupBarcode(barcode: string): Promise<ProductLookupResult | null> {
  // Open Beauty Facts has a large fragrance/cosmetics database
  try {
    const response = await fetch(
      `https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`
    );
    if (!response.ok) throw new Error('Not found');

    const data = await response.json();
    if (data.status !== 1 || !data.product) throw new Error('Product not found');

    const product = data.product;
    const name = product.product_name ?? product.product_name_en ?? '';
    const brand = product.brands ?? '';
    const imageUrl = product.image_front_url ?? product.image_url;

    if (!name) throw new Error('No name found');

    return { name, brand, imageUrl };
  } catch {
    // Fall back to Open Food Facts (sometimes has cologne/perfume)
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();
      if (data.status === 1 && data.product?.product_name) {
        return {
          name: data.product.product_name,
          brand: data.product.brands ?? '',
          imageUrl: data.product.image_front_url,
        };
      }
    } catch {
      // ignore second failure
    }
    return null;
  }
}
