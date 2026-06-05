import Dexie, { type EntityTable } from 'dexie';
import type { Match } from '../types';

interface SyncEvent {
    id?: number;
    matchId: string;
    action: string;
    payload: any;
    timestamp: number;
}

class CricketDatabase extends Dexie {
    matches!: EntityTable<Match, 'id'>;
    syncQueue!: EntityTable<SyncEvent, 'id'>;
    tournaments!: EntityTable<import('../types').Tournament, 'id'>;

    constructor() {
        super('CricketDatabase');
        this.version(1).stores({
            matches: 'id, date, status',
            syncQueue: '++id, matchId, timestamp'
        });
        this.version(2).stores({
            matches: 'id, tournamentId, date, status',
            syncQueue: '++id, matchId, timestamp',
            tournaments: 'id, status'
        });
    }
}

export const db = new CricketDatabase();

/**
 * Migrates data from localStorage to IndexedDB if it exists.
 * This ensures users don't lose their history when upgrading to Phase II.
 */
export async function migrateFromLocalStorage() {
    try {
        const localData = localStorage.getItem('cricket_matches');
        if (localData) {
            const matches: Match[] = JSON.parse(localData);
            if (matches && matches.length > 0) {
                // Bulk add ignores duplicates if id already exists
                await db.matches.bulkPut(matches);
                console.log(`Migrated ${matches.length} matches from localStorage to IndexedDB.`);
            }
            // Remove it from localStorage to prevent re-migration and save space
            localStorage.removeItem('cricket_matches');
        }
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

// Automatically trigger migration when db is initialized
db.on('ready', () => {
    return migrateFromLocalStorage();
});

export async function queueSyncEvent(matchId: string, action: string, payload: any) {
    await db.syncQueue.add({
        matchId,
        action,
        payload,
        timestamp: Date.now()
    });
}
