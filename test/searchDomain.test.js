const OdooAwait = require('../lib/index');
const should = require('should');

describe('OddoAwait external ID test', () => {

  const odoo = new OdooAwait({
    baseUrl: process.env.ODOO_BASE_URL || 'http://localhost',
    port: process.env.ODOO_PORT || 8069,
    db: process.env.ODOO_DB || 'odoo_db',
    username: process.env.ODOO_USER || 'admin',
    password: process.env.ODOO_PW || 'admin'
  });

  let recordId =0;


  describe('#create()', () => {
    it('creates', async() => {
      await odoo.connect();
      recordId = await odoo.create('res.partner', {name: 'john doe', email: 'johndoe@example.com'});
      recordId.should.be.instanceOf(Number);
    });
  });

  describe('#search', () => {
    it('searches with a simple domain object', async() => {
      const records = await odoo.search('res.partner', {name: 'john doe'});
      records.length.should.be.greaterThan(0);
    })

    it('searches with a single domain filter array', async() => {
      const records = await odoo.search('res.partner', ['name', '=', 'john doe']);
      records.length.should.be.greaterThan(0);
    })

    it('searches with a multiple domain filter array', async() => {
      const records = await odoo.search('res.partner',
        [
          ['name', '=like', 'john%'],
          ['email', '=', 'johndoe@example.com']
        ]);
      records.length.should.be.greaterThan(0);
    })
  })

  describe('#searchRead()', () => {
    it('Searches with a simple domain object and returns the records with data', async() => {
      const records = await odoo.searchRead('res.partner', {name: 'john doe'});
      records[0].should.have.property('name');
    })

    it('Uses a filter array to search for records and returns the records with data', async() => {
      const records = await odoo.searchRead('res.partner', ['name', '=', 'john doe']);
      records[0].should.have.property('name');
    })

    it('searches with a multiple domain filter array', async() => {
      const records = await odoo.searchRead('res.partner',
        [
          ['name', '=like', 'john%'],
          ['email', '=', 'johndoe@example.com']
        ]);
      records[0].should.have.property('name');
    })
  })

  describe('#delete()', () => {
    it('deletes the test record', async() => {
      const deleted = await odoo.delete('res.partner',recordId);
      deleted.should.be.exactly(true);
    });
  });


});
