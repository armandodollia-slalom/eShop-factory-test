<!-- head: 3aa06fdbbc3e00afb1ef6500268772a724f249d6 -->
## Demo video

No demo video: this change has no browser-visible part (backend only). (commit 3aa06fd)

## Before the fix / After the fix

### BUG-57: Placing an order with a card type the shop does not know answers with a server error


**1.** As alice, place an order for one Adventurer GPS Watch with a valid Redmond delivery address and valid card details, but set the card type to 99, a type the shop does not know, to see how the Ordering API handles an unknown card type.

```
POST /api/orders?api-version=1.0
Authorization: (masked)
Content-Type: application/json

{
  "userId": "50ddac7e-9b69-4d68-a91b-25100ef2e403",
  "userName": "alice",
  "city": "Redmond",
  "street": "15703 NE 61st Ct",
  "state": "WA",
  "country": "U.S.",
  "zipCode": "98052",
  "cardNumber": "4111111111111111",
  "cardHolderName": "Alice Smith",
  "cardExpiration": "2030-12-31T00:00:00Z",
  "cardSecurityNumber": "123",
  "cardTypeId": 99,
  "buyer": "50ddac7e-9b69-4d68-a91b-25100ef2e403",
  "items": [
    {
      "id": "1",
      "productId": 99,
      "productName": "Adventurer GPS Watch",
      "unitPrice": 199.99,
      "oldUnitPrice": 199.99,
      "quantity": 1,
      "pictureUrl": ""
    }
  ]
}
```

Before the fix:

```
HTTP 500
```

After the fix:

```
HTTP 400
content-type: application/problem+json

{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "CardTypeId": [
      "Card type 99 is not known."
    ]
  },
  "traceId": "00-ebdc7a88406dcafb4b3282f7a9722d00-890b71b5f6ed1eb5-01"
}
```

**What changed:** Before the fix it is a server error with no body. After the fix it is a bad request whose validation errors point at the card type field and say card type 99 is not known.
