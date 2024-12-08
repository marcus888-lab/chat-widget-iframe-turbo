import React from "react";
import { BaseToolProps } from "./types";

export interface ProductDetailProps extends BaseToolProps {
  product: {
    name: string;
    description: string;
    category: string;
    price: number;
    signed_url?: string;
    scores?: {
      hybrid: number;
    };
  };
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  sender,
  timestamp,
}) => {
  return (
    <div
      className={`product-detail ${sender === "assistant" ? "ml-8" : "mr-8"}`}
    >
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              {product.name}
            </h3>
            <p className="text-secondary-600 dark:text-secondary-300 mb-4">
              {product.description}
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  ${product.price.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center">
                <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-700 rounded-full text-sm">
                  {product.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-xs text-secondary-400 mt-2">
        {timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default ProductDetail;
