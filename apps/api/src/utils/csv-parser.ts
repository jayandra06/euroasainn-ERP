import XLSX from 'xlsx';
import { logger } from '../config/logger';

export interface ParsedCatalogItem {
  impa: string;
  description: string;
  partNo?: string;
  positionNo?: string;
  alternativeNo?: string;
  brand?: string;
  model?: string;
  category?: string;
  dimensions?: string;
  uom: string;
  moq: string;
  leadTime?: string;
  price: number;
  currency: string;
  stockStatus: 'In Stock' | 'Limited' | 'Backorder' | 'Discontinued';
}

/**
 * Parse uploaded catalog file (CSV or Excel) and return clean items
 * Compatible with your frontend template and CatalogItem model
 */
export function parseCatalogFile(fileBuffer: Buffer): ParsedCatalogItem[] {
  try {
    let rows: any[] = [];

    // Detect file type and parse accordingly
    const fileString = fileBuffer.toString('binary');
    const isExcel = ['xlsx', 'xls'].some(ext => 
      fileBuffer.slice(0, 4).toString('hex') === '504b0304' && fileString.includes(ext)
    );

    if (isExcel || fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b) { // ZIP header for .xlsx
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    } else {
      // Fallback to CSV parsing if not Excel
      const { parse } = require('csv-parse/sync');
      rows = parse(fileBuffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    }

    if (rows.length === 0) {
      logger.warn('No rows found in uploaded catalog file');
      return [];
    }

    const items: ParsedCatalogItem[] = [];

    // Flexible field matcher
    const getField = (row: any, names: string[]): string => {
      for (const name of names) {
        if (row[name] !== undefined && row[name] !== '') {
          return String(row[name]).trim();
        }
        const match = Object.keys(row).find(
          k => k.toLowerCase().replace(/\s/g, '') === name.toLowerCase().replace(/\s/g, '')
        );
        if (match && row[match] !== '') {
          return String(row[match]).trim();
        }
      }
      return '';
    };

    for (const row of rows) {
      const impa = getField(row, ['IMPA', 'impa', 'Impa Code']);
      const description = getField(row, ['Description', 'description', 'Item Description']);

      // Skip completely empty rows
      if (!impa && !description) {
        continue;
      }

      // Required fields
      if (!impa || !description) {
        logger.warn(`Skipping row - missing IMPA or Description: ${JSON.stringify(row)}`);
        continue;
      }

      const priceStr = getField(row, ['Price', 'price', 'Unit Price']);
      const price = parseFloat(priceStr) || 0;

      const item: ParsedCatalogItem = {
        impa,
        description,
        partNo: getField(row, ['Part No', 'partNo', 'Part Number']) || undefined,
        positionNo: getField(row, ['Position No', 'positionNo']) || undefined,
        alternativeNo: getField(row, ['Alternative No', 'alternativeNo']) || undefined,
        brand: getField(row, ['Brand', 'brand']) || undefined,
        model: getField(row, ['Model', 'model']) || undefined,
        category: getField(row, ['Category', 'category']) || 'General',
        dimensions: getField(row, ['Dimensions', 'dimensions', 'Dimensions (W x B x H)']) || undefined,
        uom: getField(row, ['UoM', 'uom', 'Unit']) || 'PCS',
        moq: getField(row, ['MOQ', 'moq', 'Min Order']) || '1',
        leadTime: getField(row, ['Lead Time', 'leadTime']) || undefined,
        price,
        currency: getField(row, ['Currency', 'currency']) || 'USD',
        stockStatus: (() => {
          const status = getField(row, ['Stock Status', 'stockStatus', 'Status', 'Availability']);
          const normalized = status.toLowerCase();
          if (normalized.includes('limited')) return 'Limited';
          if (normalized.includes('backorder')) return 'Backorder';
          if (normalized.includes('discontinued')) return 'Discontinued';
          return 'In Stock';
        })() as ParsedCatalogItem['stockStatus'],
      };

      items.push(item);
    }

    logger.info(`Successfully parsed ${items.length} catalog items from file`);
    return items;

  } catch (error: any) {
    logger.error('Failed to parse catalog file:', error);
    throw new Error(`Invalid file format or parsing error: ${error.message}`);
  }
}