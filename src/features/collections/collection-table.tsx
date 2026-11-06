import { ValueCell } from '@/components/value-cell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CollectionDocument } from './api';

/** A read-only table whose columns come from the server's `fields`, so no model needs its own code. */
export function CollectionTable({
  fields,
  documents,
}: {
  fields: string[];
  documents: CollectionDocument[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {fields.map((field) => (
              <TableHead key={field} className="font-mono text-xs whitespace-nowrap">
                {field}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document, index) => (
            <TableRow key={typeof document.id === 'string' ? document.id : index}>
              {fields.map((field) => (
                <TableCell key={field} className="align-top">
                  <ValueCell value={document[field]} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
