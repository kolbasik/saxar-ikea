import { AppContext } from "../context";
import { Command, Event } from "../cqrs";

export class RecalculateAllProductsAvailability extends Command {}

export class RecalculateProductsAvailability extends Command {
    constructor(public readonly product_ids: string[]) {
        super();
    }
}

export class RecalculateProductsAvailabilityFailed extends Event {
    constructor(public readonly product_id: string, public readonly reason: unknown) {
        super();
    }
}

export type ArticleStock = { amount_of: number; stock: number };

export const availableAmount = (articles: ArticleStock[]): number =>
    Math.max(0, Math.min(...articles.map((article) => Math.trunc(article.stock / article.amount_of))));

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createRecalculateAllProductsAvailabilityHandler = (app: AppContext) => {
    const productsRepository = app.repository("product");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return async (command: RecalculateAllProductsAvailability): Promise<void> => {
        const products = await productsRepository.all();
        const product_ids = products.map((it) => it.product_id);
        app.bus.tell(new RecalculateProductsAvailability(product_ids));
    };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createRecalculateProductsAvailabilityHandler = (app: AppContext) => {
    const productsRepository = app.repository("product");
    const articlesRepository = app.repository("article");
    return async (command: RecalculateProductsAvailability): Promise<void> => {
        const products = command.product_ids.map(async (product_id) => {
            const product = await productsRepository.get(product_id);
            return { product_id, product };
        });
        for await (const { product_id, product } of products) {
            try {
                if (product == null) {
                    throw new Error("NOT_FOUND");
                }
                const articles = await Promise.all(
                    product.contain_articles.map(async (it) => {
                        const article = await articlesRepository.get(it.article_id);
                        return { ...it, article };
                    })
                );
                const articleStocks = articles
                    .filter((it) => it.article != null)
                    .map((it): ArticleStock => ({ amount_of: it.amount_of, stock: it.article!.stock }));
                if (articleStocks.length < articles.length) {
                    throw new Error("ARTICLES_INCOMPLETE");
                }
                product.available_amount = availableAmount(articleStocks);
                await productsRepository.set(product_id, product);
            } catch (error) {
                app.bus.emit(new RecalculateProductsAvailabilityFailed(product_id, error));
            }
        }
    };
};
