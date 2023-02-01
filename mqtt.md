这是我参与「第五届青训营 」伴学笔记创作活动的第 16 天

**项目代码**：[Plumbiu/mqttjs](https://github.com/Plumbiu/mqttjs)

**前置知识**：`mqtt.js`、`aedes`（不知道 aedes 咋用的，可以看我上期的笔记[如何用nodejs搭建mqtt服务 | 青训营笔记 - 掘金 (juejin.cn)](https://juejin.cn/post/7194814989859815484)，这次简单介绍一下 mqtt.js）

**目标**：前端通过 mqtt 协议接收到来自单片机的数据。

# 1. 搭建一个 mqtt 服务

这里直接复制粘贴就行，其中 `websocket-stream` 需要手动 `npm i websocket-stream` 安装即可

```js
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
```
代码写好之后，可以 `node index.js` 启动

# 2. 使用 mqtt.fx 工具模拟

（我的版本可能比较低）

![QQ截图20230201145346.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/553c37742f9a4b28bea0ed93bffcc20c~tplv-k3u1fbpfcp-watermark.image?)

**注意**：mqttfx 的端口地址是上述代码常量 `port` 的值

# 3. mqtt.js使用

这里我们没有使用任何框架，只使用了原生的 HTML、CSS、JS。如果想要在框架中使用，可以参考官网：[mqttjs/MQTT.js](https://github.com/mqttjs/MQTT.js)

既然采用了原生，那么就必须使用cdn了，[mqtt.js](https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js)

**首先引入 `mqtt.js`**

```html
<script src="https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js"></script>
```

**在页面的script标签书写**

注意这里的地址格式，8888 为最开始代码常量 `wsPort` 的值

```js
const client = mqtt.connect('ws://127.0.0.1:8888')
```

**mqtt.js 自带的api**

```js
//当重新连接启动触发回调
client.on('reconnect', () => {})
// 连接断开后触发的回调
client.on('close', () => {})
// 客户端脱机下线触发回调
client.on('offline', () => {})
// 当客户端无法连接或出现错误时触发回调
client.on('error', (error) => {})
//成功连接后触发的回调
client.on('connect', (connack) => {})
// 接收到消息触发的回调函数
client.on('message', (topic, message, packet) => {})
```

如果想要订阅主题，可以使用 `client.subscribe([])` 方法，数据可以写多个值，代表订阅多个主题。

如果想要向某个主题发送数据，可以使用 `client.publish(topic, val, { qos: 0}, () => {console.log('发送成功')})` 方法，`topic` 为发布消息对应的主题，`val` 为发送内容, `qos` 代表通信质量，第四个函数代表发送成功后的回调函数。

# 4. 实践

我们先假设一个场景，单片机的同学会向 `Water`、`DHT11` 两个主题发送数据，格式如下(均为 json 格式)：

Water 主题：
```json
{
    "value": 1900
}
```
DHT11主题：

```json
{
    "tem": 25,
    "hum": 80
}
```

前端需要展示这些数据，类似下图的效果：


![QQ截图20230201150939.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f71d6945f8e54ab98ab73d102ef37453~tplv-k3u1fbpfcp-watermark.image?)

**废话不多说，开干！**

首先我们明确知道，我们前端只需要接收数据，而不用发送数据，为了简便起见，这里可以只需要使用 `client.on('connect', () => {})`、`client.subscribe([])`、`client.on('message', (topic, message, packet) => {})` 三个方法。

1. 先构建 HTML 架构

```html
<div>
    <span>浇水量: </span>
    <span id="water">?</span>
</div>
<div>
    <span>温度: </span>
    <span id="tem">?</span>
</div>
<div>
    <span>湿度: </span>
    <span id="hum">?</span>
</div>
 ```

2. 连接服务并获取DOM元素

注意这里的地址格式，8888 为最开始代码常量 `wsPort` 的值

```js
const client = mqtt.connect('ws://127.0.0.1:8888')
const water = document.getElementById('water')
const tem = document.getElementById('tem')
const hum = document.getElementById('hum')
```

3. 关键代码

首先是**连接订阅**部分：这段代码表示，当我们成功连接后，订阅 `Water`、`DHT11` 两个主题

```js
client.on('connect', () => {
    client.subscribe(['Water', 'DHT11'])
})
```

最后是接收数据部分：当单片机向我们发送数据时，就会触发此方法

`topic`：触发此方法的是哪个主题，也就是单片机向哪个主题发送信息了(注意，这里的 publisher 只能是单片机)

`message`：单片机发送过来的数据，该数据类型为 `Uint8Array`，所以需要 `toString()` 方法转换为字符串，同时我们已经事先规定好传输格式为 `JSON`，所以还需要使用 `JSON.pare()` 方法转换为 JS 对象。

```js
client.on('message', (topic, message) => {
    const msg = JSON.parse(message.toString())
    if (topic === 'Water') {
        water.innerText = msg.value + 'ml'
    }
    if (topic === 'DHT11') {
        tem.innerText = msg.tem + '°C'
        hum.innerText = msg.hum + '%'
    }
})
```
4. 最后测试阶段

还是使用 `mqtt.fx` 软件测试。

Water 主题

![QQ截图20230201154241.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/426ff9fc697442a2a2b9b8d7ad9d85b9~tplv-k3u1fbpfcp-watermark.image?)

DHT11 主题

![QQ截图20230201154358.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6d6efd8606b7407a98d1378f0b597ab1~tplv-k3u1fbpfcp-watermark.image?)

点击 Publish 按钮后，页面显示正常，测试成功！

# 5. 总结

代码还是很简单理解的，如果想要做得更好的话，可以在后端加入数据库之类的，这里不展示了



