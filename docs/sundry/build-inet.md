---
description: 在这篇文章中，我们将讲解多机器时的内网搭建方法和iBGP的配置。
---

# 3. 建立内网

## 前言

如果你拥有多个节点，建立一个内网将收到的路由发到别的节点上往往是很有必要的。
通常，我们可以使用 [iBGP + confederation](build-inet#ibgp-confederation), [iBGP + OSPF](build-inet#ibgp-ospf), [OSPF (仅交换属于自己的网络)](build-inet#ospf) 达成建立内网的目的。

如果你很懒不想搭建内网，尝试直接从`transit`中获取别的节点的路由并发送给`peer`，对方的过滤器有很大概率会因为`你的 AS Path 中存在 Tier 1 ASN`从而拒绝这条路由。

## 链路选择

在正式建立内网并交换路由前，你需要建立隧道或用物理方式连接两个节点。
如果你的节点很近或者可以物理连接，请用物理方式请自行动手连接。这里不会赘述。
关于隧道，常用的隧道分为三层 (`GRE, WireGuard, OpenVPN TUN`) 和二层 (`GRETAP, VxLAN, OpenVPN TAP`) 隧道，如果只是用于简单的路由交换，选用三层隧道和选用二层隧道并无二致，但是为了能够在未来能较为方便地升级网络架构，笔者建议使用二层隧道。

#### 请注意(感谢 [KusakabeShi](https://www.kskb.eu.org/) 提出的解决方案)

如果你使用了`GRE/GRETAP/SIT/IPIP`等隧道，请检查在添加隧道网卡的时候是否带上了`ttl 255`参数，如果不带上此参数，你可能会遇到一些奇怪的问题，如下图所示

<figure><img src="./assets/images/mtr-example.png" alt=""></img><figcaption></figcaption></figure>

此时你就需要把添加网卡的指令

```
ip link add dev mytunnel type gre local 10.1.1.1 remote 10.1.1.2
```

改为

```
ip link add dev mytunnel type gre local 10.1.1.1 remote 10.1.1.2 ttl 255
```

## 在正式开始之前

我们假设：

* 你的 ASN 是 `AS114514`
*   你有七台机器

    1. 10.0.0.1 2404::1 fe80::1 对外广播 2404:1::/48
    2. 10.0.0.2 2404::2 fe80::2
    3. 10.0.0.3 2404::3 fe80::3
    4. 10.0.0.4 2404::4 fe80::4 对外广播 2404:2::/48
    5. 10.0.0.5 2404::5 fe80::5
    6. 10.0.0.6 2404::6 fe80::6
    7. 10.0.0.7 2404::7 fe80::7 对外广播 2404:3::/48

    fe80开头的为`Link Local IPv6`

    如下所示，其中黑色直线代表有链路存在，蓝色椭圆代表`AS114514`这个自治系统

<figure><img src="./assets/images/inet-example.png" alt=""></img><figcaption></figcaption></figure>

### 基础概念介绍 <a href="#ji-chu-gai-nian-jie-shao" id="ji-chu-gai-nian-jie-shao"></a>

*   `IGP`（全称`Interior Gateway Protocol`），即在AS**内部**使用的路由协议。用来管理内网路由。

    常见的IGP协议有：`OSPF`，`babel`，`ISIS`。其中我们将主要讲解`OSPF`。
* `iBGP`（全称`Interior BGP`），是将路由在边界路由器**之间**传递路由的方式，用来管理多地的公网路由。
* 链路，通俗来说，指的是一条二层可达的连接，比如使用网线连接。隧道是一种特殊的链路。
* `Link Local IPv6`，缩写`LL IPv6`或`IPv6 LL`，用于链路之上的`IPv6`，仅在同一链路内有效。在本篇文章中，我们使用 LL IPv6 来简化链路之间的连接。

### IGP 与 iBGP 的区别和应用 <a href="#igp-gen-ibgp-de-qu-bie-he-ying-yong" id="igp-gen-ibgp-de-qu-bie-he-ying-yong"></a>

IGP 的主要应用在于自治系统内的内网路由的传递。如上图中示例，则`IGP`是用来管理`10.0.0.1-10.0.0.7`这一段 IP 的传递。

iBGP 的主要应用在于自治系统的边界路由器之间外部路由传递。如上图中示例，则`iBGP`用来在`10.0.0.1 10.0.0.4 10.0.0.7`之间传递各自的广播段和外部 BGP 收到的段。

### full mesh <a href="#full-mesh" id="full-mesh"></a>

`full mesh`是一种连接形式，即所有节点之间全部两两直接连接。

在内网搭建中，有不少人会搞混`BGP full mesh`与`tunnel full mesh`。

`iBGP`为了防止环路，所以每个路由仅会传递给他的直接邻居，不会传递给邻居的邻居，也就是说边界路由器之间需要两两连接以保证路由可以传递到每一个边界路由器，这就是`BGP full mesh`。

而让边界路由器之间能够直接连接，最直接而最简单的方法就是让`网络 full mesh`，也就是`tunnel full mesh`。但当网络内节点变得多的时候，这种连接方式就会变得费时费力，难以维护，易出错。为了简化连接，我们就需要使用`IGP`来代替`tunnel full mesh`并达到`full mesh`的效果，即网络内所有设备都能联通。

## 使用 IGP 交换只属于自己网络的路由

### OSPF (仅交换属于自己的网络) <a href="#ospf" id="ospf"></a>

#### 配置会话

下面是一个`OSPF`的配置模板

```
protocol ospf v3 myOSPF {
    ipv6 {
        import all;
        export filter {
            if source ~ [ RTS_DEVICE, RTS_OSPF ] then accept;    # 把自己的路由发出去
            reject;
        };
    };
    area 0 {                        # 对于Player来说，area 0足够了
        interface "tunnel_tyo" {    # 网卡名称
            hello 5;                # 几秒发一次Hello数据包，请根据需要自行修改
	    cost 114;               # 线路的花费，建议使用延迟，当有多条路径会优先选择cost小的
	    tx length 1420;         # 隧道网需要，一般小于等于隧道的mtu
            type pointopoint;
            stub no;
        };
    };
}
```

假设目前设备是`10.0.0.2`，网卡名称都取`IPv4`中最后一位，那么我们可以在这个设备上写出这样的配置

```
protocol ospf v3 myOSPF {
    ipv6 {
        import all;
        export filter {
            if source ~ [ RTS_DEVICE, RTS_OSPF ] then accept;
            reject;
        };
    };
    area 0 {
        interface "tunnel_1" {	# 10.0.0.1 <-> 10.0.0.2
            hello 5;
	    cost 114;
	    tx length 1420;
            type pointopoint;
            stub no;
        };
        interface "tunnel_3" {	# 10.0.0.3 <-> 10.0.0.2
            hello 5;
	    cost 114;
	    tx length 1420;
            type pointopoint;
            stub no;
        };
        interface "tunnel_5" {	# 10.0.0.5 <-> 10.0.0.2
            hello 5;
	    cost 114;
	    tx length 1420;
            type pointopoint;
            stub no;
        };		
        interface "tunnel_6" {	# 10.0.0.6 <-> 10.0.0.2
            hello 5;
	    cost 114;
	    tx length 1420;
            type pointopoint;
            stub no;
        };		
    };
}
```

此时，在设备`10.0.0.3`中，就需要以下配置

```
protocol ospf v3 myOSPF {
    ipv6 {
        import all;
        export filter {
            if source ~ [ RTS_DEVICE, RTS_OSPF ] then accept;
            reject;
        };
    };
    area 0 {
        interface "tunnel_1" {	# 10.0.0.1 <-> 10.0.0.3
            hello 5;
	    cost 114;
	    tx length 1420;
            type pointopoint;
            stub no;
        };
        interface "tunnel_2" {	# 10.0.0.3 <-> 10.0.0.2
            hello 5;
	    cost 114;
	    tx length 1420;
            type pointopoint;
            stub no;
        };
    };
}
```

其他的设备都需要这么做，`interface`的数量等于前往其他节点的隧道数量

#### 查看连接状态

如果要查看 OSPF 是否正常工作，可以输入`birdc s p`查看`OSPF`会话是否处在`Running`状态中，如果不是，请检查自己的隧道是否配置正确。

下面是一些较为常用的指令，用于判断该节点与别的节点之间的详细信息。

```
birdc s o    # 查看OSPF会话的详情 (指令等价于birdc show ospf)
birdc s o n  # 查看所有OSPF会话中的邻居 (指令等价于birdc show ospf neighbor)
```

## 使用 iBGP 交换路由

### 在建立内网前请注意

如果要做一个大内网，请尽可能的发送所有来自对等（Peering）和下游（Downstream）的路由并确保内网的每一台机子都可以正确收到路由表。

### iBGP confederation

在开始使用`iBGP confederation`搭建自己的内网之前，请自行划分好`confederation ASN`的范围，本文使用范围为`AS100000-110000`。

假设路由器1使用的是`AS100001`，路由器2使用的是`AS100002`，此时路由器1的配置如下

```
protocol bgp confed_Route2 {
    local 2404::1 as 100001;
    neighbor 2404::2 as 100002;
    confederation 114514;
    confederation member yes;    
    ipv4 {
        import filter import_filter_v4; # 指定导入过滤器
        export filter export_filter_v4; # 指定导出过滤器
    };
    ipv6 {
        import filter import_filter_v6; # 指定导入过滤器
        export filter export_filter_v6; # 指定导出过滤器
    };
    graceful restart;
    description "iBGP Confederation Route1 <=> Route2";
}
```

路由器2的配置为

```
protocol bgp confed_Route1 {
    local 2404::2 as 100002;
    neighbor 2404::1 as 100001;
    confederation 114514;
    confederation member yes;    
    ipv4 {
        import filter import_filter_v4; # 指定导入过滤器
        export filter export_filter_v4; # 指定导出过滤器
    };
    ipv6 {
        import filter import_filter_v6; # 指定导入过滤器
        export filter export_filter_v6; # 指定导出过滤器
    };
    graceful restart;
    description "iBGP Confederation Route2 <=> Route1";
}
```

别的路由器之间建立 confederation 也是如此，不再赘述

### iBGP OSPF

注意：当数据包到下一跳时，接下来怎么走是下一跳的事，并不会100%按照你接收的 BGP 路由那样走
比如你收到了1.0.0.0/24 `AS Path: 114514 6939 12345`，而下一跳走默认路由(假设默认路由上游是`174`)，那么实际上这个包走的是`174`而不是`6939`。

在建立了 [OSPF连接](build-inet#ospf) 后，我们直接建立`iBGP Session`即可(此处为机器1和机器2的 Session，如有需要请自行添加，`BOGON_PREFIXES_V4/V6`定义请参阅[此处](attachments/ji-chu-guo-lv-ding-yi))

机器1:&#x20;

```
protocol bgp ibgp_Route2 { # 建议给自己指定一个命名规则
	local 2404::1 as 114514;
	neighbor 2404::2 as 114514;
	ipv4 {
		import all;
		export filter {
			if net ~ BOGON_PREFIXES_V4 then reject; # 不要把一些不该发送的路由发送出去，请根据需要自行修改
			accept;
		};
	};
	ipv6 {
		import all;
		export filter {
			if net ~ Code then reject; # 不要把一些不该发送的路由发送出去，请根据需要自行修改
			accept;
		};
	};
	graceful restart;
	description "iBGP Route1 <=> iBGP Route2";
}
```

机器2:

```
protocol bgp ibgp_Route1 { # 建议给自己指定一个命名规则
	local 2404::2 as 114514;
	neighbor 2404::1 as 114514;
	ipv4 {
		import all;
		export filter {
			if net ~ BOGON_PREFIXES_V4 then reject; # 不要把一些不该发送的路由发送出去，请根据需要自行修改
			accept;
		};
	};
	ipv6 {
		import all;
		export filter {
			if net ~ BOGON_PREFIXES_V6 then reject; # 不要把一些不该发送的路由发送出去，请根据需要自行修改
			accept;
		};
	};
	graceful restart;
	description "iBGP Route2 <=> iBGP Route1";
}
```

