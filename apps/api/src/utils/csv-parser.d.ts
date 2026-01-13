export interface CatalogRow {
    IMPA?: string;
    Description?: string;
    'Part No'?: string;
    'Position No'?: string;
    'Alternative No'?: string;
    Brand?: string;
    Model?: string;
    Category?: string;
    'Dimensions (W x B x H)'?: string;
    Price?: string;
    Remarks?: string;
}
export interface ParsedCatalogItem {
    name: string;
    description?: string;
    category?: string;
    sku?: string;
    unitPrice: number;
    currency: string;
    metadata: {
        impa?: string;
        partNo?: string;
        positionNo?: string;
        alternativeNo?: string;
        brand?: string;
        model?: string;
        dimensions?: string;
        remarks?: string;
    };
}
/**
 * Parse CSV file buffer and convert to catalog items
 */
export declare function parseCatalogCSV(fileBuffer: Buffer): ParsedCatalogItem[];
//# sourceMappingURL=csv-parser.d.ts.map