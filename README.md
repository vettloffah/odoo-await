# Odoo Await

Simple Odoo API client using async await. Features CRUD and extra methods.
Odoo API docs: [Odoo External API](https://www.odoo.com/documentation/14.0/webservices/odoo.html)

# Contributing
Happy to merge all useful features and bug fixes. Just start an 'issue' regarding the update, fork the repo, 
commit your changes, and submit a pull request.

## Node version
Node 11.16+

## Installation

```sh
$ npm install odoo-await
```

## Usage

```js
const Odoo = require('odoo-await');

const odoo = new Odoo({
    baseUrl: 'http://localhost',
    port: 8069,
    db: 'odoo_db',
    username: 'admin',
    password: 'admin'
});

await odoo.connect();

const partnerId = await odoo.create('res.partner', {name: 'Kool Keith', email: 'lostinspace@example.com'});
console.log(`Partner created with ID ${partnerId}`);
```
# Methods

### odoo.connect()
Must be called before other methods.
### odoo.execute_kw(model,method,params)
This method is wrapped inside the below methods. If below methods don't do what you need, you can use this method. Docs: https://www.odoo.com/documentation/13.0/webservices/odoo.html
## CRUD
### odoo.create(model, params)
Returns the ID of the created record.

```js
const partnerId = await odoo.create('res.partner', {name: 'Kool Keith'})
```
#### many2many fields 
Provide an array of record ID's for many2many fields

```js
const partnerId = await odoo.create('res.partner', {name: 'Kool Keith', tag_ids: [1,3,5]})
```

### odoo.read(model, recordId)
Takes an array of record ID's and fetches the record data. Returns an array. 
Optionally, you can specify which fields to return. This 
is usually a good idea, since there tends to be a lot of fields on the base models (like over 100).

```js
const records = await odoo.read('res.partner', [54, 1568], ['name', 'email']);
console.log(records); 
// [ { name: 'Kool Keith', email: 'lostinspace@gmail.com }, { name: 'Jack Dorsey', email: 'jack@twitter.com' } ];
```
### odoo.update(model, recordId, params)
Returns true if successful

```js
const updated = await odoo.update('res.partner', 54, {street: '334 Living Astro Blvd.'})
console.log(updated); // true
```
### odoo.delete(model, recordId)
Returns true if successful.

```js
const deleted = await odoo.delete('res.partner', 54);
```
## Other Methods
### odoo.search(model, domain)
Searches and returns record ID's for all records that match the model and domain.
```js
const recordIds =  await odoo.search(`res.partner`, {country_id: 'United States'});
console.log(recordIds); // [14,26,33, ... ]
```

### odoo.searchRead(model, domain, fields, opts)
Searches for matching records and returns record data.
Provide an array of field names if you only want certain fields returned.
```js
const records =  await odoo.searchRead(`res.partner`, {country_id: 'United States'}, ['name', 'city'],  {limit: 5, offset: 10});
console.log(records); // [ {id: 5, name: 'Kool Keith', city: 'Los Angeles' }, ... ]
```
If you just want to do a basic search_read you can omit the extra args:
```js
const records =  await odoo.searchRead(`res.partner`, {country_id: 'United States'});
```
Empty args can be used if you need some type of filtering but not others:
```js
const records =  await odoo.searchRead(`res.partner`, {}, [], {limit: 10, offset: 20});
```

### odoo.getFields(model, attributes)
Returns detailed list of fields for a model, filtered by attributes. i.e. if you only want to know if fields are required you could call:
```js
const fields = await odoo.getFields('res.partner', ['required']);
console.log(fields);
```
### odoo.createOrderLine(orderId, productId, opts)

```js
const orderId = await odoo.create('sale.order', {partner_id: 54});
await odoo.createOrderLine(orderId, 47, { qty: 2, price: 45.55, name: 'Dehydrated space food capsule'} );
```

### Complete Example
This example creates a partner (customer), creates an order (quote) for the customer, and finally ads a line item to that order. You might use this if integrating with an ecomm platform.

```js
const Odoo = require('odoo-await');

const odoo = new Odoo({
    baseUrl: 'http://localhost',
    port: 8069,
    db: 'odoo_db',
    username: 'admin',
    password: 'admin'
});

try {
  await odoo.connect();
  const partnerId = await odoo.create('res.partner', {name: 'Kool Keith', email: 'lostinspace@example.com'});
  const orderId = await odoo.create('sale.order', {partner_id: partnerId});
  await odoo.createOrderLine(orderId, 47, { qty: 2, price: 45.55, name: 'Dehydrated space food capsule'} );
} catch(e) {
  console.log(e);
}
```
## Testing
The default test will run through basic CRUD functions, creating a `res.partner` record, updating it, reading it, and deleting it. Uses Mocha and Should as dependencies.

If you are using default db name `"odoo_db"`, username `"admin"`, password `"admin"`, and port `8069` on `"http://localhost"`:
```shell script
$ npm test 
```
If you aren't using the defaults, pass the variables in command line with environment variables:
```shell script
$ ODOO_DB=mydatabase ODOO_USER=myusername ODOO_PW=mypassword ODOO_PORT=8080 ODOO_BASE_URL=https://myodoo.com npm test 
```


* [Odoo Docs](https://www.odoo.com/documentation/14.0)
* [Odoo External API](https://www.odoo.com/documentation/14.0/webservices/odoo.html)

## License

ISC

Copyright 2020 Charlie Wettlaufer

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
