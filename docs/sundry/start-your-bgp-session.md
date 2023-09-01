# 1. 建立 BGP Session

从这篇文章开始，我们就要安装 BIRD 并开始往外广播了。

## 开始之前 <a href="#kai-shi-zhi-qian" id="kai-shi-zhi-qian"></a>

我们假设：

* 你只拥有`IPv6`段
* 你的 ASN 是 `AS114514`
* 你的 IPv6 段为 `2001:db8:beef::/48`，你计划能使用 `2001:db8:beef::1`访问这台机器
* 该机器的公网 IPv4 为 `1.1.1.1` 公网 IPv6 为 `2405::1`
* 你的 BGP 邻居为`AS20473`，对方的 IPv6 为`2405::2`
* 你与你的邻居在同一个子网且一跳可达

**该设置将通用于本篇文章**

**BIRD 的安装方法已经在** [**这里**](../attachments/bird-2.0.10-an-zhuang-fang-fa) **提出，请先自行安装。**

## 配置虚拟网卡 <a href="#pei-zhi-xu-ni-wang-ka" id="pei-zhi-xu-ni-wang-ka"></a>

如果你需要使用`2001:db8:beef::1`来访问你的机器，那么你的机器就需要有一个网卡绑定这个地址。由于这个IP并不在任意一个物理接口中可用（或者在多个物理接口中可用），所以你需要使用一个虚拟网卡来绑定它。

dummy 网卡的作用，就是绑定一个并不实际关联到物理接口的地址到你的机器。它的工作方式与 loopback 接口类似，但你可以创建非常多的 dummy 接口用来绑定非常多的地址（尽管我**非常**不建议这么做，这样可能会导致 BIRD 在扫描网卡的时候占用大量 CPU 导致 BGP 断连）。

我们可以用下面的命令创建一个 dummy 网卡并绑定地址。

```
ip link add dummy0 type dummy # 新建一个dummy网卡，命名为dummy0（强烈建议使用一个规则的命名方式，比如dummy+数字）
ip link set dummy0 up # 标记网卡状态为UP
ip addr add 2001:db8:beef::1/128 dev dummy0 # 向dummy网卡添加地址
```

**通过命令创建的网卡每次重启会消失，建议让它在开机时自行启动（比如 rc.local）或写入 interfaces 文件，具体方法请自行 Google**

**强烈建议 dummy 只绑定/128（IPv6）或/32（IPv4）地址，否则可能跟接下来在 BIRD 内配置的地址导致冲突从而出现错误**

## 撰写配置文件 <a href="#zhuan-xie-pei-zhi-wen-jian" id="zhuan-xie-pei-zhi-wen-jian"></a>

BIRD 在 Debian 的默认配置文件在`/etc/bird/bird.conf`

你可以复制一份以备之后详细阅读他的注释（有很多有用的示例），现在我们要做的就是清空它。

运行如下命令：

```
echo > /etc/bird/bird.conf
```

现在 bird.conf 已经清空了。

### 基本配置 <a href="#ji-ben-pei-zhi" id="ji-ben-pei-zhi"></a>

我们先写一个基本的配置文件。

```
log syslog all;
router id 1.1.1.1; # 指定路由ID，通常而言需要全球单播ipv4作为routerid
define MyASN=114514; # 定义常量MyASN，提升可扩展性
define OWNIPv6s=[2001:db8:beef::/48];    #在这里写入你网络拥有的IP块，我建议使用Git+Include文件的方法
protocol device { # 扫描设备IP，这么写即可
};
protocol kernel {
    ipv6 {
        export all; # 将所有路由都导入系统路由表
    };
};
protocol static ANNOUNCE_v6 { #宣告自己的IPv6地址块，你也可以把ANNOUNCE_v6改成你喜欢的名字
    ipv6;
    route 2001:db8:beef::/48 reject; #在STATIC中添加路由
};

protocol static { #在某些特殊情况下，BGP会话会收到下一跳的路由，需要自行手动定义下一跳
    ipv6;
};
```

上面配置文件比较重要的是`static`。一般，我们在 static 的第一行用`ipv4;`或`ipv6;`指定该 static 的类型，然后在下面用`route xxxxx/xx reject;`来宣告路由。由于该整段都分配在该设备上，并且更细分的路由（如/128 /64）会比该路由优先，所以这里`reject`（也可用`unreachable`，即向请求方返回`icmp unreachable`信息）起到保底的作用。

### 过滤器 <a href="#guo-lv-qi" id="guo-lv-qi"></a>

**过滤器非常的重要，做好自己的过滤是对与你建立 BGP 连接的人的尊敬**

所幸，作为一个只有一个节点的 BGP Player，我们不需要太过于复杂的过滤器，对于导出，我们只需要下面这些即可

