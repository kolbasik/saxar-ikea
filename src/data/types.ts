export type ResourceMap = {
    article: Article;
    product: Product;
};

export type Article = {
    article_id: string;
    name: string;
    stock: number;
};

export type Product = {
    product_id: string;
    name: string;
    price: {
        value: number;
        currency: string;
    };
    available_amount: number;
    contain_articles: {
        article_id: string;
        amount_of: number;
    }[];
};
