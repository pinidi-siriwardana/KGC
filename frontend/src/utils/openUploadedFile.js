import { API_URL } from './api';

// Uploaded receipts/photos can go missing from disk (deleted, moved, cleaned
// up manually) even though the DB still has a path on record. A plain
// window.open()/<a href> would silently pop a blank/404 tab with no
// explanation — this checks the file actually exists first and reports
// back instead of opening a dead link.
export const openUploadedFile = async (relativePath, onMissing) => {
    const url = `${API_URL}${relativePath}`;
    try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
            window.open(url, '_blank');
            return;
        }
    } catch {
        // network error — fall through to onMissing below
    }
    onMissing?.();
};
