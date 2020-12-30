import { AppContext } from "../context";
import { Query } from "../cqrs";
import { Product } from "../data/types";

export const isAvailableProduct = (product: Product): boolean => product.available_amount > 0;

export class GetAllAvailableProducts extends Query<Product[]> {}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createGetAllAvailableProductsHandler = (app: AppContext) => {
    const productsRepository = app.repository("product");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return async (query: GetAllAvailableProducts): Promise<Product[]> => {
        const products = await productsRepository.all();
        return products.filter(isAvailableProduct);
    };
};
