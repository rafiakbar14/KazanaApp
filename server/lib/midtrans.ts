import midtransClient from "midtrans-client";

// Initialize Snap API client
export const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY || "YOUR_MIDTRANS_SERVER_KEY",
});

// Helper to generate transaction token
export async function createTransactionToken(orderId: string, grossAmount: number, customerDetails?: any, itemDetails?: any[]) {
    const parameter = {
        transaction_details: {
            order_id: orderId,
            gross_amount: Math.round(grossAmount),
        },
        credit_card: {
            secure: true,
        },
        customer_details: customerDetails,
        item_details: itemDetails,
    };

    try {
        const transaction = await snap.createTransaction(parameter);
        return transaction.token;
    } catch (e) {
        console.error("Midtrans createTransaction error:", e);
        throw e;
    }
}

// Helper to verify webhook notification signature
export async function verifyWebhookSignature(notificationBody: any) {
    try {
        const statusResponse = await snap.transaction.notification(notificationBody);
        return statusResponse;
    } catch (e) {
        console.error("Midtrans webhook verification error:", e);
        throw e;
    }
}
