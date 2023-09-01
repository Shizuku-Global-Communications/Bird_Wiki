# 争议项，如果您想更正，请提交 PR

### iBGP Route Reflector

建议专门建立一个`table`用于存储来自 Route Reflector（下文全部将`Route Reflector`简称为 RR）的 Session，并且使用`Pipe`处理`master`和负责 RR 的 table 之间的路由传输（如果某个节点配置错误导致奇怪的路由进入 RR，发送到别的节点后直接写入`master`表可能导致你的节点网络当场暴毙）

在使用`iBGP RR`之前，你需要了解`RR`的工作原理。

**请注意：在本教程中，为了省事，直接将 RR 当做 Core 使用，这样做不清真，但是方便。如果真的需要制作一个真正的 RR，请同时使用 OSPF 等 IGP 协议，让路由器收到表后通过 OSPF 前往下一跳。**
**本文假设路由器1为`RR Server`，与RR直接连接的路由器设为`RR Client`。**

对于所有在`此RR范围内`的路由器，我们需要在`bird.conf`开头部分中添加以下配置(`BOGON_PREFIXES_V4/V6`定义请参阅[此处](attachments/ji-chu-guo-lv-ding-yi))

```
ipv4 table rr_v4;	# 添加专门用于存取RR发来的路由表
ipv6 table rr_v6;	# 添加专门用于存取RR发来的路由表

# 在此配置中默认接收除了BOGON以外的所有路由，仅仅过滤掉BOGON是不够的，需要自行根据情况修改过滤器
protocol pipe rr_v4_transfer { # 一个用于处理master4和rr_v4路由表的pipe
    table master4;
    peer table rr_v4;
    import filter { # 从rr_v4到master4，具体的路由过滤配置请根据自己的情况编写，此处只做示例
        if net ~ BOGON_PREFIXES_V4 then reject;	# 虽然在路由器1发过来的时候就已经添加了过滤，但以防万一，在这里继续添加一个
        accept;
    };
    export filter { # 从master4到rr_v4，具体的路由过滤配置请根据自己的情况编写，此处只做示例
        if proto ~ "peer_*" then accept;	# 把来自peer的路由放入rr_v4中
        if proto ~ "downstream_*" then accept;	# 把来自downstream的路由放入rr_v4中
        reject;
    };
}

# 在此配置中默认接收除了BOGON以外的所有路由，仅仅过滤掉BOGON是不够的，需要自行根据情况修改过滤器
protocol pipe rr_v6_transfer { # 一个用于处理master6和rr_v6路由表的pipe
    table master6;
    peer table rr_v6;
    import filter { # 从rr_v6到master6，具体的路由过滤配置请根据自己的情况编写，此处只做示例
        if net ~ BOGON_PREFIXES_V6 then reject;	# 虽然在路由器1发过来的时候就已经添加了过滤，但以防万一，在这里继续添加一个
        accept;
    };
    export filter { # 从master6到rr_v6，具体的路由过滤配置请根据自己的情况编写，此处只做示例
        if proto ~ "peer_*" then accept;	# 把来自peer的路由放入rr_v6中
        if proto ~ "downstream_*" then accept;	# 把来自downstream的路由放入rr_v6中
        reject;
    };
}
```

下面是路由器1到路由器2的`iBGP RR Session`配置

```
protocol bgp rr_Route2 {
    local 2404::1 as 114514;
    neighbor 2404::2 as 114514;
    ipv4 {
        table rr_v4;
        import filter {
            if net ~ BOGON_PREFIXES_V4 then reject;
            accept;
        };
        export filter {
            if net ~ BOGON_PREFIXES_V4 then reject; # 可以开始的时候就过滤掉BOGON
            if proto ~ "rr_*" then accept; # 把其它client的路由也发过去
            if proto ~ "peer_*" then accept; # 发送来自Peer的路由
            if proto ~ "downstream_*" then accept; # 发送来自Downstream的路由
            reject;
        };
        next hop self;
    };
    ipv6 {
        table rr_v6;
        import filter {
            if net ~ BOGON_PREFIXES_V6 then reject;
            accept;
        };
        export filter {
            if net ~ BOGON_PREFIXES_V6 then reject; # 可以开始的时候就过滤掉BOGON
            if proto ~ "rr_*" then accept; # 把其它client的路由也发过去
            if proto ~ "peer_*" then accept; # 发送来自Peer的路由
            if proto ~ "downstream_*" then accept; # 发送来自Downstream的路由
            reject;
        };
        next hop self;
    };
    rr client; # 把此路由器当做RR服务器，对方当做客户端
    graceful restart;
    description "Route Reflector Route1 <=> Route2";
}
```

下面是路由器2去路由器1的`iBGP RR Session`，其它的路由器到路由器1的 Session 也是如此，不再赘述

```
protocol bgp rr_Route1 {
    local 2404::2 as 114514;
    neighbor 2404::1 as 114514;
    ipv4 {
        table rr_v4;
        import filter { # 默认接收除了BOGON以外的所有路由，仅仅过滤掉BOGON是不够的，需要自行根据情况修改过滤器
            if net ~ BOGON_PREFIXES_V4 then reject;
            accept;
        };
        export filter {
            if net ~ BOGON_PREFIXES_V4 then reject; # 可以开始的时候就过滤掉BOGON
            if proto ~ "rr_*" then accept; # 把其它client的路由也发过去
            if proto ~ "peer_*" then accept; # 发送来自Peer的路由
            if proto ~ "downstream_*" then accept; # 发送来自Downstream的路由
            reject;
        };
        next hop self;
    };
    ipv6 {
        table rr_v6;
        import filter { # 默认接收除了BOGON以外的所有路由，仅仅过滤掉BOGON是不够的，需要自行根据情况修改过滤器
            if net ~ BOGON_PREFIXES_V6 then reject;
            accept;
        };
        export filter {
            if net ~ BOGON_PREFIXES_V6 then reject; # 可以开始的时候就过滤掉BOGON
            if proto ~ "rr_*" then accept; # 把其它client的路由也发过去
            if proto ~ "peer_*" then accept; # 发送来自Peer的路由
            if proto ~ "downstream_*" then accept; # 发送来自Downstream的路由
            reject;
        };
        next hop self;
    };
    graceful restart;
    description "Route Reflector Route2 <=> Route1";
}
```

在建立好`RR Session`并配置好`Pipe`之后，**强烈建议在所有对外的过滤器中添加以下指令，防止来自`RR Session`的路由外泄。**

```
# 这是你过滤的最后一道防线，慎重对待
if proto ~ "rr_*" then reject; # 如果此路由的来源会话名称是rr开头，说明是从路由反射器过来的，应当拒绝
```
