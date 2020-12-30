import { isAvailableProduct } from "./get-all-available-products";
import { Product } from "../data/types";
import assert from "assert";

describe("Get All Available Products", () => {
    describe("isAvailableProduct()", () => {
        [
            {
                product: { available_amount: 1 } as Product,
                expected: true
            },
            {
                product: { available_amount: 0 } as Product,
                expected: false
            }
        ].forEach(({ product, expected }) => {
            it(`should return ${expected} for ${JSON.stringify(product)}`, async () => {
                // act
                const actual = isAvailableProduct(product);

                // assert
                assert.deepStrictEqual(actual, expected);
            });
        });
    });
});
