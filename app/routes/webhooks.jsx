// app/routes/webhooks.jsx
import { authenticate } from "../shopify.server";
import shopify from "../shopify.server";

export async function action({ request }) {
    const { topic, shop, session, payload } = await authenticate.webhook(request);

    console.log(`📦 Webhook received: ${topic} from ${shop}`);

    try {
        if (topic === "DISCOUNTS_CREATE" || topic === "DISCOUNTS_UPDATE") {
            const discountValue =
                payload.value_type === "percentage"
                    ? `${payload.value}%`
                    : `$${payload.value}`;

            const entitledProducts = payload.entitled_product_ids || [];

            const client = new shopify.api.clients.Rest({ session });

            for (const productId of entitledProducts) {
                console.log(`Updating product ${productId} with discount ${discountValue}`);
                await client.post({
                    path: `products/${productId}/metafields`,
                    data: {
                        metafield: {
                            namespace: "custom",
                            key: "discount_pct",
                            type: "single_line_text_field",
                            value: discountValue,
                        },
                    },
                });
            }
        }

        if (topic === "DISCOUNTS_DELETE") {
            console.log("Discount deleted — clearing product metafields");
            const entitledProducts = payload.entitled_product_ids || [];
            const client = new shopify.api.clients.Rest({ session });

            for (const productId of entitledProducts) {
                // Clear metafield (you might need to fetch metafield ID first)
                await client.delete({
                    path: `products/${productId}/metafields/custom.discount_pct`,
                });
            }
        }
    } catch (err) {
        console.error("❌ Webhook handler failed:", err);
        return new Response("Error", { status: 500 });
    }

    return new Response("OK", { status: 200 });
}
