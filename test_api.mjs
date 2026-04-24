
import fetch from 'node-fetch';

async function testCreateInvoice() {
    const payload = {
      "customerId": 5,
      "totalAmount": 75000,
      "paymentMethod": "transfer",
      "paymentStatus": "pending",
      "dueDate": "2026-04-26T00:00:00.000Z",
      "items": [
        {
          "productId": 1,
          "quantity": 1,
          "unitPrice": 75000,
          "subtotal": 75000
        }
      ]
    };

    console.log("Sending request to http://localhost:5000/api/sales/invoices...");
    try {
        const response = await fetch('http://localhost:5000/api/sales/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note:isAuthenticated middleware might block this if not logged in.
                // But let's see what it returns.
            },
            body: JSON.stringify(payload)
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text);
    } catch (err) {
        console.error("Fetch error:", err.message);
    }
}

testCreateInvoice();
