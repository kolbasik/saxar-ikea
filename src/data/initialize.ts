import { AppContext } from "../context";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";

export const initializeFromDir = async (dirPath: string, app: AppContext): Promise<void> => {
    if (!fs.existsSync(dirPath)) {
        throw new Error(`Unable to load data from the ${dirPath}`);
    }

    const products = app.repository("product");
    const articles = app.repository("article");

    try {
        const data = JSON.parse(fs.readFileSync(path.resolve(dirPath, "inventory.json"), "utf-8")) as {
            inventory: {
                art_id: string;
                name: string;
                stock: string;
            }[];
        };

        for (const article of data.inventory) {
            await articles.set(article.art_id, {
                article_id: article.art_id,
                name: article.name,
                stock: +article.stock,
            });
        }
    } catch (error) {
        throw new Error(`Unable to load articles. ${error}`);
    }
    try {
        const data = JSON.parse(fs.readFileSync(path.resolve(dirPath, "products.json"), "utf-8")) as {
            products: {
                name: string;
                contain_articles: {
                    art_id: string;
                    amount_of: string;
                }[];
            }[];
        };

        for (const product of data.products) {
            const product_id = uuid();
            await products.set(product_id, {
                product_id,
                name: product.name,
                price: { value: 10_000, currency: "EUR" },
                available_amount: 0,
                contain_articles: product.contain_articles.map((it) => ({
                    article_id: it.art_id,
                    amount_of: +it.amount_of
                }))
            });
                    }
    } catch (error) {
        throw new Error(`Unable to load products. ${error}`);
    }
};
