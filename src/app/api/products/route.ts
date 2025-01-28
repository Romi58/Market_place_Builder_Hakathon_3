import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";
import { NextApiRequest } from "next/types";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  discountPercent: number;
  isNew: boolean;
  colors: string[];
  sizes: string[];
}

export async function GET() {
    const data = await client.fetch(`
      *[_type == "products"] {
        _id,
        name,
        description,
        price,
        "imageUrl": image.asset->url,
        category,
        discountPercent,
        "isNew": new,
        colors,
        sizes
      }
    `);
    return NextResponse.json(data);
}

export async function searchHandler(req: NextApiRequest, res: NextResponse) {
    const { search } = req.query;

    if (!search) {
        return NextResponse.json({ message: 'Search term is required' }, { status: 400 });
    }

    const query = `
      *[_type == "product" && (name match $search || category match $search || description match $search)] {
        _id,
        name,
        category,
        description,
        "image": image.asset->url,
        colors,
        sizes,
        price,
        discountPercent,
        isNew
      }
    `;

    try {
        const products: Product[] = await client.fetch(query, {
            search: `*${search}*`, // Wildcard search for partial matches
        });

        return NextResponse.json(products, { status: 200 });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}


export default async function handler(req: NextApiRequest, res: NextResponse) {
    // Call the search handler if there is a search query, otherwise fetch all products
    if (req.query.search) {
        return searchHandler(req, res);
    } else {
        return GET();
    }
}
