import { json } from "@remix-run/node";
import shopify from "../../shopify-server";

export const action = async ({ request }) => {
    const { topic, shop, session, body } = await shopify.authenticate.webhook(request);

    console.log(`Discount webhook received: ${topic} for shop ${shop}`);
    console.log("Payload:", body);

    // Step 1: Parse discount payload
    const discount = body.discount || body; // Shopify webhook sends "discount" object
    const discountValue = discount.value; // e.g. 20 (percent) or 10 (fixed amount)
    const valueType = discount.value_type; // "percentage" or "fixed_amount"

    // Format the metafield value
    let metafieldValue = valueType === "percentage" ? `${discountValue}%` : `$${discountValue}`;

    // Step 2: Find the product IDs affected by this discount
    // This depends on your discount config — sometimes products are direct, sometimes via collections
    const productIds = discount.entitled_product_ids || [];

    // Step 3: Update metafields for each product
    const client = new shopify.api.clients.Graphql({ session });

    for (const productId of productIds) {
        try {
            await client.query({
                data: {
                    query: `
            mutation updateProductMetafield($productId: ID!, $value: String!) {
              metafieldsSet(metafields: [{
                namespace: "custom",
                key: "discount_pct",
                value: $value,
                type: "single_line_text_field"
              }], ownerId: $productId) {
                userErrors {
                  field
                  message
                }
              }
            }
          `,
                    variables: {
                        productId: `gid://shopify/Product/${productId}`,
                        value: metafieldValue,
                    },
                },
            });

            console.log(`✅ Updated metafield for product ${productId}`);
        } catch (err) {
            console.error(`❌ Failed to update metafield for product ${productId}`, err);
        }
    }

    return json({ success: true });
};
