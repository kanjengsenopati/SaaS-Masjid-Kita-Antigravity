/**
 * Helper to uniformly format ISO dates (YYYY-MM-DD) into Indonesian DD-MM-YYYY
 */
export const formatDateDDMMYYYY = (isoString?: string | null): string => {
    if (!isoString) return '-';
    // Handle both "YYYY-MM-DD" and full ISO strings "YYYY-MM-DDTHH:mm:ss.sssZ"
    const datePart = isoString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length !== 3) return isoString; // fallback if malformed

    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
};

/**
 * Format date while preserving Time if it exists in the original string
 */
export const formatDateTimeDDMMYYYY = (isoString?: string | null): string => {
    if (!isoString) return '-';
    const hasTime = isoString.includes('T') && isoString.length > 11;

    if (hasTime) {
        const dateObj = new Date(isoString);
        if (isNaN(dateObj.getTime())) return isoString;

        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');

        return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
    }

    return formatDateDDMMYYYY(isoString); // Fallback to just date
};

/**
 * Format number to Indonesian Rupiah currency string
 */
export const formatCurrencyRp = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 'Rp 0';
    return `Rp ${num.toLocaleString('id-ID')}`;
};
