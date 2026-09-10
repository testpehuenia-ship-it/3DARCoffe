import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ORDERS_FILE = path.resolve(__dirname, 'data_orders.json')
const MENU_FILE = path.resolve(__dirname, 'data_menu.json')

const DEFAULT_MENU = [
  { id: 'c1', name: 'Café de Especialidad', description: 'Origen Colombia, notas a chocolate y nuez', price: 2500, category: 'cafeteria', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80', isActive: true },
  { id: 'c2', name: 'Latte Patagonia', description: 'Espresso con leche texturizada y syrup de lavanda', price: 3200, category: 'cafeteria', image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&q=80', isActive: true },
  { id: 'c3', name: 'Chocolate Caliente Submarino', description: 'Leche hirviendo con barra de chocolate amargo 70%', price: 3500, category: 'cafeteria', image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80', isActive: true },
  { id: 'h1', name: 'Helado Artesanal', description: 'Sabores a elección: Calafate, Dulce de Leche, Chocolate', price: 2000, category: 'heladeria', image: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=400&q=80', isActive: true },
  { id: 'p1', name: 'Torta Galesa', description: 'Porción de receta tradicional del sur con frutos secos', price: 4000, category: 'pasteleria', image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80', isActive: true },
]

function readData(filePath, defaultData) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }
  } catch (e) {
    console.error('Error reading file:', filePath, e)
  }
  return defaultData
}

function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
  } catch (e) {
    console.error('Error writing file:', filePath, e)
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        resolve({})
      }
    })
  })
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*'
  })
  res.end(JSON.stringify(data))
}

const apiPlugin = () => ({
  name: 'api-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // CORS preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*'
        })
        return res.end()
      }

      const parsedUrl = new URL(req.url, 'http://localhost')
      const pathname = parsedUrl.pathname
      const method = req.method

      if (!pathname.startsWith('/api/')) {
        return next()
      }

      console.log(`\x1b[36m[API Request]\x1b[0m ${method} ${pathname}`)

      try {
        // GET /api/orders
        if (pathname === '/api/orders' && method === 'GET') {
          const orders = readData(ORDERS_FILE, [])
          return sendJSON(res, orders)
        }

        // POST /api/orders
        if (pathname === '/api/orders' && method === 'POST') {
          const body = await readBody(req)
          const orders = readData(ORDERS_FILE, [])
          const newOrder = {
            id: body.id || Date.now().toString(),
            customerName: body.customerName,
            items: body.items || [],
            total: body.total || 0,
            status: body.status || 'para_despachar',
            billRequested: body.billRequested || false,
            createdAt: body.createdAt || new Date().toISOString()
          }
          orders.unshift(newOrder)
          writeData(ORDERS_FILE, orders)
          console.log(`\x1b[32m[API Success]\x1b[0m Pedido creado: #${newOrder.id.slice(-4)} - ${newOrder.customerName} ($${newOrder.total})`)
          return sendJSON(res, newOrder, 201)
        }

        // PUT /api/orders/:id
        if (pathname.startsWith('/api/orders/') && method === 'PUT') {
          const id = pathname.split('/').pop()
          const body = await readBody(req)
          const orders = readData(ORDERS_FILE, [])
          let updatedOrder = null
          const updatedOrders = orders.map(order => {
            if (order.id === id) {
              updatedOrder = { ...order, ...body }
              return updatedOrder
            }
            return order
          })
          if (updatedOrder) {
            writeData(ORDERS_FILE, updatedOrders)
            console.log(`\x1b[33m[API Update]\x1b[0m Pedido #${id.slice(-4)} actualizado:`, body)
            return sendJSON(res, updatedOrder)
          } else {
            console.log(`\x1b[31m[API Error]\x1b[0m Pedido #${id.slice(-4)} no encontrado para actualizar`)
            return sendJSON(res, { error: 'Order not found' }, 404)
          }
        }

        // DELETE /api/orders/:id
        if (pathname.startsWith('/api/orders/') && method === 'DELETE') {
          const id = pathname.split('/').pop()
          const orders = readData(ORDERS_FILE, [])
          const updatedOrders = orders.filter(order => order.id !== id)
          writeData(ORDERS_FILE, updatedOrders)
          console.log(`\x1b[31m[API Delete]\x1b[0m Pedido #${id.slice(-4)} eliminado`)
          return sendJSON(res, { success: true })
        }


        // GET /api/menu
        if (pathname === '/api/menu' && method === 'GET') {
          const menu = readData(MENU_FILE, DEFAULT_MENU)
          return sendJSON(res, menu)
        }

        // POST /api/menu
        if (pathname === '/api/menu' && method === 'POST') {
          const body = await readBody(req)
          const menu = readData(MENU_FILE, DEFAULT_MENU)
          const newItem = {
            ...body,
            id: body.id || Date.now().toString(),
            price: Number(body.price),
            isActive: body.isActive !== undefined ? body.isActive : true
          }
          menu.push(newItem)
          writeData(MENU_FILE, menu)
          return sendJSON(res, newItem, 201)
        }

        // PUT /api/menu/:id
        if (pathname.startsWith('/api/menu/') && method === 'PUT') {
          const id = pathname.split('/').pop()
          const body = await readBody(req)
          const menu = readData(MENU_FILE, DEFAULT_MENU)
          let updatedItem = null
          const updatedMenu = menu.map(item => {
            if (item.id === id) {
              updatedItem = { ...item, ...body, price: Number(body.price) }
              return updatedItem
            }
            return item
          })
          if (updatedItem) {
            writeData(MENU_FILE, updatedMenu)
            return sendJSON(res, updatedItem)
          } else {
            return sendJSON(res, { error: 'Menu item not found' }, 404)
          }
        }

        // DELETE /api/menu/:id
        if (pathname.startsWith('/api/menu/') && method === 'DELETE') {
          const id = pathname.split('/').pop()
          const menu = readData(MENU_FILE, DEFAULT_MENU)
          const updatedMenu = menu.filter(item => item.id !== id)
          writeData(MENU_FILE, updatedMenu)
          return sendJSON(res, { success: true })
        }

        return sendJSON(res, { error: 'Not Found' }, 404)
      } catch (err) {
        console.error('API Error:', err)
        return sendJSON(res, { error: 'Internal Server Error', details: err.message }, 500)
      }
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
})