```
filter export_filter_v6 {
    if net ~ OWNIPv6s then accept; # 如果前缀包括在OWNIPv6s内则放出
    reject; # 否则全部拒绝
};
```

或者自行定义需要导出的路由

```
filter export_filter_v6 {
    if net ~ 2001:db8:beef::/48 then accept; # 如果前缀是2001:db8:beef::/48或者允许范围内的更小前缀(IPv4 /24,IPv6 /48)，则允许
    #if net ~ [2001:db8:beef::/48] then accpet;    # 只允许2001:db8:beef::/48，不允许更大或更小的前缀通过 
    reject; # 否则全部拒绝
};
```

而对于导入，可以直接不过滤，收全表

```
filter import_filter_v6 {
    accept; # 接收所有路由
};
```

也可以如下所示过滤掉默认路由

```
filter import_filter_v6 {
    if net ~ [::/0] then reject; # 如果为默认路由则拒绝
    accept; # 接收所有其他路由	
};
```

写好过滤器后，我们就可以开始配置 BGP 会话了。

### 配置BGP会话（Transit） <a href="#pei-zhi-bgp-hui-hua" id="pei-zhi-bgp-hui-hua"></a>

如下所示

```
protocol bgp transit_as20473_v6 { # 建议给自己指定一个命名规则
	local 2405::1 as MyASN; # 指定本端地址与ASN
	neighbor 2405::2 as 20473;  # 指定对端地址与ASN
	ipv6 { # 指定要在该BGP邻居上跑的协议
		import filter import_filter_v6; # 指定导入过滤器
		export filter export_filter_v6; # 指定导出过滤器
		export limit 10; # 限制导出前缀数量，根据需要调整，防止过滤器因过滤器配置错误导致 session 被关闭，在这种情况下通常需要联系对方 NOC 手动重启（比如 Hurricane Electric, AS6939）
	};
	graceful restart; # 平滑重启，建议支持，防止重启 BIRD 的时候造成路由撤回导致服务中断
	description "AS20473 IPv6 Transit"; # 注释，根据自己的需要添加
};
```

