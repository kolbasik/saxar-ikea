import { AppContext } from "../context";
import { Command, Event } from "../cqrs";
import { Product } from "../data/types";
import { RecalculateProductsAvailability } from "../actions";

export class SellProduct extends Command {
    constructor(public readonly product_id: string, public readonly amount: number) {
        super();
    }
}

export class SellProductFailed extends Event {
    constructor(public readonly command: SellProduct, public readonly reason: unknown) {
        super();
    }
}

export class ProductSold extends Event {
    constructor(public readonly command: SellProduct, public readonly product: Product) {
        super();
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createSellProductHandler = (app: AppContext) => {
    const productsRepository = app.repository("product");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return async (command: SellProduct): Promise<void> => {
        try {
            const product = await productsRepository.get(command.product_id);
            if (product == null) {
                throw new Error("NOT_FOUND_PRODUCT");
            }
            if (product.available_amount < command.amount) {
                throw new Error("NOT_ENOUGH_PRODUCT_AMOUNT");
            }
            product.available_amount -= command.amount;
            await productsRepository.set(product.product_id, product);
            app.bus.emit(new ProductSold(command, product));
        } catch (error) {
            app.bus.emit(new SellProductFailed(command, error));
        }
    };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createAdjustInventoryHandler = (app: AppContext) => {
    const articlesRepository = app.repository("article");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return async (event: ProductSold): Promise<void> => {
        const affected_product_ids = await Promise.all(
            event.product.contain_articles.map(
                async (it): Promise<string[]> => {
                    const article = await articlesRepository.get(it.article_id);
                    if (article) {
                        article.stock -= it.amount_of * event.command.amount;
                        await articlesRepository.set(article.article_id, article);
                        return article.used_in_products;
                    }
                    return [];
                }
            )
        );
        const unique_affected_product_ids = Array.from(new Set(affected_product_ids.flat()));
        app.bus.tell(new RecalculateProductsAvailability(unique_affected_product_ids));
    };
};
