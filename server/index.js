const aedes = require('aedes')()
const server = require('net').createServer(aedes.handle)
const httpServer = require('http').createServer()
const ws = require('websocket-stream')
const port = 1883
const wsPort = 8888

server.listen(port)

ws.createServer({
  server: httpServer
}, aedes.handle)

httpServer.listen(wsPort)

// 当有人订阅我们主题时触发
aedes.on('client', (client) => {
  console.log('client.id', client.id)
})
// 当有人向我们发布内容时触发
aedes.on('publish', (packet, client) => {
  const topic = packet.topic
  const payload = packet.payload.toString()
  console.log('topic', topic)
  console.log('payload', payload)
})
