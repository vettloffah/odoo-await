/**
 *  Testing many2many / one2many fields
 * @type {OdooAwait}
 */

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

  let recordId;
  let categoryId;


  it('connects to odoo', async() => {
    await odoo.connect();
  })

  describe('#create()', () =>{
    it('creates record with a set of records in a many2many field', async() =>{
      recordId = await odoo.create('res.partner',{name: 'Testing RelatedFields', category_id: [1,2]});
      recordId.should.be.a.Number();
    });
  });

  describe('#update()', () => {
    it('updates a many2many with new id set', async() =>{
      await odoo.update('res.partner', recordId, { category_id: [3]});
      const record = (await odoo.read('res.partner', recordId, ['category_id']))[0];
      record['category_id'].length.should.be.exactly(1);
      record['category_id'][0].should.be.exactly(3);
    });
  });

  describe('#create action', () => {
    it('adds 1 new record and add it to the set', async() => {
      const updated = await odoo.update('res.partner', recordId,{
        category_id: {
          action: 'create', value: { name: 'created tag' }
        }
      });
      updated.should.be.exactly(true);
    })

    it('adds multiple new records to the set', async() => {
      await odoo.update('res.partner', recordId, { category_id: {
        action: 'create',
          value: [
            {name: '2nd created tag'},
            {name: '3rd created tag'}
          ]
        }
      });
      const record = (await odoo.read('res.partner', recordId, ['category_id']))[0];
      record['category_id'].length.should.be.exactly(4);
    });
  });

  describe('#update action', () => {
    it('updates one record in the set', async() =>{
      categoryId = (await odoo.search('res.partner.category', { name: 'created tag'}))[0];
      await odoo.update('res.partner', recordId, {
        category_id: {
          action: 'update',
          id: categoryId,
          value: {
            name: 'edited category'
          }
        }
      });
      const updatedCategory = (await odoo.read('res.partner.category', categoryId, ['name']))[0];
      updatedCategory.name.should.be.exactly('edited category');
    })
  })

  describe('#add action', ()=> {
    it('adds 1 existing record to the set', async() => {
      await odoo.update('res.partner', recordId, {
        category_id: {
          action: 'add',
          id: 1
        }
      });
      const record = (await odoo.read('res.partner', recordId, ['category_id']))[0];
      record['category_id'].length.should.be.exactly(5);
    });

    it('adds multiple existing records to the set', async() => {
      await odoo.update('res.partner', recordId, {
        category_id: {
          action: 'add',
          id: [2,5]
        }
      });
      const record = (await odoo.read('res.partner', recordId, ['category_id']))[0];
      record['category_id'].length.should.be.exactly(7);
    });
  });

  describe('#remove action', () => {
    it('removes one record from the set but doesn\'t delete it from the database', async() => {
      await odoo.update('res.partner', recordId, {
        category_id: {
          action: 'remove',
          id: 4
        }
      });
      const record = (await odoo.read('res.partner', recordId, ['category_id']))[0];
      record['category_id'].should.not.containEql(4);
    })
  })
  describe('#delete action', () => {
    it('removes one id from the set and deletes it from the database', async() => {
      await odoo.update('res.partner', recordId, {
        category_id: {
          action: 'delete',
          id: categoryId
        }
      });
      const allCategories = await odoo.search('res.partner.category');
      allCategories.should.not.containEql(categoryId);
    });
  });

  describe('#replace action', () => {
    it('replaces all records in the set with the supplied list of ids', async() => {
      await odoo.update('res.partner', recordId, {
        category_id: {
          action: 'replace',
          id: [1,2]
        }
      });
      const record = (await odoo.read('res.partner', recordId, ['category_id']))[0];
      record['category_id'].should.containEql(1).and.containEql(2);
    });
  });

  describe('#clear', () =>{
    it('clears all records from the set, but doesnt delete from database', async() => {
      await odoo.update('res.partner', recordId, {
        category_id: {
          action: 'clear'
        }
      });
      const record = (await odoo.read('res.partner', recordId, ['category_id']))[0];
      record['category_id'].length.should.be.exactly(0)
    })
  });

  it('deletes the created contact', async() => {
    await odoo.delete('res.partner', recordId);
  });


});
