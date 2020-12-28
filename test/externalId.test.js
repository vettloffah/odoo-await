const OdooAwait = require('../lib/index');
const should = require('should');
const { v4: uuidv4 } = require('uuid');

describe('OddoAwait external ID test', () => {

  const odoo = new OdooAwait({
    baseUrl: process.env.ODOO_BASE_URL || 'http://localhost',
    port: process.env.ODOO_PORT || 8069,
    db: process.env.ODOO_DB || 'odoo_db',
    username: process.env.ODOO_USER || 'admin',
    password: process.env.ODOO_PW || 'admin'
  });

  let randomStr = uuidv4();
  let externalId = `random_${randomStr}`;

  describe('#create()', () => {
    it('creates a record with an external ID', async() => {
      await odoo.connect();
      const recordId = await odoo.create('res.partner', {name: 'john doe', email: 'johndoe@example.com'}, externalId);
      recordId.should.be.instanceOf(Number);
      // clean up
      await odoo.delete('res.partner', recordId);
    });
  });

  describe('#createExternalId()', () => {
    it('creates an external ID for a res.partner record', async() => {
      randomStr = uuidv4();
      externalId = `random_${randomStr}`;
      const recordId = await odoo.create('res.partner',{name: 'jack dorsey', email: 'jack@example.com'});
      const irModelDataId = await odoo.createExternalId('res.partner', recordId, externalId, '__api__');
      irModelDataId.should.be.instanceOf(Number);
    });
  });

  describe('#searchByExternalId()', () => {
    it('returns a record ID if there is one', async() => {
      const recordId = await odoo.searchByExternalId(externalId);
      recordId.should.be.instanceOf(Number);
    })
  });

  describe('#readByExternalId()', () => {
    it('returns a res.partner record', async() => {
      const record = await odoo.readByExternalId(externalId, ['name', 'email']);
      record.should.have.property('id');
    });
  });

  describe('#updateByExternalId', () => {
    it('updates a record using the external identifier', async() => {
      const updated = await odoo.updateByExternalId(externalId);
      updated.should.be.exactly(true);
    })
  })

  describe('#deleteByExternalId()', () => {
    it('deletes a record by external ID', async() => {
      const deleted = await odoo.deleteByExternalId(externalId);
      deleted.should.be.exactly(true);
    });
  });


});
