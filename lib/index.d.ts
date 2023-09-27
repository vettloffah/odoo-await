interface OdooAwaitOptions {
    baseUrl: string;
    port?: number;
    db: string;
    username: string;
    password: string;
  }

  type BasicAuth = {
    user: string;
    pass: string;
  } | null;

  type OdooSearchDomain = any | any[];

  interface OdooSearchReadOptions {
    offset?: number;
    limit?: number;
    order?: string;
    context?: any;
  }


  declare module 'odoo-await' {
    namespace OdooAwait {
      interface SearchReadOptions extends OdooSearchReadOptions {}
      interface SearchDomain extends OdooSearchDomain {}
    }

    class OdooAwait {
      static host: string;
      static secure: boolean;
      static port: number;
      static basicAuth: BasicAuth;
      static db: string;
      static username: string;
      static password: string;
      static uid: number;

      /**
       *  Config options default to the Odoo defaults if nothing passed in constructor.
       * @typedef {object} [opts] - configure connection to Odoo
       * @param {string} [opts.baseUrl] -'http://localhost' (note, port number can be provided as part of the URL)
       * @param {number} [opts.port] - undefined, defaults to protocol default port
       * @param {string} [opts.db] - 'odoo_db'
       * @param {string} [opts.username] - 'admin'
       * @param {string} [opts.password] - 'admin
       */
      constructor(opts: OdooAwaitOptions);

      /**
       * Assemble options for xmlrpc client using given path.
       * @param {string} path The path to use for XMLRPC
       * @returns options to be used with xmlrpc client
       */
      createClientOptions(path: string): {
        host: string;
        port: number;
        basic_auth: BasicAuth;
        path: string;
      };

      /**
       * Connect to Odoo. Must be called before calling other methods.
       * @return {Promise<number>} - returns user ID if connected
       */
      connect(): any;

      /**
       * Execute various methods on Odoo models. Recommend using one of the CRUD
       * methods below if it does what you need. Otherwise you need a deeper understanding
       * of how the Odoo XMLRPC api works.
       * @param {string} model - e.g. 'res.partner'
       * @param {string} method - e.g. 'create'
       * @param {array} params
       * @return {Promise<>} Data from Odoo.
       */
      execute_kw(model: string, method: string, params: any[]): Promise<any>;

      /**
       * Private function for checking for many2many / one2many fields
       * Searches for values that have the "action" property
       * If "action" property is found, we assume it's a many2many / many2one field,
       * and processes as such.
       * If no "action" property is found, we just return the parameter as it was
       * received.
       * @param params
       * @returns {*}
       */
      parseManyFields(params: any): any;

      /**
       * Create a record.
       * @param {string} model - e.g. 'res.partner'
       * @param {object} params - Initial data to include in record eg: { name: 'some name', email: 'email@example.com }
       * @param {string} [externalId] - this is a special parameter. Supplying it will
       * create a linked 'res.model.data' record that is used to store external ID's
       * of other models. See the README for more information.
       * @param {string} [moduleName] - custom module name for external ID (optional).
       * @return {Promise<number>} record ID of the created record
       */
      create(
        model: string,
        params: any,
        externalId?: string,
        moduleName?: string,
      ): Promise<number>;

      /**
       * Fetches record data by a list of ID's.
       * @param {string} model - e.g. 'res.partner
       * @param {array|number} recordId - a record ID integer or an array of ID's e.g. `45` or `[45, 15748, 347]`
       * @param {array} [fields] - optional list of fields to return instead of all fields
       * @return {Promise<object[]>}
       */
      read<T>(
        model: string,
        recordId: number[] | number,
        fields?: string[],
      ): Promise<T[]>;

      /**
       * Update record
       * @param {string} model - e.g. 'res.partner'
       * @param {number | array} recordId - e.g. 45 or [45, 271]. If you provide
       * an array, the same value(s) are updated in every record.
       * @param {object} params - Whatever fields you want to update e.g.
       * { name: 'some name', email: 'john@example.com }
       * if updating a many2many or one2many field, use a special object. For more info,
       * view the readme.
       * @return {Promise<boolean>} Returns true if update succeeds
       */
      update(
        model: string,
        recordId: number[] | number,
        params?: any,
      ): Promise<boolean>;

      /**
       * Delete a record
       * @param {string} model - e.g. 'res.partner'
       * @param {number | array} recordId -  e.g. 45 or [45, 667, 857]
       * @return {Promise<boolean>} returns true if successful, otherwise throws error
       */
      delete(model: string, recordId: number[] | number): Promise<boolean>;

      /**
       * Search for matching records and return them with the record data.
       * @param {string} model e.g. 'res.partner'
       * @param {object|array} [domain] What to match in search e.g. country_id: 'United States'.
       * provide empty object to return all records. Leave out or provide an empty
       * object to return all records.
       * @param {array} [fields] - fields to return in response e.g. ['name', 'state_id']
       * @param {object} [opts] - options e.g. { offset: 100, limit: 5, order: 'category, birthday desc' }
       * @return {Promise<T[]>}
       */
      searchRead<T>(
        model: string,
        domain?: OdooSearchDomain,
        fields?: string[],
        opts?: OdooSearchReadOptions,
      ): Promise<T[]>;

      /**
       * Search for matching records and return ID's in an array.
       * @param {string} model - e.g. 'res.partner'
       * @param {object|array} [domain] - What to match / filter in search e.g.
       * {country_id: 'United States'}.
       * Or you can use an array like: ['country_id', 'in', ['United States', 'Canada']].
       * Or an array of arrays like: [['country_id', '=', 'Canada'],['email','=','lostinspace@example.com']]
       * Lots of filters you can use: https://www.odoo.com/documentation/14.0/reference/orm.html#reference-orm-domains
       * Leave out or provide empty object ro return all records.
       * @return {Promise<number[]>}
       */
      search(model: string, domain?: OdooSearchDomain): Promise<number[]>;

      /**
       * Returns field attributes for a model.
       * @param {string} model -  e.g. res.partner (required)
       * @param {array} [attributes] - which attributes you want returned for each field.
       * example: ['type', 'string', 'required'] - If you want all attributes, just leave this param out.
       * @return {Promise<object>}
       */
      getFields(model: string, attributes?: string[]): Promise<any>;

      /**
       * Execute a server action on a record or set of records.
       * Oddly, the Odoo API returns **false** if it was successful, or an error if it wasn't.
       *
       * @param {string} model - name of model, example: `sale.order`
       * @param {string} action - name of action example: `action_confirm`
       * @param {number | number[]} recordId - record ID or array of record IDs to execute the action on.
       * @returns {Promise<boolean>} - oddly, this returns **false** if it was successful, or an error if it wasn't.
       */
      action(
        model: string,
        action: string,
        recordId: number | number[],
      ): Promise<boolean>;

      /**
       * Add an external ID to an existing record.
       * @param {string} model - model name of record the external ID is being created for
       * @param {number} recordId - the Odoo record ID of the record
       * @param {string} externalId - the unique identifier
       * @param {string} [moduleName] - a module name is always appended to the beginning of an
       * external ID. You can omit this arg to use the default '__api__'.
       * @returns {Promise<*>}
       */
      createExternalId(
        model: string,
        recordId: number,
        externalId: string,
        moduleName?: string,
      ): Promise<number>;

      /**
       * Returns the record ID that is connected to the External ID. YOu don't need
       * to include the module name.
       * @param externalId
       * @returns {Promise<number>}
       */
      searchByExternalId(externalId: string): Promise<number>;

      /**
       * Read a single record by supplying external ID.
       * @param {string} externalId
       * @param {array} [fields] - optional array of fields to return. If left blank
       * @returns {Promise<Object>}
       */
      readByExternalId<T>(externalId: string, fields?: string[]): Promise<T>;

      /**
       * Update a record using its external identifier.
       * @param externalId
       * @param params
       * @returns {Promise<boolean>}
       */
      updateByExternalId(externalId: string, params?: any): Promise<boolean>;

      /**
       * Delete a record by it's external identifier
       * @param {string} externalId - the records external identifier
       * @returns {Promise<boolean>} - true if record successfully deleted
       */
      deleteByExternalId(externalId: string): Promise<boolean>;
    }

    export = OdooAwait;
  }
