import { availableAmount } from "./recalculate-products-availability";
import assert from "assert";

describe("Recalculate Product Availability", () => {
    describe("availableAmount()", () => {
        [
            {
                articles: [
                    { amount_of: 4, stock: 12 },
                    { amount_of: 8, stock: 17 },
                    { amount_of: 1, stock: 2 }
                ],
                expected: 2
            },
            {
                articles: [
                    { amount_of: 4, stock: 12 },
                    { amount_of: 8, stock: 17 },
                    { amount_of: 1, stock: 1 }
                ],
                expected: 1
            }
        ].forEach(({ articles, expected }) => {
            it(`should return ${expected} for ${JSON.stringify(articles)}`, async () => {
                // act
                const actual = availableAmount(articles);

                // assert
                assert.deepStrictEqual(actual, expected);
            });
        });
    });
});
