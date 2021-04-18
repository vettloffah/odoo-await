const OdooAwait = require('../lib/index')
const should = require('should')

describe('OddoAwait external ID test', () => {

  const odoo = new OdooAwait({
    baseUrl: process.env.ODOO_BASE_URL || 'http://localhost',
    port: process.env.ODOO_PORT || 8069,
    db: process.env.ODOO_DB || 'odoo_db',
    username: process.env.ODOO_USER || 'admin',
    password: process.env.ODOO_PW || 'admin',
  })

  let recordIds = []

  describe('#create()', () => {
    it('creates 2 records with different names', async () => {
      await odoo.connect()
      const recordId1 = await odoo.create('res.partner',
        { name: 'aaa bbb', email: 'aaabbb@example.com' })
      const recordId2 = await odoo.create('res.partner',
        { name: 'aaa ccc', email: 'aaaccc@example.com' })
      recordIds = [recordId1, recordId2]
      recordIds[1].should.be.instanceOf(Number)
    })
  })

  // describe('#search', () => {
  //   it('searches with a simple domain object', async () => {
  //     const records = await odoo.search('res.partner', { name: 'john doe' });
  //     records.length.should.be.greaterThan(0);
  //   })
  // });

  describe('#searchRead()', () => {
    it('Searches with with sorting in descending order',
      async () => {
        const records = await odoo.searchRead('res.partner',
          ['name', 'ilike', '%aaa%'], [], { order: 'name desc' })
        records[0].name.should.be.exactly('aaa ccc')
      })
    it('Searches with with sorting in ascending order',
      async () => {
        const records = await odoo.searchRead('res.partner',
          ['name', 'ilike', '%aaa%'], [], { order: 'name asc' })
        records[0].name.should.be.exactly('aaa bbb')
      })
    it('Searches with no sort order specified',
      async () => {
        const records = await odoo.searchRead('res.partner',
          ['name', 'ilike', '%aaa%'])
        records.length.should.be.exactly(2)
      })
  })

  describe('#delete()', () => {
    it('deletes the created records', async () => {
      const deleted = await odoo.delete('res.partner', recordIds)
      deleted.should.be.exactly(true)
    })
  })

})
