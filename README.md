# Odoo Await

Simple Odoo API client using async await. Features CRUD, external IDs, and related field methods.

## Release Notes

#### 2.2.0
1. [Feature] - Now supports sorting records returned by the `searchRead()` function. Thanks to @tsogoo for the PR. 
   See [other API methods](#other-odoo-api-methods) below.
#### 2.1.1
1. [Bug Fix] - Fixed type casting in search methods. [Issue #8](https://github.com/vettloffah/odoo-await/issues/8).

#### 2.1.0
1. [Feature] - Use domain filters like `<`, `=like`, `in`, etc. for more complex searches. See 
[complex domain filters](#complex-domain-filters) below.

#### 2.0.2
1. [Bug fix] - Null values no longer throw errors.

#### 2.0.0
Version two introduces the following major feature additions:
1. [Feature] **Working with external ID's**. Create, search, read, update by using an external ID instead of model name and ID. See 
[Working with external identifiers](#working-with-external-identifiers) below. 
2. [Feature] **Enhanced functionality when working with many2many or one2many fields**. Now you can create records on the fly, update 
records, delete, or replace. See [Many2many and one2many fields](#many2many-and-one2many-fields) below.

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
This method is wrapped inside the below methods. If below methods don't do what you need, you can use this method. Docs: 
[Odoo External API](https://www.odoo.com/documentation/14.0/webservices/odoo.html)

## CRUD
#### odoo.create(model, params, externalId)
Returns the ID of the created record. The externalId parameter is special. If supplied, will create a linked record 
in the `ir.model.data` model. See the "working with external identifiers" section below for more information.

```js
const partnerId = await odoo.create('res.partner', {name: 'Kool Keith'});
```

#### odoo.read(model, recordId, fields)
Takes an array of record ID's and fetches the record data. Returns an array. 
Optionally, you can specify which fields to return. This 
is usually a good idea, since there tends to be a lot of fields on the base models (like over 100).

```js
const records = await odoo.read('res.partner', [54, 1568], ['name', 'email']);
console.log(records); 
// [ { name: 'Kool Keith', email: 'lostinspace@gmail.com }, { name: 'Jack Dorsey', email: 'jack@twitter.com' } ];
```
#### odoo.update(model, recordId, params)
Returns true if successful

```js
const updated = await odoo.update('res.partner', 54, {street: '334 Living Astro Blvd.'});
console.log(updated); // true
```
#### odoo.delete(model, recordId)
Returns true if successful.

```js
const deleted = await odoo.delete('res.partner', 54);
```

## many2many and one2many fields
Odoo handles the related field lists in a special way. You can choose to: 
1. `add` an existing record to the list using the record ID
2. `update` an existing record in the record set using ID and new values
2. `create` a new record on the fly and add it to the list using values
3. `replace` all records with other record(s) without deleting the replaced ones from database - using a list of IDs
4. `delete` one or multiple records from the database

In order to use any of these actions on a field, supply an object as the field value with the following parameters:
- **action** (required) - one of the strings from above
- **id** (required for actions that use id(s) ) - can usually be an array, or a single number
- **value** (required for actions that update or create new related records) - can usually be an single value object, or 
an array of value objects if creating mutliple records

#### Examples

  

```js

// create new realted records on the fly
await odoo.update('res.partner', 278, {
  category_id: {
    action: 'create',
    value: [
      { name : 'a new category' },
      { name: 'another new category'}
    ]
  }
});

// update a related record in the set
await odoo.update('res.partner', 278, {
  category_id: {
    action: 'update',
    id: 3,
    value: { name: 'Updated category' } 
  }
});

// add existing records to the set
await odoo.update('res.partner', 278, {
  category_id: {
    action: 'add',
    id: 5 // or an array of numbers
  }
});

// remove from the set but don't delete from database
await odoo.update('res.partner', 278, {
  category_id: {
    action: 'remove',
    id: 5 // or an array of numbers
  }
});

// remove record and delete from database
await odoo.update('res.partner', 278, {
  category_id: {
    action: 'delete',
    id: 5 // or an array of numbers
  }
});

// clear all records from set, but don't delete
await odoo.update('res.partner', 278, {
  category_id: {
    action: 'clear'
  }
});

// replace records in set with other existing records
await odoo.update('res.partner', 278, {
  category_id: {
    action: 'replace',
    id: [3, 12, 6] // or a single number
  }
});

// You can also just do a regular update with an array of IDs, which will accomplish same as above
await odoo.update('res.partner', 278, {
  category_id: [3, 12, 16]
});

```
## Other Odoo API Methods

#### odoo.search(model, domain)
Searches and returns record ID's for all records that match the model and domain.
```js
const recordIds =  await odoo.search(`res.partner`, {country_id: 'United States'});
console.log(recordIds); // [14,26,33, ... ]

// return all records of a certain model (omit domain)
const records =  await odoo.searchRead(`res.partner`);
```

#### odoo.searchRead(model, domain, fields, opts)
Searches for matching records and returns record data.
Provide an array of field names if you only want certain fields returned.
```js
const records =  await odoo.searchRead(`res.partner`, 
        {country_id: 'United States'}, 
        ['name', 'city'],  
        {limit: 5, offset: 10, order: 'name, desc'});
console.log(records); // [ {id: 5, name: 'Kool Keith', city: 'Los Angeles' }, ... ]

// Empty domain or other args can be used
const records =  await odoo.searchRead(`res.partner`, {}, ['name', 'city'], {limit: 10, offset: 20});
```

#### Complex domain filters
A domain filter array can be supplied if any of the alternate domain filters are needed, such as `<`, `>`, `=like`,`in` 
etc. For a complete list check out the 
[API Docs](https://www.odoo.com/documentation/14.0/reference/orm.html#reference-orm-domains).

```js
// single domain filter array
const recordIds =  await odoo.search(`res.partner`, ['name', '=like', 'john%']);

// or a multiple domain filter array (array of arrays)
const recordIds =  await odoo.search(`res.partner`, [['name', '=like', 'john%'], ['sale_order_count', '>', 1]]);

```

#### odoo.getFields(model, attributes)
Returns detailed list of fields for a model, filtered by attributes. i.e. if you only want to know if fields are required you could call:
```js
const fields = await odoo.getFields('res.partner', ['required']);
console.log(fields);
```

## Working With External Identifiers
External ID's can be important when syncing data between systems or updating 
records using your own unique identifiers instead of the Odoo database ID. 

External ID's are created automatically when exporting or importing data using the Odoo 
_user interface_, but when working with the API this must be done intentionally.

External IDs are managed separately in the 'ir.model.data' model in the database - so these methods make working with 
them easier.

#### Module names with external ID's
External ID's require a module name along with the ID. If you don't supply a module name when creating an external ID 
with this library, the default module name '\_\_api__' will be used. 
What that means is that `'some-unique-identifier'` will live in the database as 
`'\_\_api__.some-unique-identifier'`. You do _not_ need to supply the module name when searching using externalId.


#### create(model, params, externalId, moduleName)
If creating a record, simply supply the external ID as the third parameter, and a module name as an optional 4th parameter. 
This example creates a record and an external ID in one method. (although it makes two separate `create` calls to the 
database under the hood).

```js
const record = await odoo.create('product.product', {name: "new product"}, 'some-unique-identifier');
```
#### createExternalId(model, recordId, externalId)
For records that are already created without an external ID, you can link an external ID to it.
```js
await odoo.createExternalId('product.product', 76, 'some-unique-identifier');
```
#### readByExternalId(externalId, fields);
Find a record by the external ID, and return whatever fields you want. Leave the `fields` parameter empty to return all 
fields.
```js
const record = await odoo.readByExternalId('some-unique-identifier', ['name', 'email']);
```
#### updateByExternalId(externalId, params)
```js
const updated = await odoo.updateByExternalId('some-unique-identifier', {name: 'space shoe', price: 65479.99});
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
