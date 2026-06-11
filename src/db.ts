import Dexie, { Table } from 'dexie';
import type { LabMetadata } from './store';

export interface DBQuestion {
  id: string;
  order: number;
  prefix: string;
  questionText: string;
  imageBlob: Blob | null;
  type?: 'question' | 'subheading';
}

export interface DBMetadata extends LabMetadata {
  id: number;
  logoBlob?: Blob | null;
}

export class LabDatabase extends Dexie {
  metadata!: Table<DBMetadata>;
  questions!: Table<DBQuestion>;

  constructor() {
    super('LabDatabase');
    
    this.version(1).stores({
      metadata: 'id',
      questions: 'id, order',
    });

    this.version(2).stores({
      metadata: 'id',
      questions: 'id, order',
    }).upgrade(tx => {
      return tx.table('questions').toCollection().modify(q => {
        q.prefix = String(q.order) + ".";
      });
    });

    this.version(3).upgrade(tx => {
      // Clear metadata because the schema changed significantly
      return tx.table('metadata').clear();
    });
  }
}

export const db = new LabDatabase();
