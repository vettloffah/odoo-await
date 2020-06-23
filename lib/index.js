/*
*  Odoo Await
*
* A simple way to communicate with Odoo API featuring async-await.
* 2020 Charlie Wettlaufer
*
*/

const xmlrpc = require('xmlrpc');
const url = require('url');

class OdooAwait {

  /**
   *  Config options default to the Odoo defaults if nothing passed in constructor.
   * @param opts {object} Config connection to Odoo
   * @param {string} opts.baseUrl -'http://localhost'
   * @param {number} opts.port - 8069
   * @param {string} [opts.db] - 'odoo_db'
   * @param {string} [opts.username] - 'admin'
   * @param {string} [opts.password] - 'admin
   */
  constructor (opts) {

    let defaults = {
      baseUrl: 'http://localhost',
      port: 8069,
      db: 'odoo_db',
      username: 'admin',
      password: 'admin'
    }

    const options = Object.assign(defaults, opts);

    this.host = url.parse(options.baseUrl).hostname;
    this.secure = url.parse(options.baseUrl).protocol === 'https';
    this.port = options.port;
    this.db = options.db;
    this.username = options.username;
    this.password = options.password;
    this.uid = 0;
  }

  /**
   * Connect to Odoo. Must be called before calling other methods.
   * @return {Promise<number>}
   */
  connect(){
    let self = this;
    const client = xmlrpc.createClient({host: this.host, port: this.port, path: '/xmlrpc/2/common'});

    let params = [];
    params.push(this.db, this.username, this.password);
    params.push({});

    return new Promise((resolve, reject) => {
      client.methodCall('authenticate', params, function(err, uid) {
        if(err){
          reject(err)
        }
        if(uid === false){
          reject("No UID returned from authentication" );
        }
        self.uid = uid;
        console.log('Connected to Oddo with user ID: ' + uid)
        resolve(uid);
      });
    })

  }

  /**
   * Execute various methods on Odoo models.
   * @param {string} model - e.g. 'res.partner'
   * @param {string} method - e.g. 'create'
   * @param {array} params
   * @return {Promise<>} Data from Odoo.
   */
  execute_kw(model, method, params) {

    const clientOpts = {
      host: this.host,
      port: this.port,
      path: '/xmlrpc/2/object'
    }

    let client = this.secure ? xmlrpc.createSecureClient(clientOpts) : xmlrpc.createClient(clientOpts);

    params.unshift( this.db, this.uid, this.password, model, method);

    return new Promise((resolve, reject) => {
      client.methodCall('execute_kw', params, function (err, resp) {
        if (err) reject(err);
        resolve(resp);
      });
    })
  }

  /*****************************
   * Basic CRUD Methods
   *****************************/

  /**
   * Create a record.
   * @param {string} model - e.g. 'res.partner'
   * @param {object} params - Initial data to include in record eg: nam: 'some name', email: 'email@example.com
   * @return {Promise<number>} record ID of the created record
   */
  async create(model, params = {}){
    try {
      const recordId = await this.execute_kw(model, 'create', [[params]]);
      console.log(`Model ${model} record created with ID ${recordId}`);
      return recordId;
    } catch(err) {
      throw `Error creating ${model} record:\n${err}`;
    }
  }

  /**
   * Read a single record by record ID.
   * @param {string} model - e.g. 'res.partner
   * @param {number} recordId - e.g. 45
   * @return {Promise<object>}
   */
  async read(model, recordId) {
    try {
      const records = await this.execute_kw(model, 'read', [[recordId]]);
      const record = records[0];
      console.log(`Retrieved ${model} ID ${record.id}`);
      return record;
    } catch(err) {
      throw err;
    }
  }

