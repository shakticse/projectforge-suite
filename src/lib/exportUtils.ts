import * as xlsx from 'xlsx';

export interface ColumnMapping<T> {
    header: string;
    key: keyof T | ((item: T) => any);
}

/**
 * Exports a list of objects to an Excel file.
 * 
 * @param data The array of data objects to export.
 * @param filename The desired name of the downloaded file (without extension).
 * @param columnMapping An array defining the columns to export and how to map them from the data.
 */
export const exportToExcel = <T>(
    data: T[],
    filename: string,
    columnMapping: ColumnMapping<T>[]
) => {
    // 1. Transform the data into a flat array of objects based on mapping
    const exportData = data.map(item => {
        const rowData: Record<string, any> = {};
        columnMapping.forEach(col => {
            const value = typeof col.key === 'function' ? col.key(item) : item[col.key as keyof T];
            rowData[col.header] = value;
        });
        return rowData;
    });

    // 2. Create a new workbook and worksheet
    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();

    // 3. Append the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // 4. Generate the Excel file and trigger download
    // xlsx version 0.18.5+ has writeFile that works correctly in browsers
    xlsx.writeFile(workbook, `${filename}.xlsx`);
};
