import { parse } from 'csv-parse/sync';
import { logger } from '../config/logger';
/**
 * Parse CSV file buffer and convert to catalog items
 */
export function parseCatalogCSV(fileBuffer) {
    try {
        const records = parse(fileBuffer.toString('utf-8'), {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        });
        const items = [];
        for (const record of records) {
            // Skip empty rows
            if (!record.Description && !record.IMPA && !record['Part No']) {
                continue;
            }
            // Use Description as name, fallback to IMPA or Part No
            const name = record.Description || record.IMPA || record['Part No'] || 'Unnamed Item';
            // Extract price from CSV or use default
            const priceStr = record.Price?.trim() || '';
            const unitPrice = priceStr ? parseFloat(priceStr) || 0 : 0;
            const currency = 'USD'; // Default currency
            const item = {
                name: name.trim(),
                description: record.Description?.trim() || undefined,
                category: record.Category?.trim() || undefined,
                sku: record['Part No']?.trim() || record.IMPA?.trim() || undefined,
                unitPrice,
                currency,
                metadata: {
                    impa: record.IMPA?.trim() || undefined,
                    partNo: record['Part No']?.trim() || undefined,
                    positionNo: record['Position No']?.trim() || undefined,
                    alternativeNo: record['Alternative No']?.trim() || undefined,
                    brand: record.Brand?.trim() || undefined,
                    model: record.Model?.trim() || undefined,
                    dimensions: record['Dimensions (W x B x H)']?.trim() || undefined,
                    remarks: record.Remarks?.trim() || undefined,
                },
            };
            items.push(item);
        }
        logger.info(`Parsed ${items.length} items from CSV`);
        return items;
    }
    catch (error) {
        logger.error('Failed to parse CSV:', error);
        throw new Error(`Failed to parse CSV file: ${error.message}`);
    }
}
//# sourceMappingURL=csv-parser.js.map