在 BGP 中，是可以在一个会话上传递多种协议的，也就是 Multiprotocol extensions for BGP （简称 MP-BGP）（[RFC 4760](http://www.rfc-editor.org/info/rfc4760)）。但是，如果没有明确约定，一般都是每种协议起一个会话。

对于 BGP Session 的命名，你大可以根据自己的喜好命名，但是建议还是自行指定一个命名规则，在之后对路由和会话的管理有帮助。
例如

| 会话类型       | 命名方式                                   |
| ---------- | -------------------------------------- |
| Transit    | transit_asXXX(对方ASN)_v6(IP协议版本号4/6)  |
| Peering    | peer_asXXX(对方ASN)_v6(IP协议版本号4/6)     |
| Downstream | customer_asXXX(对方ASN)_v6(IP协议版本号4/6) |
| RPKI       | rpki_Cloudflare(RPKI服务提供来源)           |
| ...        | ...                                    |

### 配置BGP会话（Peering） <a href="#pei-zhi-bgp-hui-hua" id="pei-zhi-bgp-hui-hua"></a>

同理，根据上文的 Transit 配置方法，我们可以推出对等的接法，此时添加假设

* 你的 BGP 邻居(对等)为`AS100000`，对方的 IPv6 为`2405::3`
* 你与你的邻居在同一个子网且一跳可达

我们可以配出这样的配置

```
protocol bgp peer_as100000_v6 { # 建议给自己指定一个命名规则
	local 2405::1 as MyASN; # 指定本端地址与ASN
	neighbor 2405::3 as 100000;  # 指定对端地址与ASN
	ipv6 { # 指定要在该BGP邻居上跑的协议
		import filter import_filter_v6; # 指定导入过滤器
		export filter export_filter_v6; # 指定导出过滤器
		import limit 10; # 限制导入前缀数量，根据需要调整，防止对方过滤器配糊导致自己的网络瘫痪
		export limit 10; # 限制导出前缀数量，根据需要调整，防止过滤器因过滤器配置错误导致 session 被关闭，在这种情况下通常需要联系对方 NOC 手动重启（比如 Hurricane Electric, AS6939）
	};
	graceful restart; # 平滑重启，建议支持，防止重启 BIRD 的时候造成路由撤回导致服务中断
	description "AS100000 IPv6 Peering"; # 注释，根据自己的需要添加
};
```

对于 Peering 的会话，我们往往需要更加留意对方是否会发送一些奇怪的路由(比如`::/0`默认路由)，这个时候，我们可以将这个会话配置改成这样

```
protocol bgp peer_as100000_v6 { # 建议给自己指定一个命名规则
	local 2405::1 as MyASN; # 指定本端地址与ASN
	neighbor 2405::3 as 100000;  # 指定对端地址与ASN
	ipv6 { # 指定要在该BGP邻居上跑的协议
		import filter { # 指定导入过滤器
		    if net ~ [::/0] then reject; # 如果为默认路由则拒绝
		    accept; # 接收所有其他路由
		};
		export filter export_filter_v6; # 指定导出过滤器
		import limit 10; # 限制导入前缀数量，根据需要调整，防止对方过滤器配糊导致自己的网络瘫痪
		export limit 10; # 限制导出前缀数量，根据需要调整，防止过滤器因过滤器配置错误导致 session 被关闭，在这种情况下通常需要联系对方 NOC 手动重启（比如 Hurricane Electric, AS6939）
	};
	graceful restart; # 平滑重启，建议支持，防止重启 BIRD 的时候造成路由撤回导致服务中断
	description "AS100000 IPv6 Peering"; # 注释，根据自己的需要添加
};
```

这里只是表示了可以直接在某个 session 中写明过滤，export 同理，你也可以这么做。
当然，在之后的 BGP 学习中，你会发现只排除默认路由往往是不够的，你还需要通过 IRR/RPKI/Bogon 检测对路由进行过滤，关于这些类型的检测，我们之后再讲（附录部分）。

### 收尾 <a href="#shou-wei" id="shou-wei"></a>

通常而言，如果一切正常，你的前缀应该已经广播出去，并将在24-72小时内传递至全球互联网，并且你应该能用你所广播的地址访问你的机器。

## 标准配置

```
log syslog all;
router id 1.1.1.1; # 指定路由 ID，通常而言需要全球单播 ipv4 作为 routerid
define MyASN=114514; # 定义常量 MyASN，提升可扩展性
define OWNIPv6s=[2001:db8:beef::/48];    #在这里写入你网络拥有的 IP Block，我建议使用 Git+Include 文件的方法
protocol device { # 扫描设备 IP，这么写即可
};
protocol kernel {
    ipv6 {
        export all; # 将所有路由都导入系统路由表
    };
};
protocol static ANNOUNCE_v6 { #宣告自己的 IPv6 地址块，你也可以把 ANNOUNCE_v6 改成你喜欢的名字
    ipv6;
    route 2001:db8:beef::/48 reject; #在 STATIC 中添加路由
};

protocol static { #在某些特殊情况下，BGP 会话会收到下一跳的路由，需要自行手动定义下一跳
    ipv6;
};

filter export_filter_v6 {
    if net ~ OWNIPv6s then accept; # 如果前缀包括在 OWNIPv6s 内则放出
    reject; # 否则全部拒绝
};

filter import_filter_v6 {
    accept; # 接收所有路由
};

protocol bgp transit_as20473_v6 { # 建议给自己指定一个命名规则
	local 2405::1 as MyASN; # 指定本端地址与 ASN
	neighbor 2405::2 as 20473;  # 指定对端地址与 ASN
	ipv6 { # 指定要在该 BGP 邻居上跑的 channel，根据你自己的需求添加（比如加 ipv4）或减少
		import filter import_filter_v6; # 指定导入过滤器
		export filter export_filter_v6; # 指定导出过滤器
		export limit 10; # 限制导出前缀数量，根据需要调整，防止过滤器因过滤器配置错误导致 session 被关闭，在这种情况下通常需要联系对方 NOC 手动重启（比如 Hurricane Electric, AS6939）
	};
	graceful restart; # 平滑重启，建议支持，防止重启 BIRD 的时候造成路由撤回导致服务中断
	description "AS20473 IPv6 Transit"; # 注释，根据自己的需要添加
};

protocol bgp peer_as100000_v6 { # 建议给自己指定一个命名规则
	local 2405::1 as MyASN; # 指定本端地址与 ASN
	neighbor 2405::3 as 100000;  # 指定对端地址与 ASN
	ipv6 { # 指定要在该 BGP 邻居上跑的 channel，根据你自己的需求添加（比如加 ipv4）或减少
		import filter { # 对此会话单独定义导入过滤器
		    if net ~ [::/0] then reject; # 如果为默认路由则拒绝
		    accept; # 接收所有其他路由
		};
		export filter export_filter_v6; # 指定导出过滤器
		import limit 10; # 限制导入前缀数量，根据需要调整，防止对方过滤器配糊导致自己的网络瘫痪
		export limit 10; # 限制导出前缀数量，根据需要调整，防止过滤器因过滤器配置错误导致 session 被关闭，在这种情况下通常需要联系对方 NOC 手动重启（比如 Hurricane Electric, AS6939）
	};
	graceful restart; # 平滑重启，建议支持，防止重启 BIRD 的时候造成路由撤回导致服务中断
	description "AS100000 IPv6 Peering"; # 注释，根据自己的需要添加
};
```
