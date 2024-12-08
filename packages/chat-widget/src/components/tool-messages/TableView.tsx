import React from 'react';

interface Column {
  key: string;
  title: string;
  width?: number;
}

interface TableViewProps {
  columns: Column[];
  data: Record<string, any>[];
  caption?: string;
}

export const TableView: React.FC<TableViewProps> = ({ columns, data, caption }) => {
  return (
    <div className="tool-message table-view">
      <div className="table-container">
        {caption && <div className="table-caption">{caption}</div>}
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td key={`${rowIndex}-${col.key}`}>
                    {typeof row[col.key] === 'object'
                      ? JSON.stringify(row[col.key])
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        {data.length} {data.length === 1 ? 'row' : 'rows'}
      </div>
    </div>
  );
};
