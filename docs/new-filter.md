# 2. 过滤器进阶

在过滤公网路由的时候，只过滤::/0默认路由往往是不够的，因为这么做无法阻止盗播和错误路由，所以我们需要对过滤器进行进一步的修改。

## 公网路由应遵守的规则

过滤器过滤要基于一套规则。下面我们来看一下HE的规则：

> ## Hurricane Electric Route Filtering Algorithm <a href="#hurricane-electric-route-filtering-algorithm" id="hurricane-electric-route-filtering-algorithm"></a>
>
> This is the route filtering algorithm for customers and peers that have explicit filtering:
>
> 1. Attempt to find an as-set to use for this network.
>
> 1.1 In peeringdb, for this ASN, check for an IRR as-set name. Validate the as-set name by retrieving it. If it exists, use it.
>
> 1.2 In IRR, query for an aut-num for this ASN. If it exists, inspect the aut-num for this ASN to see if we can extract from their IRR policy an as-set for what they will announce to Hurricane by finding export or mp-export to AS6939, ANY, or AS-ANY. Precedence is as follows: The first match is used, "export" is checked before "mp-export", and "export: to AS6939" is checked before "export: to ANY" or "export: to AS-ANY". Validate the as-set name by retrieving it. If it exists, use it.
>
> 1.3 Check various internal lists maintained by Hurricane Electric's NOC that map ASNs to as-set names where we discovered or were told of them. Validate the as-set name by retrieving it. If it exists, use it.
>
> 1.4 If no as-set name is found by the previous steps use the ASN.
>
> 1. Collect the received routes for all BGP sessions with this ASN. This details both accepted and filtered routes.
> 2. For each route, perform the following rejection tests:
>
> 3.1 Reject default routes 0.0.0.0/0 and ::/0.
>
> 3.2 Reject AS paths that use BGP AS_SET notation (i.e. {1} or {1 2}, etc). See draft-ietf-idr-deprecate-as-set-confed-set.
>
> 3.3 Reject prefix lengths less than minimum and greater than maximum. For IPv4 this is 8 and 24. For IPv6 this is 16 and 48.
>
> 3.4 Reject bogons (RFC1918, documentation prefix, etc).
>
> 3.5 Reject exchange prefixes for all exchanges Hurricane Electric is connected to.
>
> 3.6 Reject AS paths that exceed 50 hops in length. Excessive BGP AS Path Prepending is a Self-Inflicted Vulnerability.
>
> 3.7 Reject AS paths that use unallocated 32-bit ASNs between 1000000 and 4199999999. https://www.iana.org/assignments/as-numbers/as-numbers.xhtml
>
> 3.8 Reject AS paths that use AS 23456. AS 23456 should not be encountered in the AS paths of BGP speakers that support 32-bit ASNs.
>
> 3.9 Reject AS paths that use AS 0. As per RFC 7606, "A BGP speaker MUST NOT originate or propagate a route with an AS number of zero".
>
> 3.10 Reject routes that have RPKI status INVALID_ASN or INVALID_LENGTH based on the origin AS and prefix.
>
> 1. For each route, perform the following acceptance tests:
>
> 4.1 If the origin is the neighbor AS, accept routes that have RPKI status VALID based on the origin AS and prefix.
>
> 4.2 If the prefix is an announced downstream route that is a subnet of an accepted originated prefix that was accepted due to either RPKI or an RIR handle match, accept the prefix.
>
> 4.3 If RIR handles match for the prefix and the peer AS, accept the prefix.
>
> 4.4 If this prefix exactly matches a prefix allowed by the IRR policy of this peer, accept the prefix.
>
> 4.5 If the first AS in the path matches the peer and path is two hops long and the origin AS is in the expanded as-set for the peer AS and either the RPKI status is VALID or there is an RIR handle match for the origin AS and the prefix, accept the prefix.
>
> 1. Reject all prefixes not explicitly accepted

翻译

