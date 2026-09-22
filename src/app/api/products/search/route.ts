import { NextResponse } from 'next/server';
import { searchProducts } from '@/services/products';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '4', 10);

    if (!query.trim()) {
      return NextResponse.json({ products: [] });
    }

    const products = await searchProducts(query.trim(), Math.min(limit, 4));
    return NextResponse.json({ products });
  } catch (err: unknown) {
    console.error('[Search API] Error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
