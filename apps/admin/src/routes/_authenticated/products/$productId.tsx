import { createFileRoute } from "@tanstack/react-router";
import ProductDetailPage from "@/features/productDetail";

export const Route = createFileRoute("/_authenticated/products/$productId")({
    component: ProductDetailPage,
});
