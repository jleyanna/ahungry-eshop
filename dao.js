const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./games.db')

function query (sql, args, eachFn = (_) => true) {
  const records = []

  return new Promise((resolve, reject) => {
    db.each(
      sql,
      args,
      (err, row) => { eachFn(row) && records.push(row) }, // fn on each
      (err, res) => { // fn at end
        if (err) return reject(err)

        return resolve(records)
      })
  })
}

async function get_count (where = '', args = []) {
  const rec = await query('select count(*) as count from games WHERE 1=1 ' + where, args)

  return rec[0].count
}

function get_records (where = '', args = []) {
  const transformerFn = (row) => {
    // Found these inputs: c_pad,f_auto,q_auto,w_400
    // Resize the headers for faster loading.
    row['horizontalHeaderImage'] = String(row['horizontalHeaderImage'])
      .replace('upload/ncom', 'upload/w_300/ncom')

    return true
  }

  return query(`select *,
100 * (1 - (cast(salePrice as float)/cast(msrp as float))) as percentOff,
(cast(msrp as float) - cast(salePrice as float)) as savings
from games WHERE 1=1 ` + where, args, transformerFn)
}

function get_games ({ limit, offset, search_title, search_publisher } = {}) {
  return get_records(
    `AND title like ?
AND publishers like ?
ORDER BY cast(msrp as float) DESC
LIMIT ?
OFFSET ?
`,
    ['%' + search_title + '%',
     '%' + search_publisher + '%',
     limit,
     offset,
    ]
  )
}

function get_games_on_sale ({ limit, offset, search_title, search_publisher } = {}) {
  return get_records(
    `AND salePrice > 0
AND title like ?
AND publishers like ?
ORDER BY 1 - (cast(salePrice as float)/cast(msrp as float)) DESC
LIMIT ?
OFFSET ?
`,
    ['%' + search_title + '%',
     '%' + search_publisher + '%',
     limit,
     offset,
    ]
  )
}

function get_games_on_sale_dollar ({ limit, offset, search_title, search_publisher } = {}) {
  return get_records(
    `AND salePrice > 0
AND title like ?
AND publishers like ?
ORDER BY (cast(msrp as float) - cast(salePrice as float)) DESC
LIMIT ?
OFFSET ?
`,
    ['%' + search_title + '%',
     '%' + search_publisher + '%',
     limit,
     offset,
    ]
  )
}

module.exports = {
  get_count,
  get_games,
  get_games_on_sale,
  get_games_on_sale_dollar,
  get_records,
}