  /**
   * Update record
   * @param {string} model - e.g. 'res.partner'
   * @param {number} recordId - e.g. 45
   * @param {object} params - Whatever fields you want to update like { name: 'some name', email: 'email@example.com }
   * @return {Promise<boolean>} Returns true if update succeeds
   */
  async update(model, recordId, params = {}) {

    try {
      await this.execute_kw(model, 'write', [[recordId, params]]);
      console.log(`Model ${model} ID ${recordId} updated`);
      return true;
    } catch(err) {
      throw `Trying to update ${model} record failed:\n${err}`;
    }

  }

  /**
   * Delete a record
   * @param {string} model - e.g. 'res.partner'
   * @param {number} recordId -  e.g. 45
   * @return {Promise<boolean>} returns true if successful, otherwise throws error
   */
  async delete(model, recordId){
    try {
      await this.execute_kw(model, 'unlink', [[recordId]]);
      console.log(`Model ${model} ID ${recordId} deleted`);
      return true;
    } catch(err) {
      throw `Attempt to delete ${model} ID ${recordId} failed:\n${err}`;
    }
  }

  /*****************************
   * Other Methods
   *****************************/

  /**
   * Search for matching records and return them with the record data.
   * @param {string} model e.g. 'res.partner'
   * @param {object} domain What to match in search e.g. country_id; 'United States'
   * @param {array} [fields] - fields to return in response e.g. ['name', 'state_id']
   * @param {object} [opts] - options e.g. { offset: 100, limit: 5 }
   * @return {Promise<*>}
   */
  async searchRead(model, domain, fields = [],  opts = { offset: 0, limit: 0 }) {

    let domainArray = [];
    for (let [key, value] of Object.entries(domain)) {
      domainArray.push([`${key}`, '=', `${value}`]);
    }

    let params = [];
    params.push([domainArray]);
    params.push({fields: fields, offset: opts.offset, limit: opts.limit});

    try {
      return await this.execute_kw(model, 'search_read', params);
    } catch(err) {
      throw err;
    }

  }

  /**
   * Returns field attributes for a model.
   * @param {string} model -  e.g. res.partner (required)
   * @param {array} [attributes] - which attributes you want returned for each field.
   * example: ['type', 'string', 'required'] - If you want all attributes, just leave this param out.
   * @return {Promise<object>}
   */
  async getFields(model, attributes = []){
    return await this.execute_kw( model, 'fields_get', [[],{'attributes': attributes}], );
  }


  /*****************************
   * Various helper methods
   *****************************/

  /**
   * Search for customer by email
   * @param {string} email
   * @return {Promise<number>}
   */
  async searchForPartnerByEmail(email ){
    let partnerIdArray = [];
    try {
      partnerIdArray = await this.execute_kw('res.partner', 'search', [[[['email', '=', email]]]]);
    } catch(err){
      throw err;
    }

    // if no partner foound
    if(!partnerIdArray.length){
      return false;
    } else {
      console.log(`Found res.partner by email with partner ID ${partnerIdArray[0]}`);
      return partnerIdArray[0];
    }


  }

  /**
   * Create a line item on an order
   * @param {number} orderId - 475
   * @param {number} productId - 465
   * @param {number} [opts.qty] - quantity - defaults to 1
   * @param {number} [opts.price] - price per unit - 45.55
   * @param {number} [opts.discount] - line item discount
   * @param {string} [opts.name] - optional product description to replace default
   * @param {object} [opts] - optional params
   * @return {Promise<*>}
   */
  async createOrderLine(orderId, productId, opts = {}){

    const params = {
      order_id: orderId,
      product_id: productId,
      // only include the below properties if passed as args
      ...(opts.qty !== undefined && { product_uom_qty: opts.qty }),
      ...(opts.price &&  {price_unit: opts.price}),
      ...(opts.discount && {discount: opts.discount}),
      ...(opts.name && {name: opts.name})
    };

    try {
      const recordId = await this.execute_kw('sale.order.line', 'create', [[params]]);
      console.log(`Model sale.order.line record created with ID ${recordId}`);
    } catch(err) {
      throw err;
    }
  }

}

module.exports = OdooAwait;
