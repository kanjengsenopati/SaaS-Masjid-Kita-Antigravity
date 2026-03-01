import { db } from '../lib/db';

/**
 * Exports all IndexedDB data to a structured JSON string.
 * This structure maps arrays to objects making it friendly for PostgreSQL / Laravel Seeders.
 */
export const exportDatabaseToJson = async (): Promise<string> => {
    try {
        const exportedData: Record<string, any[]> = {};

        // Iterate through all tables defined in Dexie
        for (const table of db.tables) {
            const records = await table.toArray();

            // Map the data for compatibility if necessary
            exportedData[table.name] = records.map(record => {
                const mappedRecord = { ...record };
                // Enforce datetime ISO string conversion if needed
                // Add any SQL-specific mappings here
                return mappedRecord;
            });
        }

        return JSON.stringify(exportedData, null, 2);
    } catch (error) {
        console.error('Failed to export database', error);
        throw new Error('Database export failed');
    }
};

/**
 * Triggers a browser download of the exported JSON string.
 */
export const downloadDatabaseExport = async (filename: string = 'masjidkita-backup.json') => {
    try {
        const jsonStr = await exportDatabaseToJson();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error initiating download', error);
        alert('Gagal mengekspor database. Silakan coba lagi.');
    }
};
