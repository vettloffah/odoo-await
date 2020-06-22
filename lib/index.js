/*
*  Odoo Client
*
* A simple way to communicate with Odoo API featuring async-await.
* 2020 Charlie Wettlaufer
*
*/

const xmlrpc = require('xmlrpc');
const url = require('url');

class OdooClient {

  constructor (opts = {
    baseUrl: 'http://localhost',
    port: 8069,
    db: 'odoo_db',
    username: 'admin',
    password: 'admin'
  }) {

    this.host = url.parse(opts.baseUrl).hostname;
    this.secure = url.parse(opts.baseUrl).protocol === 'https';
    this.port = opts.port;
    this.db = opts.db;
    this.username = opts.username;
    this.password = opts.password;
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
        if(!uid){
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
   * @param model {string} e.g. 'res.partner'
   * @param method {string} e.g. 'create'
   * @param params {array} e.g. [userId]
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
   * @param model {string} e.g. 'res.partner'
   * @param params {object} Initial data to include in record eg: nam: 'some name', email: 'email@example.com
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
   * @param model {string} e.g. 'res.partner
   * @param recordId {number} e.g. 45
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
   * @param model {string} e.g. 'res.partner'
   * @param recordId {number} e.g. 45
   * @param params {object} Whatever fields you want to update like { name: 'some name', email: 'email@example.com }
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
   * @param model {string} e.g. 'res.partner'
   * @param recordId {number} e.g. 45
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
   * @param model {string} e.g. 'res.partner'
   * @param domain {object} What to match in search e.g. country_id; 'United States'
   * @param fields {array} Optional - fields to return in response e.g. ['name', 'state_id']
   * @param opts {object} Optional -  e.g. { offset: 100, limit: 5 }
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
   * @param model {string} e.g. res.partner (required)
   * @param attributes {array} what attributes you want returned for each field.
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
   * @param email {string} email address
   * @return {Promise<number>}
   */
  async searchForPartnerByEmail(email ){
    try {
      const partnerIdArray = await this.execute_kw('res.partner', 'search', [[[['email', '=', email]]]]);
      if(!partnerIdArray.length){
        new Error(`No partner found in Odoo matching email ${email}.`);
      }
      console.log(`Found partner by email, partner_id: ${partnerIdArray[0]}`);
      return partnerIdArray[0];
    } catch(err){
      throw err;
    }

  }

  /**
   * Add line to a quote / sales order
   * @param params {object} The order line data
   * @return {Promise<number>}
   */
  async createOrderLine(params = { order_id: null, product_id: null, product_uom_qty: 1, price_unit: null, name: null }){
    try {
      return await this.execute_kw('sale.order.line', 'create', [[params]]);
    } catch(err) {
      throw err;
    }
  }

}

module.exports = OdooClient;
