# BGP 劫持

由于 BGP 的[特点](https://www.cloudflare.com/zh-cn/learning/security/glossary/what-is-bgp/)，如果公网中存在更小的前缀或者更短的 AS Path，那就默认使用更小的前缀或者更短的 AS Path 的路由，如果是因为某个路由器的配置错误造成的，发到公网后就会产生不良的后果，现实生活中发生的示例已经在上文中提到。

在公网中如果配置了错误的路由和过滤器，会导致某个 ASN 的某条路由被错误优选，互联网会根据这条路由通过你的 ASN 将数据包发向目标，这种行为叫 [BGP劫持 (BGP Hijack)](https://www.cloudflare.com/zh-cn/learning/security/glossary/bgp-hijacking/)