> ## Hurricane Electric 的路由过滤算法 <a href="#hurricaneelectric-de-lu-you-guo-lv-suan-fa" id="hurricaneelectric-de-lu-you-guo-lv-suan-fa"></a>
>
> 这是具有显式过滤的客户和对等方的路由过滤列表：
>
> 1.尝试查找该网络的AS-SET
>
> 1.1 使用在PeeringDB中匹配该ASN所属IRR策略中的AS-SET如果它存在
>
> 1.2 在 IRR 中，查询此 ASN 的 aut-num。如果存在，请检查此 ASN 的 aut-num 以查看我们是否可以从他们的 IRR 策略中提取他们将通过查找到 AS6939、ANY 或 AS-ANY 的 export 或 mp-export 向 HE 宣布的内容的资产。 优先顺序如下：使用第一个匹配项，在“mp-export”之前检查“export”，在“export: to ANY”或“export: to AS-ANY”之前检查“export: to AS6939”。 如果存在，请使用查询来验证AS-SET。
>
> 1.3 检查由 HE 的 NOC 维护的各种内部列表，这些列表将 ASN 映射到我们发现或被告知它们的AS-SET。 如果存在，请使用通过查询来验证AS-SET。
>
> 1.4 如果前面的步骤没有找到AS-SET，则使用 ASN。
>
> 1. 收集与此 ASN的所有 BGP 会话接收的路由。这个结果同时接受并进行过滤。
> 2. 对于每条路由，执行以下拒绝测试：
>
> 3.1 拒绝默认路由 0.0.0.0/0 和 ::/0。
>
> 3.2 拒绝使用 BGP AS_SET 表示法的 AS 路径（即 {1} 或 {1 2} 等）。请参阅draft-ietf-idr-deprecate-as-set-confed-set。
>
> 3.3 拒绝前缀长度小于最小值和大于最大值。IPV4中为 8 和 24，IPV6为16 和 48。
>
> 3.4 拒绝 bogons（RFC1918、文档前缀等）。
>
> 3.5 拒绝 HE 连接到的所有来自IXP的前缀。
>
> 3.6 拒绝长度超过 50 跳的 AS 路径。过多的 BGP AS 路径预置是一个自我造成的漏洞。
>
> 3.7 拒绝使用 1000000 到 4199999999 之间未分配的 32 位 ASN 中的 AS 路径。 请参阅 https://www.iana.org/assignments/as-numbers/as-numbers.xhtml
>
> 3.8 拒绝使用 AS23456 的 AS 路径。 在支持 32 位 ASN 的 BGP 广播的 AS 路径中不应遇到 AS23456。
>
> 3.9 拒绝使用 AS 0 的 AS 路径。根据 RFC 7606，“BGP 广播者不得发起或传播 AS 编号为零的路由”。
>
> 3.10 拒绝在源ASN或IP前缀的RPKI中含有INVALID_ASN 或 INVALID_LENGTH状态的路由
>
> 1. 对于每条路由，执行以下接受测试：
>
> 4.1 据源 AS 和前缀接受 RPKI 状态为 VALID 的路由。
>
> 4.2 如果前缀是一个宣布的下游路由并是一个已接受的起源前缀的子网，该前缀由于 RPKI 或 RIR 句柄匹配而被接受，则接受该前缀。
>
> 4.3 如果 RIR 处理前缀和对等 AS 匹配，则接受前缀。
>
> 4.4 如果此前缀与该对等网络的 IRR 策略允许的前缀完全匹配，则接受该前缀。
>
> 4.5 如果路径中的第一个 AS 与对等网络匹配，并且路径为两跳，并且源 AS 在对等 AS 的扩展AS-SET中，并且 RPKI 状态为 VALID 或存在与源 AS 的 RIR 句柄匹配和前缀，接受前缀。
>
> 1. 拒绝所有未明确接受的前缀

1. 若路由为默认路由，或长度小于最小值/大于最大值，则拒绝。（对于 IPv4，这是 8 和 24。对于 IPv6 来说，这是 16 和 48。）
2. 若路由的起源 ASN 为保留 ASN，或 BGP Path 中包含保留 ASN，则拒绝。
3. 若路由为保留前缀，则拒绝。
4. 若路由的 IRR 与 ASN 匹配，且 RPKI 不为 INVALID，则接受。

总结而言，对于对等与下游，我们只应该接受路由长度大于最小值小于最大值，path 内不包含保留 ASN，不为保留前缀，且 IRR 匹配，RPKI 不为 INVALID 的路由。

而对于上游，我们仅验证 RPKI 不为 INVALID，路由长度大于最小值小于最大值，path 内不包含保留  ASN，不为保留前缀即可，不必验证 IRR。

### 专有名词概念解释 <a href="#gai-nian" id="gai-nian"></a>

在正式改进自己的过滤器之前，我们需要了解以下概念。

#### IRR <a href="#irr" id="irr"></a>

