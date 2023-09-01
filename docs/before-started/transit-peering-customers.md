# 什么是 BGP Session?

BGP Session，顾名思义，就是一个 BGP 的会话，连接双方都必须要配置正确的参数，否则会报错，无法连接。

在下文中，你会看到不少类似于类似 Transit、Peering、Customer(Downstream，下文统一使用 Downstream) 的描述，他们是你与对方的关系的描述。

Transit：你的上游，将你的路由通过它走向世界的每一个角落。
Peering：你的对等连接，你需要把你和你的下游（Downstream）发送给对方，让双方的网络不经过Transit即可到达对方。
Downstream：你的下游，你需要负责把它的路由发送给你的上游，让下游的路由走向世界的每个角落。

例如：
某 VPS 服务商会免费提供 Transit，如果你发送路由，那么这条路由将会经过此 Transit 发送到互联网，所有流量都会经过你的上游到达你的 VPS。

Transit、Peering、Customer 需要发送路由的关系如下

<table><thead><tr><th> </th><th data-type="checkbox">你自己</th><th data-type="checkbox">Transit</th><th data-type="checkbox">Peering</th><th data-type="checkbox">Downstream</th></tr></thead><tbody><tr><td>发往Transit</td><td>true</td><td>false</td><td>false</td><td>true</td></tr><tr><td>发往Peering</td><td>true</td><td>false</td><td>false</td><td>true</td></tr><tr><td>发往Downstream</td><td>true</td><td>true</td><td>true</td><td>true</td></tr></tbody></table>

下面是几个`BGP Session`的常见状态输出

```
myBGP     BGP        ---        up     09:30:08.990  Established # 会话成功建立且已经交换路由
myBGP     BGP        ---        up     09:30:08.990  Active # 会话没有建立，准备发起连接
myBGP     BGP        ---        up     09:30:08.990  Connect # BIRD正在尝试连接对方，如果长时间保持在此处，请检查双方连接
myBGP     BGP        ---        up     09:30:08.990  Idle # 空闲状态，请检查是否是配置错误
```
