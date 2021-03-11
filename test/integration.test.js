const OdooAwait = require('../lib/index');
const should = require('should');

describe('OddoAwait', () => {

  const odoo = new OdooAwait({
    baseUrl: process.env.ODOO_BASE_URL || 'http://localhost',
    port: process.env.ODOO_PORT || 8069,
    db: process.env.ODOO_DB || 'odoo_db',
    username: process.env.ODOO_USER || 'admin',
    password: process.env.ODOO_PW || 'admin'
  });

  describe('#connect()', () => {
    it('Authenticates and returns a UID number', async() => {
      const uid = await odoo.connect();
      uid.should.be.a.Number();
    })
  })

  let recordId;
  describe('#create()', () => {
    it('Creates a record and returns a record ID', async() => {
      recordId = await odoo.create('res.partner', {name: 'Kool Keith', email: 'lostinspace@example.com'});
      recordId.should.be.a.Number();
    })

  })

  describe('#read()', () => {
    it('Fetches record data by an array of IDs', async() => {
      const records = await odoo.read('res.partner', [recordId], ['name', 'email']);
      records.should.be.instanceOf(Array);
    })
  })

  describe('#update()', () => {
    it('Updates record and returns true', async() => {
      const updated = await odoo.update('res.partner', recordId, {email: 'seeingrobots@example.com'});
      updated.should.be.exactly(true);
    })
  })

  describe('#searchRead()', () => {
    it('Searches for records and returns the record(s) with data', async() => {
      const records = await odoo.searchRead('res.partner', {email: ['seeingrobots@example.com']});
      records[0].should.have.property('name');
    })
  })

  describe('#search()', () => {
    it('Searches for records and returns an array of record IDs', async() => {
      const records = await odoo.search('res.partner', {email: 'seeingrobots@example.com'});
      records.should.be.instanceOf(Array);
    })
  })

  describe('#delete()', () => {
    it('Deletes record and returns true', async() => {
      const deleted = await odoo.delete('res.partner', recordId);
      deleted.should.be.exactly(true);
    })
  })




})
