# odoo-client

Node.js client library for [Odoo](https://www.odoo.com/) ERP using modern JS with async-await.
Utilizes the XML-RPC API methods.

# Contributing
Happy to merge all useful features and bug fixes. Just push a feature branch and a initiate a pull request.

Things that aren't currently included that should be:

- Inspection and introspection
- Additional helper functions to make working with the API easier for things that we might have to do often.

## Node version
Node 11.16+

## Installation

```sh
$ npm install odoo-client
```

# Testing
The default test will run through basic CRUD functions, creating a `res.partner` record, updating it, reading it, and deleting it.

If you are using default db name `"odoo_db"`, username `"admin"`, password `"admin"`, and port `8069` on `"http://localhost"`:
```shell script
$ npm test 
```
If you aren't using the defaults, pass the variables in command line with environment variables:
```shell script
$ ODOO_DB=my_database ODOO_USER=myusername ODOO_PW=my_password ODOO_PORT=8080 ODOO_BASE_URL=https://myodoo.com npm test 
```

# Methods

### odoo.connect()
Must be called before other methods.
### odoo.execute_kw(model,method,params)
This method is wrapped inside the below methods. If below methods don't do what you need, you can use this method. Docs: https://www.odoo.com/documentation/13.0/webservices/odoo.html
## CRUD
### odoo.create(model, params)
### odoo.read(model, recordId)
### odoo.update(model, recordId, params)
### odoo.delete(model, recordId)
## Other Methods
### odoo.searchRead(model, domain, fields, opts)
Searches for matching records and returns record data.
### odoo.getFields(model, attributes)
Returns detailed list of fields for a model, filtered by attributes. i.e. if you only want to know which fields are required you could call:
```js
const fields = await odoo.getFields('res.partner', ['required']);
console.log(fields);
```


## Usage

```js
const OdooClient = require('../OdooClient');
```

### Configuration

```js
const odoo = new OdooClient({
    url: 'http://localhost',
    port: 8069,
    db: 'odoo_db',
    username: 'admin',
    password: 'admin'
});
```

### Connect

```js
const uid = await odoo.connect //returns user ID of logged in user
```
### Calling methods

```js
const partnerId = await odoo.create('res.partner', {name: 'Kool Keith', email: 'lostinspace@example.com'});
```

### Create an order with a line item

```js
const orderId = await odoo.create('sale.order', {partner_id: partnerId});
await odoo.createOrderLine(orderId, 47, 1, 45.55, 'Dehydrated space food capsule');

```

### Search for records and return requested field values

```js
const matchingRecords = await odoo.searchRead('res.partner', {email: 'lostinspace@example.com'}, ['name, street, phone']);
console.log(matchingRecords);
```

### Complete Example
This example creates a partner (customer), creates an order (quote) for the customer, and finally ads a line item to that order. You might use this if integrating with an ecomm platform.

```js
const OdooClient = require('odoo-client');

const odoo = new OdooClient({
    url: 'http://localhost',
    port: 8069,
    db: 'odoo_db',
    username: 'admin',
    password: 'admin'
});

try {
  await odoo.connect();
  const partnerId = await odoo.create('res.partner', {name: 'Kool Keith', email: 'lostinspace@example.com'});
  const orderId = await odoo.create('sale.order', {partner_id: partnerId});
  await odoo.createOrderLine(orderId, 47, 1, 45.55, 'Dehydrated space food capsule.');
} catch(e) {
  console.log(e);
}
```


* [Odoo Docs](https://www.odoo.com/documentation/13.0)
* [Odoo External API](https://www.odoo.com/documentation/13.0/webservices/odoo.html)

## License

ISC

Copyright 2020 Charlie Wettlaufer

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
