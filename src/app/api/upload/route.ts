import { NextRequest, NextResponse } from 'next/server';
import { createWriteStream, promises as fsPromises } from 'fs';
import { parse } from 'csv-parse/sync';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface Product {
  Handle: string;
  Title: string;
  Vendor: string;
  Published: boolean;
  Option1Name: string;
  Option1Value: string;
  VariantGrams: number;
  VariantInventoryQty: number;
  VariantInventoryPolicy: string;
  VariantFulfillmentService: string;
  VariantPrice: number;
  VariantRequiresShipping: boolean;
  VariantTaxable: boolean;
  GiftCard: boolean;
  VariantWeightUnit: string;
  IncludedPrimary: boolean;
  IncludedInternational: boolean;
  Status: string;
  [key: string]: string | number | boolean | undefined;
}

export async function POST(req: NextRequest) {
  const uploadDir = join(process.cwd(), 'uploads');
  const fileName = `${Date.now()}-upload.csv`;
  const filePath = join(uploadDir, fileName);

  // Ensure the uploads directory exists
  if (!existsSync(uploadDir)) {
    await fsPromises.mkdir(uploadDir, { recursive: true });
  }

  const fileStream = createWriteStream(filePath);

  try {
    // @ts-ignore
    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let result;
    while (!(result = await reader.read()).done) {
      const chunk = decoder.decode(result.value);
      fileStream.write(chunk);
    }
    fileStream.end();

    const data = await fsPromises.readFile(filePath);
    const parsedData = processCSV(data);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error handling the file upload:', error);
    return NextResponse.json({ error: 'Failed to upload or process file' }, { status: 500 });
  }
}

function processCSV(data: Buffer): Product[] {
  const records: Product[] = parse(data, {
    columns: true,
    skip_empty_lines: true,
  }) as unknown as Product[];

  return records.map((record) => {
    const processedRecord: Product = {
      Handle: record.Handle || generateHandle(record.Title),
      Title: record.Title,
      Vendor: record.Vendor || 'Default Vendor',
      Published: parseBoolean(record.Published.toString(), true),
      Option1Name: record['Option1 Name']?.toString() || 'Title',
      Option1Value: record['Option1 Value']?.toString() || 'Default Title',
      VariantGrams: parseNumber(record['Variant Grams']?.toString(), 0.0),
      VariantInventoryQty: parseNumber(record['Variant Inventory Qty']?.toString(), 0),
      VariantInventoryPolicy: record['Variant Inventory Policy']?.toString() || 'deny',
      VariantFulfillmentService: record['Variant Fulfillment Service']?.toString() || 'manual',
      VariantPrice: parseNumber(record['Variant Price']?.toString(), 0.0),
      VariantRequiresShipping: parseBoolean(record['Variant Requires Shipping']?.toString(), true),
      VariantTaxable: parseBoolean(record['Variant Taxable']?.toString(), true),
      GiftCard: parseBoolean(record['Gift Card']?.toString(), false),
      VariantWeightUnit: record['Variant Weight Unit']?.toString() || 'kg',
      IncludedPrimary: parseBoolean(record['Included / Primary']?.toString(), true),
      IncludedInternational: parseBoolean(record['Included / International']?.toString(), true),
      Status: record.Status || 'active',
    };

    validateRequiredFields(processedRecord);

    return processedRecord;
  });
}

function generateHandle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return defaultValue;
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  const parsedValue = parseFloat(value || '');
  return isNaN(parsedValue) ? defaultValue : parsedValue;
}

function validateRequiredFields(product: Product): void {
  if (!product.Handle) {
    throw new Error('Handle is required but missing.');
  }
  if (!product.Title) {
    throw new Error('Title is required but missing.');
  }
  if (!product.Vendor) {
    throw new Error('Vendor is required but missing.');
  }
}



// const processedRecord: Product = {
//   Handle: record.Handle || generateHandle(record.Title),
//   Title: record.Title,
//   Vendor: record.Vendor || 'Default Vendor',
//   Published: parseBoolean(record.Published.toString(), true),
//   Option1Name: record['Option1 Name']?.toString() || 'Title',
//   Option1Value: record['Option1 Value']?.toString() || 'Default Title',
//   VariantGrams: parseNumber(record['Variant Grams']?.toString(), 0.0),
//   VariantInventoryQty: parseNumber(record['Variant Inventory Qty']?.toString(), 0),
//   VariantInventoryPolicy: record['Variant Inventory Policy']?.toString() || 'deny',
//   VariantFulfillmentService: record['Variant Fulfillment Service']?.toString() || 'manual',
//   VariantPrice: parseNumber(record['Variant Price']?.toString(), 0.0),
//   VariantRequiresShipping: parseBoolean(record['Variant Requires Shipping']?.toString(), true),
//   VariantTaxable: parseBoolean(record['Variant Taxable']?.toString(), true),
//   GiftCard: parseBoolean(record['Gift Card']?.toString(), false),
//   VariantWeightUnit: record['Variant Weight Unit']?.toString() || 'kg',
//   IncludedPrimary: parseBoolean(record['Included / Primary']?.toString(), true),
//   IncludedInternational: parseBoolean(record['Included / International']?.toString(), true),
//   Status: record.Status || 'active',
// };