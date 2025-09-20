import shopify from "../../shopify-server.js";

export const action = async ({ request }) => {
    try {
        const { topic, shop, session, payload } = await shopify.processWebhookRequest(request);

        console.log(`📦 Webhook received: ${topic} for shop ${shop}`);

        if (topic === "DISCOUNTS_CREATE" || topic === "DISCOUNTS_UPDATE") {
            const client = new shopify.clients.Rest({ session });

            const discountValue =
                payload.value_type === "percentage"
                    ? `${payload.value}%`
                    : `$${payload.value}`;

            const entitledProducts = payload.entitled_product_ids || [];

            for (const productId of entitledProducts) {
                await client.post({
                    path: `/products/${productId}/metafields`,
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
            const client = new shopify.clients.Rest({ session });
            const entitledProducts = payload.entitled_product_ids || [];

            for (const productId of entitledProducts) {
                await client.delete({
                    path: `/products/${productId}/metafields/custom.discount_pct`,
                });
            }
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("❌ Error in webhook:", error);
        return new Response("Error", { status: 500 });
    }
};
