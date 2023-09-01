# 关于 BGP

以下文段来自[维基百科](https://zh.wikipedia.org/wiki/%E8%BE%B9%E7%95%8C%E7%BD%91%E5%85%B3%E5%8D%8F%E8%AE%AE)

> **边界网关协议**（英语：Border Gateway Protocol，缩写：BGP）是[互联网](https://zh.wikipedia.org/wiki/%E4%BA%92%E8%81%94%E7%BD%91)上一个核心的去中心化自治[路由协议](https://zh.wikipedia.org/wiki/%E8%B7%AF%E7%94%B1%E5%8D%8F%E8%AE%AE)。它通过维护 IP [路由表](https://zh.wikipedia.org/wiki/%E8%B7%AF%E7%94%B1%E8%A1%A8)或“前缀”表来实现[自治系统](https://zh.wikipedia.org/wiki/%E8%87%AA%E6%B2%BB%E7%B3%BB%E7%BB%9F)（Autonomous system, AS）之间的可达性，属于矢量路由协议。BGP 不使用传统的[内部网关协议](https://zh.wikipedia.org/wiki/%E5%86%85%E9%83%A8%E7%BD%91%E5%85%B3%E5%8D%8F%E8%AE%AE)（IGP）的指标，而使用基于路径、网络策略或规则集来决定路由。因此，它更适合被称为矢量性协议，而不是路由协议。
>
> 大多数[互联网服务提供商](https://zh.wikipedia.org/wiki/%E4%BA%92%E8%81%94%E7%BD%91%E6%9C%8D%E5%8A%A1%E6%8F%90%E4%BE%9B%E5%95%86)必须使用 BGP 来与其他 ISP 创建路由连接（尤其是当它们采取多宿主连接时）。因此，即使大多数互联网用户不直接使用它，但是与[7号信令系统](https://zh.wikipedia.org/wiki/7%E5%8F%B7%E4%BF%A1%E4%BB%A4%E7%B3%BB%E7%BB%9F)——即通过 PSTN 的跨供应商核心响应设置协议相比，BGP 仍然是互联网最重要的协议之一。特大型的私有 [IP](https://zh.wikipedia.org/wiki/%E7%BD%91%E9%99%85%E5%8D%8F%E8%AE%AE) 网络也可以使用 BGP。例如，当需要将若干个大型的 [OSPF](https://zh.wikipedia.org/wiki/OSPF)（[开放最短路径优先](https://zh.wikipedia.org/wiki/%E5%BC%80%E6%94%BE%E6%9C%80%E7%9F%AD%E8%B7%AF%E5%BE%84%E4%BC%98%E5%85%88)）网络进行合并，而 OSPF 本身又无法提供这种可扩展性时。使用 BGP 的另一个原因是其能为多宿主的单个或多个 ISP（[RFC 1998](https://tools.ietf.org/html/rfc1998)）网络提供更好的冗余。

简而言之，BGP 是在自治系统之间的最主要的路由协议（对于大部分情况来说），用来在自治系统间传递路由。通常而言，BGP 只会把最优路由传递给对方。
