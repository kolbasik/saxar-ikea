import fetch from "node-fetch";
import assert from "assert";
import { Article, Product } from "../src/data/types";

describe("API", () => {
    const BASE_URL = "http://localhost:3000";

    describe("REST", () => {
        it("should serve articles", async () => {
            // act
            const articles = await fetch(BASE_URL + "/api/v1/articles").then((r) =>
                r.ok ? r.json() : Promise.reject(r.statusText)
            );

            // assert
            assert.ok(articles.length > 0);
        });

        it("should serve products", async () => {
            // act
            const products = await fetch(BASE_URL + "/api/v1/products").then((r) =>
                r.ok ? r.json() : Promise.reject(r.statusText)
            );

            // assert
            assert.ok(products.length > 0);
        });
    });

    describe("RPC", () => {
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        const getAvailableProducts = (): Promise<Product[]> =>
            fetch(BASE_URL + "/api/v1/rpc/get-available-products", {
                method: "post",
                headers: {
                    "accept": "application/json"
                }
            }).then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)));

        const sellProduct = (data: { product_id: string; amount: number }): Promise<void> =>
            fetch(BASE_URL + "/api/v1/rpc/sell-product", {
                method: "post",
                headers: {
                    "content-type": "application/json",
                    "accept": "application/json"
                },
                body: JSON.stringify(data)
            }).then((r) => (r.ok && r.status == 204 ? undefined : Promise.reject(r.statusText)));

        describe("GetAvailableProducts", () => {
            it("should serve available products", async () => {
                // act
                const products = await getAvailableProducts();

                // assert
                assert.ok(products.length > 0);
                products.forEach((product: { available_amount: number }) => {
                    assert.ok(product.available_amount > 0, "product.available_amount == 0");
                });
            });
        });

        describe("SellProduct", () => {
            it("should serve sell product", async () => {
                // act & assert
                await sellProduct({
                    product_id: "ANY" + Date.now(),
                    amount: 1
                });
            });

            it("should change available amount of products", async () => {
                // arrange
                const products = await getAvailableProducts();
                assert.strictEqual(products.length, 2); // predefined data
                assert.deepStrictEqual(
                    products.map(({ available_amount }) => ({ available_amount })),
                    [{ available_amount: 2 }, { available_amount: 1 }]
                );

                for (let step = 1; step <= 2; ++step) {
                    switch (step) {
                        case 1: {
                            // act
                            await sellProduct({
                                product_id: products[0].product_id,
                                amount: 1
                            });
                            await delay(100);
                            const actual = await getAvailableProducts();

                            // assert
                            assert.strictEqual(actual.length, 2); // predefined data
                            assert.deepStrictEqual(
                                actual.map(({ available_amount }) => ({ available_amount })),
                                [{ available_amount: 1 }, { available_amount: 1 }]
                            );
                            break;
                        }
                        case 2: {
                            // act
                            await sellProduct({
                                product_id: products[0].product_id,
                                amount: 1
                            });
                            await delay(100);
                            const actual = await getAvailableProducts();

                            // assert
                            assert.strictEqual(actual.length, 0, "all products should be sold");
                            break;
                        }
                    }
                }
            });
        });
    });
});
