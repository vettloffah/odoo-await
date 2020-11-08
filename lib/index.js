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
   * @param {object} [opts] - configure connection to Odoo
   * @param {string} [opts.baseUrl] -'http://localhost'
   * @param {number} [opts.port] - 8069
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

    const options = opts ? Object.assign(defaults, opts) : defaults;

    this.host = url.parse(options.baseUrl).hostname;
    this.secure = url.parse(options.baseUrl).protocol === 'https:';
    this.port = options.port;
    this.db = options.db;
    this.username = options.username;
    this.password = options.password;
    this.uid = 0;
  }

  /**
   * Connect to Odoo. Must be called before calling other methods.
   * @return {Promise<number>} - returns user ID if connected
   */
  connect(){
    let self = this;
    let client;
    if(this.secure){
      client = xmlrpc.createSecureClient({host: this.host, port: this.port, path: '/xmlrpc/2/common'});
    }else{
      client = xmlrpc.createClient({host: this.host, port: this.port, path: '/xmlrpc/2/common'});
    }


    let params = [];
    params.push(this.db, this.username, this.password);
    params.push({});

    return new Promise((resolve, reject) => {
      client.methodCall('authenticate', params, function(err, uid) {
        if(err){
          reject(err);
          return;
        }
        if(!uid){
          reject("Error connecting to database. This is probably due to invalid credentials." );
          return;
        }
        self.uid = uid;
        console.log('Connected to Odoo with user ID: ' + uid)
        resolve(uid);
      });
    })

  }

  /**
   * Execute various methods on Odoo models. Recommend using one of the CRUD
   * methods below if it does what you need. Otherwise you need a deeper understanding
   * of how the Odoo XMLRPC api works.
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
        if (err) {
          reject(err);
          return;
        }
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
   * @param {object} params - Initial data to include in record eg: name: 'some name', email: 'email@example.com
   * @return {Promise<number>} record ID of the created record
   */
  async create(model, params = {}){

    // detect array for many2many field and format for odoo api
    for (const param in params){
        if (Array.isArray(params[param])){
            params[param] = [[6,0,params[param]]]
        }
    }

    // return record ID
    return await this.execute_kw(model, 'create', [[params]]);
  }

  /**
   * Fetches record data by a list of ID's.
   * @param {string} model - e.g. 'res.partner
   * @param {array} recordIds - e.g. [45, 15748, 347] or [45]
   * @param {array} [fields] - optional list of fields to return instead of all fields
   * @return {Promise<object>}
   */
  async read(model, recordIds, fields = []) {

    let params = [[recordIds]];
    if(fields.length){
      params.push({fields: fields});
    }

    return await this.execute_kw(model, 'read', params);

  }

  /**
   * Update record
   * @param {string} model - e.g. 'res.partner'
   * @param {number} recordId - e.g. 45
   * @param {object} params - Whatever fields you want to update like { name: 'some name', email: 'email@example.com }
   * @return {Promise<boolean>} Returns true if update succeeds
   */
  async update(model, recordId, params = {}) {

    // detect array for many2many field and format for odoo api
    for (const param in params){
      if (Array.isArray(params[param])){
        params[param] = [[6,0,params[param]]]
      }
    }

    await this.execute_kw(model, 'write', [[recordId, params]]);
    return true;

  }

  /**
   * Delete a record
   * @param {string} model - e.g. 'res.partner'
   * @param {number} recordId -  e.g. 45
   * @return {Promise<boolean>} returns true if successful, otherwise throws error
   */
  async delete(model, recordId){

    await this.execute_kw(model, 'unlink', [[recordId]]);
    return true;

  }

  /*****************************
   * Other Methods
   *****************************/

  /**
   * Search for matching records and return them with the record data.
   * @param {string} model e.g. 'res.partner'
   * @param {object} domain What to match in search e.g. country_id: 'United States'.
   * provide empty object to return all records.
   * @param {array} [fields] - fields to return in response e.g. ['name', 'state_id']
   * @param {object} [opts] - options e.g. { offset: 100, limit: 5 }
   * @return {Promise<Array>}
   */
  async searchRead(model, domain, fields = [],  opts = { offset: 0, limit: 0 }) {

    let domainArray = [];
    if(domain){
      for (let [key, value] of Object.entries(domain)) {
        domainArray.push([`${key}`, '=', `${value}`]);
      }
    }


    let params = [];
    params.push([domainArray]);
    params.push({fields: fields, offset: opts.offset, limit: opts.limit});

    return await this.execute_kw(model, 'search_read', params);


  }

  /**
   * Search for matching records and return ID's in an array.
   * @param {string} model - e.g. 'res.partner'
   * @param {object} domain - What to match in search e.g. country_id: 'United States'.
   * @return {Promise<Array>}
   */
  async search(model, domain) {

    let domainArray = [];
    if(domain){
      for (let [key, value] of Object.entries(domain)) {
        domainArray.push([`${key}`, '=', value]);
      }
    }

    let params = [];
    params.push([domainArray]);

    return await this.execute_kw(model, 'search', params);

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

    const partnerIdArray = await this.execute_kw('res.partner', 'search', [[[['email', '=', email]]]]);

    // if no partner found
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

    const recordId = await this.execute_kw('sale.order.line', 'create', [[params]]);
    console.log(`Model sale.order.line record created with ID ${recordId}`);

  }

}

module.exports = OdooAwait;
