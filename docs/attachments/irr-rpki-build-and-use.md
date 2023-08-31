# IRR RPKI 服务的搭建和使用

## IRR 检测

关于 IRR，[此处](../new-filter.md#irr) 已经提及，此文章不再赘述。

关于获取 IRR 的数据，我们需要用到`bgpq4`用于从 RIR 获取对应数据并且返回对应 IP 地址块。你可以通过执行`apt install bgpq4`安装或者前往 [bgpq4的GitHub仓库](https://github.com/bgp/bgpq4) 自行编译安装。

### 通过 bgpq4 查询 AS-SET 中所有 ASN 及其 IRR 记录

#### 查询 ASN

下面是一条从`AS-SET`中获取所有 ASN 的 IRR 的指令，你可以将`AS-OUL`换成任何你想要查询的 AS-SET。

```
bgpq4 -b -t AS-OUL -l "define AS-OUL_ASN_List" 
```

将会输出以下结果

```
define AS-OUL_ASN_List = [
    114514, 1919810
];
```

#### 查询AS-SET

下面是一条从`AS-SET`中获取所有 ASN 的 IRR 的指令，你可以将`AS-OUL`换成任何你想要查询的 AS-SET。

```
bgpq4 -S ARIN,APNIC,RIPE,AFRINIC,LACNIC -R 48 -m 48 -A6b AS-OUL -l "define AS114514_IRR_v6"
```

这串指令将会输出以下结果，bgpq4 已经将 IRR 记录递归到`/48`的大小，如果你不想这么做，请前往 [此处](irr-rpki-build-and-use.md#tong-guo-bgpq4-cha-xun-asn-de-fei-di-gui-irr-ji-lu)

```
define AS114514_IRR_v6 = [    # 示例
    2001:db8::/36{36,48},
    2001:db8:19fe::/48
];
```

我们只需要将此结果直接写至一个文件中，并且在`bird.conf`里加入这句语句

```
include "path/to/your/file";    # 具体文件名和路径请根据实际情况调整
```

在需要使用 IRR 进行过滤时，在过滤器中添加

```
if net ~ AS114514_IRR_v6 then accept;    # 如果IP块在上面的列表中，即通过。
```

即可通过 IRR 判断是否该收取前缀，下文收到结果后也要同样这么做，不再赘述。

### 通过 bgpq4 查询 ASN 的 IRR 记录

下面是一条从 ASN 中获取 IRR 的指令，你可以将`AS114514`换成任何你想要查询的 ASN。

```
bgpq4 -S ARIN,APNIC,RIPE,AFRINIC,LACNIC -R 48 -m 48 -A6b AS114514 -l "define AS114514_IRR_v6"
```

将会输出以下结果

```
define AS114514_IRR_v6 = [    # 示例
    2001:db8::/36{36,48}
];
```

### 通过 bgpq4 查询 ASN 的非递归 IRR 记录

下面是一条从 ASN 中获取 IRR 的指令，你可以将`AS114514`换成任何你想要查询的 ASN。

```
bgpq4 -S ARIN,APNIC,RIPE,AFRINIC,LACNIC -6b AS114514 -l "define AS114514_IRR_v6"
```

将会输出以下结果

```
define AS114514_IRR_v6 = [    # 示例
    2001:db8::/36    #注意：此处没有递归到/48
];
```

### bgpq4 是否递归 IRR 的区别

根据上文是否递归，我们可以看到递归和非递归结果，它们的区别如下

```
假设收到的 IP 为 2001:db8::/36
递归：accept
非递归：accpet
---
假设收到的 IP 为 2001:db8::/48
递归：accept
非递归：reject
---
假设收到的 IP 为 2001:db8:1::/48
递归：accept
非递归：reject
---
```

请根据自己的需求决定是否使用递归。

### 使用 IRR 检测此路由是否有效

假设你通过对`AS114514`生成递归 IRR 记录获取到了结果(名为`AS114514_IRR_v6`)，保存到文件中并成功读取，我们就可以用如下方式进行过滤

```
if net ~ AS114514_IRR_v6 then accept;    # 如果这个前缀在AS114514_IRR_v6中，即放行，适用于不带下游的方式
```

## RPKI 检测

关于 RPKI，[此处](../new-filter.md#rpki) 已经提及，不再赘述。

### 建立 RPKI 会话

下面是一串 RPKI 会话的示例配置，本文使用了Cloudflare 的 RPKI 服务器，如果有自建需求，可以前往 [GoRTR的GitHub仓库](https://github.com/cloudflare/gortr) 查看。

```
roa4 table rpki_v4;
roa6 table rpki_v6;

protocol rpki rpki_server {
        roa4 { table rpki_v4; };
        roa6 { table rpki_v6; };
        remote "rtr.rpki.cloudflare.com" port 8282; # RPKI Server
        retry keep 600;
        refresh keep 600;
        expire keep 600;
}
```

建议将这一串配置尽可能地扔在前面，让这个配置最先加载，以防止出现奇怪的 NOT DEFINED 错误。

成功同步后，输入 `birdc s p a rpki_server` 如果看到 Established 即为成功获取数据。

### 使用 RPKI 检测路由是否有效

先在上文提到的rpki\_server的下面加入一个函数

```
function rpki_invalid_check() {        # true为无效，false为未知或有效，建议先判断IRR再判断RPKI，此时若RPKI未知，但是IRR有效，即认定其有效
    case net.type {
	#roa_check(ROA表, net, bgp_path.last_nonaggregated) = ROA_INVALID
        NET_IP4: return roa_check(rpki_v4, net, bgp_path.last_nonaggregated) = ROA_INVALID;
        NET_IP6: return roa_check(rpki_v6, net, bgp_path.last_nonaggregated) = ROA_INVALID;
        else: print "unexpected route ", net.type, " ", net; return false; # 保底，一般不应该出现非IP4/IP6的前缀。
    }
}
```

在负责 import 的过滤器中使用它，即可判断此路由的 RPKI 是否有效

```
import filter {
    ...
    if rpki_invalid_check() then reject;    # 如果确定无效则拒绝
    ...
    accept;
};
```

