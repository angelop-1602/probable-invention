'use client';

import Link from 'next/link';
import { format } from 'date-fns';

// Dummy document data
const documents = [
  {
    id: 'doc1',
    title: 'Protocol Review - SPUP_2025_0001',
    date: '2025-04-25',
    type: 'Full Review',
  },
  {
    id: 'doc2',
    title: 'Informed Consent Form - SPUP_2025_0002',
    date: '2025-04-28',
    type: 'Expedited Review',
  },
  {
    id: 'doc3',
    title: 'Exemption Checklist - SPUP_2025_0003',
    date: '2025-04-30',
    type: 'Exemption',
  },
];

export default function DocumentListPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Protocol Documents</h1>
      <div className="bg-white shadow rounded-md divide-y divide-gray-200">
        {documents.map((doc) => (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 hover:bg-gray-50"
          >
            <div className="flex flex-col md:flex-row md:justify-between">
              <span className="font-medium text-sm text-gray-800">{doc.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
