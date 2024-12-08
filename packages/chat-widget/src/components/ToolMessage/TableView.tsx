import React from "react";
import { TableViewProps } from "./types";

export const TableView: React.FC<TableViewProps> = ({
  headers,
  rows,
  sender,
}) => {
  if (!headers?.length || !rows?.length) {
    return (
      <div
        className={`mt-2 p-4 rounded-lg bg-secondary-50 border border-secondary-200 text-secondary-900 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-50 ${
          sender === "assistant" ? "ml-8" : "mr-8"
        }`}
      >
        <p className="text-sm text-secondary-600 dark:text-secondary-300">
          No table data available
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mt-2 overflow-x-auto ${
        sender === "assistant" ? "ml-8" : "mr-8"
      }`}
    >
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden rounded-lg border border-secondary-200 dark:border-secondary-700">
          <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
            <thead className="bg-secondary-50 dark:bg-secondary-800">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-4 py-3 text-left text-sm font-semibold text-secondary-900 dark:text-secondary-100"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 bg-white dark:divide-secondary-700 dark:bg-secondary-900">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="whitespace-nowrap px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableView;