IRR（Internet Routing Registry）是存储互联网路由对象的数据库，里面记录了某个前缀该被路由到哪个 ASN。IRR 实际上由很多个数据库组成，具体列表请看[这里](https://www.irr.net/docs/list.html)。五大 RIR（ARIN，RIPE，AFRINIC，APNIC，LACNIC），比较老的 T1（LEVEL3，NTTCOM）都有自己的 IRR 数据库，同时还有一个商业数据库 RADb 和一个非营利数据库 ALTDB。这9个数据库是目前比较通用的数据库。

#### RPKI <a href="#rpki" id="rpki"></a>

关于 RPKI 的介绍我推荐查看[这篇文章](https://blog.cloudflare.com/rpki/)。简而言之，RPKI 也可以用来将 ASN 与路由关联在一起，但与 IRR 的区别是 RPKI 需要使用证书签名，使用它可以有效地防止路由劫持。

#### AS-SET <a href="#as-set" id="as-set"></a>

AS-SET，顾名思义，一个 AS 的集合。一个 AS-SET 内通常要包含自己以及自己的下游的 ASN。AS-SET 允许嵌套。

#### BGP Community <a href="#bgp-community" id="bgp-community"></a>

BGP Community（也称 BGP 社区） 类似于给路由的标签，对等方可以根据标签内容来做出自己的选择。

BGP Community 有如下三种类型：

* `BGP Community` (BGP 社区)，为一个4字节的值，在 BIRD 内显示为`(2byte ASN,2byte value)`，前二字节为 ASN，后二字节由 AS 自由分配。由于使用它需要一个 2byte 的 ASN（目前申请比较困难），所以一般在大 ISP 中能见到，或者使用保留 ASN。
* `BGP Extended Community`(BGP 扩展社区)，在BIRD内一般表示为`(type,administrator,value)`，为一个八字节的值，前二字节为类型，后六字节为管理员和分配的编号，由 AS 自行分配。它比较著名的应用位于 MPLS-VPN 内。
* `BGP Large Community`(BGP 大型社区)，在BIRD内一般表示为`(4byte ASN,4byte value,4byte value)`，为一个12字节的值，前四字节为 ASN，中间四字节与后四字节由 AS 自由分配。它被开发的主要原因是因为4字节 ASN 不能用于普通的 BGP 社区。

目前，在公网上应用比较广的主要为`BGP Community`与`BGP Large Community`

RFC 要求所有支持 BGP 社区的路由器必须处理知名的 BGP 社区，也就是`NO_EXPORT`, `NO_ADVERTISE`和`NO_EXPORT_SUBCONFED`。在默认情况下，BIRD 会自动处理这些 BGP 社区。

## BIRD 的基础语法解释 <a href="#guo-lv-qi" id="guo-lv-qi"></a>

以下内容摘自[ Soha 的文章](https://soha.moe/post/bird-bgp-kickstart.html)：

> 和 Juniper、Cisco 等路由器，或 FRR（Quagga）等路由软件不同，写 BIRD 的配置文件就像是在写程序，如果你是个程序员，那么上手应该会很快。正因如此，它也有着和常见编程语言所类似的语法。下面则是一些基础语法。
>
> #### 杂项 <a href="#za-xiang" id="za-xiang"></a>
>
> 用 `/* */` 包起来的内容是注释，`#` 至其所在行行末的内容也是注释。
>
> 分号 `;` 标示着一个选项或语句的结束，而花括号 `{ }` 内则是多个选项或语句。
>
> 在 BIRD 的配置文件中，有协议实例（`protocol <proto> <name> {}`），过滤器（`filter <name> [local_variables] {}`），函数（`function <name> [local_variables] {}`）可以定义，这些将在下文各部分选择性挑重点介绍。
>
> `print` 用来输出内容，这些会输出在 BIRD 的日志文件中，在使用 systemd 的系统中，可以使用 `journalctl -xeu bird.service` 查看。
>
> #### 变量与常量 <a href="#bian-liang-yu-chang-liang" id="bian-liang-yu-chang-liang"></a>
>
> 变量名、常量名、协议实例名、过滤器名、函数名等，都遵循着这样的规则：必须以下划线或字母开头，名称内也只能有字母、数字、下划线。比如 `Soha233`、`_my_filter`、`bgp_4842` 都是合法的名字。当然在 BIRD 中有例外，如果一个名字用单引号括起来，那么我们还可以用冒号、横线、点，比如 `'2.333:what-a-strange-name'`，只不过不推荐这么用就是了。
>
> 使用 `define` 定义常量，如 `define LOCAL_AS = 65550`。
>
> BIRD 中可以针对很多变量类型定义集合。集合用一对方括号定义，如 `[1, 2, 3, 4]`。集合可以用范围来快速生成，比如 `[1, 2, 10..13]` 就会生成为 `[1, 2, 10, 11, 12, 13]`。范围的写法还可以用在社区属性中，如 `[(64512, 100..200)]`，在社区属性中还可以用通配符，如 `[(1, 2, *)]`。
>
> 前缀的集合中的范围写法较为复杂，`[prefix{low, high}]`，`prefix` 是一个用于匹配的前缀，`low` 和 `high` 两个值限制了它的 CIDR 长度。`[192.168.1.0/24{16,30}]` 表示的是包含或被包含于 192.168.1.0/24 且 CIDR 在 16-30 之间的前缀，例如 `192.168.0.0/20` 和 `192.168.1.0/29` 均属于这个集合，而 `192.168.233.0/24` 不属于。这样子的写法可能过于麻烦，所以 BIRD 中也使用加号和减号提供了两种便捷的写法，如 `[2001:db8:10::/44+, 2001:db8:2333::/48-]` 则等价于 `[2001:db8:10::/44{44,128}, 2001:db8:2333::/48{0,48}]`。
>
> 在 BIRD 中还有一类特殊的变量类型，他们都是列表，`bgppath`（AS Path，路由的 `bgp_path` 属性）、`clist`（BGP Community 列表，路由的 `bgp_community` 属性）、`eclist`（BGP Extended Community 列表，路由的 `bgp_ext_community` 属性）、`lclist`（BGP Large Community 列表，路由的 `bgp_large_community` 属性）都是这类变量，他们的操作有非常特殊的用法。下面的代码展示了 `bgppath` 的用法。`clist/eclist/lclist` 与之类似，但是它们只能使用其中的 `empty`、`len`、`add`、`delete`、`filter`。
>
> ```
> function foo()
> bgppath P;
> bgppath P2; {
>  print "path 中第一个元素是", P.first, "，最后一个元素是", P.last;
>  # 第一个元素可以认为是邻居的 ASN，最后一个元素是宣告这条路由的 ASN
>  # 这两个在 P 中没有元素的时候是 0
>  print "path 的长度是", P.len;
>  if P.empty then {
>      print "path 为空";
>  }
>  P.prepend(233); # 在 path 的第一个位置插入元素
>  P.delete(233); # 删除 path 中所有等于 233 的元素
>  P.delete([64512..65535]); # 删除 path 中所有属于集合 [64512..65535] 的元素
>  P.filter([64512..65535]); # 只在 path 中留下集合 [64512..65535] 中出现的元素
>
>  # 如果不想改变 P，可以使用下面这样的方法将操作后的结果存入 P2
>  P2 = delete(P, 233)
>  P2 = filter(P, [64512..65535])
> }
> ```
>
> 变量只能定义在函数或过滤器的最开头（左花括号外面），关于变量类型的更详细信息，请移步[官方文档相关部分](https://bird.network.cz/?get_doc\&v=20\&f=bird.html#ss5.2)。
>
> #### 操作符 <a href="#cao-zuo-fu" id="cao-zuo-fu"></a>
>
> 在 BIRD 中有很多常见的操作符。如 `+`、`-`、`*`、`/`、`()` 这些基本的算数操作符，有等于 `a = b`、不等于 `a != b`、大于 `a > b`、大于等于 `a >= b`、小于 `a < b`、小于等于 `a <= b` 这些比较符，有与 `&&`、或 `||`、非 `!` 这三种逻辑操作符。还有 `~` 和 `!~` 这两种判断包含或者不包含的操作符。包含操作符的用法写在附录 3 中。
>
> #### 分支 <a href="#fen-zhi" id="fen-zhi"></a>
>
> 过滤器和函数中的语句都是顺序执行的。同时支持 `case` 和 `if` 两种分支语句。在 BIRD 中是不支持循环的。
>
> `if` 的写法如下：
>
> ```
> if 6939 ~ bgp_path then {   # 只要 AS Path 中有 6939
>  bgp_local_pref = 233;   # 就将这条路由的 Local Preference 调为 233
> } else {
>  bgp_local_pref = 2333;  # 否则设为 2333
> }
> ```
>
> `case` 的写法如下：
>
> ```
> case arg1 {
>  2: print "two"; print "I can do more commands without {}";
>  #  ^ case 不需要花括号就能在一个分支中写下更多语句。
>  3..5: print "three to five";
>  else: print "something else";
> }
> ```
>
> 在 BIRD 中，if 和 case 的写法均与常见编程语言略有不同。

BIRD 的包含 `~` 和不包含 `!~` 操作符能用于下表中所示的类型。`~` 或者 `!~` 左边的东西叫做左操作数（是的，它不一定是数字，也可以是其它类型），右边的东西叫做右操作数，对应表如下。(摘自[ Soha 的文章](https://soha.moe/post/bird-bgp-kickstart.html)

|        左操作数类型       |    右操作数类型    |                        样例                       |                        说明                       |
| :-----------------: | :----------: | :---------------------------------------------: | :---------------------------------------------: |
|      `bgppath`      |   `bgpmask`  |        `bgp_path ~ [= * 64512 64513 * =]`       |              bgp_path 符合右边描述的模式则为真             |
|        `int`        |   `bgppath`  |                `64512 ~ bgp_path`               |                   左边被包含于右边则为真                   |
| `pair`/`quad`/`ip4` |    `clist`   |           `(123, 456) ~ bgp_community`          | 左边被包含于右边则为真，`pair`、`quad`、`ip4` 都是 32 位的，所以它们等价 |
|         `ec`        |   `eclist`   |        `(rt, 10, 3) ~ bgp_ext_community`        |                   左边被包含于右边则为真                   |
|         `lc`        |   `lclist`   |       `(4842, 0, 0) ~ bgp_large_community`      |                   左边被包含于右边则为真                   |
|       `string`      |   `string`   |                `proto ~ "bgp_*"`                |            左边的字符串符合右边的模式（类 shell）就为真            |
|         `ip`        |   `prefix`   |              `1.1.1.1 ~ 1.0.0.0/8`              |                  IP 被包含于某前缀则为真                  |
|       `prefix`      |   `prefix`   |         `1.1.1.0/24 ~ 1.0.0.0/8{16,24}`         |                左边的前缀被包含于右边的前缀则为真                |
|       `prefix`      | `prefix set` |     `1.1.1.0/24 ~ [1.0.0.0/24, 1.1.0.0/22]`     |               左边的前缀被包含于右边任意一个前缀则为真              |
|        `path`       |   `int set`  |         `bgp_path ~ [233, 2333, 64512]`         |                   左右两边交集非空即为真                   |
|       `clist`       |  `pair set`  |     `bgp_community ~ [(0, 6939), (1, 2333)]`    |                   左右两边交集非空即为真                   |
|       `eclist`      |   `ec set`   | `bgp_ext_community ~ [(rt, 1, 30), (ro, 2, *)]` |                   左右两边交集非空即为真                   |
|       `lclist`      |   `lc set`   |    `bgp_large_community ~ [(1, 2, 100..233)]`   |                   左右两边交集非空即为真                   |

通过以上的解释，你应该能了解 BIRD 中大概的判断方式。

## 与对等 (Peering) 连接的过滤器定义

在了解了上面的过滤方法后，我们可以写出如下的过滤器

```
function general_check(){ # 返回true则拒绝，返回false则允许 (数据集来源：附录-基础过滤定义)
    if bgp_path ~ BOGON_ASNS then return true; # 如果路径包含保留ASN则返回true
    case net.type {
        NET_IP4: return net.len > 24 || net ~ BOGON_PREFIXES_V4; # IPv4 CIDR 大于 /24 为太长
        NET_IP6: return net.len > 48 || net ~ BOGON_PREFIXES_V6; # IPv6 CIDR 大于 /48 为太长
        else: print "unexpected net.type ", net.type, " ", net; return false; # 保底，一般不应该出现非IP4/IP6的前缀。
    }
}

filter peer_import_filter_v6 {    # 生成一个专用于Peering对等会话的导入过滤器
    if genreal_check() then reject;        # 无法通过上面的基础检测的函数应该处理掉
    if irr_check() then reject;            # 对该路由进行IRR检测 (IRR检测的函数定义以及数据集建立方法：附录-IRR RPKI服务的搭建和使用)
    if rpki_invalid_check() then reject;   # 对RPKI进行检测 (RPKI检测的函数定义以及数据集建立方法：附录-IRR RPKI服务的搭建和使用)
    if bgp_path.first != PEER_ASN then reject;    # 对BGP_Path.first 进行检测，如果发现错误就应当拒绝，虽然一般情况下不会出现这种情况
    accept;
}

filter peer_export_filter_v6 {    # 生成一个专用于Peering对等会话的导出过滤器
    if proto ~ "transit_*" then reject;    # 直接匹配配置名称，直接过滤上游来的路由，transit_* 应根据自己的实际情况修改
    if proto ~ "peer_*" then reject;       # 直接匹配配置名称，直接过滤其他对等来的路由，peer_* 应根据自己的实际情况修改
    if general_check() then reject;        # 网络中可能存在一些自定义的Bogon，添加此函数可以保底
    # ... 你也可以在这里添加一些自定义的函数或判断条件
    accept;
}
```
